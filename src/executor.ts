/**
 * FlowForge - Task Executor
 * Handles task execution with support for parallel/serial execution,
 * dependencies, conditions, and retries
 */

import { spawn } from 'child_process';
import * as path from 'path';
import { 
  Task, 
  Workflow, 
  ExecutionResult, 
  WorkflowRunResult,
  TaskCondition 
} from './types';

export class TaskExecutor {
  private workflow: Workflow;
  private results: Map<string, ExecutionResult> = new Map();
  private startTime: Date = new Date();

  constructor(workflow: Workflow) {
    this.workflow = workflow;
  }

  async execute(): Promise<WorkflowRunResult> {
    this.startTime = new Date();
    this.results.clear();

    const { tasks, settings } = this.workflow;
    const taskMap = new Map(tasks.map(t => [t.name, t]));
    
    // Get execution order based on dependencies
    const executionOrder = this.getExecutionOrder(tasks);
    
    // Execute tasks
    if (settings?.parallel) {
      await this.executeParallel(executionOrder, taskMap, settings.maxParallel || 4);
    } else {
      await this.executeSerial(executionOrder, taskMap, settings?.failFast !== false);
    }

    // Calculate results
    const endTime = new Date();
    const taskResults = Array.from(this.results.values());
    
    const passedTasks = taskResults.filter(r => r.success).length;
    const failedTasks = taskResults.filter(r => !r.success && r.exitCode !== -2).length;
    const skippedTasks = taskResults.filter(r => r.exitCode === -2).length;

    return {
      workflowName: this.workflow.name,
      success: failedTasks === 0,
      totalTasks: tasks.length,
      passedTasks,
      failedTasks,
      skippedTasks,
      duration: endTime.getTime() - this.startTime.getTime(),
      startTime: this.startTime,
      endTime,
      taskResults,
    };
  }

  private getExecutionOrder(tasks: Task[]): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const taskMap = new Map(tasks.map(t => [t.name, t]));

    function visit(taskName: string) {
      if (visited.has(taskName)) return;
      visited.add(taskName);

      const task = taskMap.get(taskName);
      if (task?.dependsOn) {
        for (const dep of task.dependsOn) {
          visit(dep);
        }
      }
      order.push(taskName);
    }

    for (const task of tasks) {
      visit(task.name);
    }

    return order;
  }

  private async executeSerial(
    order: string[],
    taskMap: Map<string, Task>,
    failFast: boolean
  ): Promise<void> {
    for (const taskName of order) {
      const task = taskMap.get(taskName)!;
      const result = await this.executeTask(task);
      
      if (!result.success && failFast && !task.ignoreError) {
        // Skip remaining tasks
        for (const remainingName of order) {
          if (!this.results.has(remainingName)) {
            this.results.set(remainingName, {
              taskName: remainingName,
              success: false,
              exitCode: -2,
              stdout: '',
              stderr: 'Skipped due to previous failure',
              duration: 0,
              startTime: new Date(),
              endTime: new Date(),
            });
          }
        }
        break;
      }
    }
  }

  private async executeParallel(
    order: string[],
    taskMap: Map<string, Task>,
    maxParallel: number
  ): Promise<void> {
    const completed = new Set<string>();
    const running = new Set<string>();

    while (completed.size < order.length) {
      // Find tasks that can be started
      const ready = order.filter(name => {
        if (completed.has(name) || running.has(name)) return false;
        const task = taskMap.get(name)!;
        return task.dependsOn?.every(dep => completed.has(dep)) ?? true;
      });

      // Start tasks up to maxParallel
      const toStart = ready.slice(0, maxParallel - running.size);
      
      if (toStart.length === 0 && running.size === 0) {
        break; // Deadlock or all done
      }

      // Execute tasks in parallel
      const promises = toStart.map(async name => {
        running.add(name);
        const task = taskMap.get(name)!;
        const result = await this.executeTask(task);
        running.delete(name);
        completed.add(name);
        return result;
      });

      if (promises.length > 0) {
        await Promise.all(promises);
      } else {
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  private async executeTask(task: Task): Promise<ExecutionResult> {
    const startTime = new Date();

    // Check condition
    if (task.condition && !(await this.checkCondition(task.condition))) {
      const result: ExecutionResult = {
        taskName: task.name,
        success: true,
        exitCode: -2,
        stdout: '',
        stderr: 'Skipped due to condition',
        duration: 0,
        startTime,
        endTime: new Date(),
      };
      this.results.set(task.name, result);
      return result;
    }

    // Check if dependencies failed
    if (task.dependsOn) {
      const failedDeps = task.dependsOn.filter(dep => {
        const result = this.results.get(dep);
        return result && !result.success;
      });
      
      if (failedDeps.length > 0) {
        const result: ExecutionResult = {
          taskName: task.name,
          success: false,
          exitCode: -2,
          stdout: '',
          stderr: `Skipped due to failed dependencies: ${failedDeps.join(', ')}`,
          duration: 0,
          startTime,
          endTime: new Date(),
        };
        this.results.set(task.name, result);
        return result;
      }
    }

    // Execute with retry
    let lastResult: ExecutionResult | null = null;
    const maxRetries = task.retry || 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      lastResult = await this.runCommand(task, startTime, attempt);
      
      if (lastResult.success || task.ignoreError) {
        break;
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.results.set(task.name, lastResult!);
    return lastResult!;
  }

  private async runCommand(
    task: Task,
    startTime: Date,
    attempt: number
  ): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const cwd = task.cwd ? path.resolve(task.cwd) : process.cwd();
      const env = { ...process.env, ...task.env };
      const timeout = task.timeout || this.workflow.settings?.timeout || 300000;

      let stdout = '';
      let stderr = '';

      const child = spawn(task.command, [], {
        cwd,
        env,
        shell: true,
        timeout,
      });

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
        if (!task.silent && this.workflow.settings?.verbose) {
          process.stdout.write(data);
        }
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
        if (!task.silent) {
          process.stderr.write(data);
        }
      });

      child.on('error', (error) => {
        const endTime = new Date();
        resolve({
          taskName: task.name,
          success: false,
          exitCode: -1,
          stdout,
          stderr: stderr + error.message,
          duration: endTime.getTime() - startTime.getTime(),
          startTime,
          endTime,
        });
      });

      child.on('close', (code) => {
        const endTime = new Date();
        resolve({
          taskName: task.name,
          success: code === 0,
          exitCode: code || 0,
          stdout,
          stderr,
          duration: endTime.getTime() - startTime.getTime(),
          startTime,
          endTime,
        });
      });
    });
  }

  private async checkCondition(condition: TaskCondition): Promise<boolean> {
    // Check branch condition
    if (condition.branch) {
      const branch = await this.getCurrentBranch();
      if (condition.branch.startsWith('!')) {
        if (branch === condition.branch.slice(1)) return false;
      } else {
        if (branch !== condition.branch) return false;
      }
    }

    // Check environment variable condition
    if (condition.env) {
      if (condition.env.startsWith('!')) {
        if (process.env[condition.env.slice(1)]) return false;
      } else {
        if (!process.env[condition.env]) return false;
      }
    }

    // Check file existence condition
    if (condition.fileExists) {
      const fs = await import('fs-extra');
      if (condition.fileExists.startsWith('!')) {
        if (await fs.pathExists(condition.fileExists.slice(1))) return false;
      } else {
        if (!(await fs.pathExists(condition.fileExists))) return false;
      }
    }

    // Check platform condition
    if (condition.platform) {
      if (process.platform !== condition.platform) return false;
    }

    return true;
  }

  private async getCurrentBranch(): Promise<string> {
    return new Promise((resolve) => {
      const child = spawn('git', ['branch', '--show-current'], {
        shell: true,
      });
      
      let output = '';
      child.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      child.on('close', () => {
        resolve(output.trim());
      });
      
      child.on('error', () => {
        resolve('');
      });
    });
  }
}

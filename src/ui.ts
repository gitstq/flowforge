/**
 * FlowForge - UI Components
 * Beautiful terminal output and progress display
 */

import chalk from 'chalk';
import ora, { Ora } from 'ora';
import Table from 'cli-table3';
import { ExecutionResult, WorkflowRunResult, HistoryEntry } from './types';
import { formatDistanceToNow } from 'date-fns';

// Simple duration formatter
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

export class UI {
  private spinner: Ora | null = null;

  printBanner(): void {
    console.log();
    console.log(chalk.cyan.bold('  ███████╗ ██████╗ ███╗   ██╗██████╗  █████╗ ███████╗███████╗'));
    console.log(chalk.cyan.bold('  ██╔════╝██╔═══██╗████╗  ██║██╔══██╗██╔══██╗██╔════╝██╔════╝'));
    console.log(chalk.cyan.bold('  █████╗  ██║   ██║██╔██╗ ██║██████╔╝███████║███████╗█████╗  '));
    console.log(chalk.cyan.bold('  ██╔══╝  ██║   ██║██║╚██╗██║██╔══██╗██╔══██║╚════██║██╔══╝  '));
    console.log(chalk.cyan.bold('  ██║     ╚██████╔╝██║ ╚████║██████╔╝██║  ██║███████║███████╗'));
    console.log(chalk.cyan.bold('  ╚═╝      ╚═════╝ ╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝'));
    console.log(chalk.gray('  Lightweight Workflow Automation Tool'));
    console.log();
  }

  startTask(taskName: string): void {
    this.spinner = ora({
      text: chalk.cyan(`Running: ${taskName}`),
      spinner: 'dots',
    }).start();
  }

  succeedTask(taskName: string, duration: number): void {
    if (this.spinner) {
      this.spinner.succeed(chalk.green(`✓ ${taskName} `) + chalk.gray(`(${formatDuration(duration)})`));
    }
  }

  failTask(taskName: string, error: string): void {
    if (this.spinner) {
      this.spinner.fail(chalk.red(`✗ ${taskName}`));
      console.log(chalk.red(`  Error: ${error}`));
    }
  }

  skipTask(taskName: string, reason: string): void {
    if (this.spinner) {
      this.spinner.info(chalk.yellow(`○ ${taskName} `) + chalk.gray(`(${reason})`));
    }
  }

  printWorkflowSummary(result: WorkflowRunResult): void {
    console.log();
    console.log(chalk.bold('  ─────────────────────────────────────────'));
    console.log(chalk.bold('  Workflow Summary'));
    console.log(chalk.bold('  ─────────────────────────────────────────'));
    console.log();
    
    console.log(`  ${chalk.gray('Name:')} ${chalk.white(result.workflowName)}`);
    console.log(`  ${chalk.gray('Status:')} ${result.success ? chalk.green('✓ Success') : chalk.red('✗ Failed')}`);
    console.log(`  ${chalk.gray('Duration:')} ${chalk.white(formatDuration(result.duration))}`);
    console.log();
    
    console.log(`  ${chalk.gray('Tasks:')}`);
    console.log(`    ${chalk.green('✓ Passed:')} ${result.passedTasks}`);
    console.log(`    ${chalk.red('✗ Failed:')} ${result.failedTasks}`);
    console.log(`    ${chalk.yellow('○ Skipped:')} ${result.skippedTasks}`);
    console.log();
  }

  printTaskTable(results: ExecutionResult[]): void {
    const table = new Table({
      head: [
        chalk.cyan.bold('Task'),
        chalk.cyan.bold('Status'),
        chalk.cyan.bold('Duration'),
        chalk.cyan.bold('Exit Code'),
      ],
      style: {
        head: [],
        border: ['gray'],
      },
    });

    for (const result of results) {
      let status: string;
      if (result.success) {
        status = chalk.green('✓ Passed');
      } else if (result.exitCode === -2) {
        status = chalk.yellow('○ Skipped');
      } else {
        status = chalk.red('✗ Failed');
      }

      table.push([
        result.taskName,
        status,
        formatDuration(result.duration),
        result.exitCode === -2 ? '-' : result.exitCode.toString(),
      ]);
    }

    console.log(table.toString());
  }

  printHistory(entries: HistoryEntry[]): void {
    if (entries.length === 0) {
      console.log(chalk.yellow('  No history entries found.'));
      return;
    }

    const table = new Table({
      head: [
        chalk.cyan.bold('ID'),
        chalk.cyan.bold('Workflow'),
        chalk.cyan.bold('Status'),
        chalk.cyan.bold('Tasks'),
        chalk.cyan.bold('Duration'),
        chalk.cyan.bold('Time'),
      ],
      style: {
        head: [],
        border: ['gray'],
      },
    });

    for (const entry of entries) {
      let status: string;
      if (entry.status === 'success') {
        status = chalk.green('✓');
      } else if (entry.status === 'partial') {
        status = chalk.yellow('○');
      } else {
        status = chalk.red('✗');
      }

      table.push([
        entry.id.slice(0, 8),
        entry.workflowName,
        status,
        `${entry.passedTasks}/${entry.totalTasks}`,
        formatDuration(entry.duration),
        formatDistanceToNow(entry.startTime, { addSuffix: true }),
      ]);
    }

    console.log(table.toString());
  }

  printStats(stats: {
    totalRuns: number;
    successRate: number;
    avgDuration: number;
    mostRunWorkflow: string | null;
  }): void {
    console.log();
    console.log(chalk.bold('  ─────────────────────────────────────────'));
    console.log(chalk.bold('  Statistics'));
    console.log(chalk.bold('  ─────────────────────────────────────────'));
    console.log();
    
    console.log(`  ${chalk.gray('Total Runs:')} ${chalk.white(stats.totalRuns)}`);
    console.log(`  ${chalk.gray('Success Rate:')} ${chalk.white(stats.successRate.toFixed(1))}%`);
    console.log(`  ${chalk.gray('Avg Duration:')} ${chalk.white(formatDuration(stats.avgDuration))}`);
    
    if (stats.mostRunWorkflow) {
      console.log(`  ${chalk.gray('Most Run:')} ${chalk.white(stats.mostRunWorkflow)}`);
    }
    console.log();
  }

  printError(message: string): void {
    console.log();
    console.log(chalk.red.bold('  ✗ Error'));
    console.log(chalk.red(`  ${message}`));
    console.log();
  }

  printSuccess(message: string): void {
    console.log();
    console.log(chalk.green.bold('  ✓ Success'));
    console.log(chalk.green(`  ${message}`));
    console.log();
  }

  printInfo(message: string): void {
    console.log(chalk.cyan(`  ℹ ${message}`));
  }

  printWarning(message: string): void {
    console.log(chalk.yellow(`  ⚠ ${message}`));
  }
}

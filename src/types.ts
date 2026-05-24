/**
 * FlowForge - Core Types
 * Defines all TypeScript interfaces and types for the workflow system
 */

export interface Task {
  name: string;
  command: string;
  description?: string;
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  retry?: number;
  dependsOn?: string[];
  condition?: TaskCondition;
  silent?: boolean;
  ignoreError?: boolean;
}

export interface TaskCondition {
  branch?: string;
  env?: string;
  fileExists?: string;
  platform?: 'win32' | 'darwin' | 'linux';
}

export interface Workflow {
  name: string;
  version: string;
  description?: string;
  tasks: Task[];
  settings?: WorkflowSettings;
}

export interface WorkflowSettings {
  parallel?: boolean;
  maxParallel?: number;
  failFast?: boolean;
  timeout?: number;
  verbose?: boolean;
}

export interface ExecutionResult {
  taskName: string;
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  startTime: Date;
  endTime: Date;
}

export interface WorkflowRunResult {
  workflowName: string;
  success: boolean;
  totalTasks: number;
  passedTasks: number;
  failedTasks: number;
  skippedTasks: number;
  duration: number;
  startTime: Date;
  endTime: Date;
  taskResults: ExecutionResult[];
}

export interface HistoryEntry {
  id: string;
  workflowName: string;
  workflowFile: string;
  status: 'success' | 'failed' | 'partial';
  startTime: Date;
  endTime: Date;
  duration: number;
  totalTasks: number;
  passedTasks: number;
  failedTasks: number;
}

export interface ProjectConfig {
  name: string;
  type: ProjectType;
  workflows: string[];
  defaultWorkflow?: string;
}

export type ProjectType = 
  | 'node'
  | 'python'
  | 'go'
  | 'rust'
  | 'java'
  | 'unknown';

export const DEFAULT_SETTINGS: WorkflowSettings = {
  parallel: false,
  maxParallel: 4,
  failFast: true,
  timeout: 300000, // 5 minutes
  verbose: false,
};

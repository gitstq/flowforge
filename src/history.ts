/**
 * FlowForge - History Manager
 * Manages execution history and statistics
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { HistoryEntry, WorkflowRunResult } from './types';

const HISTORY_DIR = path.join(os.homedir(), '.flowforge', 'history');
const HISTORY_FILE = path.join(HISTORY_DIR, 'history.json');
const MAX_HISTORY_ENTRIES = 100;

export class HistoryManager {
  private history: HistoryEntry[] = [];

  constructor() {
    this.load();
  }

  private async load(): Promise<void> {
    try {
      await fs.ensureDir(HISTORY_DIR);
      if (await fs.pathExists(HISTORY_FILE)) {
        const content = await fs.readFile(HISTORY_FILE, 'utf-8');
        this.history = JSON.parse(content);
      }
    } catch (error) {
      this.history = [];
    }
  }

  private async save(): Promise<void> {
    try {
      await fs.ensureDir(HISTORY_DIR);
      await fs.writeFile(HISTORY_FILE, JSON.stringify(this.history, null, 2));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }

  async addEntry(result: WorkflowRunResult, workflowFile: string): Promise<HistoryEntry> {
    const entry: HistoryEntry = {
      id: this.generateId(),
      workflowName: result.workflowName,
      workflowFile,
      status: result.success ? 'success' : result.passedTasks > 0 ? 'partial' : 'failed',
      startTime: result.startTime,
      endTime: result.endTime,
      duration: result.duration,
      totalTasks: result.totalTasks,
      passedTasks: result.passedTasks,
      failedTasks: result.failedTasks,
    };

    this.history.unshift(entry);
    
    // Keep only recent entries
    if (this.history.length > MAX_HISTORY_ENTRIES) {
      this.history = this.history.slice(0, MAX_HISTORY_ENTRIES);
    }

    await this.save();
    return entry;
  }

  getHistory(limit: number = 20): HistoryEntry[] {
    return this.history.slice(0, limit);
  }

  getEntry(id: string): HistoryEntry | undefined {
    return this.history.find(e => e.id === id);
  }

  async clear(): Promise<void> {
    this.history = [];
    await this.save();
  }

  getStats(): {
    totalRuns: number;
    successRate: number;
    avgDuration: number;
    mostRunWorkflow: string | null;
  } {
    if (this.history.length === 0) {
      return {
        totalRuns: 0,
        successRate: 0,
        avgDuration: 0,
        mostRunWorkflow: null,
      };
    }

    const successCount = this.history.filter(e => e.status === 'success').length;
    const totalDuration = this.history.reduce((sum, e) => sum + e.duration, 0);
    
    const workflowCounts = new Map<string, number>();
    for (const entry of this.history) {
      workflowCounts.set(
        entry.workflowName,
        (workflowCounts.get(entry.workflowName) || 0) + 1
      );
    }
    
    let mostRunWorkflow: string | null = null;
    let maxCount = 0;
    for (const [name, count] of workflowCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostRunWorkflow = name;
      }
    }

    return {
      totalRuns: this.history.length,
      successRate: (successCount / this.history.length) * 100,
      avgDuration: totalDuration / this.history.length,
      mostRunWorkflow,
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

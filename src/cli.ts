#!/usr/bin/env node

/**
 * FlowForge - CLI Entry Point
 * Main command-line interface for the workflow automation tool
 */

import { Command } from 'commander';
import * as path from 'path';
import inquirer from 'inquirer';
import { UI } from './ui';
import { findConfigFile, loadConfig, createDefaultConfig, detectProjectType } from './config';
import { TaskExecutor } from './executor';
import { HistoryManager } from './history';

const program = new Command();
const ui = new UI();
const historyManager = new HistoryManager();

program
  .name('flowforge')
  .alias('ff')
  .description('A lightweight CLI tool for defining, executing, and managing development workflows')
  .version('1.0.0');

// Run command (default)
program
  .command('run [workflow]')
  .description('Execute a workflow')
  .option('-p, --parallel', 'Run tasks in parallel')
  .option('-s, --serial', 'Run tasks in serial')
  .option('-v, --verbose', 'Show detailed output')
  .option('-t, --task <task>', 'Run specific task only')
  .action(async (workflow, options) => {
    try {
      const configFile = workflow || await findConfigFile();
      
      if (!configFile) {
        ui.printError('No workflow configuration found.');
        console.log(chalk.gray('\n  Run `flowforge init` to create a new workflow.'));
        return;
      }

      const configPath = path.resolve(configFile);
      ui.printInfo(`Loading workflow from: ${configPath}`);
      
      const workflowConfig = await loadConfig(configPath);
      
      // Apply command-line options
      if (options.parallel) workflowConfig.settings!.parallel = true;
      if (options.serial) workflowConfig.settings!.parallel = false;
      if (options.verbose) workflowConfig.settings!.verbose = true;
      
      // Filter tasks if specific task requested
      if (options.task) {
        const task = workflowConfig.tasks.find(t => t.name === options.task);
        if (!task) {
          ui.printError(`Task "${options.task}" not found.`);
          return;
        }
        workflowConfig.tasks = [task];
      }

      console.log();
      ui.printInfo(`Running workflow: ${workflowConfig.name}`);
      console.log();

      const executor = new TaskExecutor(workflowConfig);
      
      // Execute tasks with progress
      for (const task of workflowConfig.tasks) {
        ui.startTask(task.name);
        
        // This is a simplified version - in real implementation,
        // we'd hook into the executor for real-time updates
      }

      const result = await executor.execute();
      
      // Display results
      ui.printTaskTable(result.taskResults);
      ui.printWorkflowSummary(result);
      
      // Save to history
      await historyManager.addEntry(result, configPath);

      process.exit(result.success ? 0 : 1);
    } catch (error: any) {
      ui.printError(error.message);
      process.exit(1);
    }
  });

// Init command
program
  .command('init')
  .description('Initialize a new workflow configuration')
  .option('-t, --type <type>', 'Project type (node, python, go, rust, java)')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(async (options) => {
    try {
      const existingConfig = await findConfigFile();
      
      if (existingConfig && !options.force) {
        ui.printWarning(`Configuration already exists: ${existingConfig}`);
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: 'Do you want to overwrite it?',
            default: false,
          },
        ]);
        
        if (!overwrite) {
          ui.printInfo('Operation cancelled.');
          return;
        }
      }

      let projectType = options.type;
      
      if (!projectType) {
        const detected = await detectProjectType(process.cwd());
        const { selectedType } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedType',
            message: 'Select project type:',
            default: detected,
            choices: [
              { name: `Node.js ${detected === 'node' ? '(detected)' : ''}`, value: 'node' },
              { name: `Python ${detected === 'python' ? '(detected)' : ''}`, value: 'python' },
              { name: `Go ${detected === 'go' ? '(detected)' : ''}`, value: 'go' },
              { name: `Rust ${detected === 'rust' ? '(detected)' : ''}`, value: 'rust' },
              { name: `Java ${detected === 'java' ? '(detected)' : ''}`, value: 'java' },
              { name: 'Custom', value: 'unknown' },
            ],
          },
        ]);
        projectType = selectedType;
      }

      const configPath = await createDefaultConfig(process.cwd(), projectType as any);
      ui.printSuccess(`Created workflow configuration: ${configPath}`);
      console.log(chalk.gray('\n  Edit the file to customize your workflow.'));
      console.log(chalk.gray('  Run `flowforge run` to execute the workflow.'));
    } catch (error: any) {
      ui.printError(error.message);
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List all tasks in the workflow')
  .action(async () => {
    try {
      const configFile = await findConfigFile();
      
      if (!configFile) {
        ui.printError('No workflow configuration found.');
        return;
      }

      const workflowConfig = await loadConfig(path.resolve(configFile));
      
      console.log();
      console.log(chalk.bold(`  Workflow: ${workflowConfig.name}`));
      console.log(chalk.gray(`  ${workflowConfig.description || 'No description'}`));
      console.log();
      
      const Table = require('cli-table3');
      const table = new Table({
        head: [
          chalk.cyan.bold('#'),
          chalk.cyan.bold('Task'),
          chalk.cyan.bold('Command'),
          chalk.cyan.bold('Dependencies'),
        ],
        style: { head: [], border: ['gray'] },
      });

      workflowConfig.tasks.forEach((task, index) => {
        table.push([
          index + 1,
          task.name,
          task.command.slice(0, 40) + (task.command.length > 40 ? '...' : ''),
          task.dependsOn?.join(', ') || '-',
        ]);
      });

      console.log(table.toString());
      console.log();
    } catch (error: any) {
      ui.printError(error.message);
      process.exit(1);
    }
  });

// History command
program
  .command('history')
  .description('Show execution history')
  .option('-l, --limit <number>', 'Number of entries to show', '10')
  .action(async (options) => {
    try {
      const entries = historyManager.getHistory(parseInt(options.limit));
      ui.printHistory(entries);
    } catch (error: any) {
      ui.printError(error.message);
      process.exit(1);
    }
  });

// Stats command
program
  .command('stats')
  .description('Show workflow statistics')
  .action(async () => {
    try {
      const stats = historyManager.getStats();
      ui.printStats(stats);
    } catch (error: any) {
      ui.printError(error.message);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate [workflow]')
  .description('Validate workflow configuration')
  .action(async (workflow) => {
    try {
      const configFile = workflow || await findConfigFile();
      
      if (!configFile) {
        ui.printError('No workflow configuration found.');
        return;
      }

      const workflowConfig = await loadConfig(path.resolve(configFile));
      
      ui.printSuccess('Configuration is valid!');
      console.log(chalk.gray(`  Name: ${workflowConfig.name}`));
      console.log(chalk.gray(`  Version: ${workflowConfig.version}`));
      console.log(chalk.gray(`  Tasks: ${workflowConfig.tasks.length}`));
    } catch (error: any) {
      ui.printError(`Validation failed: ${error.message}`);
      process.exit(1);
    }
  });

// Clean command
program
  .command('clean')
  .description('Clear execution history')
  .option('-f, --force', 'Skip confirmation')
  .action(async (options) => {
    try {
      if (!options.force) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to clear all history?',
            default: false,
          },
        ]);
        
        if (!confirm) {
          ui.printInfo('Operation cancelled.');
          return;
        }
      }

      await historyManager.clear();
      ui.printSuccess('History cleared.');
    } catch (error: any) {
      ui.printError(error.message);
      process.exit(1);
    }
  });

// Default action - show help
program.parse();

import chalk from 'chalk';

// If no command provided, show banner and help
if (process.argv.length === 2) {
  ui.printBanner();
  program.outputHelp();
}

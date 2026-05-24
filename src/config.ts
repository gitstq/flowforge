/**
 * FlowForge - Config Parser
 * Handles loading and parsing workflow configuration files
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { Workflow, Task, DEFAULT_SETTINGS, ProjectType, ProjectConfig } from './types';

const CONFIG_FILE_NAMES = [
  'flowforge.yml',
  'flowforge.yaml',
  'flowforge.json',
  '.flowforge.yml',
  '.flowforge.yaml',
  '.flowforge.json',
];

export async function findConfigFile(dir: string = process.cwd()): Promise<string | null> {
  for (const fileName of CONFIG_FILE_NAMES) {
    const filePath = path.join(dir, fileName);
    if (await fs.pathExists(filePath)) {
      return filePath;
    }
  }
  return null;
}

export async function loadConfig(filePath: string): Promise<Workflow> {
  const content = await fs.readFile(filePath, 'utf-8');
  const ext = path.extname(filePath).toLowerCase();
  
  let config: any;
  
  if (ext === '.json') {
    config = JSON.parse(content);
  } else {
    config = yaml.load(content) as any;
  }
  
  return validateAndNormalizeConfig(config);
}

function validateAndNormalizeConfig(config: any): Workflow {
  if (!config.name) {
    throw new Error('Workflow name is required');
  }
  
  if (!config.tasks || !Array.isArray(config.tasks) || config.tasks.length === 0) {
    throw new Error('At least one task is required');
  }
  
  const tasks: Task[] = config.tasks.map((task: any, index: number) => {
    if (!task.name) {
      throw new Error(`Task at index ${index} must have a name`);
    }
    if (!task.command) {
      throw new Error(`Task "${task.name}" must have a command`);
    }
    
    return {
      name: task.name,
      command: task.command,
      description: task.description,
      cwd: task.cwd,
      env: task.env || {},
      timeout: task.timeout,
      retry: task.retry || 0,
      dependsOn: task.dependsOn || task.depends_on || [],
      condition: task.condition || task.if,
      silent: task.silent || false,
      ignoreError: task.ignoreError || task.ignore_error || false,
    };
  });
  
  // Validate task dependencies
  const taskNames = new Set(tasks.map(t => t.name));
  for (const task of tasks) {
    for (const dep of task.dependsOn || []) {
      if (!taskNames.has(dep)) {
        throw new Error(`Task "${task.name}" depends on non-existent task "${dep}"`);
      }
    }
  }
  
  // Check for circular dependencies
  detectCircularDependencies(tasks);
  
  return {
    name: config.name,
    version: config.version || '1.0.0',
    description: config.description,
    tasks,
    settings: {
      ...DEFAULT_SETTINGS,
      ...config.settings,
    },
  };
}

function detectCircularDependencies(tasks: Task[]): void {
  const taskMap = new Map(tasks.map(t => [t.name, t]));
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function hasCycle(taskName: string): boolean {
    if (recursionStack.has(taskName)) {
      return true;
    }
    if (visited.has(taskName)) {
      return false;
    }
    
    visited.add(taskName);
    recursionStack.add(taskName);
    
    const task = taskMap.get(taskName);
    if (task && task.dependsOn) {
      for (const dep of task.dependsOn) {
        if (hasCycle(dep)) {
          return true;
        }
      }
    }
    
    recursionStack.delete(taskName);
    return false;
  }
  
  for (const task of tasks) {
    if (hasCycle(task.name)) {
      throw new Error('Circular dependency detected in task definitions');
    }
  }
}

export async function detectProjectType(dir: string): Promise<ProjectType> {
  const files = await fs.readdir(dir);
  
  if (files.includes('package.json')) {
    return 'node';
  }
  if (files.includes('requirements.txt') || files.includes('pyproject.toml') || files.includes('setup.py')) {
    return 'python';
  }
  if (files.includes('go.mod')) {
    return 'go';
  }
  if (files.includes('Cargo.toml')) {
    return 'rust';
  }
  if (files.includes('pom.xml') || files.includes('build.gradle')) {
    return 'java';
  }
  
  return 'unknown';
}

export async function createDefaultConfig(dir: string, projectType: ProjectType): Promise<string> {
  const configPath = path.join(dir, 'flowforge.yml');
  
  const templates: Record<ProjectType, any> = {
    node: {
      name: path.basename(dir),
      version: '1.0.0',
      description: 'Development workflow for Node.js project',
      settings: {
        parallel: true,
        failFast: true,
      },
      tasks: [
        {
          name: 'install',
          command: 'npm install',
          description: 'Install dependencies',
        },
        {
          name: 'lint',
          command: 'npm run lint',
          description: 'Run linter',
          dependsOn: ['install'],
        },
        {
          name: 'test',
          command: 'npm test',
          description: 'Run tests',
          dependsOn: ['install'],
        },
        {
          name: 'build',
          command: 'npm run build',
          description: 'Build project',
          dependsOn: ['lint', 'test'],
        },
      ],
    },
    python: {
      name: path.basename(dir),
      version: '1.0.0',
      description: 'Development workflow for Python project',
      settings: {
        parallel: false,
        failFast: true,
      },
      tasks: [
        {
          name: 'install',
          command: 'pip install -r requirements.txt',
          description: 'Install dependencies',
        },
        {
          name: 'lint',
          command: 'flake8 .',
          description: 'Run linter',
          dependsOn: ['install'],
        },
        {
          name: 'test',
          command: 'pytest',
          description: 'Run tests',
          dependsOn: ['install'],
        },
      ],
    },
    go: {
      name: path.basename(dir),
      version: '1.0.0',
      description: 'Development workflow for Go project',
      settings: {
        parallel: true,
        failFast: true,
      },
      tasks: [
        {
          name: 'fmt',
          command: 'go fmt ./...',
          description: 'Format code',
        },
        {
          name: 'lint',
          command: 'golangci-lint run',
          description: 'Run linter',
        },
        {
          name: 'test',
          command: 'go test ./...',
          description: 'Run tests',
        },
        {
          name: 'build',
          command: 'go build ./...',
          description: 'Build project',
          dependsOn: ['fmt', 'lint', 'test'],
        },
      ],
    },
    rust: {
      name: path.basename(dir),
      version: '1.0.0',
      description: 'Development workflow for Rust project',
      settings: {
        parallel: true,
        failFast: true,
      },
      tasks: [
        {
          name: 'fmt',
          command: 'cargo fmt',
          description: 'Format code',
        },
        {
          name: 'clippy',
          command: 'cargo clippy -- -D warnings',
          description: 'Run clippy',
        },
        {
          name: 'test',
          command: 'cargo test',
          description: 'Run tests',
        },
        {
          name: 'build',
          command: 'cargo build --release',
          description: 'Build release',
          dependsOn: ['fmt', 'clippy', 'test'],
        },
      ],
    },
    java: {
      name: path.basename(dir),
      version: '1.0.0',
      description: 'Development workflow for Java project',
      settings: {
        parallel: false,
        failFast: true,
      },
      tasks: [
        {
          name: 'compile',
          command: 'mvn compile',
          description: 'Compile source code',
        },
        {
          name: 'test',
          command: 'mvn test',
          description: 'Run tests',
          dependsOn: ['compile'],
        },
        {
          name: 'package',
          command: 'mvn package',
          description: 'Package application',
          dependsOn: ['test'],
        },
      ],
    },
    unknown: {
      name: path.basename(dir),
      version: '1.0.0',
      description: 'Basic development workflow',
      settings: {
        parallel: false,
        failFast: true,
      },
      tasks: [
        {
          name: 'build',
          command: 'echo "Add your build command here"',
          description: 'Build project',
        },
        {
          name: 'test',
          command: 'echo "Add your test command here"',
          description: 'Run tests',
        },
      ],
    },
  };
  
  const config = templates[projectType];
  const content = yaml.dump(config, { indent: 2, lineWidth: -1 });
  
  await fs.writeFile(configPath, content, 'utf-8');
  return configPath;
}

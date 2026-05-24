<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg" alt="Node Version">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg" alt="Platform">
</p>

<p align="center">
  <a href="#english">English</a> | 
  <a href="#简体中文">简体中文</a> | 
  <a href="#繁體中文">繁體中文</a>
</p>

---

<a name="english"></a>
# 🎉 FlowForge

**A lightweight CLI tool for defining, executing, and managing development workflows.**

FlowForge helps developers automate repetitive tasks with simple YAML configuration. Define your workflows once, run them everywhere. Perfect for build pipelines, deployment scripts, and development automation.

## ✨ Core Features

- 📝 **Simple Configuration** - Define workflows in YAML or JSON with minimal syntax
- ⚡ **Flexible Execution** - Run tasks in serial or parallel with dependency management
- 🔗 **Smart Dependencies** - Define task dependencies with automatic execution order
- 🎯 **Conditional Execution** - Run tasks based on branch, environment, or file conditions
- 📊 **Beautiful Output** - Modern terminal UI with progress tracking and summaries
- 💾 **History Tracking** - View execution history and statistics
- 🧩 **Auto-Detection** - Automatically detect project type and generate templates
- 🚀 **Zero Dependencies** - Single binary, no external dependencies required

## 🚀 Quick Start

### Installation

```bash
# Using npm
npm install -g flowforge

# Using yarn
yarn global add flowforge

# Or run directly with npx
npx flowforge --help
```

### Initialize a Workflow

```bash
# Auto-detect project type and create config
flowforge init

# Or specify project type
flowforge init --type node
flowforge init --type python
flowforge init --type go
flowforge init --type rust
```

### Run a Workflow

```bash
# Run with default config
flowforge run

# Run with parallel execution
flowforge run --parallel

# Run specific task only
flowforge run --task build

# Run with verbose output
flowforge run --verbose
```

## 📖 Detailed Usage

### Workflow Configuration

Create a `flowforge.yml` file in your project root:

```yaml
name: my-project
version: 1.0.0
description: Development workflow for my project

settings:
  parallel: true      # Run tasks in parallel
  failFast: true      # Stop on first failure
  maxParallel: 4      # Max concurrent tasks
  timeout: 300000     # 5 minutes timeout

tasks:
  - name: install
    command: npm install
    description: Install dependencies

  - name: lint
    command: npm run lint
    description: Run linter
    dependsOn: [install]

  - name: test
    command: npm test
    description: Run tests
    dependsOn: [install]

  - name: build
    command: npm run build
    description: Build project
    dependsOn: [lint, test]
```

### Task Options

Each task supports the following options:

| Option | Type | Description |
|--------|------|-------------|
| `name` | string | Task name (required) |
| `command` | string | Command to execute (required) |
| `description` | string | Task description |
| `cwd` | string | Working directory |
| `env` | object | Environment variables |
| `timeout` | number | Timeout in milliseconds |
| `retry` | number | Number of retry attempts |
| `dependsOn` | string[] | Task dependencies |
| `condition` | object | Conditional execution rules |
| `silent` | boolean | Suppress output |
| `ignoreError` | boolean | Continue on failure |

### Conditional Execution

Run tasks based on conditions:

```yaml
tasks:
  - name: deploy-production
    command: npm run deploy:prod
    condition:
      branch: main           # Only on main branch
      env: CI               # Only when CI env var is set
      fileExists: dist/     # Only when dist/ exists
```

### CLI Commands

```bash
flowforge init              # Create new workflow config
flowforge run [file]        # Execute workflow
flowforge list              # List all tasks
flowforge validate [file]   # Validate configuration
flowforge history           # Show execution history
flowforge stats             # Show workflow statistics
flowforge clean             # Clear history
```

## 💡 Design Philosophy

FlowForge was designed with these principles in mind:

1. **Simplicity First** - Minimal configuration, maximum productivity
2. **Developer Experience** - Beautiful output, helpful error messages
3. **Flexibility** - Support for any project type and workflow
4. **Reliability** - Proper error handling and dependency resolution

### Future Roadmap

- [ ] Web UI for workflow visualization
- [ ] Remote execution support
- [ ] Plugin system for custom task types
- [ ] Integration with CI/CD platforms
- [ ] Workflow templates marketplace

## 📦 Deployment

### Build from Source

```bash
git clone https://github.com/gitstq/flowforge.git
cd flowforge
npm install
npm run build
npm link  # Install globally
```

### Create Distribution Package

```bash
npm pack
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
git clone https://github.com/gitstq/flowforge.git
cd flowforge
npm install
npm run dev  # Run in development mode
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<a name="简体中文"></a>
# 🎉 FlowForge

**轻量级开发工作流自动化 CLI 工具**

FlowForge 帮助开发者通过简单的 YAML 配置自动化重复性任务。一次定义工作流，随处运行。非常适合构建流水线、部署脚本和开发自动化。

## ✨ 核心特性

- 📝 **简洁配置** - 使用 YAML 或 JSON 定义工作流，语法极简
- ⚡ **灵活执行** - 支持串行或并行执行，自动管理依赖
- 🔗 **智能依赖** - 定义任务依赖关系，自动计算执行顺序
- 🎯 **条件执行** - 基于分支、环境变量或文件条件执行任务
- 📊 **美观输出** - 现代化终端 UI，实时进度跟踪
- 💾 **历史记录** - 查看执行历史和统计数据
- 🧩 **自动检测** - 自动识别项目类型并生成模板
- 🚀 **零依赖** - 单一二进制文件，无需外部依赖

## 🚀 快速开始

### 安装

```bash
# 使用 npm
npm install -g flowforge

# 使用 yarn
yarn global add flowforge

# 或直接使用 npx 运行
npx flowforge --help
```

### 初始化工作流

```bash
# 自动检测项目类型并创建配置
flowforge init

# 或指定项目类型
flowforge init --type node
flowforge init --type python
flowforge init --type go
flowforge init --type rust
```

### 运行工作流

```bash
# 使用默认配置运行
flowforge run

# 并行执行
flowforge run --parallel

# 只运行特定任务
flowforge run --task build

# 详细输出模式
flowforge run --verbose
```

## 📖 详细使用

### 工作流配置

在项目根目录创建 `flowforge.yml` 文件：

```yaml
name: my-project
version: 1.0.0
description: 我项目的开发工作流

settings:
  parallel: true      # 并行执行任务
  failFast: true      # 首次失败时停止
  maxParallel: 4      # 最大并发任务数
  timeout: 300000     # 5分钟超时

tasks:
  - name: install
    command: npm install
    description: 安装依赖

  - name: lint
    command: npm run lint
    description: 运行代码检查
    dependsOn: [install]

  - name: test
    command: npm test
    description: 运行测试
    dependsOn: [install]

  - name: build
    command: npm run build
    description: 构建项目
    dependsOn: [lint, test]
```

### 任务选项

每个任务支持以下选项：

| 选项 | 类型 | 描述 |
|------|------|------|
| `name` | string | 任务名称（必填） |
| `command` | string | 要执行的命令（必填） |
| `description` | string | 任务描述 |
| `cwd` | string | 工作目录 |
| `env` | object | 环境变量 |
| `timeout` | number | 超时时间（毫秒） |
| `retry` | number | 重试次数 |
| `dependsOn` | string[] | 任务依赖 |
| `condition` | object | 条件执行规则 |
| `silent` | boolean | 静默输出 |
| `ignoreError` | boolean | 失败时继续 |

### 条件执行

基于条件执行任务：

```yaml
tasks:
  - name: deploy-production
    command: npm run deploy:prod
    condition:
      branch: main           # 仅在 main 分支
      env: CI               # 仅当 CI 环境变量存在
      fileExists: dist/     # 仅当 dist/ 目录存在
```

### CLI 命令

```bash
flowforge init              # 创建新的工作流配置
flowforge run [file]        # 执行工作流
flowforge list              # 列出所有任务
flowforge validate [file]   # 验证配置
flowforge history           # 显示执行历史
flowforge stats             # 显示工作流统计
flowforge clean             # 清除历史
```

## 💡 设计理念

FlowForge 的设计遵循以下原则：

1. **简洁优先** - 最小配置，最大生产力
2. **开发者体验** - 美观输出，友好的错误提示
3. **灵活性** - 支持任何项目类型和工作流
4. **可靠性** - 完善的错误处理和依赖解析

### 未来规划

- [ ] 工作流可视化 Web UI
- [ ] 远程执行支持
- [ ] 自定义任务类型插件系统
- [ ] CI/CD 平台集成
- [ ] 工作流模板市场

## 📦 部署

### 从源码构建

```bash
git clone https://github.com/gitstq/flowforge.git
cd flowforge
npm install
npm run build
npm link  # 全局安装
```

### 创建发布包

```bash
npm pack
```

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发环境设置

```bash
git clone https://github.com/gitstq/flowforge.git
cd flowforge
npm install
npm run dev  # 开发模式运行
```

## 📄 开源协议

本项目基于 MIT 协议开源 - 详见 [LICENSE](LICENSE) 文件。

---

<a name="繁體中文"></a>
# 🎉 FlowForge

**輕量級開發工作流程自動化 CLI 工具**

FlowForge 幫助開發者透過簡單的 YAML 配置自動化重複性任務。一次定義工作流程，隨處執行。非常適合建構流水線、部署腳本和開發自動化。

## ✨ 核心特性

- 📝 **簡潔配置** - 使用 YAML 或 JSON 定義工作流程，語法極簡
- ⚡ **靈活執行** - 支援序列或並行執行，自動管理依賴
- 🔗 **智慧依賴** - 定義任務依賴關係，自動計算執行順序
- 🎯 **條件執行** - 基於分支、環境變數或檔案條件執行任務
- 📊 **美觀輸出** - 現代化終端 UI，即時進度追蹤
- 💾 **歷史記錄** - 查看執行歷史和統計資料
- 🧩 **自動偵測** - 自動識別專案類型並產生範本
- 🚀 **零依賴** - 單一二進位檔案，無需外部依賴

## 🚀 快速開始

### 安裝

```bash
# 使用 npm
npm install -g flowforge

# 使用 yarn
yarn global add flowforge

# 或直接使用 npx 執行
npx flowforge --help
```

### 初始化工作流程

```bash
# 自動偵測專案類型並建立設定
flowforge init

# 或指定專案類型
flowforge init --type node
flowforge init --type python
flowforge init --type go
flowforge init --type rust
```

### 執行工作流程

```bash
# 使用預設設定執行
flowforge run

# 並行執行
flowforge run --parallel

# 只執行特定任務
flowforge run --task build

# 詳細輸出模式
flowforge run --verbose
```

## 📖 詳細使用

### 工作流程設定

在專案根目錄建立 `flowforge.yml` 檔案：

```yaml
name: my-project
version: 1.0.0
description: 我專案的開發工作流程

settings:
  parallel: true      # 並行執行任務
  failFast: true      # 首次失敗時停止
  maxParallel: 4      # 最大並發任務數
  timeout: 300000     # 5分鐘逾時

tasks:
  - name: install
    command: npm install
    description: 安裝依賴

  - name: lint
    command: npm run lint
    description: 執行程式碼檢查
    dependsOn: [install]

  - name: test
    command: npm test
    description: 執行測試
    dependsOn: [install]

  - name: build
    command: npm run build
    description: 建構專案
    dependsOn: [lint, test]
```

### 任務選項

每個任務支援以下選項：

| 選項 | 類型 | 描述 |
|------|------|------|
| `name` | string | 任務名稱（必填） |
| `command` | string | 要執行的命令（必填） |
| `description` | string | 任務描述 |
| `cwd` | string | 工作目錄 |
| `env` | object | 環境變數 |
| `timeout` | number | 逾時時間（毫秒） |
| `retry` | number | 重試次數 |
| `dependsOn` | string[] | 任務依賴 |
| `condition` | object | 條件執行規則 |
| `silent` | boolean | 靜默輸出 |
| `ignoreError` | boolean | 失敗時繼續 |

### 條件執行

基於條件執行任務：

```yaml
tasks:
  - name: deploy-production
    command: npm run deploy:prod
    condition:
      branch: main           # 僅在 main 分支
      env: CI               # 僅當 CI 環境變數存在
      fileExists: dist/     # 僅當 dist/ 目錄存在
```

### CLI 命令

```bash
flowforge init              # 建立新的工作流程設定
flowforge run [file]        # 執行工作流程
flowforge list              # 列出所有任務
flowforge validate [file]   # 驗證設定
flowforge history           # 顯示執行歷史
flowforge stats             # 顯示工作流程統計
flowforge clean             # 清除歷史
```

## 💡 設計理念

FlowForge 的設計遵循以下原則：

1. **簡潔優先** - 最小設定，最大生產力
2. **開發者體驗** - 美觀輸出，友善的錯誤提示
3. **靈活性** - 支援任何專案類型和工作流程
4. **可靠性** - 完善的錯誤處理和依賴解析

### 未來規劃

- [ ] 工作流程視覺化 Web UI
- [ ] 遠端執行支援
- [ ] 自訂任務類型外掛系統
- [ ] CI/CD 平台整合
- [ ] 工作流程範本市集

## 📦 部署

### 從原始碼建構

```bash
git clone https://github.com/gitstq/flowforge.git
cd flowforge
npm install
npm run build
npm link  # 全域安裝
```

### 建立發布套件

```bash
npm pack
```

## 🤝 貢獻指南

歡迎貢獻！請遵循以下步驟：

1. Fork 本儲存庫
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 建立 Pull Request

### 開發環境設定

```bash
git clone https://github.com/gitstq/flowforge.git
cd flowforge
npm install
npm run dev  # 開發模式執行
```

## 📄 開源授權

本專案基於 MIT 授權開源 - 詳見 [LICENSE](LICENSE) 檔案。

---

<p align="center">
  Made with ❤️ by the FlowForge Team
</p>

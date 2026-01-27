# Zen New Tab | 静谧新标签页

A minimalist, elegant new tab page extension for Chrome and Edge.

一款极简、优雅的 Chrome/Edge 新标签页扩展。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## Table of Contents

- [English](#english)
  - [Features](#features)
  - [Installation](#installation)
  - [Development](#development)
  - [Tech Stack](#tech-stack)
- [中文](#中文)
  - [功能特性](#功能特性)
  - [安装方式](#安装方式)
  - [开发调试](#开发调试)
  - [技术栈](#技术栈)
- [Contributing](#contributing)
- [License](#license)
- [Code of Conduct](#code-of-conduct)

---

## English

### Features

| Feature | Description |
|---------|-------------|
| **Customizable Backgrounds** | Support for custom images and videos |
| **Live Clock** | Display current time with optional seconds |
| **Smart Search** | Google, Bing, and Baidu with real-time suggestions |
| **Bookmarks** | Quick access to your favorite sites |
| **Weather Widget** | Real-time weather based on your location |
| **Daily Quote** | Inspirational quotes to start your day |
| **Media Player** | Control browser audio from any tab |
| **Drag & Resize** | Fully customizable layout system |
| **Layout Sharing** | Share your layout configuration with others |

### Installation

#### From Source

```bash
git clone https://github.com/tlkppm/zen-newtab.git
cd zen-newtab
npm install
npm run build
```

Then load the `dist` folder as an unpacked extension in Chrome/Edge:

1. Open `chrome://extensions` or `edge://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist` folder

### Development

```bash
npm run dev
```

### Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| Zustand | State Management |
| Lucide | Icons |

---

## 中文

### 功能特性

| 功能 | 描述 |
|------|------|
| **自定义背景** | 支持自定义图片和视频背景 |
| **实时时钟** | 显示当前时间，可选秒数显示 |
| **智能搜索** | 支持 Google、Bing、百度，带实时搜索建议 |
| **书签管理** | 快速访问收藏夹 |
| **天气组件** | 基于地理位置的实时天气 |
| **每日一言** | 开启美好一天的励志语录 |
| **媒体播放器** | 控制任意标签页的音频播放 |
| **拖拽调整** | 完全自定义的布局系统 |
| **布局分享** | 与他人分享你的布局配置 |

### 安装方式

#### 从源码构建

```bash
git clone https://github.com/tlkppm/zen-newtab.git
cd zen-newtab
npm install
npm run build
```

然后在浏览器中加载扩展：

1. 打开 `chrome://extensions` 或 `edge://extensions`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"并选择 `dist` 文件夹

### 开发调试

```bash
npm run dev
```

### 技术栈

| 技术 | 用途 |
|------|------|
| React 18 | UI 框架 |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| Tailwind CSS | 样式 |
| Zustand | 状态管理 |
| Lucide | 图标库 |

---

## Contributing

We welcome contributions from everyone. Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a pull request.

欢迎任何形式的贡献。提交 PR 前请阅读 [贡献指南](CONTRIBUTING.md)。

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## Code of Conduct

This project adheres to the Contributor Covenant [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

本项目遵循 [行为准则](CODE_OF_CONDUCT.md)。参与本项目即表示您同意遵守此准则。

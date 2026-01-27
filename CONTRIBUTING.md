# Contributing to Zen New Tab

Thank you for your interest in contributing to Zen New Tab! This document provides guidelines and information about contributing to this project.

感谢您有兴趣为「静谧新标签页」做出贡献！本文档提供了参与本项目的指南和相关信息。

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Guidelines](#coding-guidelines)
- [Reporting Issues](#reporting-issues)

---

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

本项目及其所有参与者均受 [行为准则](CODE_OF_CONDUCT.md) 约束。参与本项目即表示您同意遵守此准则。

---

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Browser version and operating system
- Screenshots if applicable

### Suggesting Features

Feature suggestions are welcome. Please provide:

- A clear and descriptive title
- Detailed description of the proposed feature
- Explanation of why this feature would be useful
- Any relevant examples or mockups

### Pull Requests

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Submit a pull request

---

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Installation

```bash
git clone https://github.com/tlkppm/zen-newtab.git
cd zen-newtab
npm install
```

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Loading the Extension

1. Open `chrome://extensions` or `edge://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

---

## Pull Request Process

1. Ensure your code follows the project's coding guidelines
2. Update documentation if necessary
3. Add tests for new functionality when applicable
4. Ensure all tests pass and the build succeeds
5. Request review from maintainers

### Commit Message Format

Use clear and descriptive commit messages:

```
<type>: <description>

[optional body]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

---

## Coding Guidelines

### General

- Use TypeScript for type safety
- Follow existing code style and patterns
- Keep functions small and focused
- Write self-documenting code

### React Components

- Use functional components with hooks
- Keep components focused on a single responsibility
- Use proper TypeScript types for props

### Styling

- Use Tailwind CSS utility classes
- Follow existing naming conventions
- Ensure responsive design

---

## Reporting Issues

### Security Issues

For security vulnerabilities, please do NOT create a public issue. Instead, contact the maintainers directly.

对于安全漏洞，请勿创建公开 issue。请直接联系维护者。

### Bug Reports

Use the issue tracker and provide:

1. Clear title and description
2. Steps to reproduce
3. Expected vs actual behavior
4. Environment details (browser, OS)
5. Screenshots or logs if applicable

---

## Questions

If you have questions, feel free to open an issue with the "question" label.

如有疑问，请使用 "question" 标签创建 issue。

---

Thank you for contributing!

感谢您的贡献！

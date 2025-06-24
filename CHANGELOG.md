# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-06-24

### Added
- 流式传输支持，实现实时对话响应显示
- 可切换的流式传输开关，支持用户偏好保存
- 流式传输中断功能，允许用户随时停止生成
- Markdown 解析支持，AI 响应支持完整的 GitHub Flavored Markdown
- 代码语法高亮，支持多种编程语言
- 自适应的明暗主题代码高亮样式
- 改进的 UnifiedCombobox 组件，支持向上展开和描述显示

### Fixed
- 修复 DeepSeek-Prover-V2-671B 模型配置错误
- 修复命令选择器的处理逻辑
- 修复 UnifiedCombobox 在底部时的显示问题

### Improved
- 优化了对话体验，支持实时流式响应
- 提升了 AI 响应的可读性，支持表格、列表、代码块等格式
- 改进了命令选择器的用户体验

## [0.1.1] - 2025-06-22

### Added
- 空对话状态的友好欢迎界面，包含渐变背景图标和清晰的引导文案
- 交互式快捷功能卡片，支持悬停效果和视觉动画
- AI消息的重新生成按钮（UI已完成，功能待实现）
- 错误提示的解决方案建议和快速刷新按钮
- 未配置模型时的清晰配置引导界面

### Changed
- 优化了 ChatDialog 组件的用户体验和视觉设计
- 改进了快捷键提示的展示方式，使用卡片布局
- 优化了错误提示的文案，更加友好和有帮助
- 提升了整体界面的视觉层次和交互反馈

### Improved
- 更好的用户引导和操作提示
- 更现代化的 UI 设计风格
- 更清晰的信息架构和视觉层次

## [0.1.0] - 2025-06-21

### Initial Release
- AI LLM Providers Research and Testing Platform
- Support for multiple AI providers (OpenAI, Anthropic, Google Gemini, Ollama, etc.)
- Unified interface for testing and comparing AI models
- Sophisticated prompt template management
- Dual prompt editor implementations (Lexical and Textarea Overlay)
- Real-time chat interface with streaming support
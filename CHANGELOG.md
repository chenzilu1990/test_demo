# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2025-06-25

### Added
- 🎯 **上下文感知滚动条 (Context-Aware Scrollbar)** - 全新的可视化组件，提供全局视角的上下文窗口管理
- 💡 **记忆聚光灯增强** - 改进的透明度调节和上下文状态可视化
- 📊 **上下文边界检测** - 自动计算并标记上下文窗口的起始和结束位置
- 🔍 **智能滚动条** - 自定义滚动条替代原生滚动条，提供更精确的导航控制
- 📏 **上下文窗口可视化** - 直观显示哪些消息在AI的"记忆"中，哪些已超出上下文
- 🎨 **透明窗口设计** - 上下文窗口区域保持透明，历史消息使用遮罩效果

### Fixed
- 修复 useContextCalculation 中的 TypeScript 警告
- 修复 distanceFromWindow 计算逻辑，正确处理负值
- 修复滚动容器的布局和溢出处理

### Improved
- **视觉层级优化** - 重新设计滚动条的视觉层级，符合物理直觉
- **交互体验提升** - 支持点击和拖拽导航，悬停显示详细信息
- **跨浏览器兼容** - 完全隐藏原生滚动条，在所有主流浏览器中保持一致体验
- **响应式设计** - 自适应不同屏幕尺寸和暗色模式
- **性能优化** - 使用高效的滚动监听和实时更新机制

### Technical Details
- 新增 `ContextAwareScrollbar` 组件，提供独立的滚动条可视化
- 增强 `useContextCalculation` Hook，返回上下文边界信息
- 添加 `.scrollbar-hide` CSS 工具类，完全隐藏原生滚动条
- 实现三层视觉结构：背景层、视口指示器、历史消息遮罩

## [0.3.0] - 2025-06-24

### Added
- 🗂️ 多对话管理系统，支持创建、切换、保存多个独立对话
- 💬 侧边栏对话列表，显示对话历史和实时状态
- 💾 本地持久化存储，对话数据自动保存到 localStorage
- 🔄 对话操作功能：重命名、复制、删除对话
- 🎯 智能对话标题生成，基于首条用户消息自动命名
- 📑 侧边栏标签页切换，支持对话列表和模板列表视图
- 🔧 完整的对话管理 Hook (useConversations)

### Fixed
- 修复流式传输时 AI 回复消息不显示的问题
- 修复流式传输中断时消息内容丢失的问题
- 修复对话切换时状态同步问题

### Improved
- 优化了对话体验，支持多对话并行管理
- 提升了数据持久化的可靠性
- 改进了侧边栏交互体验，支持收起/展开
- 增强了对话列表的视觉效果和操作便利性

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
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.1] - 2025-07-02

### Fixed
- 🐛 **修复上下文状态显示问题** - 解决了消息 isInactive 状态判断不一致的问题
- 🔧 **统一上下文状态管理** - 移除了双重上下文判断系统，完全基于 token 计算确定消息状态

### Improved
- **代码简化** - 简化了 ChatDialog 组件的消息渲染逻辑，提高可维护性
- **性能优化** - 移除了冗余的状态计算和查找操作
- **准确性提升** - 消息状态现在准确反映其在 AI 上下文窗口中的实际位置

### Technical Details
- 重构 ChatDialog.tsx，直接使用 processedMessages 进行渲染
- 移除 isMessageInContext 函数的导入和使用
- 消息的 active/fading/inactive 状态完全基于 token 使用量计算

## [0.7.0] - 2025-07-01

### Added
- 🚀 **智能流式渲染优化** - MarkdownRenderer 新增智能渲染策略，流式传输时延迟复杂解析
- 🎯 **消息状态机机制** - 引入消息状态机管理，解决流式传输中的竞态条件和状态覆盖问题
- 📊 **渲染性能监控** - 新增内容变化检测和复杂度分析，智能决定渲染时机
- 🔄 **状态同步防护** - 基于状态机的防护机制，避免活跃操作期间的状态覆盖

### Improved
- **流式传输性能提升** - 短内容和简单文本立即渲染，长内容延迟完整解析
- **用户体验优化** - 流式传输时提供即时文本反馈，完成后自动切换到完整渲染
- **状态管理增强** - 更可靠的消息状态跟踪，防止消息丢失或重复
- **内存使用优化** - 使用 useRef 缓存上次渲染内容，减少不必要的重新计算

### Technical Details
- MarkdownRenderer 组件新增 `isStreaming` 属性和智能渲染策略
- 实现基于内容长度、复杂度和变化量的渲染决策算法
- 引入 MessageState 类型定义和 updateMessageState 状态转换函数
- 优化 useEffect 同步逻辑，添加流式消息检测和保留机制

## [0.6.0] - 2025-06-26

### Added
- 🔄 **上下文与历史记录分离架构** - 完全分离对话历史记录和AI上下文窗口概念
- 🆔 **基于消息ID的上下文管理** - 使用contextMessageIds管理上下文，避免数据冗余
- 🛠️ **上下文管理工具模块** - 完整的contextManager工具集，支持上下文操作
- 🔄 **自动数据迁移** - 无缝迁移老格式数据到新的contextMessageIds架构
- 📊 **智能上下文指示** - UI清晰区分历史记录和当前上下文消息

### Changed
- **清理功能重构** - 清理操作只影响contextMessageIds，完整保留所有历史记录
- **AI请求优化** - AI只接收contextMessageIds指定的消息，提升上下文精确度
- **存储架构升级** - Conversation接口使用contextMessageIds替代contextMessages数组

### Improved
- **内存使用优化** - contextMessages作为messages的视图，无数据重复存储
- **灵活上下文选择** - 支持非连续的上下文消息选择和管理
- **用户体验提升** - 历史记录永不丢失，只影响AI的上下文窗口

### Technical Details
- 新增 `contextManager.ts` 工具模块，提供完整的上下文操作API
- 重构 `conversationStorage.ts`，支持contextMessageIds存储和迁移
- 升级 `useConversations` Hook，新增contextMessageIds管理方法
- 优化清理策略，返回消息ID数组而非消息对象
- 实现向后兼容的数据迁移逻辑

## [0.5.0] - 2025-06-26

### Added
- 🧹 **智能上下文清理功能** - 全新的上下文管理系统，支持多种清理策略
- 🎯 **清理策略选择器** - 提供4种智能清理策略：保留最近消息、保留完整对话、智能清理、按百分比清理
- 👁️ **清理预览功能** - 在执行清理前预览将保留和删除的消息，显示释放的Token数量
- 📊 **增强的上下文指示器** - 新增下拉菜单界面，提供更详细的上下文管理选项
- 🎨 **美化的UI组件** - 重新设计的上下文管理界面，提供更好的用户体验

### Improved
- **智能清理算法** - 基于消息重要性评分的智能清理，保留关键对话内容
- **策略推荐系统** - 根据当前上下文使用率自动推荐最合适的清理策略
- **用户交互优化** - 清理操作需要确认，防止误操作
- **实时预览计算** - 动态显示每种策略的清理效果
- **响应式设计** - 在移动端和桌面端都有良好的显示效果

### Technical Details
- 新增 `contextCleanup.ts` 工具模块，实现清理策略的核心逻辑
- 新增 `ContextCleanupDialog` 组件，提供清理策略选择和预览界面
- 优化 `ContextIndicator` 组件，添加下拉菜单和更丰富的交互
- 集成 `useContextCalculation` Hook，实时计算上下文使用率
- 支持策略扩展，便于未来添加更多清理策略

## [0.4.1] - 2025-06-25

### Fixed
- 🐛 **修复上下文信息面板跟随逻辑Bug** - 彻底解决面板定位和跟随鼠标的所有问题
- 🎯 **统一坐标系统** - 修复mousePosition相对坐标与面板绝对定位的冲突
- 🔧 **重构CSS定位方式** - 移除CSS类定位冲突，使用精确的内联样式定位
- 📏 **动态尺寸检测** - 使用panelRef获取实际面板尺寸，提高边界检测准确性
- 🛡️ **改进边界检测** - 双重边界检测(容器+视口)，确保面板始终可见
- ⚡ **性能优化** - 添加60fps防抖处理，避免过度更新和内存泄漏

### Improved
- **精确跟随** - 信息面板现在能够精确跟随鼠标位置，无偏移和跳跃
- **智能避让** - 自动选择最佳显示位置，永不被边界截断
- **流畅动画** - 优化过渡效果，提供更加平滑的视觉体验
- **响应式适配** - 在所有屏幕尺寸下都能正常工作

### Technical Details
- 修复了mousePosition.y相对坐标与面板绝对定位的坐标系不统一问题
- 移除right-6/left-6 CSS类与transform冲突，改用fixed定位+内联样式
- 新增panelRef动态获取面板实际尺寸，替代固定尺寸估算
- 实现视口边界和容器边界的双重检测机制
- 添加16ms防抖和清理函数，防止内存泄漏

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
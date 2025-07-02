# AI LLM Providers Research Platform

> 🚀 **Version 0.7.1** - A unified interface for testing and comparing multiple AI/LLM providers with advanced context management and optimized streaming performance.

## 🌟 Features

### Core Functionality
- **🤖 Multi-Provider Support**: OpenAI, Anthropic, Google Gemini, Ollama, SiliconFlow, AiHubMix
- **💬 Real-time Chat Interface**: Stream responses with markdown support
- **📝 Advanced Prompt Management**: Dual editor implementations (Lexical & Textarea)
- **🗂️ Multi-Conversation System**: Manage multiple chat sessions with persistent storage

### Advanced Context Management
- **🎯 Context-Aware Scrollbar**: Visual representation of AI context windows
- **💡 Memory Spotlight**: Dynamic opacity-based message visibility
- **📊 Real-time Token Tracking**: Monitor context usage and optimization
- **🔍 Smart Context Boundaries**: Automatic detection and visualization of context limits

### Latest Enhancements (v0.7.1)
- **🐛 Context State Fix**: Unified context state management based on token calculations
- **🔧 Code Simplification**: Streamlined message rendering logic for better maintainability

### Previous Release (v0.7.0)
- **🚀 Smart Streaming Optimization**: Intelligent rendering strategy for improved performance
- **🎯 Message State Machine**: Reliable state management preventing race conditions
- **📊 Performance Monitoring**: Real-time content analysis for optimal rendering decisions
- **🔄 Enhanced Sync Protection**: State machine-based protection against state overwrites

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd test_demo

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🛠️ Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   └── ai-providers-chat/  # Main chat application
├── components/             # Reusable React components
├── ai-providers/          # AI provider abstraction layer
│   ├── core/             # Base classes and utilities
│   ├── providers/        # Provider implementations
│   └── config/           # Provider configurations
└── lib/                  # Shared utilities
```

## 🎯 Key Components

### Context-Aware Scrollbar
- **Visual Context Mapping**: See exactly which messages are in AI's "memory"
- **Mouse-Following Tooltips**: Real-time information about any position in chat history
- **Smart Boundary Detection**: Automatic edge avoidance and optimal positioning
- **Performance Optimized**: Smooth 60fps updates with intelligent debouncing

### Prompt Editor System
- **Lexical Editor**: Rich text editing with plugin architecture
- **Textarea Overlay**: Lightweight alternative with canvas-based positioning
- **Template Management**: Import/export with tag-based organization
- **Parameter Substitution**: Dynamic variable replacement

### Provider Architecture
- **Unified Interface**: Consistent API across all providers
- **Built-in Caching**: TTL-based response caching
- **Error Handling**: Provider-specific error parsing
- **Performance Monitoring**: Request metrics and monitoring

## 🔧 Configuration

Configuration is managed through the provider settings interface. Each provider requires:
- API keys/credentials
- Model selection
- Context window settings
- Custom parameters (temperature, top-p, etc.)

## 📊 Context Management

The platform provides sophisticated context window management:

1. **Real-time Tracking**: Monitor token usage as you chat
2. **Visual Indicators**: See which messages are active, fading, or historical
3. **Smart Recommendations**: Get suggestions when approaching context limits
4. **Automatic Optimization**: Intelligent message prioritization

## 🎨 UI/UX Features

- **Dark/Light Mode**: Automatic theme switching
- **Responsive Design**: Works on desktop and mobile
- **Smooth Animations**: 200ms transitions for optimal feel
- **Accessibility**: ARIA labels and keyboard navigation
- **Performance**: Optimized rendering and minimal re-renders

## 🧪 Recent Updates

### v0.7.0 (2025-07-01)
- **Smart Streaming Optimization**: Intelligent markdown rendering with performance boost
- **Message State Machine**: Robust state management for streaming messages
- **Performance Monitoring**: Real-time analysis of content complexity
- **Enhanced Reliability**: State sync protection during active operations

### v0.6.0 (2025-06-26)
- **Context-History Separation**: Complete separation of chat history and AI context
- **ID-based Context Management**: Efficient context management using message IDs
- **Auto Migration**: Seamless migration of legacy data formats

### v0.5.0 (2025-06-26)
- **Smart Context Cleanup**: Multiple cleanup strategies with preview
- **Cleanup Recommendations**: AI-powered strategy suggestions
- **Enhanced UI**: Beautiful context management interface

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)

---

**Built with ❤️ using Next.js 15, TypeScript, and Tailwind CSS**
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI LLM Providers Research and Testing Platform built with Next.js 15.3.2 using the App Router pattern. The project provides a unified interface for testing and comparing multiple AI/LLM providers, along with sophisticated prompt template management and editing capabilities.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Architecture Overview

### AI Provider Abstraction Layer

The project implements a sophisticated provider abstraction pattern located in `/src/ai-providers/`:

- **BaseProvider**: Abstract base class implementing the AIProvider interface
- **Provider Factory**: `createProvider()` instantiates providers based on configuration
- **Supported Providers**: OpenAI, Anthropic, Google Gemini, Ollama (local), SiliconFlow, AiHubMix
- **Key Features**:
  - Unified interface regardless of underlying provider
  - Built-in caching with TTL support (`CachedProvider` decorator)
  - Retry mechanism with exponential backoff
  - Performance monitoring and metrics collection
  - Comprehensive error handling with provider-specific parsing

### Prompt Editor Architecture

The project features two distinct prompt editor implementations:

1. **Lexical-based Editor** (`/src/components/PromptEditor/`):
   - Built on Facebook's Lexical framework
   - Plugin-based architecture (TemplateParserPlugin, RealTimeParserPlugin)
   - Custom nodes: BracketNode, SelectedValueNode
   - Supports parameterized templates with bracket syntax: `[parameter]`, `{parameter}`, `{{parameter}}`

2. **Textarea Overlay Editor** (`/src/components/prompt-editor/textarea-editor/`):
   - Lightweight implementation using native textarea
   - Overlay pattern for interactive elements
   - Canvas-based text measurement for precise positioning
   - Performance optimized with visible-only rendering

### Template System

- **Unified Template Type**: `ExtendedPromptTemplate` (no distinction between parameterized and quick templates)
- **Template Features**:
  - Import/export functionality
  - Tag-based organization
  - Parameter options for variable substitution
  - Browser-based execution for template operations

### Key Design Patterns

1. **Factory Pattern**: Provider instantiation based on configuration
2. **Abstract Base Class**: Common provider interface and shared functionality
3. **Decorator Pattern**: Transparent caching layer
4. **Plugin Pattern**: Extensible editor features (Lexical)
5. **Overlay Pattern**: Visual enhancements without modifying core behavior (Textarea)
6. **Command Pattern**: State management in Lexical editor

## Important Notes from Cursor Rules

From `.cursor/rules/bbb.mdc`:
- Templates are unified under `ExtendedPromptTemplate` type
- No distinction between parameterized and quick templates
- Template type determined by presence of `parameterOptions` field

## File Structure

```
/src
├── app/                    # Next.js App Router pages
├── components/            # React components
├── ai-providers/          # AI provider abstraction layer
│   ├── core/             # Base classes and utilities
│   ├── providers/        # Provider implementations
│   └── config/           # Provider configurations
└── lib/                  # Shared utilities
```

## Key Interfaces

```typescript
// AI Provider Interface
interface AIProvider {
  chat(request: ChatRequest): ChatResponse
  chatStream(request: ChatRequest): AsyncGenerator<ChatStreamResponse>
  testConnection(): Promise<TestResult>
}

// Template Interface
interface ExtendedPromptTemplate {
  id: string
  name: string
  content: string
  tags: string[]
  parameterOptions?: BracketParameterOptions
}

// Parameter Options
interface BracketParameterOptions {
  [paramName: string]: string[]
}
```

## Performance Considerations

- AI provider responses are cached with configurable TTL
- Textarea overlay editor only renders visible elements
- Lexical editor uses efficient node-based updates
- Performance monitoring tracks all AI provider requests

## Error Handling

- Custom `ProviderError` class with structured error information
- Provider-specific error parsing and user-friendly messages
- Centralized error handling with `useErrorHandler` hook
- Graceful fallbacks for parsing failures
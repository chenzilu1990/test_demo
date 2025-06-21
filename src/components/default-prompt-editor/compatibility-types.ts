// Compatibility types to support migration from prompt-editor to default-prompt-editor

// Original PromptTemplate type from prompt-editor
export interface PromptTemplate {
  title?: string;
  prompt: string;
  parameterOptions?: Record<string, string[]>;
}

/**
 * BracketParameterOptions - Maps parameter names to their possible values
 * Compatible with the parameterOptions used in PromptTemplateFeature
 */
export type BracketParameterOptions = Record<string, string[]>;

// SelectedOption interface for tracking selected values
export interface SelectedOption {
  id: string;
  type: string;
  originalBracket: string;
  selectedValue: string;
  position: {start: number; end: number};
}

// Bracket format configuration
export interface BracketFormatConfig {
  regex: RegExp;
  type: string;
  priority: number;
  description?: string;
  className?: string;
}

// Default bracket formats
export const DEFAULT_BRACKET_FORMATS: BracketFormatConfig[] = [
  {
    regex: /\{\{([^\}]*)\}\}/g,
    type: 'double-brace',
    priority: 3,
    description: '双花括号',
    className: 'text-blue-500 hover:bg-blue-100/50 dark:hover:bg-blue-900/50'
  },
  {
    regex: /\{([^\}]*)\}/g,
    type: 'single-brace',
    priority: 2,
    description: '单花括号',
    className: 'text-blue-500 hover:bg-blue-100/50 dark:hover:bg-blue-900/50'
  },
  {
    regex: /\[([^\]]*)\]/g,
    type: 'bracket',
    priority: 1,
    description: '方括号',
    className: 'text-blue-500 hover:bg-blue-100/50 dark:hover:bg-blue-900/50'
  }
];

// Error types (if needed)
export enum ErrorType {
  PARSE_ERROR = 'PARSE_ERROR',
  GENERATION_ERROR = 'GENERATION_ERROR',
  STATE_ERROR = 'STATE_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorInfo {
  id: string;
  message: string;
  type: ErrorType;
  severity: ErrorSeverity;
  context?: any;
  timestamp: Date;
}
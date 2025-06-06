// 错误类型枚举
export enum ErrorType {
  PARSE_ERROR = 'PARSE_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
  GENERATION_ERROR = 'GENERATION_ERROR',
  STATE_ERROR = 'STATE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 错误严重性级别
export enum ErrorSeverity {
  LOW = 'LOW',        // 轻微错误，不影响基本功能
  MEDIUM = 'MEDIUM',  // 中等错误，部分功能受影响
  HIGH = 'HIGH',      // 严重错误，主要功能不可用
  CRITICAL = 'CRITICAL' // 致命错误，组件完全不可用
}

// 错误信息接口
export interface ErrorInfo {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: string;
  timestamp: number;
  recoverable: boolean;
  action?: string; // 建议的用户操作
}

// 错误上下文接口
export interface ErrorContext {
  component: string;
  operation: string;
  input?: any;
  stackTrace?: string;
}

// 错误处理结果
export interface ErrorHandleResult {
  handled: boolean;
  fallbackValue?: any;
  userMessage?: string;
  shouldRetry?: boolean;
}

// 配置验证错误
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

// 解析错误
export class ParseError extends Error {
  constructor(
    message: string,
    public input: string,
    public position?: number
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

// 生成错误
export class GenerationError extends Error {
  constructor(
    message: string,
    public paramName: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'GenerationError';
  }
} 
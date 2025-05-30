export interface ModelCapabilities {
  contextWindowTokens?: number;
  functionCall?: boolean;
  vision?: boolean;
  reasoning?: boolean;
  json?: boolean;
  imageGeneration?: boolean;
}

export interface ModelCard {
  id: string;
  name: string;
  description?: string;
  capabilities: ModelCapabilities;
  enabled?: boolean;
  maxTemperature?: number;
}

export interface ProviderConfig {
  id: string;
  name: string;
  baseURL: string;
  apiVersion?: string;
  authType: 'key' | 'token' | 'none';
  models: ModelCard[];
  website?: {
    official?: string;
    apiDocs?: string;
    pricing?: string;
    apiKeyUrl?: string;
    status?: string;
  };
  sdkType: 'openai' | 'anthropic' | 'gemini' | 'custom';
  defaultHeaders?: Record<string, string>;
  capabilities?: {
    streaming?: boolean;
    batchRequests?: boolean;
  };
  description?: string;
}

export type ProviderOptions = {
  apiKey?: string;
  baseURL?: string;
  apiVersion?: string;
  proxy?: string;
  timeout?: number;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
  retry?: {
    maxRetries?: number;
    retryDelay?: number;
    retryOn?: number[];
    exponentialBackoff?: boolean;
  };
};

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | Array<{type: string; [key: string]: any}>;
  name?: string;
};

export type CompletionRequest = {
  messages: ChatMessage[];
  model: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: Array<any>;
  tool_choice?: string | {name: string};
};

export type CompletionResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export interface ImageGenerationRequest {
  prompt: string;
  model: string;
  n?: number;
  size?: '256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  response_format?: 'url' | 'b64_json';
}

export interface ImageGenerationResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

export interface AIProvider {
  id: string;
  config: ProviderConfig;
  
  // 核心方法
  chat(request: CompletionRequest): Promise<CompletionResponse>;
  chatStream(request: CompletionRequest): AsyncIterable<any>;
  
  // 图像生成方法
  generateImage?(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
  
  // 元数据方法
  getModels(): Promise<ModelCard[]>;
  getModelById(modelId: string): ModelCard | undefined;
  
  // 工具方法
  validateRequest(request: CompletionRequest): boolean;
  
  // 连接测试方法
  testConnection(model?: string): Promise<boolean>;
}

// 添加错误类型定义
export interface AIProviderError extends Error {
  code?: string;
  status?: number;
  provider?: string;
  details?: any;
}

// 添加流式响应类型
export interface StreamChunk {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
      tool_calls?: any[];
    };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

// 添加提供商状态类型
export type ProviderStatus = 'unconfigured' | 'testing' | 'connected' | 'error';

// 添加测试结果类型
export interface TestConnectionResult {
  success: boolean;
  message?: string;
  error?: AIProviderError;
  timestamp: Date;
  model?: string;
}

// 添加性能监控类型
export interface PerformanceMetrics {
  requestId: string;
  provider: string;
  model: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  status: 'success' | 'error' | 'timeout';
  error?: string;
}

export interface PerformanceMonitor {
  startRequest(provider: string, model: string): string;
  endRequest(requestId: string, status: 'success' | 'error' | 'timeout', tokensUsed?: any, error?: string): void;
  getMetrics(provider?: string, model?: string): PerformanceMetrics[];
  clearMetrics(): void;
}

// 添加缓存机制类型
export interface CacheEntry {
  key: string;
  value: CompletionResponse;
  timestamp: Date;
  ttl: number;
  hits: number;
}

export interface CacheOptions {
  enabled: boolean;
  ttl?: number; // 缓存过期时间（毫秒）
  maxSize?: number; // 最大缓存条目数
  keyGenerator?: (request: CompletionRequest) => string;
}

export interface Cache {
  get(key: string): CacheEntry | null;
  set(key: string, value: CompletionResponse, ttl?: number): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  size(): number;
}

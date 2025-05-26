export interface ModelCapabilities {
  contextWindowTokens?: number;
  functionCall?: boolean;
  vision?: boolean;
  reasoning?: boolean;
  json?: boolean;
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

export interface AIProvider {
  id: string;
  config: ProviderConfig;
  
  // 核心方法
  chat(request: CompletionRequest): Promise<CompletionResponse>;
  chatStream(request: CompletionRequest): AsyncIterable<any>;
  
  // 元数据方法
  getModels(): Promise<ModelCard[]>;
  getModelById(modelId: string): ModelCard | undefined;
  
  // 工具方法
  validateRequest(request: CompletionRequest): boolean;
  
  // 连接测试方法
  testConnection(model?: string): Promise<boolean>;
}

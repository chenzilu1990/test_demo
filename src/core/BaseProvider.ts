import { AIProvider, ProviderConfig, ModelCard, CompletionRequest, CompletionResponse, ProviderOptions } from '../types';

export abstract class BaseProvider implements AIProvider {
  public id: string;
  public config: ProviderConfig;
  protected options: ProviderOptions;

  constructor(config: ProviderConfig, options: ProviderOptions = {}) {
    this.id = config.id;
    this.config = config;
    this.options = {
      baseURL: options.baseURL || config.baseURL,
      apiKey: options.apiKey,
      apiVersion: options.apiVersion || config.apiVersion,
      proxy: options.proxy,
      timeout: options.timeout || 30000,
      headers: {
        ...config.defaultHeaders,
        ...options.headers,
      },
      fetch: options.fetch || globalThis.fetch,
    };
  }

  abstract chat(request: CompletionRequest): Promise<CompletionResponse>;
  abstract chatStream(request: CompletionRequest): AsyncIterable<any>;

  public getModels(): Promise<ModelCard[]> {
    return Promise.resolve(this.config.models);
  }

  public getModelById(modelId: string): ModelCard | undefined {
    return this.config.models.find(model => model.id === modelId);
  }

  public validateRequest(request: CompletionRequest): boolean {
    const model = this.getModelById(request.model);
    if (!model) {
      return false;
    }
    
    if (request.tools && request.tools.length > 0 && !model.capabilities.functionCall) {
      return false;
    }
    
    if (request.temperature && model.maxTemperature && request.temperature > model.maxTemperature) {
      return false;
    }

    return true;
  }

  protected buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...this.options.headers,
    };
    
    if (this.options.apiKey && this.config.authType === 'key') {
      headers['Authorization'] = `Bearer ${this.options.apiKey}`;
    }
    
    return headers;
  }

  protected async fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
    const fetch = this.options.fetch || globalThis.fetch;
    
    let lastError: Error;
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: this.buildHeaders(),
          signal: options.signal,
        });
        
        if (response.ok) {
          return response;
        }
        
        if (response.status === 429) {
          // Rate limit - wait and retry
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000 * (i + 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw new Error(`Request failed with status ${response.status}: ${await response.text()}`);
      } catch (err) {
        lastError = err as Error;
        if (i === retries - 1) {
          throw lastError;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
    
    throw lastError!;
  }
}

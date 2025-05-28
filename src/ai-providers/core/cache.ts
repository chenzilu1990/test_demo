import { Cache, CacheEntry, CacheOptions, CompletionRequest, CompletionResponse } from '../types';

export class SimpleCache implements Cache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private defaultTTL: number;

  constructor(options: { maxSize?: number; defaultTTL?: number } = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5分钟
  }

  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // 检查是否过期
    const now = Date.now();
    if (now - entry.timestamp.getTime() > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // 增加命中次数
    entry.hits++;
    return entry;
  }

  set(key: string, value: CompletionResponse, ttl?: number): void {
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry = {
      key,
      value,
      timestamp: new Date(),
      ttl: ttl || this.defaultTTL,
      hits: 0
    };

    this.cache.set(key, entry);
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // 清理过期条目
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp.getTime() > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // 删除最旧的条目
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp.getTime() < oldestTime) {
        oldestTime = entry.timestamp.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // 获取缓存统计信息
  getStats() {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const now = Date.now();
    const expiredCount = entries.filter(entry => 
      now - entry.timestamp.getTime() > entry.ttl
    ).length;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits,
      expiredCount,
      hitRate: totalHits > 0 ? (totalHits / (totalHits + this.cache.size)) * 100 : 0
    };
  }
}

// 缓存键生成器
export class CacheKeyGenerator {
  static generateKey(request: CompletionRequest): string {
    // 创建一个包含关键请求参数的对象
    const keyData = {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      top_p: request.top_p,
      max_tokens: request.max_tokens,
      tools: request.tools,
      tool_choice: request.tool_choice
    };

    // 使用JSON字符串生成哈希
    const jsonString = JSON.stringify(keyData, Object.keys(keyData).sort());
    
    // 在浏览器环境中使用Web Crypto API或简单哈希函数
    if (typeof window !== 'undefined') {
      return this.simpleHash(jsonString);
    }
    
    // 在Node.js环境中使用crypto
    try {
      const crypto = require('crypto');
      return crypto.createHash('md5').update(jsonString).digest('hex');
    } catch {
      return this.simpleHash(jsonString);
    }
  }

  // 简单的哈希函数，用于浏览器环境
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(16);
  }
}

// 带缓存的提供商装饰器
export class CachedProvider {
  private cache: SimpleCache;
  private keyGenerator: (request: CompletionRequest) => string;

  constructor(
    private provider: any,
    options: CacheOptions = { enabled: true }
  ) {
    this.cache = new SimpleCache({
      maxSize: options.maxSize,
      defaultTTL: options.ttl
    });
    this.keyGenerator = options.keyGenerator || CacheKeyGenerator.generateKey;
  }

  async chat(request: CompletionRequest): Promise<CompletionResponse> {
    // 如果是流式请求，不使用缓存
    if (request.stream) {
      return this.provider.chat(request);
    }

    const cacheKey = this.keyGenerator(request);
    
    // 尝试从缓存获取
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for key: ${cacheKey}`);
      return cached.value;
    }

    // 缓存未命中，调用原始提供商
    console.log(`Cache miss for key: ${cacheKey}`);
    const response = await this.provider.chat(request);
    
    // 存储到缓存
    this.cache.set(cacheKey, response);
    
    return response;
  }

  // 代理其他方法
  async chatStream(request: CompletionRequest) {
    return this.provider.chatStream(request);
  }

  getModels() {
    return this.provider.getModels();
  }

  getModelById(modelId: string) {
    return this.provider.getModelById(modelId);
  }

  validateRequest(request: CompletionRequest) {
    return this.provider.validateRequest(request);
  }

  testConnection(model?: string) {
    return this.provider.testConnection(model);
  }

  // 缓存管理方法
  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  cleanupCache(): void {
    this.cache.cleanup();
  }
}

// 全局缓存实例
export const globalCache = new SimpleCache(); 
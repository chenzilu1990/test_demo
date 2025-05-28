# AI Providers 测试工具使用示例

## 基础使用示例

### 1. 创建和测试单个提供商

```typescript
import { createAIProvider, PROVIDER_CONFIGS } from '@/index';

// 创建OpenAI提供商
const openaiProvider = createAIProvider('openai', {
  apiKey: 'sk-your-api-key-here'
});

// 测试连接
try {
  const isConnected = await openaiProvider.testConnection('gpt-3.5-turbo');
  console.log('连接状态:', isConnected);
} catch (error) {
  console.error('连接失败:', error.message);
}

// 发送聊天请求
const response = await openaiProvider.chat({
  messages: [{ role: 'user', content: 'Hello!' }],
  model: 'gpt-3.5-turbo',
  temperature: 0.7
});

console.log('回复:', response.choices[0].message.content);
```

### 2. 使用带缓存的提供商

```typescript
import { createCachedAIProvider } from '@/index';

// 创建带缓存的提供商
const cachedProvider = createCachedAIProvider('openai', {
  apiKey: 'sk-your-api-key-here'
}, {
  ttl: 10 * 60 * 1000, // 10分钟缓存
  maxSize: 50 // 最多缓存50个响应
});

// 第一次请求会调用API
const response1 = await cachedProvider.chat({
  messages: [{ role: 'user', content: 'What is AI?' }],
  model: 'gpt-3.5-turbo'
});

// 相同请求会从缓存返回
const response2 = await cachedProvider.chat({
  messages: [{ role: 'user', content: 'What is AI?' }],
  model: 'gpt-3.5-turbo'
});

// 查看缓存统计
console.log('缓存统计:', cachedProvider.getCacheStats());
```

### 3. 使用提供商管理器

```typescript
import { AIProviderManager } from '@/index';

// 创建管理器并注册多个提供商
const manager = new AIProviderManager({
  openai: { apiKey: 'sk-openai-key' },
  anthropic: { apiKey: 'sk-ant-key' },
  gemini: { apiKey: 'your-gemini-key' }
});

// 使用不同的提供商
const openaiResponse = await manager.chat('openai', {
  messages: [{ role: 'user', content: 'Hello from OpenAI!' }],
  model: 'gpt-3.5-turbo'
});

const claudeResponse = await manager.chat('anthropic', {
  messages: [{ role: 'user', content: 'Hello from Claude!' }],
  model: 'claude-3-sonnet'
});

// 查看性能统计
console.log('OpenAI性能:', manager.getPerformanceStats('openai'));
console.log('Claude性能:', manager.getPerformanceStats('anthropic'));
```

### 4. 流式响应处理

```typescript
import { createAIProvider } from '@/index';

const provider = createAIProvider('openai', {
  apiKey: 'sk-your-api-key-here'
});

// 处理流式响应
const stream = provider.chatStream({
  messages: [{ role: 'user', content: 'Tell me a story' }],
  model: 'gpt-3.5-turbo',
  stream: true
});

let fullResponse = '';
for await (const chunk of stream) {
  if (chunk.choices?.[0]?.delta?.content) {
    const content = chunk.choices[0].delta.content;
    fullResponse += content;
    console.log('新内容:', content);
  }
}

console.log('完整回复:', fullResponse);
```

### 5. 错误处理示例

```typescript
import { createAIProvider, ProviderError, ErrorCode } from '@/index';

const provider = createAIProvider('openai', {
  apiKey: 'invalid-key' // 故意使用无效密钥
});

try {
  await provider.testConnection();
} catch (error) {
  if (error instanceof ProviderError) {
    switch (error.code) {
      case ErrorCode.UNAUTHORIZED:
        console.log('API密钥无效，请检查密钥');
        break;
      case ErrorCode.RATE_LIMIT:
        console.log('请求频率过高，请稍后重试');
        break;
      case ErrorCode.NETWORK_ERROR:
        console.log('网络连接失败');
        break;
      default:
        console.log('未知错误:', error.message);
    }
  }
}
```

### 6. 验证工具使用

```typescript
import { ValidationUtils } from '@/index';

// 验证API密钥格式
const isValidOpenAI = ValidationUtils.validateApiKey('sk-1234567890abcdef', 'openai');
const isValidClaude = ValidationUtils.validateApiKey('sk-ant-1234567890', 'anthropic');

console.log('OpenAI密钥有效:', isValidOpenAI);
console.log('Claude密钥有效:', isValidClaude);

// 验证URL格式
const isValidUrl = ValidationUtils.validateURL('https://api.openai.com/v1');
console.log('URL有效:', isValidUrl);

// 验证请求参数
const request = {
  messages: [{ role: 'user', content: 'Hello' }],
  model: 'gpt-3.5-turbo',
  temperature: 1.5 // 可能超出范围
};

const model = { 
  id: 'gpt-3.5-turbo', 
  name: 'GPT-3.5 Turbo',
  capabilities: { functionCall: false },
  maxTemperature: 1.0
};

const errors = ValidationUtils.validateRequestParams(request, model);
if (errors.length > 0) {
  console.log('验证错误:', errors);
}
```

### 7. 性能监控示例

```typescript
import { globalPerformanceMonitor } from '@/index';

// 手动记录性能指标
const requestId = globalPerformanceMonitor.startRequest('openai', 'gpt-3.5-turbo');

try {
  // 执行API调用
  const response = await provider.chat(request);
  
  // 记录成功
  globalPerformanceMonitor.endRequest(requestId, 'success', response.usage);
} catch (error) {
  // 记录失败
  globalPerformanceMonitor.endRequest(requestId, 'error', undefined, error.message);
}

// 查看统计信息
const stats = globalPerformanceMonitor.getStats('openai');
console.log('OpenAI统计:', {
  总请求数: stats.totalRequests,
  成功率: stats.successRate + '%',
  平均耗时: stats.averageDuration + 'ms',
  总Token数: stats.totalTokens
});

// 查看最近的错误
const recentErrors = globalPerformanceMonitor.getRecentErrors(5);
console.log('最近错误:', recentErrors);
```

### 8. 批量测试示例

```typescript
import { PROVIDER_CONFIGS, createAIProvider } from '@/index';

// 批量测试所有配置的提供商
async function testAllProviders() {
  const results = [];
  
  for (const [providerId, config] of Object.entries(PROVIDER_CONFIGS)) {
    try {
      const provider = createAIProvider(providerId, {
        apiKey: getApiKeyForProvider(providerId) // 你的密钥获取逻辑
      });
      
      const startTime = Date.now();
      const isConnected = await provider.testConnection();
      const duration = Date.now() - startTime;
      
      results.push({
        provider: providerId,
        success: isConnected,
        duration,
        error: null
      });
      
    } catch (error) {
      results.push({
        provider: providerId,
        success: false,
        duration: 0,
        error: error.message
      });
    }
  }
  
  return results;
}

// 执行批量测试
const testResults = await testAllProviders();
console.log('测试结果:', testResults);

// 统计成功率
const successCount = testResults.filter(r => r.success).length;
const successRate = (successCount / testResults.length) * 100;
console.log(`成功率: ${successRate}% (${successCount}/${testResults.length})`);
```

### 9. 自定义配置示例

```typescript
import { createProvider } from '@/index';

// 创建自定义配置的提供商
const customConfig = {
  id: 'custom-openai',
  name: 'Custom OpenAI',
  baseURL: 'https://your-proxy.com/v1',
  authType: 'key' as const,
  sdkType: 'openai' as const,
  models: [
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      capabilities: {
        contextWindowTokens: 4096,
        functionCall: true,
        vision: false
      }
    }
  ]
};

const customProvider = createProvider(customConfig, {
  apiKey: 'your-api-key',
  timeout: 60000, // 60秒超时
  retry: {
    maxRetries: 5,
    retryDelay: 2000,
    exponentialBackoff: true
  }
});

// 使用自定义提供商
const response = await customProvider.chat({
  messages: [{ role: 'user', content: 'Hello custom provider!' }],
  model: 'gpt-3.5-turbo'
});
```

### 10. 测试页面集成示例

```typescript
// 在React组件中使用测试功能
import { useState } from 'react';
import { createAIProvider, ValidationUtils } from '@/index';

function TestComponent() {
  const [testResults, setTestResults] = useState([]);
  
  const runTest = async (providerId: string, apiKey: string) => {
    // 验证API密钥格式
    if (!ValidationUtils.validateApiKey(apiKey, providerId)) {
      setTestResults(prev => [...prev, {
        provider: providerId,
        success: false,
        message: 'API密钥格式无效'
      }]);
      return;
    }
    
    try {
      const provider = createAIProvider(providerId, { apiKey });
      const isConnected = await provider.testConnection();
      
      setTestResults(prev => [...prev, {
        provider: providerId,
        success: isConnected,
        message: isConnected ? '连接成功' : '连接失败'
      }]);
      
    } catch (error) {
      setTestResults(prev => [...prev, {
        provider: providerId,
        success: false,
        message: error.message
      }]);
    }
  };
  
  return (
    <div>
      <button onClick={() => runTest('openai', 'sk-your-key')}>
        测试OpenAI
      </button>
      
      <div>
        {testResults.map((result, index) => (
          <div key={index} className={result.success ? 'success' : 'error'}>
            {result.provider}: {result.message}
          </div>
        ))}
      </div>
    </div>
  );
}
```

这些示例展示了如何在不同场景下使用AI Providers测试工具的各种功能。你可以根据具体需求选择合适的使用方式。 
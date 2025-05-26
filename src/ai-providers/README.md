# AI Providers 测试连接功能

AI Providers模块现在支持通用的测试连接功能，可以验证API配置是否正确，并提供详细的错误诊断信息。

## 功能特点

- ✅ **真实API测试** - 发送真实的API请求验证连接
- ✅ **详细错误诊断** - 针对不同错误类型提供具体的解决建议
- ✅ **提供商特定优化** - 每个提供商都有定制的测试逻辑
- ✅ **模型验证** - 验证指定模型是否可用

## 基本用法

```typescript
import { createProvider } from '@/ai-providers/core/providerFactory';
import { PROVIDER_CONFIGS } from '@/ai-providers/config/providers';

// 创建提供商实例
const provider = createProvider(PROVIDER_CONFIGS['openai'], {
  apiKey: 'your-api-key',
  baseURL: 'https://api.openai.com/v1' // 可选
});

// 测试连接
try {
  const isConnected = await provider.testConnection();
  if (isConnected) {
    console.log('✅ 连接测试成功');
  }
} catch (error) {
  console.error('❌ 连接测试失败:', error.message);
}

// 测试特定模型
try {
  const isConnected = await provider.testConnection('gpt-4');
  console.log('模型 gpt-4 连接正常');
} catch (error) {
  console.error('模型测试失败:', error.message);
}
```

## 各提供商特定功能

### OpenAI
```typescript
// 标准OpenAI API测试
const openaiProvider = createProvider(PROVIDER_CONFIGS['openai'], {
  apiKey: 'sk-your-api-key'
});

await openaiProvider.testConnection('gpt-4');
```

**常见错误处理：**
- `401 Unauthorized` → "API密钥无效，请检查API密钥是否正确"
- `403 Forbidden` → "API密钥权限不足或账户余额不足"
- `429 Rate Limit` → "请求频率过高，请稍后再试"

### Anthropic (Claude)
```typescript
// Anthropic特定API格式测试
const anthropicProvider = createProvider(PROVIDER_CONFIGS['anthropic'], {
  apiKey: 'your-anthropic-api-key'
});

await anthropicProvider.testConnection('claude-3-opus');
```

**特殊错误处理：**
- `authentication_error` → "Anthropic API密钥无效"
- `permission_error` → "API密钥权限不足"
- `overloaded_error` → "服务负载过高，请稍后重试"

### Gemini
```typescript
// Gemini特定API和认证方式
const geminiProvider = createProvider(PROVIDER_CONFIGS['gemini'], {
  apiKey: 'your-gemini-api-key'
});

await geminiProvider.testConnection('gemini-pro');
```

**特殊处理：**
- 使用 `x-goog-api-key` 认证头
- 检查 `candidates` 响应格式
- 处理 Gemini 特有的错误代码

### Ollama
```typescript
// 本地Ollama服务测试
const ollamaProvider = createProvider(PROVIDER_CONFIGS['ollama'], {
  baseURL: 'http://localhost:11434'
});

await ollamaProvider.testConnection('llama2');
```

**特殊功能：**
- 检查Ollama服务是否运行
- 验证模型是否已安装
- 提供安装模型的命令提示

### SiliconFlow
```typescript
// SiliconFlow API测试
const siliconFlowProvider = createProvider(PROVIDER_CONFIGS['siliconflow'], {
  apiKey: 'your-siliconflow-api-key'
});

await siliconFlowProvider.testConnection('qwen-turbo');
```

### AiHubMix
```typescript
// AiHubMix聚合服务测试
const aihubmixProvider = createProvider(PROVIDER_CONFIGS['aihubmix'], {
  apiKey: 'your-aihubmix-api-key'
});

// 会自动根据模型类型选择相应的底层提供商
await aihubmixProvider.testConnection('gpt-4');      // 使用OpenAI格式
await aihubmixProvider.testConnection('claude-3-opus'); // 使用Anthropic格式
await aihubmixProvider.testConnection('gemini-pro');    // 使用Gemini格式
```

## 错误类型和解决方案

### 网络相关错误
```
"连接超时，请检查网络连接或尝试使用代理"
"网络连接失败，请检查网络设置或防火墙配置"
"无法连接到XX服务，请检查网络连接"
```

### 认证相关错误
```
"API密钥无效或已过期，请检查密钥是否正确"
"API密钥权限不足或账户余额不足，请检查账户状态"
"API密钥未配置"
```

### 配额和限制错误
```
"请求频率过高，请稍后再试或升级您的API计划"
"API配额已用完，请检查您的使用限制或升级计划"
"账户配额不足，请检查账户余额或升级计划"
```

### 服务和模型错误
```
"服务暂时不可用，请稍后重试"
"模型 XXX 不存在或不可用，请检查模型名称"
"未找到可用的模型进行测试"
```

### Ollama特定错误
```
"Ollama服务未运行，请启动Ollama服务 (ollama serve)"
"模型 XXX 未安装，请运行: ollama pull XXX"
"请求超时，模型可能正在加载中，请稍后重试"
```

## 在配置页面中的使用

配置页面已经集成了测试连接功能：

```typescript
// 在 src/app/ai-providers/page.tsx 中
const testConnection = async (providerId: string) => {
  const provider = providers.find(p => p.id === providerId);
  if (!provider || !provider.apiKey) {
    updateProvider(providerId, { 
      status: 'error', 
      error: '请先配置API密钥',
      lastTested: new Date() 
    });
    return;
  }

  updateProvider(providerId, { status: 'testing', error: undefined });

  try {
    const aiProvider = createAIProvider(providerId, {
      apiKey: provider.apiKey,
      baseURL: provider.baseURL
    });

    const config = PROVIDER_CONFIGS[providerId];
    const testModel = config.models[0]?.id;
    
    const isConnected = await aiProvider.testConnection(testModel);
    
    if (isConnected) {
      updateProvider(providerId, { 
        status: 'connected', 
        lastTested: new Date(),
        error: undefined
      });
    }
  } catch (error: any) {
    updateProvider(providerId, { 
      status: 'error', 
      error: error.message,
      lastTested: new Date() 
    });
  }
};
```

## 最佳实践

1. **总是提供用户友好的错误信息** - 每个提供商都实现了详细的错误消息处理
2. **测试特定模型** - 如果可能，测试您实际要使用的模型
3. **处理网络问题** - 为网络相关错误提供重试机制
4. **本地服务检查** - 对于Ollama等本地服务，先检查服务状态
5. **记录测试结果** - 保存测试时间和状态用于诊断

## 技术实现

- **基类方法** - `BaseProvider.testConnection()` 提供通用实现
- **提供商特定** - 每个提供商可以重写 `testConnection()` 方法
- **错误处理** - `getDetailedErrorMessage()` 方法提供错误消息转换
- **类型安全** - 完整的TypeScript类型支持 
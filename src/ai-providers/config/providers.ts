import { ProviderConfig } from '../types';
import openAIModels from './models/openai';
import anthropicModels from './models/anthropic';
import geminiModels from './models/gemini';
import ollamaModels from './models/ollama';
import aihubmixModels from './models/aihubmix';
import siliconflowModels from './models/siliconflow';

export const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    authType: 'key',
    sdkType: 'openai',
    models: openAIModels,
    website: {
      official: 'https://openai.com',
      apiDocs: 'https://platform.openai.com/docs/api-reference',
      pricing: 'https://openai.com/pricing',
      apiKeyUrl: 'https://platform.openai.com/api-keys',
      status: 'https://status.openai.com',
      // apiKey: 'sk-proj-1234567890',
    },
    capabilities: {
      streaming: true,
      batchRequests: false,
    },
    description: 'OpenAI 是一个提供 AI 服务的平台，提供多种 AI 模型和 API 接口。',
  },
  
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    baseURL: 'https://api.anthropic.com/v1',
    apiVersion: '2023-06-01',
    authType: 'key',
    sdkType: 'anthropic',
    models: anthropicModels,
    defaultHeaders: {
      'anthropic-version': '2023-06-01',
    },
    website: {
      official: 'https://anthropic.com',
      apiDocs: 'https://docs.anthropic.com/claude/reference',
      pricing: 'https://www.anthropic.com/pricing',
      apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    },
    capabilities: {
      streaming: true,
      batchRequests: false,
    },
    description: 'Anthropic 是一个提供 AI 服务的平台，提供多种 AI 模型和 API 接口。',
  },
  
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    baseURL: 'https://generativelanguage.googleapis.com',
    apiVersion: 'v1beta',
    authType: 'key',
    sdkType: 'gemini',
    models: geminiModels,
    website: {
      official: 'https://ai.google.dev',
      apiDocs: 'https://ai.google.dev/docs',
      pricing: 'https://ai.google.dev/pricing',
      apiKeyUrl: 'https://ai.google.dev/docs/api-key',
    },
    capabilities: {
      streaming: true,
      batchRequests: false,
    },
    description: 'Google Gemini 是一个提供 AI 服务的平台，提供多种 AI 模型和 API 接口。',
  },
  
  ollama: {
    id: 'ollama',
    name: 'Ollama',
    baseURL: 'http://localhost:11434/api',
    authType: 'none',
    sdkType: 'custom',
    models: ollamaModels,
    website: {
      official: 'https://ollama.ai',
      apiDocs: 'https://github.com/ollama/ollama/blob/main/docs/api.md',
    },
    capabilities: {
      streaming: true,
      batchRequests: false,
    },
    description: 'Ollama 是一个提供 AI 服务的平台，提供多种 AI 模型和 API 接口。',
  },
  
  aihubmix: {
    id: 'aihubmix',
    name: 'AiHubMix',
    baseURL: 'https://aihubmix.com/v1',
    authType: 'key',
    sdkType: 'custom',
    models: aihubmixModels,
    website: {
      official: 'https://aihubmix.com',
      apiDocs: 'https://doc.aihubmix.com',
      pricing: 'https://aihubmix.com/pricing',
      apiKeyUrl: 'https://aihubmix.com/token',
    },
    capabilities: {
      streaming: true,
      batchRequests: false,
    },
    description: 'AiHubMix 是一个提供 AI 服务的平台，提供多种 AI 模型和 API 接口。',
  },
  
  siliconflow: {
    id: 'siliconflow',
    name: 'SiliconFlow',
    baseURL: 'https://api.siliconflow.cn/v1',
    authType: 'key',
    sdkType: 'custom',
    models: siliconflowModels,
    website: {
      official: 'https://siliconflow.cn',
      apiDocs: 'https://siliconflow.cn/docs/api',
      pricing: 'https://siliconflow.cn/pricing',
      apiKeyUrl: 'https://cloud.siliconflow.cn/account/ak',
    },
    capabilities: {
      streaming: true,
      batchRequests: false,
    },
    description: 'SiliconFlow 是一个提供 AI 服务的平台，提供多种 AI 模型和 API 接口。',
  },
}; 
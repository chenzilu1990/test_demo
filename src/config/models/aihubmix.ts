import { ModelCard } from '../../types';

const aihubmixModels: ModelCard[] = [
  // OpenAI兼容模型
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'OpenAI的最新多模态模型，支持视觉和文本输入，高性能通用AI助手',
    capabilities: {
      contextWindowTokens: 128000,
      functionCall: true,
      vision: true,
      reasoning: true,
      json: true,
    },
    enabled: true,
    maxTemperature: 2.0,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: '更快速的GPT-4版本，保持强大能力的同时提高响应速度',
    capabilities: {
      contextWindowTokens: 128000,
      functionCall: true,
      vision: false, 
      reasoning: true,
      json: true,
    },
    enabled: true,
    maxTemperature: 2.0,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: '性价比最高的模型，适合大多数日常任务',
    capabilities: {
      contextWindowTokens: 16385,
      functionCall: true,
      vision: false,
      reasoning: false,
      json: true,
    },
    enabled: true,
    maxTemperature: 2.0,
  },
  
  // Claude兼容模型
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    description: 'Anthropic最高能力模型，专为复杂任务设计',
    capabilities: {
      contextWindowTokens: 200000,
      functionCall: true,
      vision: true,
      reasoning: true,
      json: true,
    },
    enabled: true,
    maxTemperature: 1.0,
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    description: '能力与速度平衡的中等模型',
    capabilities: {
      contextWindowTokens: 200000,
      functionCall: true,
      vision: true,
      reasoning: true,
      json: true,
    },
    enabled: true,
    maxTemperature: 1.0,
  },
  
  // Gemini兼容模型
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Google的高能力多模态大型语言模型',
    capabilities: {
      contextWindowTokens: 1000000,
      functionCall: true,
      vision: true,
      reasoning: true,
      json: true,
    },
    enabled: true,
    maxTemperature: 1.0,
  },
  {
    id: 'deepseek-ai/DeepSeek-Prover-V2-671B',
    name: 'DeepSeek-Prover-V2-671B',
    description: 'DeepSeek的Prover-V2-671B模型，深度求索系列',
    capabilities: {
      contextWindowTokens: 16000,
      functionCall: true,
      json: true,
      reasoning: true,
    },
    enabled: true,
    maxTemperature: 1.0,
  },
  // 特色模型
  {
    id: 'llama-3-70b',
    name: 'Llama 3 70B',
    description: 'Meta最新开源大模型，70B参数版本',
    capabilities: {
      contextWindowTokens: 8192,
      functionCall: true,
      vision: false,
      reasoning: true,
      json: true,
    },
    enabled: true,
    maxTemperature: 2.0,
  },
  {
    id: 'mistral-medium',
    name: 'Mistral Medium',
    description: 'Mistral AI中等规模高性能模型',
    capabilities: {
      contextWindowTokens: 32768,
      functionCall: true,
      vision: false,
      reasoning: false,
      json: true,
    },
    enabled: true,
    maxTemperature: 1.0,
  },
];

export default aihubmixModels; 
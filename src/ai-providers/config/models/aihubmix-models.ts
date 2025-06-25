import { ModelCard } from '../../types';

const aihubmixModels: ModelCard[] = [
  // OpenAI兼容模型
  {
    id: 'gpt-4.1-nano',
    name: 'gpt-4.1-nano',
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
    id: 'dall-e-3',
    name: 'DALL-E 3',
    description: 'OpenAI 最新的图像生成模型，支持高质量图像生成',
    capabilities: {
      imageGeneration: true,
    },
    enabled: true,
  },
  {
    id: 'gpt-image-1',
    name: 'GPT-Image-1',
    description: 'OpenAI 的图像生成模型，支持多种尺寸和风格',
    capabilities: {
      imageGeneration: true,
    },
    enabled: true,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'OpenAI 的最新一代大模型，支持更强大的语言理解和生成能力',
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
    id: 'DeepSeek-Prover-V2-671B',
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
  {
    id: 'DeepSeek-R1',
    name: 'DeepSeek-R1',
    description: '已升级至最新版本250528；字节火山云开源部署的满血 R1，总参数量 671B，输入最高 64k。目前最稳定，推荐用这个。',
    capabilities: {
      contextWindowTokens: 4000,
      functionCall: true,
      json: true,
      reasoning: true,
    },
    enabled: true,
    maxTemperature: 1.0,
    price: {
      prompt: 0.546,
      completion: 2.184,
    },
  }
];

export default aihubmixModels; 
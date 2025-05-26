import { ModelCard } from '../../types';

const openAIModels: ModelCard[] = [
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
];

export default openAIModels; 
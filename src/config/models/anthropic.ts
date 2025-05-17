import { ModelCard } from '../../types';

const anthropicModels: ModelCard[] = [
  {
    id: 'claude-3-opus-20240229',
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
    id: 'claude-3-sonnet-20240229',
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
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    description: '最快速高效的Claude模型',
    capabilities: {
      contextWindowTokens: 200000,
      functionCall: true,
      vision: true,
      reasoning: false,
      json: true,
    },
    enabled: true,
    maxTemperature: 1.0,
  },
];

export default anthropicModels; 
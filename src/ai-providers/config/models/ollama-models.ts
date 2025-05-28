import { ModelCard } from '../../types';

const ollamaModels: ModelCard[] = [
  {
    id: 'llama3',
    name: 'Llama 3',
    description: 'Meta开源的强大语言模型，在本地运行',
    capabilities: {
      contextWindowTokens: 8192,
      functionCall: false,
      vision: false,
      reasoning: false,
      json: false,
    },
    enabled: true,
    maxTemperature: 2.0,
  },
  {
    id: 'llama3:8b',
    name: 'Llama 3 8B',
    description: 'Llama 3的8B参数变体，平衡性能与资源消耗',
    capabilities: {
      contextWindowTokens: 8192,
      functionCall: false,
      vision: false,
      reasoning: false,
      json: false,
    },
    enabled: true,
    maxTemperature: 2.0,
  },
  {
    id: 'mistral',
    name: 'Mistral',
    description: 'Mistral AI的开源语言模型',
    capabilities: {
      contextWindowTokens: 8192,
      functionCall: false,
      vision: false,
      reasoning: false,
      json: false,
    },
    enabled: true,
    maxTemperature: 2.0,
  },
  {
    id: 'codellama',
    name: 'Code Llama',
    description: '专为代码生成优化的Llama模型',
    capabilities: {
      contextWindowTokens: 16384,
      functionCall: false,
      vision: false,
      reasoning: false,
      json: true,
    },
    enabled: true,
    maxTemperature: 2.0,
  },
];

export default ollamaModels; 
import { ModelCard } from '../../types';

const geminiModels: ModelCard[] = [
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
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: '更快速的Gemini模型，适合实时应用',
    capabilities: {
      contextWindowTokens: 1000000,
      functionCall: true,
      vision: true,
      reasoning: false,
      json: true,
    },
    enabled: true,
    maxTemperature: 1.0,
  },
  {
    id: 'gemini-1.0-pro',
    name: 'Gemini 1.0 Pro',
    description: 'Gemini第一代专业模型',
    capabilities: {
      contextWindowTokens: 32768,
      functionCall: false,
      vision: true,
      reasoning: false,
      json: false,
    },
    enabled: true,
    maxTemperature: 1.0,
  },
];

export default geminiModels; 
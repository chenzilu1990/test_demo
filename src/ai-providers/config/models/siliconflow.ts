import { ModelCard } from '../../types';

const siliconflowModels: ModelCard[] = [
  {
    id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
    name: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
    description: 'SiliconFlow的Deepseek Coder模型，专为代码生成与理解优化',
    capabilities: {
      contextWindowTokens: 16000,
      functionCall: true,
      json: true,
      reasoning: true,
    },
    maxTemperature: 1.0,
  },
  {
    id: 'deepseek-chat',
    name: 'Deepseek Chat',
    description: 'SiliconFlow的Deepseek Chat模型，通用对话模型',
    capabilities: {
      contextWindowTokens: 16000,
      json: true,
      reasoning: true,
    },
    maxTemperature: 1.0,
  },
  {
    id: 'Qwen/Qwen3-235B-A22B',
    name: 'Qwen2111',
    description: 'SiliconFlow的Qwen2模型，通义千问系列',
    capabilities: {
      contextWindowTokens: 32000,
      functionCall: true,
      json: true,
      reasoning: true,
    },
    maxTemperature: 1.0,
  },
  {
    id: 'Pro/deepseek-ai/DeepSeek-V3',
    name: 'Pro/deepseek-ai/DeepSeek-V3',
    description: 'SiliconFlow的DeepSeek-V3模型，深度求索系列',
    capabilities: {
      contextWindowTokens: 16000,
      functionCall: true,
      json: true,
      reasoning: true,
    },
    maxTemperature: 1.0,
  }
];

export default siliconflowModels; 
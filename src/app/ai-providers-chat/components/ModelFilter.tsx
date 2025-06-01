import React, { useMemo } from 'react';
import { ModelOption } from './types';
import { AIProvider } from '@/ai-providers/types';

interface ModelFilterProps {
  provider: AIProvider | null;
  availableModels: ModelOption[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

const ModelFilter: React.FC<ModelFilterProps> = ({
  provider,
  availableModels,
  selectedModel,
  onModelChange,
  disabled = false
}) => {
  // 过滤出文本模型（非图像生成模型）
  const textModels = useMemo(() => {
    return availableModels.filter(model => {
      const [providerId, modelId] = model.id.split(':');
      // 只保留当前provider的模型
      if (!provider || providerId !== provider.id) return false;
      
      // 检查是否为非图像生成模型
      const modelConfig = provider.config?.models?.find((m) => m.id === modelId);
      return modelConfig && !modelConfig.capabilities?.imageGeneration;
    });
  }, [availableModels, provider]);

  const hasTextModels = textModels.length > 0;

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2" htmlFor="template-model-selector">
        选择模型:
      </label>
      <select
        id="template-model-selector"
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        disabled={disabled}
      >
        <option value="">请选择文本模型</option>
        {!hasTextModels ? (
          <option value="" disabled>无可用的文本模型</option>
        ) : (
          textModels.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))
        )}
      </select>
      {!hasTextModels && (
        <p className="mt-1 text-xs text-red-500">
          {provider ? '当前服务商没有可用的文本模型' : '请先选择一个服务商'}
        </p>
      )}
    </div>
  );
};

export default ModelFilter; 
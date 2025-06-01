import React, { memo, useMemo } from 'react';
import { ModelOption } from './types';

interface ModelSelectorProps {
  selectedProviderModel: string;
  setSelectedProviderModel: (value: string) => void;
  availableModels: ModelOption[];
  isImageGenerationModel: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = memo(({
  selectedProviderModel,
  setSelectedProviderModel,
  availableModels,
  isImageGenerationModel
}) => {
  // 安全地获取模型ID
  const currentModelId = useMemo(() => {
    if (!selectedProviderModel) return '';
    const parts = selectedProviderModel.split(':');
    return parts.length > 1 ? parts[1] : selectedProviderModel;
  }, [selectedProviderModel]);

  const hasModels = availableModels.length > 0;
  const modelTypeText = isImageGenerationModel ? ' (图像生成)' : '';
  const modeText = isImageGenerationModel ? ' - 图像生成模式' : ' - 对话模式';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
      <div>
        <label className="block text-sm font-medium mb-2" htmlFor="model-selector">
          选择模型
        </label>
        <select
          id="model-selector"
          value={selectedProviderModel}
          onChange={(e) => setSelectedProviderModel(e.target.value)}
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          aria-label="选择AI模型"
        >
          <option value="">请选择模型</option>
          {!hasModels ? (
            <option value="" disabled>请先在 AI 服务商配置中心配置并测试服务商</option>
          ) : (
            availableModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}{modelTypeText}
              </option>
            ))
          )}
        </select>
      </div>

      {selectedProviderModel && currentModelId && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
          <p className="text-sm">
            当前模型: <strong>{currentModelId}</strong>{modeText}
          </p>
        </div>
      )}

      {!hasModels && (
        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            请先在 <a href="/ai-providers-test" className="underline hover:text-yellow-700 dark:hover:text-yellow-300">AI 服务商配置中心</a> 配置并测试服务商
          </p>
        </div>
      )}
    </div>
  );
});

ModelSelector.displayName = 'ModelSelector';

export default ModelSelector; 
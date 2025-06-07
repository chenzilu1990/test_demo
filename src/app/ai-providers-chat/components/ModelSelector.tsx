import React, { memo, useMemo } from 'react';
import { ModelOption } from './types';

interface ModelSelectorProps {
  selectedProviderModel: string;
  setSelectedProviderModel: (value: string) => void;
  availableModels: ModelOption[];
  isImageGenerationModel: boolean;
  onNavigateToProviders?: () => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = memo(({
  selectedProviderModel,
  setSelectedProviderModel,
  availableModels,
  isImageGenerationModel,
  onNavigateToProviders
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
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium" htmlFor="model-selector">
          选择模型
        </label>
        {onNavigateToProviders && (
          <button
            onClick={onNavigateToProviders}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
            title="添加新模型"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            添加
          </button>
        )}
      </div>
      
      <select
        id="model-selector"
        value={selectedProviderModel}
        onChange={(e) => setSelectedProviderModel(e.target.value)}
        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        aria-label="选择AI模型"
      >
        <option value="">请选择模型</option>
        {!hasModels ? (
          <option value="" disabled>请先配置 AI 服务商</option>
        ) : (
          availableModels.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}{modelTypeText}
            </option>
          ))
        )}
      </select>

      {selectedProviderModel && currentModelId && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
          <p className="text-sm">
            当前模型: <strong>{currentModelId}</strong>{modeText}
          </p>
        </div>
      )}

      {!hasModels && (
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                还没有配置 AI 模型？
              </p>
              {onNavigateToProviders ? (
                <button
                  onClick={onNavigateToProviders}
                  className="inline-flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  立即配置 AI 服务商
                </button>
              ) : (
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  请前往 <a href="/ai-providers" className="underline hover:text-blue-700 dark:hover:text-blue-300">AI 服务商配置中心</a> 配置服务商
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ModelSelector.displayName = 'ModelSelector';

export default ModelSelector; 
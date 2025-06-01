    import React from 'react';

interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

interface ModelSelectorProps {
  selectedProviderModel: string;
  setSelectedProviderModel: (value: string) => void;
  availableModels: ModelOption[];
  isImageGenerationModel: () => boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedProviderModel,
  setSelectedProviderModel,
  availableModels,
  isImageGenerationModel
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
      <div>
        <label className="block text-sm font-medium mb-2">选择模型</label>
        <select
          value={selectedProviderModel}
          onChange={(e) => setSelectedProviderModel(e.target.value)}
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="">请选择模型</option>
          {availableModels.length === 0 ? (
            <option value="" disabled>请先在 AI 服务商配置中心配置并测试服务商</option>
          ) : (
            availableModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
                {isImageGenerationModel() && ' (图像生成)'}
              </option>
            ))
          )}
        </select>
      </div>

      {selectedProviderModel && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
          <p className="text-sm">
            当前模型: <strong>{selectedProviderModel.split(':')[1]}</strong>
            {isImageGenerationModel() ? ' - 图像生成模式' : ' - 对话模式'}
          </p>
        </div>
      )}

      {availableModels.length === 0 && (
        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            请先在 <a href="/ai-providers-test" className="underline">AI 服务商配置中心</a> 配置并测试服务商
          </p>
        </div>
      )}
    </div>
  );
};

export default ModelSelector; 
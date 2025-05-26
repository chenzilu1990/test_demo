"use client";

import { useState, useEffect } from "react";
import { createAIProvider, PROVIDER_CONFIGS } from "@/index";
import { AIProvider, CompletionRequest, CompletionResponse, ProviderConfig } from "@/index";
import Link from "next/link";
import InteractivePrompt from "@/components/InteractivePrompt";
import { userProfileOptions, userProfileTemplates } from "@/components/promptConfig";

export default function AITesting() {
  const [selectedProvider, setSelectedProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("");
  const [availableModels, setAvailableModels] = useState<{id: string, name: string}[]>([]);
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<{id: string, name: string}[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  
  // 初始化提供商列表
  useEffect(() => {
    const providerList = Object.entries(PROVIDER_CONFIGS).map(([id, config]) => ({
      id,
      name: (config as ProviderConfig).name
    }));
    setProviders(providerList);
  }, []);

  // 当选择提供商变化时，获取该提供商支持的模型
  useEffect(() => {
    if (!selectedProvider) return;
    
    try {
      const provider = createAIProvider(selectedProvider, { apiKey });
      const modelList = provider.config.models.map(model => ({
        id: model.id,
        name: model.name
      }));
      setAvailableModels(modelList);
      if (modelList.length > 0) {
        setModel(modelList[0].id);
      }
    } catch (e) {
      console.error("获取模型列表失败", e);
      setError("获取模型列表失败");
    }
  }, [selectedProvider, apiKey]);

  const handleStandardRequest = async () => {
    try {
      if (!selectedProvider || !apiKey || !prompt || !model) {
        throw new Error("请填写所有必填字段");
      }

      const provider = createAIProvider(selectedProvider, { apiKey });
      
      const request: CompletionRequest = {
        model,
        messages: [{ role: "user", content: prompt }],
        temperature,
      };

      const result = await provider.chat(request);
      setResponse(result.choices[0].message.content as string);
    } catch (e: any) {
      console.error("请求失败", e);
      setError(e.message || "请求失败，请检查API密钥和网络连接");
      throw e;
    }
  };

  const handleStreamingRequest = async () => {
    try {
      if (!selectedProvider || !apiKey || !prompt || !model) {
        throw new Error("请填写所有必填字段");
      }

      const provider = createAIProvider(selectedProvider, { apiKey });
      
      const request: CompletionRequest = {
        model,
        messages: [{ role: "user", content: prompt }],
        temperature,
        stream: true
      };

      setResponse("");
      
      // 处理流式响应
      const streamIterator = provider.chatStream(request);
      for await (const chunk of streamIterator) {
        if (chunk.choices && chunk.choices.length > 0) {
          const content = chunk.choices[0].delta?.content || "";
          if (typeof content === 'string') {
            setResponse(prev => prev + content);
          }
        }
      }
    } catch (e: any) {
      console.error("流式请求失败", e);
      setError(e.message || "流式请求失败，请检查API密钥和网络连接");
      throw e;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponse("");

    try {
      if (isStreaming) {
        await handleStreamingRequest();
      } else {
        await handleStandardRequest();
      }
    } catch (e) {
      // 错误已在各个处理函数中捕获
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">AI服务提供商测试平台</h1>
        <Link href="/" className="text-blue-500 hover:underline">
          返回首页
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">配置</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium">选择提供商</label>
              <select 
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                required
              >
                <option value="">请选择提供商</option>
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium">API密钥</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                placeholder="输入API密钥"
                required
              />
            </div>
            
            {availableModels.length > 0 && (
              <div>
                <label className="block mb-2 text-sm font-medium">模型</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  required
                >
                  {availableModels.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block mb-2 text-sm font-medium">温度 ({temperature})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="streaming"
                checked={isStreaming}
                onChange={(e) => setIsStreaming(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="streaming" className="text-sm font-medium">
                启用流式响应
              </label>
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium">提示词</label>
              <InteractivePrompt
                value={prompt}
                onChange={setPrompt}
                templates={userProfileTemplates}
                bracketOptions={userProfileOptions}
                height="12rem"
                useContentEditable={true}
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "请求中..." : "发送"}
            </button>
          </form>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">响应结果</h2>
          
          {error && (
            <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-md dark:bg-red-900 dark:text-red-100">
              {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : response ? (
            <div className="p-4 bg-gray-100 rounded-md h-64 overflow-auto dark:bg-gray-700">
              <pre className="whitespace-pre-wrap">{response}</pre>
            </div>
          ) : (
            <div className="flex justify-center items-center h-64 text-gray-400">
              等待响应...
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">使用说明</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>选择要测试的AI服务提供商</li>
          <li>输入对应提供商的API密钥（请确保密钥有效）</li>
          <li>选择要使用的模型</li>
          <li>调整温度参数（值越高，回答越随机创意；值越低，回答越确定）</li>
          <li>可选择是否启用流式响应（打字机效果）</li>
          <li>输入提示词或使用模板，点击方括号内容可选择预设选项</li>
          <li>点击发送按钮获取响应</li>
        </ol>
        
        <div className="mt-4 p-4 bg-yellow-50 rounded-md text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
          <h3 className="font-semibold mb-2">注意事项</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>API密钥不会被保存，仅用于当前会话中发送请求</li>
            <li>不同提供商可能有不同的计费模式，请注意使用频率</li>
            <li>部分提供商可能不支持流式响应，此时会自动降级为标准响应</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 
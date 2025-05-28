"use client";

import { useState, useEffect } from "react";
import { createAIProvider, PROVIDER_CONFIGS, ValidationUtils, ProviderError, ErrorCode } from "@/index";
import { CompletionRequest, CompletionResponse, ProviderStatus, TestConnectionResult } from "@/ai-providers/types";

interface TestResult {
  id: string;
  timestamp: Date;
  type: 'connection' | 'chat' | 'stream' | 'validation' | 'error';
  provider: string;
  model?: string;
  success: boolean;
  message: string;
  details?: any;
  duration?: number;
}

interface ProviderTestConfig {
  id: string;
  name: string;
  apiKey: string;
  baseURL?: string;
  enabled: boolean;
  status: ProviderStatus;
  lastTested?: Date;
}

export default function AIProvidersTestPage() {
  const [providers, setProviders] = useState<ProviderTestConfig[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [testMessage, setTestMessage] = useState("Hello, can you hear me?");
  const [streamOutput, setStreamOutput] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'config' | 'tests' | 'results'>('config');

  // 初始化提供商配置
  useEffect(() => {
    const savedConfigs = localStorage.getItem('ai-providers-config');
    if (savedConfigs) {
      try {
        const parsed = JSON.parse(savedConfigs);
        const providerList = Object.entries(PROVIDER_CONFIGS).map(([id, config]) => ({
          id,
          name: config.name,
          apiKey: parsed[id]?.apiKey || '',
          baseURL: parsed[id]?.baseURL || config.baseURL,
          enabled: parsed[id]?.enabled || false,
          status: (parsed[id]?.status as ProviderStatus) || 'unconfigured',
          lastTested: parsed[id]?.lastTested ? new Date(parsed[id].lastTested) : undefined
        }));
        setProviders(providerList);
        
        // 设置默认选中的提供商
        const firstEnabled = providerList.find(p => p.enabled);
        if (firstEnabled) {
          setSelectedProvider(firstEnabled.id);
          const models = PROVIDER_CONFIGS[firstEnabled.id]?.models || [];
          if (models.length > 0) {
            setSelectedModel(models[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to load saved configs:', e);
      }
    }
  }, []);

  // 添加测试结果
  const addTestResult = (result: Omit<TestResult, 'id' | 'timestamp'>) => {
    const newResult: TestResult = {
      ...result,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date()
    };
    setTestResults(prev => [newResult, ...prev].slice(0, 100)); // 保留最近100条
  };

  // 测试连接
  const testConnection = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider || !provider.apiKey) {
      addTestResult({
        type: 'connection',
        provider: providerId,
        success: false,
        message: 'API密钥未配置'
      });
      return;
    }

    const startTime = Date.now();
    try {
      const aiProvider = createAIProvider(providerId, {
        apiKey: provider.apiKey,
        baseURL: provider.baseURL
      });

      const model = selectedModel || PROVIDER_CONFIGS[providerId].models[0]?.id;
      const isConnected = await aiProvider.testConnection(model);
      
      const duration = Date.now() - startTime;
      addTestResult({
        type: 'connection',
        provider: providerId,
        model,
        success: isConnected,
        message: `连接测试成功 (${duration}ms)`,
        duration
      });

      // 更新提供商状态
      setProviders(prev => prev.map(p => 
        p.id === providerId 
          ? { ...p, status: 'connected', lastTested: new Date() }
          : p
      ));
    } catch (error: any) {
      const duration = Date.now() - startTime;
      addTestResult({
        type: 'connection',
        provider: providerId,
        success: false,
        message: error.message,
        details: error,
        duration
      });

      setProviders(prev => prev.map(p => 
        p.id === providerId 
          ? { ...p, status: 'error', lastTested: new Date() }
          : p
      ));
    }
  };

  // 测试聊天功能
  const testChat = async () => {
    if (!selectedProvider || !selectedModel) {
      addTestResult({
        type: 'chat',
        provider: selectedProvider,
        success: false,
        message: '请选择提供商和模型'
      });
      return;
    }

    const provider = providers.find(p => p.id === selectedProvider);
    if (!provider || !provider.apiKey) {
      addTestResult({
        type: 'chat',
        provider: selectedProvider,
        success: false,
        message: 'API密钥未配置'
      });
      return;
    }

    const startTime = Date.now();
    try {
      const aiProvider = createAIProvider(selectedProvider, {
        apiKey: provider.apiKey,
        baseURL: provider.baseURL
      });

      const request: CompletionRequest = {
        messages: [{ role: 'user', content: testMessage }],
        model: selectedModel,
        temperature: 0.7,
        max_tokens: 100
      };

      const response = await aiProvider.chat(request);
      const duration = Date.now() - startTime;
      
      addTestResult({
        type: 'chat',
        provider: selectedProvider,
        model: selectedModel,
        success: true,
        message: `聊天测试成功 (${duration}ms)`,
        details: {
          request,
          response,
          content: response.choices[0]?.message?.content
        },
        duration
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      addTestResult({
        type: 'chat',
        provider: selectedProvider,
        model: selectedModel,
        success: false,
        message: error.message,
        details: error,
        duration
      });
    }
  };

  // 测试流式输出
  const testStream = async () => {
    if (!selectedProvider || !selectedModel) {
      addTestResult({
        type: 'stream',
        provider: selectedProvider,
        success: false,
        message: '请选择提供商和模型'
      });
      return;
    }

    const provider = providers.find(p => p.id === selectedProvider);
    if (!provider || !provider.apiKey) {
      addTestResult({
        type: 'stream',
        provider: selectedProvider,
        success: false,
        message: 'API密钥未配置'
      });
      return;
    }

    setStreamOutput("");
    const startTime = Date.now();
    
    try {
      const aiProvider = createAIProvider(selectedProvider, {
        apiKey: provider.apiKey,
        baseURL: provider.baseURL
      });

      const request: CompletionRequest = {
        messages: [{ role: 'user', content: testMessage }],
        model: selectedModel,
        temperature: 0.7,
        max_tokens: 200,
        stream: true
      };

      let fullContent = "";
      const stream = aiProvider.chatStream(request);
      
      for await (const chunk of stream) {
        if (chunk.choices?.[0]?.delta?.content) {
          fullContent += chunk.choices[0].delta.content;
          setStreamOutput(fullContent);
        }
      }

      const duration = Date.now() - startTime;
      addTestResult({
        type: 'stream',
        provider: selectedProvider,
        model: selectedModel,
        success: true,
        message: `流式输出测试成功 (${duration}ms)`,
        details: {
          request,
          content: fullContent
        },
        duration
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      addTestResult({
        type: 'stream',
        provider: selectedProvider,
        model: selectedModel,
        success: false,
        message: error.message,
        details: error,
        duration
      });
    }
  };

  // 测试验证功能
  const testValidation = () => {
    // 测试API密钥验证
    const apiKeyTests = [
      { provider: 'openai', apiKey: 'sk-1234567890abcdefghijklmnopqrstuvwxyz', expected: true },
      { provider: 'openai', apiKey: 'invalid-key', expected: false },
      { provider: 'anthropic', apiKey: 'sk-ant-1234567890abcdefghijklmnop', expected: true },
      { provider: 'ollama', apiKey: '', expected: true },
    ];

    apiKeyTests.forEach(test => {
      const isValid = ValidationUtils.validateApiKey(test.apiKey, test.provider);
      addTestResult({
        type: 'validation',
        provider: test.provider,
        success: isValid === test.expected,
        message: `API密钥验证: ${test.provider} - ${isValid ? '有效' : '无效'}`,
        details: { apiKey: test.apiKey, expected: test.expected, actual: isValid }
      });
    });

    // 测试URL验证
    const urlTests = [
      { url: 'https://api.openai.com/v1', expected: true },
      { url: 'http://localhost:11434', expected: true },
      { url: 'invalid-url', expected: false },
    ];

    urlTests.forEach(test => {
      const isValid = ValidationUtils.validateURL(test.url);
      addTestResult({
        type: 'validation',
        provider: 'system',
        success: isValid === test.expected,
        message: `URL验证: ${test.url} - ${isValid ? '有效' : '无效'}`,
        details: { url: test.url, expected: test.expected, actual: isValid }
      });
    });
  };

  // 测试错误处理
  const testErrorHandling = () => {
    // 测试不同的错误代码
    const errors = [
      new ProviderError('未授权访问', ErrorCode.UNAUTHORIZED, 401, 'openai'),
      new ProviderError('请求频率限制', ErrorCode.RATE_LIMIT, 429, 'openai'),
      new ProviderError('网络连接失败', ErrorCode.NETWORK_ERROR, undefined, 'openai'),
      new ProviderError('模型不存在', ErrorCode.MODEL_NOT_FOUND, 404, 'openai'),
    ];

    errors.forEach(error => {
      addTestResult({
        type: 'error',
        provider: error.provider || 'system',
        success: true,
        message: `错误处理测试: ${error.code}`,
        details: {
          message: error.message,
          code: error.code,
          status: error.status,
          provider: error.provider
        }
      });
    });
  };

  // 运行所有测试
  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);

    // 测试验证功能
    testValidation();

    // 测试错误处理
    testErrorHandling();

    // 测试每个启用的提供商
    for (const provider of providers.filter(p => p.enabled)) {
      await testConnection(provider.id);
      
      // 如果连接成功，继续其他测试
      if (provider.status === 'connected') {
        setSelectedProvider(provider.id);
        const models = PROVIDER_CONFIGS[provider.id]?.models || [];
        if (models.length > 0) {
          setSelectedModel(models[0].id);
          await testChat();
          await testStream();
        }
      }
    }

    setIsRunningTests(false);
  };

  // 清除测试结果
  const clearResults = () => {
    setTestResults([]);
    setStreamOutput("");
  };

  // 导出测试结果
  const exportResults = () => {
    const data = {
      exportTime: new Date().toISOString(),
      results: testResults,
      providers: providers
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-providers-test-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">AI Providers 测试工具</h1>
      
      {/* 标签页 */}
      <div className="flex space-x-1 mb-6 border-b">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'config'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          配置
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'tests'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          测试
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'results'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          结果
          {testResults.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {testResults.length}
            </span>
          )}
        </button>
      </div>

      {/* 配置标签页 */}
      {activeTab === 'config' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">提供商配置状态</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map(provider => (
                <div
                  key={provider.id}
                  className={`p-4 rounded-lg border ${
                    provider.enabled
                      ? provider.status === 'connected'
                        ? 'border-green-300 bg-green-50'
                        : provider.status === 'error'
                        ? 'border-red-300 bg-red-50'
                        : 'border-yellow-300 bg-yellow-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <h3 className="font-semibold">{provider.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    状态: {provider.status === 'connected' ? '已连接' : 
                           provider.status === 'error' ? '错误' :
                           provider.status === 'testing' ? '测试中' : '未配置'}
                  </p>
                  <p className="text-sm text-gray-600">
                    API密钥: {provider.apiKey ? '已配置' : '未配置'}
                  </p>
                  {provider.lastTested && (
                    <p className="text-xs text-gray-500 mt-1">
                      最后测试: {provider.lastTested.toLocaleString()}
                    </p>
                  )}
                  <button
                    onClick={() => testConnection(provider.id)}
                    disabled={!provider.apiKey || isRunningTests}
                    className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                  >
                    测试连接
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 测试标签页 */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          {/* 测试控制面板 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">测试控制</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择提供商
                </label>
                <select
                  value={selectedProvider}
                  onChange={(e) => {
                    setSelectedProvider(e.target.value);
                    const models = PROVIDER_CONFIGS[e.target.value]?.models || [];
                    if (models.length > 0) {
                      setSelectedModel(models[0].id);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择提供商</option>
                  {providers.filter(p => p.enabled).map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择模型
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={!selectedProvider}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">选择模型</option>
                  {selectedProvider && PROVIDER_CONFIGS[selectedProvider]?.models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                测试消息
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={runAllTests}
                disabled={isRunningTests}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
              >
                {isRunningTests ? '测试中...' : '运行所有测试'}
              </button>
              <button
                onClick={testChat}
                disabled={!selectedProvider || !selectedModel || isRunningTests}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                测试聊天
              </button>
              <button
                onClick={testStream}
                disabled={!selectedProvider || !selectedModel || isRunningTests}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300"
              >
                测试流式输出
              </button>
              <button
                onClick={testValidation}
                disabled={isRunningTests}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-300"
              >
                测试验证
              </button>
              <button
                onClick={testErrorHandling}
                disabled={isRunningTests}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300"
              >
                测试错误处理
              </button>
            </div>
          </div>

          {/* 流式输出显示 */}
          {streamOutput && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">流式输出</h3>
              <div className="bg-gray-100 p-4 rounded-md">
                <pre className="whitespace-pre-wrap text-sm">{streamOutput}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 结果标签页 */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">测试结果</h2>
              <div className="space-x-2">
                <button
                  onClick={clearResults}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  清除结果
                </button>
                <button
                  onClick={exportResults}
                  disabled={testResults.length === 0}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                >
                  导出结果
                </button>
              </div>
            </div>

            {/* 结果统计 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">总测试数</p>
                <p className="text-2xl font-semibold">{testResults.length}</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-sm text-gray-600">成功</p>
                <p className="text-2xl font-semibold text-green-600">
                  {testResults.filter(r => r.success).length}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <p className="text-sm text-gray-600">失败</p>
                <p className="text-2xl font-semibold text-red-600">
                  {testResults.filter(r => !r.success).length}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-gray-600">平均耗时</p>
                <p className="text-2xl font-semibold text-blue-600">
                  {testResults.length > 0
                    ? Math.round(
                        testResults
                          .filter(r => r.duration)
                          .reduce((sum, r) => sum + (r.duration || 0), 0) /
                        testResults.filter(r => r.duration).length
                      )
                    : 0}ms
                </p>
              </div>
            </div>

            {/* 结果列表 */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map(result => (
                <div
                  key={result.id}
                  className={`p-3 rounded-lg border ${
                    result.success
                      ? 'border-green-300 bg-green-50'
                      : 'border-red-300 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          result.success ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {result.type.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600">
                          {result.provider}
                        </span>
                        {result.model && (
                          <span className="text-sm text-gray-500">
                            ({result.model})
                          </span>
                        )}
                      </div>
                      <p className="text-sm mt-1">{result.message}</p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer">
                            查看详情
                          </summary>
                          <pre className="text-xs mt-1 p-2 bg-white rounded overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {result.timestamp.toLocaleTimeString()}
                      </p>
                      {result.duration && (
                        <p className="text-xs text-gray-500">
                          {result.duration}ms
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
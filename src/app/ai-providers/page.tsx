"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PROVIDER_CONFIGS } from "@/ai-providers/config/providers";
import { ProviderConfig, ProviderOptions } from "@/ai-providers/types";
import { createProvider } from "@/ai-providers/core/providerFactory";

// 配置数据类型
interface ProviderConfigData {
  id: string;
  name: string;
  description: string;
  apiKeyUrl: string;
  apiKey?: string;
  baseURL?: string;
  enabled: boolean;
  status: 'unconfigured' | 'testing' | 'connected' | 'error';
  error?: string;
  lastTested?: Date;
  showSuccessAnimation?: boolean; // 添加成功动画标志
}

// 成功动画组件
const SuccessAnimation = ({ show }: { show: boolean }) => {
  if (!show) return null;
  
  return (
    <>
      <div className="success-ripple"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg className="w-8 h-8 text-green-500 success-animation" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
          <path 
            className="success-check" 
            d="M7 12l3 3 7-7" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  );
};

// 全屏成功动画组件
const FullScreenSuccessAnimation = ({ show, providerName }: { show: boolean; providerName: string }) => {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center bg-black/10 animate-fade-in">
      <div className="relative">
        {/* 背景圆圈扩散效果 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-40 h-40 bg-green-500 rounded-full opacity-20 animate-ping"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 bg-green-500 rounded-full opacity-30 animate-ping animation-delay-200"></div>
        </div>
        
        {/* 主体成功图标 */}
        <div className="relative bg-white dark:bg-gray-800 rounded-full p-10 shadow-2xl success-animation">
          <svg className="w-20 h-20 text-green-500" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
            <path 
              className="success-check" 
              d="M7 12l3 3 7-7" 
              stroke="currentColor" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          
          {/* 粒子效果 */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-500 rounded-full"
              style={{
                animation: `particle ${1 + i * 0.1}s ease-out forwards`,
                transform: `rotate(${i * 60}deg) translateX(0)`,
                '--rotation': `${i * 60}deg`
              } as React.CSSProperties}
            />
          ))}
        </div>
        
        {/* 成功文字 */}
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center">
          <p className="text-xl font-bold text-green-600 dark:text-green-400 animate-fade-in-up">
            {providerName} 连接成功！
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 animate-fade-in-up animation-delay-200">
            API配置验证通过
          </p>
        </div>
      </div>
    </div>
  );
};

// 增强的成功动画样式
const successAnimationStyles = `
  @keyframes successPulse {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.2);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes successRipple {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(2.5);
      opacity: 0;
    }
  }

  @keyframes successCheck {
    0% {
      stroke-dashoffset: 100;
    }
    100% {
      stroke-dashoffset: 0;
    }
  }

  @keyframes fadeInUp {
    0% {
      opacity: 0;
      transform: translateY(10px) translateX(-50%);
    }
    100% {
      opacity: 1;
      transform: translateY(0) translateX(-50%);
    }
  }

  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes particle {
    0% {
      transform: rotate(var(--rotation)) translateX(0) scale(1);
      opacity: 1;
    }
    100% {
      transform: rotate(var(--rotation)) translateX(60px) scale(0);
      opacity: 0;
    }
  }

  .success-animation {
    animation: successPulse 0.6s ease-out;
  }

  .success-ripple {
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%);
    animation: successRipple 1s ease-out;
  }

  .success-check {
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    animation: successCheck 0.8s ease-out 0.3s forwards;
  }

  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out 0.5s both;
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }

  .animation-delay-200 {
    animation-delay: 200ms;
  }

  @keyframes confetti {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(-100px) rotate(720deg);
      opacity: 0;
    }
  }

  .confetti {
    position: absolute;
    width: 10px;
    height: 10px;
    background: #10b981;
    animation: confetti 1s ease-out forwards;
  }
`;

export default function AIProvidersConfig() {
  const [providers, setProviders] = useState<ProviderConfigData[]>([]);
  const [showFullScreenSuccess, setShowFullScreenSuccess] = useState<{ show: boolean; providerName: string }>({ 
    show: false, 
    providerName: '' 
  });

  // 创建AI提供商实例的helper函数
  const createAIProvider = (providerId: string, options: { apiKey: string; baseURL?: string }) => {
    const config = PROVIDER_CONFIGS[providerId];
    if (!config) {
      throw new Error(`未找到提供商配置: ${providerId}`);
    }
    
    const providerOptions: ProviderOptions = {
      apiKey: options.apiKey,
      baseURL: options.baseURL || config.baseURL
    };
    
    return createProvider(config as ProviderConfig, providerOptions);
  };

  // 初始化提供商列表
  useEffect(() => {
    const mockProviders = Object.entries(PROVIDER_CONFIGS).map(([id, config]) => ({
      id,
      name: (config as ProviderConfig).name,
      description: (config as ProviderConfig).description,
      apiKeyUrl: (config as ProviderConfig).website?.apiKeyUrl,
      enabled: false,
      status: 'unconfigured' as const,
      lastTested: undefined,
      error: undefined,
      apiKey: undefined,
      baseURL: (config as ProviderConfig).baseURL
      
    }));
    
    // 从localStorage加载已保存的配置
    const savedConfigs = localStorage.getItem('ai-providers-config');
    if (savedConfigs) {
      try {
        const parsed = JSON.parse(savedConfigs);
        const mergedList = mockProviders.map(provider => ({
          ...provider,
          ...parsed[provider.id],
          lastTested: parsed[provider.id]?.lastTested ? new Date(parsed[provider.id].lastTested) : undefined
        }));
        setProviders(mergedList);
      } catch (e) {
        console.error('Failed to load saved configs:', e);
        setProviders(mockProviders.map(provider => ({
          ...provider,
          description: provider.description || '',
          apiKeyUrl: provider.apiKeyUrl || ''
        })));
      }
    } else {
      setProviders(mockProviders.map(provider => ({
        ...provider, 
        description: provider.description || '',
        apiKeyUrl: provider.apiKeyUrl || ''
      })));
    }
  }, []);

  // 保存配置到localStorage
  const saveConfigurations = () => {
    const configsToSave = providers.reduce((acc, provider) => {
      acc[provider.id] = {
        apiKey: provider.apiKey,
        baseURL: provider.baseURL,
        enabled: provider.enabled,
        status: provider.status,
        lastTested: provider.lastTested?.toISOString()
      };
      return acc;
    }, {} as Record<string, any>);
    
    localStorage.setItem('ai-providers-config', JSON.stringify(configsToSave));
  };

  // 更新提供商配置
  const updateProvider = (providerId: string, updates: Partial<ProviderConfigData>) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId 
        ? { ...p, ...updates }
        : p
    ));
    
    // 延迟保存，避免频繁写入
    setTimeout(saveConfigurations, 500);
  };

  // 测试连接 - 真实API测试
  const testConnection = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider || !provider.apiKey) {
      updateProvider(providerId, { 
        status: 'error', 
        error: '请先配置API密钥',
        lastTested: new Date() 
      });
      return;
    }

    updateProvider(providerId, { status: 'testing', error: undefined });

    try {
      // 创建AI提供商实例
      const aiProvider = createAIProvider(providerId, {
        apiKey: provider.apiKey,
        baseURL: provider.baseURL
      });

      // 获取第一个可用模型进行测试
      const config = PROVIDER_CONFIGS[providerId];
      const testModel = config.models[0]?.id;
      
      if (!testModel) {
        throw new Error('未找到可用的模型进行测试');
      }

      console.log(`Testing ${providerId} with model ${testModel}...`);
      
      // 调用真实的testConnection方法
      const isConnected = await aiProvider.testConnection(testModel);
      
      if (isConnected) {
        updateProvider(providerId, { 
          status: 'connected', 
          lastTested: new Date(),
          error: undefined,
          showSuccessAnimation: true // 触发成功动画
        });
        console.log(`✅ ${provider.name} 连接测试成功`);
        
        // 显示全屏成功动画
        setShowFullScreenSuccess({ show: true, providerName: provider.name });
        
        // 2秒后隐藏全屏动画
        setTimeout(() => {
          setShowFullScreenSuccess({ show: false, providerName: '' });
        }, 2000);
        
        // 3秒后清除卡片动画标志
        setTimeout(() => {
          setProviders(prev => prev.map(p => 
            p.id === providerId 
              ? { ...p, showSuccessAnimation: false }
              : p
          ));
        }, 3000);
      } else {
        throw new Error('连接测试失败，请检查API密钥和网络连接');
      }
    } catch (error: any) {
      console.error(`❌ ${provider.name} 连接测试失败:`, error);
      
      let errorMessage = '连接测试失败';
      
      // 根据错误类型提供更具体的错误信息
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'API密钥无效，请检查密钥是否正确';
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        errorMessage = 'API密钥权限不足或账户余额不足';
      } else if (error.message.includes('429') || error.message.includes('rate limit')) {
        errorMessage = '请求频率过高，请稍后再试';
      } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
        errorMessage = '连接超时，请检查网络连接';
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
        errorMessage = '网络连接失败，请检查网络设置';
      } else if (error.message.includes('Invalid request')) {
        errorMessage = '请求格式错误，请检查API配置';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      updateProvider(providerId, { 
        status: 'error', 
        error: errorMessage,
        lastTested: new Date() 
      });
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return '✅';
      case 'testing': return '⏳';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-700 bg-green-50 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700';
      case 'testing': return 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
      case 'error': return 'text-red-700 bg-red-50 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700';
      default: return 'text-gray-700 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return '连接正常';
      case 'testing': return '测试中...';
      case 'error': return '连接失败';
      default: return '未配置';
    }
  };

  // 统计数据
  const stats = {
    total: providers.length,
    connected: providers.filter(p => p.status === 'connected').length,
    enabled: providers.filter(p => p.enabled).length,
    error: providers.filter(p => p.status === 'error').length
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 注入动画样式 */}
      <style jsx>{successAnimationStyles}</style>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 头部区域 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                AI 服务商配置
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                配置您的AI服务提供商，开始体验智能助手的强大功能
              </p>
            </div>
            
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← 返回首页
            </Link>
          </div>

          {/* 快速统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              <div className="text-sm text-gray-500">支持服务商</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-green-600">{stats.connected}</div>
              <div className="text-sm text-gray-500">已连接</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-blue-600">{stats.enabled}</div>
              <div className="text-sm text-gray-500">已启用</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-red-600">{stats.error}</div>
              <div className="text-sm text-gray-500">连接异常</div>
            </div>
          </div>

          {/* 使用提示 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 text-lg">💡</div>
              <div>
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  配置指南
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  填入您的API密钥后，点击"测试连接"验证配置。启用开关控制该服务商是否可用。
                  建议至少配置一个服务商以获得最佳体验。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 服务商配置卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {providers.map(provider => (
            <div 
              key={provider.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* 服务商信息 */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {provider.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {provider.description}
                    </p>
                  </div>
                  
                  <div className="ml-4 relative">
                    {/* 成功动画效果 */}
                    {provider.showSuccessAnimation && provider.status === 'connected' && (
                      <SuccessAnimation show={provider.showSuccessAnimation} />
                    )}
                    
                    <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(provider.status)} ${provider.showSuccessAnimation && provider.status === 'connected' ? 'success-animation' : ''}`}>
                      <span className="mr-1">{getStatusIcon(provider.status)}</span>
                      {getStatusText(provider.status)}
                    </div>
                  </div>
                </div>

                {provider.lastTested && (
                  <div className="text-xs text-gray-500">
                    最后测试: {provider.lastTested.toLocaleString()}
                  </div>
                )}
              </div>

              {/* 配置表单 */}
              <div className="p-6 space-y-5">
                {provider.error && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="text-red-500">⚠️</div>
                    <div className="text-sm text-red-700 dark:text-red-300">
                      {provider.error}
                    </div>
                  </div>
                )}

                {/* API密钥配置 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      API密钥
                    </label>
                    {provider.apiKey && (
                      <span className="text-xs text-green-600 dark:text-green-400">✓ 已配置</span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={provider.apiKey || ""}
                      onChange={(e) => updateProvider(provider.id, { 
                        apiKey: e.target.value,
                        status: e.target.value ? 'unconfigured' : 'unconfigured'
                      })}
                      className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                      placeholder="请输入您的API密钥"
                    />
                    
                    <a
                      href={provider.apiKeyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium whitespace-nowrap"
                      title={`获取 ${provider.name} API密钥`}
                    >
                      🔑 获取
                    </a>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    在 {provider.name} 官网申请API密钥，用于身份验证
                  </p>
                </div>

                {/* 基础URL配置 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    自定义API地址 <span className="text-gray-400">(可选)</span>
                  </label>
                  <input
                    type="url"
                    value={provider.baseURL || ""}
                    onChange={(e) => updateProvider(provider.id, { baseURL: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    placeholder={`默认: https://api.${provider.id}.com`}
                  />
                  <p className="text-xs text-gray-500">
                    用于自定义API服务地址或使用代理服务
                  </p>
                </div>

                {/* 启用开关 */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      启用此服务商
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      启用后可在应用中使用此AI服务
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={provider.enabled}
                      onChange={(e) => updateProvider(provider.id, { enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="px-6 pb-6 flex gap-3">
                {provider.apiKey ? (
                  <button
                    onClick={() => testConnection(provider.id)}
                    disabled={provider.status === 'testing'}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {provider.status === 'testing' ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        测试中...
                      </>
                    ) : (
                      <>
                        🔍 测试连接
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-lg text-center text-sm">
                    请先配置API密钥
                  </div>
                )}
                
                <a
                  href={`https://${provider.id}.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  📖 官网
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* 底部帮助信息 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            需要帮助? 请参考各服务商的官方文档获取API密钥申请指南
          </p>
        </div>
      </div>
      
      {/* 全屏成功动画 */}
      <FullScreenSuccessAnimation 
        show={showFullScreenSuccess.show} 
        providerName={showFullScreenSuccess.providerName} 
      />
    </div>
  );
} 
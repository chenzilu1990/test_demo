"use client";

import { useState } from 'react';
import InteractivePrompt from '../InteractivePrompt';
import { PromptTemplate } from '../types';
import { ModelOption } from '../../../app/ai-providers-chat/components/types';

// 示例模型数据
const exampleModels: ModelOption[] = [
  { id: 'openai:gpt-4', name: 'GPT-4', provider: 'openai' },
  { id: 'openai:gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
  { id: 'anthropic:claude-3', name: 'Claude 3', provider: 'anthropic' },
  { id: 'google:gemini-pro', name: 'Gemini Pro', provider: 'google' }
];

// 示例模板数据
const exampleTemplates: PromptTemplate[] = [
  {
    title: '代码审查',
    prompt: '请帮我审查以下代码，重点关注：\n1. 代码质量\n2. 性能优化\n3. 安全问题\n\n代码：\n{code}'
  },
  {
    title: '翻译助手',
    prompt: '请将以下内容翻译成{language}：\n\n{content}'
  },
  {
    title: '文档生成',
    prompt: '为以下{type}生成详细的文档：\n\n{content}'
  }
];

export default function MentionExample() {
  const [promptValue, setPromptValue] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    console.log('选中模型:', modelId);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">@和#触发弹出菜单示例</h1>
        
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <h2 className="text-lg font-semibold mb-2 text-blue-800 dark:text-blue-200">🎯 使用说明</h2>
          <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
            <li>输入 <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded font-mono">@</code> 触发模型选择器 📱</li>
            <li>输入 <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded font-mono">#</code> 触发模板选择器 📝</li>
            <li>按 <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded font-mono">ESC</code> 键关闭弹出菜单</li>
            <li>弹出菜单智能定位：优先<strong>上方</strong>显示，空间不足时自动<strong>下方</strong>弹出</li>
            <li>支持括号参数：[参数] {'{参数}'} {'{{参数}}'}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <InteractivePrompt
            value={promptValue}
            onChange={setPromptValue}
            templates={exampleTemplates}
            bracketOptions={{
              'language': ['中文', '英文', '日文', '法文', '德文'],
              'type': ['函数', '类', 'API', '组件'],
              'code': ['请粘贴代码'],
              'content': ['请输入内容']
            }}
            placeholder="尝试输入@选择模型，或输入#选择模板..."
            height="200px"
            availableModels={exampleModels}
            selectedProviderModel={selectedModel}
            onModelSelect={handleModelSelect}
            isImageGenerationModel={false}
          />

          {selectedModel && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
              <p className="text-green-800 dark:text-green-200">
                当前选中的模型: <strong>{exampleModels.find(m => m.id === selectedModel)?.name}</strong>
              </p>
            </div>
          )}

          {promptValue && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-md">
              <h3 className="font-semibold mb-2">当前提示词内容：</h3>
              <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                {promptValue}
              </pre>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">功能特性</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-green-600 dark:text-green-400">✅ 已实现</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>@字符触发模型选择器 📱</li>
              <li>#字符触发模板选择器 📝</li>
              <li>智能弹出定位（上方优先，自动适配空间）</li>
              <li>ESC键关闭弹出菜单</li>
              <li>点击选择后自动插入文本</li>
              <li>光标位置自动定位</li>
              <li>流畅的动画过渡效果</li>
              <li>箭头指示器连接关系</li>
              <li>图标化的视觉提示</li>
              <li>支持深色模式</li>
              <li>响应式设计</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-600 dark:text-blue-400">🔧 可扩展</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>支持更多触发字符</li>
              <li>自定义弹出菜单样式</li>
              <li>键盘导航（上下键选择）</li>
              <li>模糊搜索过滤</li>
              <li>自定义插入格式</li>
              <li>更多键盘快捷键</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 
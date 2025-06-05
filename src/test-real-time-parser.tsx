/**
 * 实时解析功能测试页面
 * 用于验证用户输入方括号时是否能正确转换为BracketNode
 */

import React, { useState } from 'react';
import LexicalPromptEditor from './components/prompt-editor/lexical-editor/LexicalPromptEditor';
import { BracketParameterOptions } from './components/prompt-editor/types';

export default function TestRealTimeParser() {
  const [value, setValue] = useState('请输入一些文本，然后尝试输入 [国家] 或 [城市] 等方括号参数。');
  const [bracketOptions, setBracketOptions] = useState<BracketParameterOptions>({
    '国家': ['中国', '美国', '日本', '德国'],
    '城市': ['北京', '上海', '纽约', '伦敦'],
    '颜色': ['红色', '蓝色', '绿色', '黄色']
  });

  const handleGenerateMoreOptions = async (paramName: string, currentOptions: string[]): Promise<string[]> => {
    // 模拟生成更多选项
    const mockOptions: Record<string, string[]> = {
      '国家': ['法国', '英国', '加拿大', '澳大利亚', '韩国'],
      '城市': ['广州', '深圳', '东京', '首尔', '巴黎'],
      '颜色': ['紫色', '橙色', '粉色', '灰色', '黑色'],
    };

    return mockOptions[paramName] || [`新${paramName}1`, `新${paramName}2`, `新${paramName}3`];
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">实时解析功能测试</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">使用说明：</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li>在编辑器中输入方括号参数，如 <code>[参数名]</code></li>
          <li>输入完整的方括号后，文本应该自动转换为蓝色的可点击节点</li>
          <li>点击蓝色节点可以选择预设选项</li>
          <li>选择后会变成绿色的已选择状态</li>
          <li>再次点击绿色节点可以重新选择</li>
        </ul>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          编辑器内容：
        </label>
        <LexicalPromptEditor
          value={value}
          onChange={setValue}
          bracketOptions={bracketOptions}
          onBracketOptionsUpdate={setBracketOptions}
          onGenerateMoreOptions={handleGenerateMoreOptions}
          placeholder="在这里输入并测试方括号参数..."
          height="200px"
          className="border-2 border-gray-300 rounded-lg"
        />
      </div>

      <div className="mb-4">
        <h3 className="text-md font-semibold mb-2">当前内容：</h3>
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
          {value}
        </pre>
      </div>

      <div className="mb-4">
        <h3 className="text-md font-semibold mb-2">检测到的参数：</h3>
        <div className="bg-gray-100 p-3 rounded">
          {Object.keys(bracketOptions).length === 0 ? (
            <p className="text-gray-500">暂无检测到的参数</p>
          ) : (
            Object.entries(bracketOptions).map(([param, options]) => (
              <div key={param} className="mb-2">
                <span className="font-medium">[{param}]:</span>
                <span className="ml-2 text-sm text-gray-600">
                  {options.length === 0 ? '无选项' : options.join(', ')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-md font-semibold mb-2 text-blue-800">测试建议：</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-700">
          <li>尝试输入: "我想去[国家]的[城市]旅行"</li>
          <li>尝试输入: "我喜欢[颜色]的衣服"</li>
          <li>尝试输入新参数: "我想吃[食物]"</li>
          <li>观察方括号是否自动转换为蓝色节点</li>
          <li>点击节点测试选项功能</li>
        </ol>
      </div>
    </div>
  );
} 
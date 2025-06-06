import React, { useState } from 'react';
import InteractivePrompt from '../InteractivePrompt';
import { DEFAULT_BRACKET_FORMATS, BracketFormatConfig } from '../types';

// 示例：使用重构后的组件
export const RefactoredUsageExample: React.FC = () => {
  const [prompt, setPrompt] = useState('Hello {name}, you are a [role] working on {{task}}');
  
  const bracketOptions = {
    name: ['Alice', 'Bob', 'Charlie'],
    role: ['developer', 'designer', 'manager'],
    task: ['frontend', 'backend', 'database']
  };

  const customFormats: BracketFormatConfig[] = [
    {
      regex: /\{\{([^\}]*)\}\}/g,
      type: 'variable',
      priority: 3,
      description: '变量',
      className: 'text-purple-600 hover:bg-purple-100/50 dark:hover:bg-purple-900/50'
    },
    {
      regex: /\{([^\}]*)\}/g,
      type: 'parameter',
      priority: 2,
      description: '参数',
      className: 'text-blue-500 hover:bg-blue-100/50 dark:hover:bg-blue-900/50'
    },
    {
      regex: /\[([^\]]*)\]/g,
      type: 'option',
      priority: 1,
      description: '选项',
      className: 'text-green-600 hover:bg-green-100/50 dark:hover:bg-green-900/50'
    }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">重构后的组件使用示例</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">基本使用</h3>
        <InteractivePrompt
          value={prompt}
          onChange={setPrompt}
          bracketOptions={bracketOptions}
          placeholder="输入包含参数的提示词..."
          height="8rem"
        />
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">自定义括号格式</h3>
        <InteractivePrompt
          value={prompt}
          onChange={setPrompt}
          bracketOptions={bracketOptions}
          bracketFormats={customFormats}
          placeholder="使用自定义格式..."
          height="8rem"
        />
      </div>

      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h4 className="font-semibold mb-2">当前提示词内容：</h4>
        <pre className="text-sm text-gray-700 dark:text-gray-300">{prompt}</pre>
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <h4 className="font-semibold mb-2">重构带来的好处：</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>组件职责更加单一，代码更易维护</li>
          <li>使用自定义hooks提升代码复用性</li>
          <li>子组件可以独立测试和开发</li>
          <li>状态管理更加清晰和可预测</li>
          <li>性能得到优化（useMemo、useCallback）</li>
        </ul>
      </div>
    </div>
  );
};

export default RefactoredUsageExample; 
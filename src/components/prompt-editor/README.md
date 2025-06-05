# InteractivePrompt 组件使用指南

## 括号格式配置

`InteractivePrompt` 组件支持自定义括号格式，让你可以定义不同类型的可交互括号。

### 基本用法

```tsx
import InteractivePrompt from './InteractivePrompt';
import { DEFAULT_BRACKET_FORMATS } from './types';

// 使用默认配置
<InteractivePrompt
  value={prompt}
  onChange={setPrompt}
  bracketOptions={bracketOptions}
  // 其他 props...
/>
```

### 自定义括号格式

```tsx
import { BracketFormatConfig } from './types';

const customFormats: BracketFormatConfig[] = [
  {
    regex: /\{\{([^\}]*)\}\}/g,
    type: 'variable',
    priority: 3,
    description: '变量',
    className: 'text-purple-600 hover:bg-purple-100/50'
  },
  {
    regex: /<([^>]*)>/g,
    type: 'placeholder',
    priority: 2,
    description: '占位符',
    className: 'text-orange-600 hover:bg-orange-100/50'
  },
  {
    regex: /\[([^\]]*)\]/g,
    type: 'parameter',
    priority: 1,
    description: '参数',
    className: 'text-blue-600 hover:bg-blue-100/50'
  }
];

<InteractivePrompt
  value={prompt}
  onChange={setPrompt}
  bracketOptions={bracketOptions}
  bracketFormats={customFormats}
  // 其他 props...
/>
```

## 配置属性说明

### BracketFormatConfig

| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `regex` | `RegExp` | ✅ | 匹配正则表达式，必须包含一个捕获组 `()` |
| `type` | `string` | ✅ | 格式类型标识符 |
| `priority` | `number` | ✅ | 优先级，数字越大优先级越高（用于处理重叠） |
| `description` | `string` | ❌ | 格式描述，用于 UI 显示 |
| `className` | `string` | ❌ | 自定义样式类名 |

### 正则表达式要求

- 必须包含全局标志 `g`
- 必须包含一个捕获组 `()` 来提取括号内的内容
- 示例：`/\[([^\]]*)\]/g` 匹配 `[content]` 并捕获 `content`

### 优先级处理

当多个格式在同一位置匹配时，优先级高的格式会被保留：

```tsx
// 例如文本 "{{name}}" 同时匹配：
// 1. {{name}} (priority: 3) ✅ 保留
// 2. {name}  (priority: 2) ❌ 被过滤
```

## 预设配置

### 默认配置 (DEFAULT_BRACKET_FORMATS)
- `{{content}}` - 双花括号 (priority: 3)
- `{content}` - 单花括号 (priority: 2)  
- `[content]` - 方括号 (priority: 1)

### 扩展示例

查看 `examples/CustomBracketFormats.ts` 文件了解更多配置示例：

- **自定义样式配置**：不同颜色的括号格式
- **简化配置**：只支持基本格式
- **模板特定配置**：类似 Jinja2 的模板语法

## 样式自定义

可以通过 `className` 属性自定义每种格式的样式：

```tsx
{
  regex: /\{\{([^\}]*)\}\}/g,
  type: 'highlight',
  priority: 1,
  description: '高亮内容',
  className: 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200 font-bold'
}
```

## 注意事项

1. **正则表达式冲突**：确保不同格式的正则表达式不会产生意外的匹配
2. **性能考虑**：避免过于复杂的正则表达式，特别是在长文本中
3. **用户体验**：保持格式的一致性，避免过多的格式类型造成困惑
4. **向后兼容**：默认配置保持不变，确保现有代码正常工作

## 完整示例

```tsx
import React, { useState } from 'react';
import InteractivePrompt from './InteractivePrompt';
import { CUSTOM_BRACKET_FORMATS } from './examples/CustomBracketFormats';

function MyComponent() {
  const [prompt, setPrompt] = useState('Hello {{name}}, you are a {role} working on <task>');
  
  const bracketOptions = {
    name: ['Alice', 'Bob', 'Charlie'],
    role: ['developer', 'designer', 'manager'],
    task: ['frontend', 'backend', 'database']
  };

  return (
    <InteractivePrompt
      value={prompt}
      onChange={setPrompt}
      bracketOptions={bracketOptions}
      bracketFormats={CUSTOM_BRACKET_FORMATS}
      placeholder="输入包含参数的提示词..."
    />
  );
}
``` 
import { BracketFormatConfig } from '../types';
import { ConfigValidationError } from '../types/errors';

// 验证结果接口
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 验证单个括号格式配置
export function validateBracketFormat(format: BracketFormatConfig, index: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 检查必需字段
  if (!format.regex) {
    errors.push(`格式配置 ${index}: regex 字段是必需的`);
  } else {
    // 验证正则表达式
    try {
      // 检查是否为 RegExp 对象
      if (!(format.regex instanceof RegExp)) {
        errors.push(`格式配置 ${index}: regex 必须是 RegExp 对象`);
      } else {
        // 检查是否包含全局标志
        if (!format.regex.global) {
          warnings.push(`格式配置 ${index}: 建议正则表达式包含全局标志 'g'`);
        }

        // 检查是否包含捕获组
        const testString = format.regex.source;
        if (!testString.includes('(') || !testString.includes(')')) {
          warnings.push(`格式配置 ${index}: 建议正则表达式包含捕获组 () 来提取内容`);
        }

        // 测试正则表达式安全性（防止 ReDoS 攻击）
        if (isRegexUnsafe(format.regex)) {
          errors.push(`格式配置 ${index}: 正则表达式可能导致性能问题，请优化`);
        }
      }
    } catch (error) {
      errors.push(`格式配置 ${index}: 正则表达式无效 - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (!format.type || typeof format.type !== 'string') {
    errors.push(`格式配置 ${index}: type 字段必须是非空字符串`);
  }

  if (typeof format.priority !== 'number') {
    errors.push(`格式配置 ${index}: priority 字段必须是数字`);
  } else if (format.priority < 0) {
    warnings.push(`格式配置 ${index}: priority 为负数，可能导致意外行为`);
  }

  // 检查可选字段
  if (format.description !== undefined && typeof format.description !== 'string') {
    warnings.push(`格式配置 ${index}: description 应该是字符串`);
  }

  if (format.className !== undefined && typeof format.className !== 'string') {
    warnings.push(`格式配置 ${index}: className 应该是字符串`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// 验证括号格式配置数组
export function validateBracketFormats(formats: BracketFormatConfig[]): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // 检查是否为数组
  if (!Array.isArray(formats)) {
    return {
      isValid: false,
      errors: ['bracketFormats 必须是数组'],
      warnings: []
    };
  }

  // 检查是否为空数组
  if (formats.length === 0) {
    return {
      isValid: false,
      errors: ['bracketFormats 不能为空数组'],
      warnings: []
    };
  }

  // 验证每个格式配置
  formats.forEach((format, index) => {
    const result = validateBracketFormat(format, index);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  });

  // 检查重复的类型
  const types = formats.map(f => f.type).filter(Boolean);
  const duplicateTypes = types.filter((type, index) => types.indexOf(type) !== index);
  if (duplicateTypes.length > 0) {
    allWarnings.push(`发现重复的 type: ${[...new Set(duplicateTypes)].join(', ')}`);
  }

  // 检查优先级冲突
  const priorities = formats.map(f => ({ type: f.type, priority: f.priority }));
  const priorityGroups = new Map<number, string[]>();
  
  priorities.forEach(({ type, priority }) => {
    if (!priorityGroups.has(priority)) {
      priorityGroups.set(priority, []);
    }
    priorityGroups.get(priority)!.push(type);
  });

  priorityGroups.forEach((types, priority) => {
    if (types.length > 1) {
      allWarnings.push(`多个格式使用了相同的优先级 ${priority}: ${types.join(', ')}`);
    }
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}

// 验证括号选项配置
export function validateBracketOptions(options: Record<string, string[]>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!options || typeof options !== 'object') {
    return {
      isValid: false,
      errors: ['bracketOptions 必须是对象'],
      warnings: []
    };
  }

  Object.entries(options).forEach(([key, value]) => {
    if (typeof key !== 'string' || key.trim() === '') {
      errors.push(`选项键 "${key}" 必须是非空字符串`);
    }

    if (!Array.isArray(value)) {
      errors.push(`选项 "${key}" 的值必须是数组`);
    } else {
      if (value.length === 0) {
        warnings.push(`选项 "${key}" 的数组为空`);
      }

      value.forEach((item, index) => {
        if (typeof item !== 'string') {
          errors.push(`选项 "${key}" 的第 ${index + 1} 个元素必须是字符串`);
        }
      });

      // 检查重复值
      const uniqueValues = [...new Set(value)];
      if (uniqueValues.length !== value.length) {
        warnings.push(`选项 "${key}" 包含重复值`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// 检查正则表达式是否可能导致性能问题
function isRegexUnsafe(regex: RegExp): boolean {
  const source = regex.source;
  
  // 检查可能导致灾难性回溯的模式
  const dangerousPatterns = [
    /\(\?\=.*\)\+/,           // 正向前瞻 + 量词
    /\(\?\!.*\)\+/,           // 负向前瞻 + 量词
    /\(\?\<=.*\)\+/,          // 正向后瞻 + 量词
    /\(\?\<!.*\)\+/,          // 负向后瞻 + 量词
    /\(\.\*\)\+/,             // (.*)+
    /\(\.\+\)\+/,             // (.+)+
    /\(\w\*\)\+/,             // (\w*)+
    /\(\w\+\)\+/,             // (\w+)+
    /\([^)]*\*[^)]*\)\+/,     // 嵌套量词
  ];

  return dangerousPatterns.some(pattern => pattern.test(source));
}

// 完整的配置验证函数
export function validateInteractivePromptConfig(config: {
  bracketFormats?: BracketFormatConfig[];
  bracketOptions?: Record<string, string[]>;
}): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // 验证括号格式
  if (config.bracketFormats) {
    const formatResult = validateBracketFormats(config.bracketFormats);
    allErrors.push(...formatResult.errors);
    allWarnings.push(...formatResult.warnings);
  }

  // 验证括号选项
  if (config.bracketOptions) {
    const optionsResult = validateBracketOptions(config.bracketOptions);
    allErrors.push(...optionsResult.errors);
    allWarnings.push(...optionsResult.warnings);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}

// 创建安全的默认配置
export function createSafeConfig(userConfig: Partial<{
  bracketFormats: BracketFormatConfig[];
  bracketOptions: Record<string, string[]>;
}>): {
  bracketFormats: BracketFormatConfig[];
  bracketOptions: Record<string, string[]>;
} {
  const safeBracketFormats: BracketFormatConfig[] = [
    {
      regex: /\[([^\]]*)\]/g,
      type: 'bracket',
      priority: 1,
      description: '方括号',
      className: 'text-blue-500 hover:bg-blue-100/50 dark:hover:bg-blue-900/50'
    }
  ];

  const safeBracketOptions: Record<string, string[]> = {};

  return {
    bracketFormats: userConfig.bracketFormats && validateBracketFormats(userConfig.bracketFormats).isValid 
      ? userConfig.bracketFormats 
      : safeBracketFormats,
    bracketOptions: userConfig.bracketOptions && validateBracketOptions(userConfig.bracketOptions).isValid 
      ? userConfig.bracketOptions 
      : safeBracketOptions
  };
} 
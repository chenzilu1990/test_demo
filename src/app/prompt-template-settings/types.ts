import { PromptTemplate } from '@/components/prompt-editor/types';

// 标签数据结构
export interface TemplateTag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface ExtendedPromptTemplate extends PromptTemplate {
  id: string;
  createdAt: Date;
  usageCount: number;
  lastUsedAt?: Date;
  tags?: string[]; // 标签ID数组
}

export type SortOption = 'createdAt' | 'usageCount' | 'lastUsedAt';

export interface SortConfig {
  field: SortOption;
}

// 数据迁移相关类型
export interface LegacyTemplateData {
  paramTemplates?: any[];
  quickTemplates?: any[];
  metadata?: Record<string, any>;
}

// 统一的模板存储key
export const UNIFIED_TEMPLATES_KEY = 'ai-prompt-templates';

// 标签存储key
export const TAGS_STORAGE_KEY = 'ai-template-tags';

// 旧的存储keys（用于数据迁移）
export const LEGACY_KEYS = {
  PARAM_TEMPLATES: 'ai-chat-param-templates',
  QUICK_TEMPLATES: 'ai-chat-templates', // 注意：这个与新key相同
  METADATA: 'ai-chat-templates-metadata'
} as const;

// 预定义标签颜色 - 统一灰色调色板
export const TAG_COLORS = [
  '#6B7280', // gray-500
  '#4B5563', // gray-600  
  '#374151', // gray-700
  '#1F2937', // gray-800
  '#9CA3AF', // gray-400
  '#64748B', // slate-500
  '#475569', // slate-600
  '#334155', // slate-700
  '#78716C', // stone-500
  '#57534E', // stone-600
] as const;

// 标签相关工具函数
export const generateTagId = (): string => {
  return `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 判断是否为参数化模板
export const isParameterizedTemplate = (template: ExtendedPromptTemplate): boolean => {
  return !!(template.parameterOptions && Object.keys(template.parameterOptions).length > 0);
};

// 生成模板ID
export const generateTemplateId = (template: PromptTemplate, index: number, type: 'param' | 'quick'): string => {
  const cleanTitle = (template.title || '').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  return `${type}_${index}_${cleanTitle}_${Date.now()}`;
}; 
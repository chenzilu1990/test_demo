import { PromptTemplate } from '@/components/default-prompt-editor';
import { ExtendedPromptTemplate, LEGACY_KEYS, UNIFIED_TEMPLATES_KEY, generateTemplateId } from '../types';

/**
 * 数据迁移工具：将旧的三个分离的数据源合并为统一的ExtendedPromptTemplate结构
 */

// 从localStorage加载统一的模板数据
export const loadUnifiedTemplates = (): ExtendedPromptTemplate[] => {
  try {
    // 首先尝试加载新的统一数据结构
    const unifiedData = localStorage.getItem(UNIFIED_TEMPLATES_KEY);
    if (unifiedData) {
      const parsed = JSON.parse(unifiedData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // 检查是否已经是ExtendedPromptTemplate结构
        const firstItem = parsed[0];
        if (firstItem.id && firstItem.createdAt && typeof firstItem.usageCount === 'number') {
          // 已经是新结构，直接返回（需要转换日期）
          return parsed.map(template => ({
            ...template,
            createdAt: new Date(template.createdAt),
            lastUsedAt: template.lastUsedAt ? new Date(template.lastUsedAt) : undefined
          }));
        }
      }
    }

    // 如果没有新结构数据或数据格式不正确，进行数据迁移
    return migrateFromLegacyData();
  } catch (error) {
    console.error('Failed to load unified templates:', error);
    // 如果加载失败，尝试数据迁移
    return migrateFromLegacyData();
  }
};

// 从旧的数据结构迁移数据
export const migrateFromLegacyData = (): ExtendedPromptTemplate[] => {
  const allTemplates: ExtendedPromptTemplate[] = [];

  try {
    // 加载元数据
    const metadataStr = localStorage.getItem(LEGACY_KEYS.METADATA);
    const metadata: Record<string, any> = metadataStr ? JSON.parse(metadataStr) : {};

    // 迁移参数化模板
    const paramTemplatesStr = localStorage.getItem(LEGACY_KEYS.PARAM_TEMPLATES);
    if (paramTemplatesStr) {
      const paramTemplates = JSON.parse(paramTemplatesStr);
      if (Array.isArray(paramTemplates)) {
        paramTemplates.forEach((template: any, index: number) => {
          const extendedTemplate = convertToExtendedTemplate(
            template, 
            index, 
            'param', 
            metadata
          );
          allTemplates.push(extendedTemplate);
        });
      }
    }

    // 迁移快捷模板（注意：QUICK_TEMPLATES和UNIFIED_TEMPLATES_KEY是同一个key）
    // 我们需要检查现有数据是否是旧格式的快捷模板
    const quickTemplatesStr = localStorage.getItem(LEGACY_KEYS.QUICK_TEMPLATES);
    if (quickTemplatesStr) {
      const quickTemplates = JSON.parse(quickTemplatesStr);
      if (Array.isArray(quickTemplates)) {
        // 过滤掉已经是ExtendedPromptTemplate格式的数据（避免重复迁移）
        const legacyQuickTemplates = quickTemplates.filter(template => {
          return !(template.id && template.createdAt && typeof template.usageCount === 'number');
        });

        legacyQuickTemplates.forEach((template: any, index: number) => {
          const extendedTemplate = convertToExtendedTemplate(
            template, 
            index, 
            'quick', 
            metadata
          );
          allTemplates.push(extendedTemplate);
        });
      }
    }

    // 保存迁移后的数据到新的统一格式
    if (allTemplates.length > 0) {
      saveUnifiedTemplates(allTemplates);
      // 清理旧的数据（可选，暂时保留以防万一）
      // cleanupLegacyData();
    }

    return allTemplates;
  } catch (error) {
    console.error('Failed to migrate legacy data:', error);
    return [];
  }
};

// 将单个模板转换为ExtendedPromptTemplate格式
const convertToExtendedTemplate = (
  template: any, 
  index: number, 
  type: 'param' | 'quick',
  metadata: Record<string, any>
): ExtendedPromptTemplate => {
  let title: string;
  let prompt: string;
  let parameterOptions: any = undefined;

  if (typeof template === 'string') {
    // 旧格式的快捷模板：字符串数组
    title = template.length > 30 ? template.substring(0, 30) + '...' : template;
    prompt = template;
  } else {
    // 新格式的模板对象
    title = template.title || (template.prompt?.length > 30 ? template.prompt.substring(0, 30) + '...' : template.prompt) || 'Untitled Template';
    prompt = template.prompt || '';
    parameterOptions = template.parameterOptions;
  }

  // 生成唯一ID
  const templateId = generateTemplateId({ title, prompt, parameterOptions }, index, type);

  // 从元数据中获取统计信息
  const templateMetadata = metadata[templateId] || metadata[`${type}_${index}_${title.replace(/\s+/g, '_')}`] || {};

  return {
    id: templateId,
    title,
    prompt,
    parameterOptions,
    createdAt: templateMetadata.createdAt ? new Date(templateMetadata.createdAt) : new Date(),
    usageCount: templateMetadata.usageCount || 0,
    lastUsedAt: templateMetadata.lastUsedAt ? new Date(templateMetadata.lastUsedAt) : undefined,
    tags: templateMetadata.tags || [] // 迁移时保留现有标签，如果没有则为空数组
  };
};

// 保存统一的模板数据
export const saveUnifiedTemplates = (templates: ExtendedPromptTemplate[]): void => {
  try {
    const serializedTemplates = templates.map(template => ({
      ...template,
      createdAt: template.createdAt.toISOString(),
      lastUsedAt: template.lastUsedAt?.toISOString()
    }));
    
    localStorage.setItem(UNIFIED_TEMPLATES_KEY, JSON.stringify(serializedTemplates));
  } catch (error) {
    console.error('Failed to save unified templates:', error);
    throw error;
  }
};

// 添加新模板
export const addTemplate = (template: PromptTemplate & { tags?: string[] }): ExtendedPromptTemplate => {
  const existingTemplates = loadUnifiedTemplates();
  const isParametrized = template.parameterOptions && Object.keys(template.parameterOptions).length > 0;
  
  const newTemplate: ExtendedPromptTemplate = {
    id: generateTemplateId(template, existingTemplates.length, isParametrized ? 'param' : 'quick'),
    title: template.title,
    prompt: template.prompt,
    parameterOptions: template.parameterOptions,
    createdAt: new Date(),
    usageCount: 0,
    tags: template.tags || [] // 使用传入的标签或默认为空数组
  };

  const updatedTemplates = [...existingTemplates, newTemplate];
  saveUnifiedTemplates(updatedTemplates);
  
  return newTemplate;
};

// 更新模板
export const updateTemplate = (templateId: string, updates: Partial<PromptTemplate & { tags?: string[] }>): ExtendedPromptTemplate | null => {
  const existingTemplates = loadUnifiedTemplates();
  const templateIndex = existingTemplates.findIndex(t => t.id === templateId);
  
  if (templateIndex === -1) {
    return null;
  }

  const updatedTemplate = {
    ...existingTemplates[templateIndex],
    ...updates
  };

  existingTemplates[templateIndex] = updatedTemplate;
  saveUnifiedTemplates(existingTemplates);
  
  return updatedTemplate;
};

// 删除模板
export const deleteTemplate = (templateId: string): boolean => {
  const existingTemplates = loadUnifiedTemplates();
  const filteredTemplates = existingTemplates.filter(t => t.id !== templateId);
  
  if (filteredTemplates.length === existingTemplates.length) {
    return false; // 没有找到要删除的模板
  }

  saveUnifiedTemplates(filteredTemplates);
  return true;
};

// 更新模板使用统计
export const updateTemplateUsage = (templateId: string): ExtendedPromptTemplate | null => {
  const existingTemplates = loadUnifiedTemplates();
  const templateIndex = existingTemplates.findIndex(t => t.id === templateId);
  
  if (templateIndex === -1) {
    return null;
  }

  const updatedTemplate = {
    ...existingTemplates[templateIndex],
    usageCount: existingTemplates[templateIndex].usageCount + 1,
    lastUsedAt: new Date()
  };

  existingTemplates[templateIndex] = updatedTemplate;
  saveUnifiedTemplates(existingTemplates);
  
  return updatedTemplate;
};

// 清理旧的数据（可选使用）
export const cleanupLegacyData = (): void => {
  try {
    localStorage.removeItem(LEGACY_KEYS.PARAM_TEMPLATES);
    localStorage.removeItem(LEGACY_KEYS.METADATA);
    // 注意：不删除QUICK_TEMPLATES因为它与新key相同
  } catch (error) {
    console.error('Failed to cleanup legacy data:', error);
  }
}; 
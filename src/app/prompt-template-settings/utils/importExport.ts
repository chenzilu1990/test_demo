import { ExtendedPromptTemplate } from '../types';
import { loadUnifiedTemplates, addTemplate } from './dataMigration';
import { loadTags, saveTags } from './tagManager';

// 导出数据格式版本
const EXPORT_VERSION = '1.0.0';

// 导出数据结构
export interface ExportData {
  version: string;
  exportedAt: string;
  templates: ExtendedPromptTemplate[];
  tags: Array<{
    id: string;
    name: string;
    color: string;
    createdAt: string;
  }>;
  metadata: {
    totalTemplates: number;
    totalTags: number;
    source: string;
  };
}

// 导入结果
export interface ImportResult {
  success: boolean;
  message: string;
  importedTemplates: number;
  importedTags: number;
  skippedTemplates: number;
  errors: string[];
}

// 导入选项
export interface ImportOptions {
  overwriteExisting: boolean; // 是否覆盖已存在的模板
  importTags: boolean; // 是否导入标签
  preserveIds: boolean; // 是否保持原有ID
}

/**
 * 导出单个模板
 */
export function exportTemplate(template: ExtendedPromptTemplate): string {
  const exportData: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    templates: [template],
    tags: [],
    metadata: {
      totalTemplates: 1,
      totalTags: 0,
      source: 'single-template-export'
    }
  };

  // 如果模板有标签，导出相关标签
  if (template.tags && template.tags.length > 0) {
    const allTags = loadTags();
    const templateTags = allTags.filter(tag => template.tags!.includes(tag.id));
    exportData.tags = templateTags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt.toISOString()
    }));
    exportData.metadata.totalTags = templateTags.length;
  }

  return JSON.stringify(exportData, null, 2);
}

/**
 * 导出多个模板
 */
export function exportTemplates(templates: ExtendedPromptTemplate[]): string {
  const exportData: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    templates: templates,
    tags: [],
    metadata: {
      totalTemplates: templates.length,
      totalTags: 0,
      source: 'batch-template-export'
    }
  };

  // 收集所有模板使用的标签
  const usedTagIds = Array.from(new Set(
    templates.flatMap(template => template.tags || [])
  ));

  if (usedTagIds.length > 0) {
    const allTags = loadTags();
    const usedTags = allTags.filter(tag => usedTagIds.includes(tag.id));
    exportData.tags = usedTags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt.toISOString()
    }));
    exportData.metadata.totalTags = usedTags.length;
  }

  return JSON.stringify(exportData, null, 2);
}

/**
 * 导出所有模板
 */
export function exportAllTemplates(): string {
  const templates = loadUnifiedTemplates();
  const tags = loadTags();

  const exportData: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    templates: templates,
    tags: tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt.toISOString()
    })),
    metadata: {
      totalTemplates: templates.length,
      totalTags: tags.length,
      source: 'full-export'
    }
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * 验证导入数据格式
 */
export function validateImportData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查基本结构
  if (!data || typeof data !== 'object') {
    errors.push('导入数据格式错误：不是有效的JSON对象');
    return { valid: false, errors };
  }

  // 检查版本
  if (!data.version || typeof data.version !== 'string') {
    errors.push('缺少版本信息');
  }

  // 检查模板数组
  if (!Array.isArray(data.templates)) {
    errors.push('模板数据格式错误：templates应该是数组');
  } else {
    // 检查每个模板的基本字段
    data.templates.forEach((template: any, index: number) => {
      if (!template.id || typeof template.id !== 'string') {
        errors.push(`模板${index + 1}: 缺少有效的ID`);
      }
      if (!template.title || typeof template.title !== 'string') {
        errors.push(`模板${index + 1}: 缺少有效的标题`);
      }
      if (!template.prompt || typeof template.prompt !== 'string') {
        errors.push(`模板${index + 1}: 缺少有效的提示词内容`);
      }
    });
  }

  // 检查标签数组（可选）
  if (data.tags && !Array.isArray(data.tags)) {
    errors.push('标签数据格式错误：tags应该是数组');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 导入模板
 */
export function importTemplates(
  data: ExportData, 
  options: ImportOptions = {
    overwriteExisting: false,
    importTags: true,
    preserveIds: false
  }
): ImportResult {
  const result: ImportResult = {
    success: false,
    message: '',
    importedTemplates: 0,
    importedTags: 0,
    skippedTemplates: 0,
    errors: []
  };

  try {
    // 验证数据格式
    const validation = validateImportData(data);
    if (!validation.valid) {
      result.errors = validation.errors;
      result.message = '导入数据格式验证失败';
      return result;
    }

    const existingTemplates = loadUnifiedTemplates();
    const existingIds = new Set(existingTemplates.map(t => t.id));
    const existingTitles = new Set(existingTemplates.map(t => t.title));

    // 导入标签
    if (options.importTags && data.tags && data.tags.length > 0) {
      try {
        const existingTags = loadTags();
        const existingTagIds = new Set(existingTags.map(t => t.id));
        const existingTagNames = new Set(existingTags.map(t => t.name));

        const newTags = data.tags.filter(tag => {
          if (existingTagIds.has(tag.id) || existingTagNames.has(tag.name)) {
            return false; // 跳过已存在的标签
          }
          return true;
        }).map(tag => ({
          id: tag.id,
          name: tag.name,
          color: tag.color,
          createdAt: new Date(tag.createdAt)
        }));

        if (newTags.length > 0) {
          saveTags([...existingTags, ...newTags]);
          result.importedTags = newTags.length;
        }
      } catch (error) {
        result.errors.push(`导入标签失败: ${error}`);
      }
    }

    // 导入模板
    for (const templateData of data.templates) {
      try {
        let templateToImport = { ...templateData };

        // 处理ID冲突
        if (!options.preserveIds || existingIds.has(templateData.id)) {
          // 生成新ID
          templateToImport.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        }

        // 处理标题冲突
        if (existingTitles.has(templateData.title)) {
          if (!options.overwriteExisting) {
            // 跳过重复的模板
            result.skippedTemplates++;
            continue;
          }
          // 覆盖模式：添加时间戳后缀
          templateToImport.title = `${templateData.title} (导入于${new Date().toLocaleString()})`;
        }

        // 确保日期格式正确
        templateToImport.createdAt = new Date(templateData.createdAt);
        templateToImport.lastUsedAt = templateData.lastUsedAt ? new Date(templateData.lastUsedAt) : undefined;

        // 添加模板
        addTemplate(templateToImport);
        result.importedTemplates++;

      } catch (error) {
        result.errors.push(`导入模板 "${templateData.title}" 失败: ${error}`);
      }
    }

    // 设置结果
    result.success = result.importedTemplates > 0 || result.importedTags > 0;
    
    if (result.success) {
      const parts = [];
      if (result.importedTemplates > 0) {
        parts.push(`${result.importedTemplates}个模板`);
      }
      if (result.importedTags > 0) {
        parts.push(`${result.importedTags}个标签`);
      }
      result.message = `成功导入${parts.join('和')}`;
      
      if (result.skippedTemplates > 0) {
        result.message += `，跳过${result.skippedTemplates}个重复模板`;
      }
    } else {
      result.message = '没有导入任何数据';
    }

  } catch (error) {
    result.errors.push(`导入过程中发生错误: ${error}`);
    result.message = '导入失败';
  }

  return result;
}

/**
 * 下载文件
 */
export function downloadFile(content: string, filename: string, contentType: string = 'application/json') {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * 读取文件内容
 */
export function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('文件读取失败：内容格式错误'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsText(file, 'UTF-8');
  });
} 
    import { TemplateTag, TAGS_STORAGE_KEY, TAG_COLORS, generateTagId } from '../types';

/**
 * 标签管理工具类
 */

// 从localStorage加载所有标签
export const loadTags = (): TemplateTag[] => {
  try {
    const saved = localStorage.getItem(TAGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        console.log(parsed);
        return parsed.map(tag => ({
          ...tag,
          createdAt: new Date(tag.createdAt)
        }));
      }
    }
    return [];
  } catch (error) {
    console.error('Failed to load tags:', error);
    return [];
  }
};

// 保存标签到localStorage
export const saveTags = (tags: TemplateTag[]): void => {
  try {
    const serializedTags = tags.map(tag => ({
      ...tag,
      createdAt: tag.createdAt.toISOString()
    }));
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(serializedTags));
  } catch (error) {
    console.error('Failed to save tags:', error);
    throw error;
  }
};

// 创建新标签
export const createTag = (name: string, color?: string): TemplateTag => {
  const existingTags = loadTags();
  
  // 检查标签名是否已存在
  if (existingTags.some(tag => tag.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('标签名称已存在');
  }

  // 选择颜色（如果未指定则自动选择）
  const selectedColor = color || TAG_COLORS[existingTags.length % TAG_COLORS.length];

  const newTag: TemplateTag = {
    id: generateTagId(),
    name: name.trim(),
    color: selectedColor,
    createdAt: new Date()
  };

  const updatedTags = [...existingTags, newTag];
  saveTags(updatedTags);
  
  return newTag;
};

// 更新标签
export const updateTag = (tagId: string, updates: Partial<Pick<TemplateTag, 'name' | 'color'>>): TemplateTag | null => {
  const existingTags = loadTags();
  const tagIndex = existingTags.findIndex(tag => tag.id === tagId);
  
  if (tagIndex === -1) {
    return null;
  }

  // 如果更新名称，检查是否与其他标签重复
  if (updates.name) {
    const nameExists = existingTags.some((tag, index) => 
      index !== tagIndex && tag.name.toLowerCase() === updates.name!.toLowerCase()
    );
    if (nameExists) {
      throw new Error('标签名称已存在');
    }
  }

  const updatedTag = {
    ...existingTags[tagIndex],
    ...updates
  };

  existingTags[tagIndex] = updatedTag;
  saveTags(existingTags);
  
  return updatedTag;
};

// 删除标签
export const deleteTag = (tagId: string): boolean => {
  const existingTags = loadTags();
  const filteredTags = existingTags.filter(tag => tag.id !== tagId);
  
  if (filteredTags.length === existingTags.length) {
    return false; // 标签不存在
  }

  saveTags(filteredTags);
  return true;
};

// 根据ID获取标签
export const getTagById = (tagId: string): TemplateTag | undefined => {
  const tags = loadTags();
  return tags.find(tag => tag.id === tagId);
};

// 根据ID列表获取标签
export const getTagsByIds = (tagIds: string[]): TemplateTag[] => {
  const tags = loadTags();
  return tagIds.map(id => tags.find(tag => tag.id === id)).filter(Boolean) as TemplateTag[];
};

// 搜索标签
export const searchTags = (query: string): TemplateTag[] => {
  const tags = loadTags();
  const lowerQuery = query.toLowerCase();
  return tags.filter(tag => tag.name.toLowerCase().includes(lowerQuery));
};

// 获取下一个可用颜色
export const getNextAvailableColor = (): string => {
  const existingTags = loadTags();
  const usedColors = existingTags.map(tag => tag.color);
  
  // 找到第一个未使用的颜色
  for (const color of TAG_COLORS) {
    if (!usedColors.includes(color)) {
      return color;
    }
  }
  
  // 如果所有颜色都被使用，返回第一个颜色
  return TAG_COLORS[0];
};

// 创建一些默认标签（可选）
export const createDefaultTags = (): void => {
  const existingTags = loadTags();
  
  if (existingTags.length === 0) {
    const defaultTags = [
      { name: '工作', color: TAG_COLORS[0] }, // gray-500
      { name: '学习', color: TAG_COLORS[1] }, // gray-600
      { name: '创作', color: TAG_COLORS[2] }, // gray-700
      { name: '分析', color: TAG_COLORS[3] }, // gray-800
      { name: '日常', color: TAG_COLORS[4] }, // gray-400
      { name: '思考', color: TAG_COLORS[5] }, // slate-500
    ];

    defaultTags.forEach(({ name, color }) => {
      try {
        createTag(name, color);
      } catch (error) {
        // 忽略重复标签错误
        console.warn(`Failed to create default tag "${name}":`, error);
      }
    });
  }
}; 
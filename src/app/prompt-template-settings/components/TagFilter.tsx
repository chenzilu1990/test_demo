import React, { useState, useEffect } from 'react';
import { TemplateTag } from '../types';
import { loadTags, getTagsByIds } from '../utils/tagManager';

interface TagFilterProps {
  selectedTagIds: string[];
  onTagSelect: (tagIds: string[]) => void;
  templateTags: string[]; // 所有模板中使用的标签ID
}

export default function TagFilter({
  selectedTagIds,
  onTagSelect,
  templateTags
}: TagFilterProps) {
  const [allTags, setAllTags] = useState<TemplateTag[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // 加载所有标签
  useEffect(() => {
    const tags = loadTags();
    setAllTags(tags);
  }, []);

  // 获取在模板中实际使用的标签
  const usedTags = allTags.filter(tag => templateTags.includes(tag.id));

  // 显示的标签（收起时显示前5个，展开时显示全部）
  const displayTags = isExpanded ? usedTags : usedTags.slice(0, 10);
  const hasMoreTags = usedTags.length > 10;

  if (usedTags.length === 0) {
    return null; // 如果没有使用的标签，不显示筛选器
  }

    // 处理标签选择
  const handleTagToggle = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      // 如果已选中，则移除
      onTagSelect(selectedTagIds.filter(id => id !== tagId));
    } else {
      // 如果未选中，则添加
      onTagSelect([...selectedTagIds, tagId]);
    }
  };

  // 清除所有选择
  const handleClearAll = () => {
    onTagSelect([]);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">

        
        {/* 全部按钮 */}
        <button
          onClick={handleClearAll}
          className={`
            inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium
            transition-all duration-200 border-2
            ${selectedTagIds.length === 0
              ? 'bg-blue-500 text-white border-blue-500 shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }
          `}
        >
          全部
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {displayTags.map(tag => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => handleTagToggle(tag.id)}
              className={`
                inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                transition-all duration-200 border-2 transform hover:scale-105
                ${isSelected
                  ? 'bg-blue-500 text-white border-blue-500 shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md'
                }
              `}
              title={isSelected ? `取消筛选 ${tag.name}` : `筛选 ${tag.name} 标签的模板`}
            >

              <span className="whitespace-nowrap">{tag.name}</span>
              {/* {isSelected && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )} */}
            </button>
          );
        })}

        {/* 展开/收起按钮 */}
        {hasMoreTags && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
          >
            {isExpanded ? (
              <>
                <span>收起</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </>
            ) : (
              <>
                <span>+{usedTags.length - 5}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>

    </div>
  );
} 
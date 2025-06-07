import React from 'react';
import { TemplateTag } from '../types';

interface TagDisplayProps {
  tags: TemplateTag[];
  maxDisplay?: number; // 最多显示多少个标签
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean; // 是否可交互（点击删除等）
  onTagClick?: (tag: TemplateTag) => void;
  onTagRemove?: (tagId: string) => void;
}

export default function TagDisplay({
  tags,
  maxDisplay = 3,
  size = 'sm',
  interactive = false,
  onTagClick,
  onTagRemove
}: TagDisplayProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  const displayTags = tags.slice(0, maxDisplay);
  const hiddenCount = tags.length - maxDisplay;

  const getSizeClasses = () => {
    switch (size) {
      case 'lg':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-2 py-1 text-xs';
      case 'sm':
      default:
        return 'px-1.5 py-0.5 text-xs';
    }
  };

  const handleTagClick = (tag: TemplateTag) => {
    if (onTagClick) {
      onTagClick(tag);
    }
  };

  const handleTagRemove = (e: React.MouseEvent, tagId: string) => {
    e.stopPropagation();
    if (onTagRemove) {
      onTagRemove(tagId);
    }
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {displayTags.map(tag => (
        <span
          key={tag.id}
          onClick={() => handleTagClick(tag)}
          className={`
            inline-flex items-center gap-1 rounded-full font-medium
            ${getSizeClasses()}
            ${interactive ? 'cursor-pointer hover:opacity-80' : ''}
          `}
          style={{ 
            backgroundColor: `${tag.color}20`, 
            color: tag.color,
            border: `1px solid ${tag.color}40`
          }}
          title={tag.name}
        >
          <span className="truncate max-w-20">{tag.name}</span>
          {interactive && onTagRemove && (
            <button
              onClick={(e) => handleTagRemove(e, tag.id)}
              className="ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
              title={`移除标签 ${tag.name}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </span>
      ))}
      
      {hiddenCount > 0 && (
        <span className={`
          inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 
          text-gray-600 dark:text-gray-400 font-medium
          ${getSizeClasses()}
        `}>
          +{hiddenCount}
        </span>
      )}
    </div>
  );
} 
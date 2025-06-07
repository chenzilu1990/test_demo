import React, { useState, useRef, useEffect } from 'react';
import { TemplateTag } from '../types';
import { loadTags, createTag, getNextAvailableColor } from '../utils/tagManager';
import TagDisplay from './TagDisplay';

interface TagSelectorProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  disabled?: boolean;
}

export default function TagSelector({
  selectedTagIds,
  onTagsChange,
  disabled = false
}: TagSelectorProps) {
  const [allTags, setAllTags] = useState<TemplateTag[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 加载所有标签
  useEffect(() => {
    const tags = loadTags();
    setAllTags(tags);
  }, []);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setSearchQuery('');
        setNewTagName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 获取已选中的标签
  const selectedTags = allTags.filter(tag => selectedTagIds.includes(tag.id));

  // 获取可选择的标签（排除已选中的）
  const availableTags = allTags.filter(tag => 
    !selectedTagIds.includes(tag.id) &&
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 添加标签
  const handleAddTag = (tagId: string) => {
    if (!selectedTagIds.includes(tagId)) {
      onTagsChange([...selectedTagIds, tagId]);
    }
    setSearchQuery('');
  };

  // 移除标签
  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTagIds.filter(id => id !== tagId));
  };

  // 创建新标签
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const newTag = createTag(newTagName.trim(), getNextAvailableColor());
      setAllTags(prev => [...prev, newTag]);
      handleAddTag(newTag.id);
      setNewTagName('');
      setIsCreating(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : '创建标签失败');
    }
  };

  // 处理搜索输入
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setIsCreating(false);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isCreating && newTagName.trim()) {
        handleCreateTag();
      } else if (availableTags.length === 1) {
        handleAddTag(availableTags[0].id);
      } else if (searchQuery.trim() && availableTags.length === 0) {
        setIsCreating(true);
        setNewTagName(searchQuery.trim());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setIsCreating(false);
      setSearchQuery('');
      setNewTagName('');
    }
  };

  // 当打开下拉菜单时聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 标签显示区域 */}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          min-h-[42px] p-2 border rounded-lg cursor-pointer transition-colors
          ${disabled 
            ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' 
            : 'bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20' : 'border-gray-300 dark:border-gray-600'}
        `}
      >
        <div className="flex items-center flex-wrap gap-1">
          {selectedTags.length > 0 ? (
            <TagDisplay
              tags={selectedTags}
              maxDisplay={10}
              size="md"
              interactive={!disabled}
              onTagRemove={handleRemoveTag}
            />
          ) : (
            <span className="text-gray-400 text-sm">点击选择标签...</span>
          )}
        </div>
      </div>

      {/* 下拉菜单 */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
          {/* 搜索输入 */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              ref={inputRef}
              type="text"
              placeholder="搜索或创建标签..."
              value={isCreating ? newTagName : searchQuery}
              onChange={(e) => {
                if (isCreating) {
                  setNewTagName(e.target.value);
                } else {
                  handleSearchChange(e.target.value);
                }
              }}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* 标签列表 */}
          <div className="max-h-40 overflow-y-auto">
            {isCreating ? (
              <div className="p-2">
                <div className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                  <span className="text-sm">创建标签: "{newTagName}"</span>
                  <div className="flex gap-1">
                    <button
                      onClick={handleCreateTag}
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      创建
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setNewTagName('');
                      }}
                      className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {availableTags.map(tag => (
                  <div
                    key={tag.id}
                    onClick={() => handleAddTag(tag.id)}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm">{tag.name}</span>
                  </div>
                ))}
                
                {availableTags.length === 0 && searchQuery && (
                  <div className="p-2 text-center">
                    <button
                      onClick={() => {
                        setIsCreating(true);
                        setNewTagName(searchQuery);
                      }}
                      className="text-sm text-blue-500 hover:text-blue-600"
                    >
                      创建标签 "{searchQuery}"
                    </button>
                  </div>
                )}
                
                {availableTags.length === 0 && !searchQuery && (
                  <div className="p-2 text-center text-gray-500 text-sm">
                    暂无可选标签
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
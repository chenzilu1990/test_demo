import React from 'react';
import { PromptTemplate } from '@/components/prompt-editor/types';
import { ExtendedPromptTemplate } from '../types';
import TagDisplay from './TagDisplay';
import EmptyState from './EmptyState';
import { getTagsByIds } from '../utils/tagManager';

interface TemplateListProps {
  templates: ExtendedPromptTemplate[];
  selectedTemplate: ExtendedPromptTemplate | null;
  onTemplateSelect: (template: ExtendedPromptTemplate) => void;
  searchQuery: string;
  isLoading?: boolean;
  onDeleteTemplate?: (index: number) => void;
}

export default function TemplateList({
  templates,
  selectedTemplate,
  onTemplateSelect,
  searchQuery,
  isLoading = false,
  onDeleteTemplate
}: TemplateListProps) {
  // 加载状态
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {[...Array(10)].map((_, index) => (
          <div key={index} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  // 使用传入的已筛选模板
  const filteredTemplates = templates;

  if (filteredTemplates.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">
          {searchQuery ? '未找到匹配的模板' : '暂无模板'}
        </p>
        <p className="text-xs mt-1">
          {searchQuery ? '尝试调整搜索条件' : '点击右上角新建按钮创建第一个模板'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {filteredTemplates.map((template, index) => {
        const isParametrized = template.parameterOptions && Object.keys(template.parameterOptions).length > 0;
        const isSelected = selectedTemplate?.id === template.id;

        return (
          <div
            key={template.id || index}
            onClick={() => onTemplateSelect(template)}
            className={`group relative p-5 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg
              ${isSelected 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500 ring-opacity-20 shadow-lg' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
              }
              min-h-[240px] flex flex-col
            `}
          >
            {/* 模板头部 */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight line-clamp-2 flex-1">
                  {template.title || '未命名模板'}
                </h3>
                
                {/* 类型标识 */}
                <div className="flex-shrink-0 ml-2">
                  {isParametrized ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs">
                      <span>📋</span>
                      <span>参数</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs">
                      <span>📝</span>
                      <span>文本</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 内容预览 */}
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3 leading-relaxed">
                {template.prompt.length > 120 
                  ? template.prompt.substring(0, 120) + '...'
                  : template.prompt}
              </p>

              {/* 标签信息 */}
              {template.tags && template.tags.length > 0 && (
                <div className="mb-3">
                  <TagDisplay
                    tags={getTagsByIds(template.tags)}
                    maxDisplay={5}
                    size="sm"
                  />
                </div>
              )}


            </div>

            {/* 模板底部信息 */}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {template.usageCount || 0} 次
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {template.createdAt.toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            </div>

            {/* 悬停操作按钮 */}
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onDeleteTemplate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTemplate(index);
                  }}
                  className="p-2 bg-white dark:bg-gray-800 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-lg shadow-sm border border-gray-200 dark:border-gray-600"
                  title="删除模板"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
} 
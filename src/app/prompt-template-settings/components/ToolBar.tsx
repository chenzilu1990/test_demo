import React from 'react';
import { SortConfig } from '../types';
import TagFilter from './TagFilter';
import SortControls from './SortControls';
import SearchHistory from './SearchHistory';

interface ToolBarProps {
  // 搜索相关
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  searchHistory: string[];
  onSelectSearchHistory: (query: string) => void;
  onClearSearchHistory: () => void;
  
  // 标签筛选相关
  selectedTagFilter: string[];
  onTagFilterChange: (tagIds: string[]) => void;
  templateTags: string[];
  
  // 排序相关
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
  
  // 操作相关
  onCreateNew: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  
  // 统计信息
  templateCount: number;
  filteredCount: number;
}

export default function ToolBar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  searchHistory,
  onSelectSearchHistory,
  onClearSearchHistory,
  selectedTagFilter,
  onTagFilterChange,
  templateTags,
  sortConfig,
  onSortChange,
  onCreateNew,
  onRefresh,
  isLoading,
  templateCount,
  filteredCount
}: ToolBarProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="px-6 py-4">
        {/* 主工具栏 */}
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* 左侧：搜索区域 */}
          <div className="flex-1 max-w-md">
            <form onSubmit={onSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="🔍 搜索模板标题或内容..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-12 pr-12 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg"
              />
              <svg 
                className="absolute left-4 top-3.5 h-6 w-6 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              
              {/* 搜索历史 */}
              <div className="absolute right-3 top-2.5">
                <SearchHistory
                  history={searchHistory}
                  onSelectHistory={onSelectSearchHistory}
                  onClearHistory={onClearSearchHistory}
                />
              </div>
            </form>
          </div>

          {/* 中间：统计信息 */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
                             <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                 {selectedTagFilter.length > 0 || searchQuery ? (
                   <>显示 <span className="text-blue-600 dark:text-blue-400">{filteredCount}</span> / {templateCount} 个模板</>
                 ) : (
                   <>共 <span className="text-blue-600 dark:text-blue-400">{templateCount}</span> 个模板</>
                 )}
               </span>
            </div>
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-3">
            {/* 刷新按钮 */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 disabled:opacity-50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md transform hover:scale-105"
              title="刷新模板列表"
            >
              <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* 新建模板按钮 */}
            <button
              onClick={onCreateNew}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="hidden sm:inline">新建模板</span>
            </button>
          </div>
        </div>

        {/* 筛选和排序区域 */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
          <div className="flex flex-col xl:flex-row xl:items-center gap-4">
            {/* 标签筛选 */}
            <div className="flex-1 min-w-0">
                          <TagFilter
              selectedTagIds={selectedTagFilter}
              onTagSelect={onTagFilterChange}
              templateTags={templateTags}
            />
            </div>

            {/* 分隔线 */}
            <div className="hidden xl:block w-px h-8 bg-gray-300 dark:bg-gray-600"></div>

            {/* 排序控制 */}
            <div className="flex-shrink-0">
              <SortControls
                sortConfig={sortConfig}
                onSortChange={onSortChange}
              />
            </div>
          </div>
        </div>

        {/* 活跃筛选条件显示 */}
        {(selectedTagFilter.length > 0 || searchQuery) && (
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
                                 <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                   筛选中: 显示 {filteredCount} / {templateCount} 个模板
                 </span>
               </div>
               
               <div className="flex items-center gap-2">
                 {searchQuery && (
                   <span className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 rounded-md text-xs border border-blue-200 dark:border-blue-600">
                     🔍 "{searchQuery}"
                   </span>
                 )}
                 {selectedTagFilter.length > 0 && (
                   <span className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 rounded-md text-xs border border-blue-200 dark:border-blue-600">
                     🏷️ {selectedTagFilter.length}个标签
                   </span>
                 )}
               </div>
            </div>
            
            <button
              onClick={() => {
                onSearchChange('');
                onTagFilterChange([]);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              清除全部
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
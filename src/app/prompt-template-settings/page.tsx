"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PromptTemplate } from '@/components/prompt-editor/types';
import TemplateList from './components/TemplateList';
import EmptyState from './components/EmptyState';
import TemplateEditor from './components/TemplateEditor';
import SortControls from './components/SortControls';
import SearchHistory from './components/SearchHistory';
import { ExtendedPromptTemplate, SortConfig, isParameterizedTemplate } from './types';
import { 
  loadUnifiedTemplates, 
  addTemplate, 
  updateTemplate, 
  deleteTemplate as deleteTemplateById, 
  updateTemplateUsage 
} from './utils/dataMigration';
import TagDisplay from './components/TagDisplay';
import TagFilter from './components/TagFilter';
import ToolBar from './components/ToolBar';
import { ImportModal, ExportModal } from './components/ImportExportModal';
import { UrlImportModal } from './components/UrlImportModal';
import { getTagsByIds } from './utils/tagManager';
import { exportAllTemplates, downloadFile, ImportResult } from './utils/importExport';

export default function PromptTemplateSettingsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<ExtendedPromptTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ExtendedPromptTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // 移除模板类型分类，统一管理所有模板
  const [templates, setTemplates] = useState<ExtendedPromptTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'lastUsedAt' });
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string[]>([]); // 标签筛选状态
  
  // 导入/导出状态
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showUrlImportModal, setShowUrlImportModal] = useState(false);

  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // 从统一数据源加载模板数据
  const loadTemplates = () => {
    try {
      const allTemplates = loadUnifiedTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 加载搜索历史
  const loadSearchHistory = () => {
    try {
      const saved = localStorage.getItem('template-search-history');
      if (saved) {
        const parsed = JSON.parse(saved);
        // 确保加载的是字符串数组，如果是对象数组则提取query字段
        if (Array.isArray(parsed)) {
          const stringHistory = parsed.map(item => 
            typeof item === 'string' ? item : (item.query || item.toString())
          ).filter(Boolean);
          setSearchHistory(stringHistory);
        }
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
      setSearchHistory([]);
    }
  };

  // 保存搜索历史
  const saveSearchHistory = (history: string[]) => {
    try {
      // 确保保存的是字符串数组
      const stringHistory = history.filter(item => typeof item === 'string' && item.trim());
      localStorage.setItem('template-search-history', JSON.stringify(stringHistory));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  // 添加搜索历史
  const addToSearchHistory = (query: string) => {
    if (!query || typeof query !== 'string' || !query.trim()) return;
    
    const trimmedQuery = query.trim();
    // 确保搜索历史中的所有项都是字符串
    const validHistory = searchHistory.filter(item => 
      typeof item === 'string' && item !== trimmedQuery
    );
    const newHistory = [trimmedQuery, ...validHistory].slice(0, 10);
    setSearchHistory(newHistory);
    saveSearchHistory(newHistory);
  };

  // 排序模板 - 统一使用降序
  const sortTemplates = (templates: ExtendedPromptTemplate[], config: SortConfig): ExtendedPromptTemplate[] => {
    return [...templates].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (config.field) {
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'usageCount':
          aValue = a.usageCount;
          bValue = b.usageCount;
          break;
        case 'lastUsedAt':
          aValue = a.lastUsedAt?.getTime() || 0;
          bValue = b.lastUsedAt?.getTime() || 0;
          break;
        default:
          return 0;
      }
      
      // 统一使用降序排序
      if (aValue < bValue) return 1;
      if (aValue > bValue) return -1;
      return 0;
    });
  };

  // 获取所有模板中使用的标签ID（用于标签筛选器）
  const allUsedTagIds = Array.from(new Set(
    templates.flatMap(template => template.tags || [])
  ));

  // 筛选模板（搜索 + 标签筛选）
  const filteredTemplates = templates.filter(template => {
    // 搜索筛选
    const matchesSearch = !searchQuery || 
      (template.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.prompt || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // 标签筛选（AND逻辑：模板必须包含所有选中的标签）
    const matchesTag = selectedTagFilter.length === 0 || 
      (template.tags && selectedTagFilter.every(tagId => template.tags!.includes(tagId)));
    
    return matchesSearch && matchesTag;
  });

  // 获取已排序的模板
  const sortedTemplates = sortTemplates(filteredTemplates, sortConfig);

  // 清理搜索历史数据（移除可能的错误格式）
  const cleanupSearchHistory = () => {
    try {
      const saved = localStorage.getItem('template-search-history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const stringHistory = parsed
            .map(item => typeof item === 'string' ? item : (item?.query || ''))
            .filter(item => typeof item === 'string' && item.trim())
            .slice(0, 10);
          
          if (stringHistory.length !== parsed.length) {
            // 如果数据被清理了，重新保存
            localStorage.setItem('template-search-history', JSON.stringify(stringHistory));
          }
        } else {
          // 如果不是数组，清空
          localStorage.removeItem('template-search-history');
        }
      }
    } catch (error) {
      console.error('Failed to cleanup search history:', error);
      localStorage.removeItem('template-search-history');
    }
  };

  // 页面加载时清理数据并加载模板和搜索历史
  useEffect(() => {
    cleanupSearchHistory();
    loadTemplates();
    loadSearchHistory();
  }, []);

  // 删除模板
  const handleDeleteTemplate = (index: number) => {
    if (confirm('确定要删除这个模板吗？')) {
      const templateToDelete = templates[index];
      
      try {
        const success = deleteTemplateById(templateToDelete.id);
        
        if (success) {
          // 重新加载模板列表
          loadTemplates();
          
          // 如果删除的是当前选中的模板，清除选中状态
          if (selectedTemplate?.id === templateToDelete.id) {
            setSelectedTemplate(null);
          }
        } else {
          alert('删除模板失败，模板未找到');
        }
      } catch (error) {
        console.error('Failed to delete template:', error);
        alert('删除模板失败，请重试');
      }
    }
  };

  // 更新模板元数据（现在由统一数据管理工具处理）
  // 这个函数已经不再需要，因为统一数据工具会处理元数据

  // 保存模板
  const handleSaveTemplate = (templateToSave: PromptTemplate) => {
    try {
      if (isCreating) {
        // 创建新模板
        const newTemplate = addTemplate(templateToSave);
        
        // 重新加载模板列表
        loadTemplates();
        
        // 选中新创建的模板
        setTimeout(() => {
          const createdTemplate = templates.find(t => t.id === newTemplate.id);
          if (createdTemplate) {
            setSelectedTemplate(createdTemplate);
          }
        }, 100);
        
        alert('模板创建成功！');
      } else if (isEditing && editingTemplate) {
        // 编辑现有模板
        const updatedTemplate = updateTemplate(editingTemplate.id, templateToSave);
        
        if (updatedTemplate) {
          // 重新加载模板列表
          loadTemplates();
          
          // 选中更新后的模板
          setTimeout(() => {
            const updated = templates.find(t => t.id === updatedTemplate.id);
            if (updated) {
              setSelectedTemplate(updated);
            }
          }, 100);
          
          alert('模板更新成功！');
        } else {
          alert('模板更新失败，模板未找到');
        }
      }

      // 重置状态
      setIsCreating(false);
      setIsEditing(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Save template error:', error);
      alert('保存模板失败，请重试');
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsCreating(false);
    setIsEditing(false);
    setEditingTemplate(null);
  };

  // 跟踪模板使用
  const trackTemplateUsage = (template: ExtendedPromptTemplate) => {
    try {
      updateTemplateUsage(template.id);
      
      // 重新加载模板列表以更新统计
      setTimeout(() => {
        loadTemplates();
      }, 100);
    } catch (error) {
      console.error('Failed to track template usage:', error);
    }
  };

  // 处理模板选择（包含使用跟踪）
  const handleTemplateSelect = (template: ExtendedPromptTemplate) => {
    setSelectedTemplate(template);
    trackTemplateUsage(template);
  };

  // 开始编辑模板
  const handleEditTemplate = (template: ExtendedPromptTemplate) => {
    setEditingTemplate(template);
    setIsEditing(true);
    setSelectedTemplate(null);
  };

  // 开始创建新模板
  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingTemplate(null);
    setSelectedTemplate(null);
  };

  // 处理搜索提交
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addToSearchHistory(searchQuery.trim());
    }
  };

  // 处理搜索历史选择
  const handleSelectSearchHistory = (query: string) => {
    setSearchQuery(query);
  };

  // 清空搜索历史
  const handleClearSearchHistory = () => {
    setSearchHistory([]);
    saveSearchHistory([]);
  };

  // 处理导出全部模板
  const handleExportAll = () => {
    setShowExportModal(true);
  };

  // 处理导入模板
  const handleImport = () => {
    setShowImportModal(true);
  };

  const handleImportFromUrl = () => {
    setShowUrlImportModal(true);
  };

  // 执行导出操作
  const executeExport = () => {
    try {
      const exportData = exportAllTemplates();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `prompt-templates-export-${timestamp}.json`;
      downloadFile(exportData, filename);
      alert(`成功导出 ${templates.length} 个模板！`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    }
  };

  // 处理导入完成
  const handleImportComplete = (result: ImportResult) => {
    if (result.success) {
      // 重新加载模板列表
      loadTemplates();
      
      // 显示导入结果
      let message = result.message;
      if (result.errors.length > 0) {
        message += '\n\n错误详情:\n' + result.errors.join('\n');
      }
      alert(message);
    } else {
      // 显示错误信息
      const errorMessage = result.message + '\n\n错误详情:\n' + result.errors.join('\n');
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 页面头部 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/ai-providers-chat" 
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
 
            </div>
          </div>
        </div>
      </div>

      {/* 工具栏 */}
      <ToolBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        searchHistory={searchHistory}
        onSelectSearchHistory={handleSelectSearchHistory}
        onClearSearchHistory={handleClearSearchHistory}
        selectedTagFilter={selectedTagFilter}
        onTagFilterChange={setSelectedTagFilter}
        templateTags={allUsedTagIds}
        sortConfig={sortConfig}
        onSortChange={setSortConfig}
        onCreateNew={handleCreateNew}
        onRefresh={loadTemplates}
        isLoading={isLoading}
        onExportAll={handleExportAll}
        onImport={handleImport}
        onImportFromUrl={handleImportFromUrl}
        templateCount={templates.length}
        filteredCount={sortedTemplates.length}
      />

      {/* 主内容区域 */}
      <div className="px-6 py-6">
        {(isCreating || isEditing) ? (
          // 编辑模式 - 全屏编辑器
          <div className="max-w-4xl mx-auto">
            <TemplateEditor
              template={editingTemplate}
              isCreating={isCreating}
              onSave={handleSaveTemplate}
              onCancel={handleCancelEdit}
            />
          </div>
        ) : (
          // 正常模式 - 网格展示
          <TemplateList
            templates={sortedTemplates}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
            searchQuery={searchQuery}
            isLoading={isLoading}
            onDeleteTemplate={handleDeleteTemplate}
          />
        )}
      </div>

      {/* 模板详情模态框 - 当有选中模板且不在编辑模式时显示 */}
      {selectedTemplate && !isCreating && !isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">模板详情</h2>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="关闭详情"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 模板基本信息 */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">{selectedTemplate.title}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">
                    📝 提示词模板
                  </span>
                  {selectedTemplate.parameterOptions && Object.keys(selectedTemplate.parameterOptions).length > 0 && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-sm">
                      📋 包含参数
                    </span>
                  )}
                </div>
                
                {/* 标签显示 */}
                {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">标签</h4>
                    <TagDisplay
                      tags={getTagsByIds(selectedTemplate.tags)}
                      maxDisplay={10}
                      size="md"
                    />
                  </div>
                )}
              </div>

              {/* 模板内容 */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">模板内容</h4>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {selectedTemplate.prompt}
                  </pre>
                </div>
              </div>

              {/* 参数列表 */}
              {selectedTemplate.parameterOptions && Object.keys(selectedTemplate.parameterOptions).length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-2">参数列表</h4>
                  <div className="space-y-3">
                    {Object.entries(selectedTemplate.parameterOptions).map(([param, options]) => (
                      <div key={param} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="font-medium text-sm mb-2">{param}</div>
                        <div className="flex flex-wrap gap-1">
                          {options.map((option, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs"
                            >
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => handleEditTemplate(selectedTemplate)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  编辑模板
                </button>

                <button
                  onClick={() => {
                    const templateIndex = templates.findIndex(t => t.id === selectedTemplate.id);
                    if (templateIndex !== -1) {
                      handleDeleteTemplate(templateIndex);
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  删除模板
                </button>
              </div>

              {/* 使用统计 */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium mb-3">使用统计</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedTemplate.usageCount || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">使用次数</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedTemplate.createdAt.toLocaleDateString('zh-CN')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">创建日期</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedTemplate.lastUsedAt ? selectedTemplate.lastUsedAt.toLocaleDateString('zh-CN') : '未使用'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">最后使用</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 导入模态框 */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={handleImportComplete}
      />

      {/* 从URL导入模态框 */}
      <UrlImportModal
        isOpen={showUrlImportModal}
        onClose={() => setShowUrlImportModal(false)}
        onImportComplete={handleImportComplete}
      />

      {/* 导出模态框 */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={executeExport}
        templateCount={templates.length}
      />
    </div>
  );
} 
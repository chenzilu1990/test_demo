import React, { useState, useRef } from 'react';
import { ExportData, ImportResult, ImportOptions, importTemplates, readFileContent } from '../utils/importExport';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (result: ImportResult) => void;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  templateCount: number;
}

// 导入模态框
export function ImportModal({ isOpen, onClose, onImportComplete }: ImportModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    overwriteExisting: false,
    importTags: true,
    preserveIds: false
  });
  const [importPreview, setImportPreview] = useState<ExportData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      alert('请选择JSON格式的文件');
      return;
    }

    setIsProcessing(true);
    try {
      const content = await readFileContent(file);
      const data = JSON.parse(content);
      setImportPreview(data);
    } catch (error) {
      alert(`文件读取失败: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleImport = () => {
    if (!importPreview) return;

    setIsProcessing(true);
    try {
      const result = importTemplates(importPreview, importOptions);
      onImportComplete(result);
      handleClose();
    } catch (error) {
      alert(`导入失败: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setImportPreview(null);
    setIsDragging(false);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              导入模板
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!importPreview ? (
            // 文件选择区域
            <div>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      拖拽文件到此处或点击选择
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      支持 JSON 格式的模板导出文件
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? '读取中...' : '选择文件'}
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
              />

              {/* 导入选项 */}
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">导入选项</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={importOptions.overwriteExisting}
                      onChange={(e) => setImportOptions(prev => ({
                        ...prev,
                        overwriteExisting: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">覆盖重复模板</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        当存在同名模板时，覆盖现有模板而不是跳过
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={importOptions.importTags}
                      onChange={(e) => setImportOptions(prev => ({
                        ...prev,
                        importTags: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">导入标签</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        同时导入模板相关的标签数据
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={importOptions.preserveIds}
                      onChange={(e) => setImportOptions(prev => ({
                        ...prev,
                        preserveIds: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">保持原始ID</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        保持模板的原始ID（可能导致ID冲突）
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            // 导入预览区域
            <div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">文件解析成功</span>
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  版本: {importPreview.version} | 
                  导出时间: {new Date(importPreview.exportedAt).toLocaleString()}
                </div>
              </div>

              {/* 预览内容 */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {importPreview.templates.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">个模板</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {importPreview.tags.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">个标签</div>
                  </div>
                </div>

                {/* 模板列表预览 */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">模板预览</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {importPreview.templates.slice(0, 5).map((template, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="font-medium text-sm">{template.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {template.prompt?.substring(0, 100)}...
                        </div>
                      </div>
                    ))}
                    {importPreview.templates.length > 5 && (
                      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                        还有 {importPreview.templates.length - 5} 个模板...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setImportPreview(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  重新选择
                </button>
                <button
                  onClick={handleImport}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      导入中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      开始导入
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 导出确认模态框
export function ExportModal({ isOpen, onClose, onExport, templateCount }: ExportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
        <div className="p-6">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              导出模板
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 内容 */}
          <div className="mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">导出信息</span>
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">
                即将导出 <span className="font-bold">{templateCount}</span> 个模板及其相关标签数据
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>导出内容包括：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>所有模板的完整数据</li>
                <li>使用的标签信息</li>
                <li>使用统计和元数据</li>
                <li>创建时间和最后使用时间</li>
              </ul>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => {
                onExport();
                onClose();
              }}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              确认导出
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
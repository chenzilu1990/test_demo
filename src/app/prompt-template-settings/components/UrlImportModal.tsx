"use client";

import { useState } from 'react';
import { addTemplate } from '../utils/dataMigration'; // 引入添加模板的函数
import { ImportResult } from '../utils/importExport';

interface UrlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (result: ImportResult) => void;
}

interface ParsedPrompt {
  title: string;
  prompt: string;
  parameterOptions?: { [key: string]: string[] };
}

export function UrlImportModal({ isOpen, onClose, onImportComplete }: UrlImportModalProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<{ sourceTitle: string, prompts: ParsedPrompt[] } | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const resetState = () => {
    setUrl('');
    setIsLoading(false);
    setError(null);
    setParsedData(null);
    setSelectedIndices([]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFetchUrl = async () => {
    if (!url) {
      setError('请输入URL');
      return;
    }
    setIsLoading(true);
    setError(null);
    setParsedData(null);

    try {
      const response = await fetch('/api/import-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `请求失败，状态码: ${response.status}`);
      }

      if (result.success && result.data && result.data.prompts.length > 0) {
        setParsedData(result.data);
        setSelectedIndices(result.data.prompts.map((_: any, index: number) => index));
      } else {
        setError('解析失败：未在该URL找到可导入的提示词。');
      }
    } catch (err: any) {
      setError(err.message || '发生未知错误');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleSelection = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleImportSelected = () => {
    if (!parsedData) return;

    const templatesToImport = selectedIndices.map(index => parsedData.prompts[index]);
    let successCount = 0;
    const errors: string[] = [];

    templatesToImport.forEach((template, index) => {
      try {
        addTemplate(template);
        successCount++;
      } catch (e: any) {
        errors.push(`导入 "${template.title}" 时出错: ${e.message}`);
      }
    });
    
    onImportComplete({
      success: errors.length === 0,
      message: `导入完成: ${successCount} 个成功, ${errors.length} 个失败.`,
      errors,
      importedTemplates: successCount,
      importedTags: 0,
      skippedTemplates: 0,
    });

    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">从 URL 导入提示词</h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="关闭"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 flex-grow overflow-y-auto">
          {!parsedData ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  输入包含提示词的网页URL
                </label>
                <div className="flex gap-2">
                  <input
                    id="url-input"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/prompts"
                    className="flex-grow p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleFetchUrl}
                    disabled={isLoading || !url}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {isLoading ? (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : '抓取与解析'}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">在 "{parsedData.sourceTitle || '此页面'}" 中发现 {parsedData.prompts.length} 个潜在提示词</h3>
              <div className="max-h-[50vh] overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2 space-y-2">
                {parsedData.prompts.map((p, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                    <input 
                      type="checkbox"
                      className="mt-1 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-900 dark:border-gray-600 dark:checked:bg-blue-500"
                      checked={selectedIndices.includes(index)}
                      onChange={() => handleToggleSelection(index)}
                    />
                    <div className="flex-1 overflow-hidden">
                      <p className="font-semibold truncate" title={p.title}>{p.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{p.prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
          <div className="flex justify-between items-center">
            <div>
              {parsedData && (
                <button 
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  onClick={() => setParsedData(null)}
                >
                  &larr; 返回重新输入URL
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                取消
              </button>
              {parsedData && (
                <button
                  onClick={handleImportSelected}
                  disabled={selectedIndices.length === 0}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
                >
                  导入选中的 ({selectedIndices.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
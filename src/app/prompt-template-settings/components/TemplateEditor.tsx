import React, { useState, useEffect, useRef } from 'react';
import { PromptTemplate } from '@/components/default-prompt-editor';
import { ExtendedPromptTemplate } from '../types';
import TagSelector from './TagSelector';
import { createDefaultTags } from '../utils/tagManager';
import OverlayTextareaPrompt from '@/components/prompt-editor/textarea-editor/OverlayTextareaPrompt';

interface TemplateEditorProps {
  template?: ExtendedPromptTemplate | null;
  isCreating: boolean;
  onSave: (template: PromptTemplate & { tags?: string[] }) => void;
  onCancel: () => void;
}

export default function TemplateEditor({
  template,
  isCreating,
  onSave,
  onCancel
}: TemplateEditorProps) {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isParametrized, setIsParametrized] = useState(false);
  const [parameters, setParameters] = useState<Record<string, string[]>>({});
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectionInfo, setSelectionInfo] = useState<{ rect: DOMRect; start: number; end: number } | null>(null);

  // 初始化表单数据
  useEffect(() => {
    if (template) {
      setTitle(template.title || '');
      setPrompt(template.prompt || '');
      setIsParametrized(!!(template.parameterOptions && Object.keys(template.parameterOptions).length > 0));
      setParameters(template.parameterOptions || {});
      setSelectedTagIds(template.tags || []);
    } else {
      setTitle('');
      setPrompt('');
      setIsParametrized(false);
      setParameters({});
      setSelectedTagIds([]);
    }
    setErrors({});
  }, [template]);

  // 初始化默认标签（仅在首次加载时）
  useEffect(() => {
    createDefaultTags();
  }, []);

  // 自动检测参数
  const detectParameters = (text: string) => {
    const regex = /\{\{(.*?)\}\}/g;
    const detectedParams = new Set<string>();
    let match;

    while ((match = regex.exec(text)) !== null) {
      detectedParams.add(match[1]);
    }

    return Array.from(detectedParams);
  };

  // 当prompt变化时自动检测参数
  useEffect(() => {
    if (prompt) {
      const detectedParams = detectParameters(prompt);
      const hasParams = detectedParams.length > 0;
      
      // 自动设置是否为参数化模板
      setIsParametrized(hasParams);
      
      if (hasParams) {
        const newParameters = { ...parameters };
        let hasChanges = false;
        
        // 添加新检测到的参数
        detectedParams.forEach(param => {
          if (!newParameters[param]) {
            newParameters[param] = ['选项1', '选项2', '选项3'];
            hasChanges = true;
          }
        });

        // 移除不再存在的参数
        Object.keys(newParameters).forEach(param => {
          if (!detectedParams.includes(param)) {
            delete newParameters[param];
            hasChanges = true;
          }
        });

        if (hasChanges) {
          setParameters(newParameters);
        }
      } else {
        // 如果没有检测到参数，清空参数设置
        if (Object.keys(parameters).length > 0) {
          setParameters({});
        }
      }
    } else {
      // 如果prompt为空，重置状态
      setIsParametrized(false);
      setParameters({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  const handleSelectionChange = () => {
    if (textareaRef.current) {
      const { selectionStart, selectionEnd } = textareaRef.current;
      if (selectionStart !== selectionEnd) {
        const nativeSelection = window.getSelection();
        if (nativeSelection && nativeSelection.rangeCount > 0) {
          const range = nativeSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setSelectionInfo({ rect, start: selectionStart, end: selectionEnd });
        }
      } else {
        setSelectionInfo(null);
      }
    }
  };

  const setAsParameter = () => {
    if (selectionInfo) {
      const { start, end } = selectionInfo;
      const selectedText = prompt.substring(start, end);
      const newPrompt = `${prompt.substring(0, start)}{{${selectedText}}}${prompt.substring(end)}`;
      setPrompt(newPrompt);
      setSelectionInfo(null);
    }
  };

  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // 标题可以为空，无需验证

    if (!prompt.trim()) {
      newErrors.prompt = '模板内容不能为空';
    }

    // 检查参数选项（如果有检测到参数的话）
    const detectedParams = detectParameters(prompt);
    detectedParams.forEach(param => {
      if (!parameters[param] || parameters[param].length === 0) {
        newErrors[`param_${param}`] = `参数 "${param}" 需要至少一个选项`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 生成默认标题
  const generateDefaultTitle = (content: string) => {
    // 移除多余的空格和换行
    const cleanContent = content.trim().replace(/\s+/g, ' ');
    
    // 取前30个字符作为标题
    if (cleanContent.length <= 30) {
      return cleanContent;
    }
    
    // 尝试在合适的位置截断（如句号、问号、感叹号后）
    const goodBreakPoints = /[。！？.!?]/;
    for (let i = 20; i <= 30; i++) {
      if (goodBreakPoints.test(cleanContent[i])) {
        return cleanContent.substring(0, i + 1);
      }
    }
    
    // 如果没有找到好的断点，就简单截断并加省略号
    return cleanContent.substring(0, 30) + '...';
  };

  // 保存模板
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      // 如果标题为空，自动生成标题
      const finalTitle = title.trim() || generateDefaultTitle(prompt.trim());
      
      // 自动根据检测到的参数决定是否包含parameterOptions
      const detectedParams = detectParameters(prompt.trim());
      const templateToSave: PromptTemplate & { tags?: string[] } = {
        title: finalTitle,
        prompt: prompt.trim(),
        parameterOptions: detectedParams.length > 0 ? parameters : undefined,
        tags: selectedTagIds
      };

      onSave(templateToSave);
    } catch (error) {
      console.error('Save template error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 添加参数选项
  const addParameterOption = (paramName: string) => {
    const newOptions = [...(parameters[paramName] || []), '新选项'];
    setParameters(prev => ({
      ...prev,
      [paramName]: newOptions
    }));
  };

  // 更新参数选项
  const updateParameterOption = (paramName: string, optionIndex: number, value: string) => {
    const newOptions = [...(parameters[paramName] || [])];
    newOptions[optionIndex] = value;
    setParameters(prev => ({
      ...prev,
      [paramName]: newOptions
    }));
  };

  // 删除参数选项
  const removeParameterOption = (paramName: string, optionIndex: number) => {
    const newOptions = parameters[paramName].filter((_, index) => index !== optionIndex);
    setParameters(prev => ({
      ...prev,
      [paramName]: newOptions
    }));
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold">
          {isCreating ? '创建新模板' : '编辑模板'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="取消"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 表单内容 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* 模板标题 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              模板标题 <span className="text-gray-400 text-xs">(可选)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入模板标题（留空将自动生成）..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* 移除模板类型选择，系统自动根据内容检测参数 */}

          {/* 模板内容 */}
          <div className="relative" onMouseUp={handleSelectionChange} onKeyUp={handleSelectionChange}>
            <label className="block text-sm font-medium mb-2">
              模板内容 <span className="text-red-500">*</span>
            </label>
            <OverlayTextareaPrompt
                ref={textareaRef}
                value={prompt}
                onChange={setPrompt}
                onSelectedOptionsChange={() => {}}
                selectedOptions={[]}
                brackets={
                    detectParameters(prompt).map(p => {
                        const start = prompt.indexOf(`{{${p}}}`);
                        return {
                            content: p,
                            start: start,
                            end: start + p.length + 4,
                        }
                    })
                }
                onBracketClick={() => {}}
                onSelectedOptionClick={() => {}}
                height="12rem"
                computeTextDiff={(old,_new) => new Map()}
                onKeyDown={() => {}}
            />
            {!prompt && (
              <div className="absolute top-12 left-4 text-gray-400 pointer-events-none">
                输入模板内容, 例如：我的目标市场是 [国家]，产品类型是 [产品类型]...
              </div>
            )}
            {selectionInfo && textareaRef.current && (
              <button
                onClick={setAsParameter}
                className="absolute z-10 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm shadow-lg hover:bg-blue-600 transition-all duration-150"
                style={{
                  top: `${selectionInfo.rect.top - textareaRef.current.getBoundingClientRect().top - 40}px`,
                  left: `${selectionInfo.rect.left - textareaRef.current.getBoundingClientRect().left}px`,
                }}
              >
                设为参数
              </button>
            )}
            
            {errors.prompt && (
              <p className="mt-1 text-sm text-red-500">{errors.prompt}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              💡 提示：选中文字即可设为参数，或使用 `[参数名]` 来定义可变参数
            </p>
          </div>

          {/* 标签设置 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              标签 <span className="text-gray-400 text-xs">(可选)</span>
            </label>
            <TagSelector
              selectedTagIds={selectedTagIds}
              onTagsChange={setSelectedTagIds}
              disabled={isSaving}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              💡 提示：使用标签来组织和分类您的模板，便于查找和管理
            </p>
          </div>

          {/* 参数设置 */}
          {isParametrized && Object.keys(parameters).length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-3">参数设置</label>
              <div className="space-y-4">
                {Object.entries(parameters).map(([paramName, options]) => (
                  <div key={paramName} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm">参数: {paramName}</h4>
                      <button
                        onClick={() => addParameterOption(paramName)}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        添加选项
                      </button>
                    </div>
                    <div className="space-y-2">
                      {options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateParameterOption(paramName, optionIndex, e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600 dark:text-white"
                            placeholder="选项值..."
                          />
                          {options.length > 1 && (
                            <button
                              onClick={() => removeParameterOption(paramName, optionIndex)}
                              className="p-1 text-red-500 hover:text-red-700 transition-colors"
                              title="删除选项"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {errors[`param_${paramName}`] && (
                      <p className="mt-1 text-sm text-red-500">{errors[`param_${paramName}`]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部操作按钮 */}
      <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isSaving
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isSaving ? '保存中...' : '保存模板'}
        </button>
      </div>
    </div>
  );
} 
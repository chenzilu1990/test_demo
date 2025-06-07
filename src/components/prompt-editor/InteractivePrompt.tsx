"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import OptionPanel from "./OptionPanel";
import { BracketParameterOptions, PromptTemplate, SelectedOption, BracketFormatConfig, DEFAULT_BRACKET_FORMATS, ErrorType, ErrorSeverity } from "./types";
// 导入拆分的hooks和组件
import { useBracketParser, useSelectedOptions, useOptionPanel, useErrorHandler } from "./hooks";
import { PromptHeader, PromptEditor, PromptActions, PromptFooter, ErrorBoundary, ErrorToast } from "./components";
import { validateInteractivePromptConfig } from "./utils/configValidator";
// 导入选择器组件
import ModelSelector from "../../app/ai-providers-chat/components/ModelSelector";
import TemplateSelector from "./TemplateSelector";
import { ModelOption } from "../../app/ai-providers-chat/components/types";

// 弹出菜单类型
type PopupMenuType = 'model' | 'template' | null;

// 弹出菜单状态接口
interface PopupMenuState {
  type: PopupMenuType;
  position: { start: number; end: number };
  triggerChar: string;
  isVisible: boolean;
}

// 组件属性接口
export interface InteractivePromptProps {
  value: string;
  onChange: (value: string) => void;
  templates?: PromptTemplate[];
  bracketOptions: BracketParameterOptions;
  placeholder?: string;
  height?: string;
  className?: string;
  useContentEditable?: boolean; // 是否使用contenteditable替代传统文本框
  paramTemplate?: PromptTemplate; // 新增参数化模板属性
  onGenerateMoreOptions?: (paramName: string, currentOptions: string[]) => Promise<string[]>; // LLM生成更多选项
  onClear?: () => void; // 新增外部清空回调
  onBracketOptionsUpdate?: (updatedOptions: BracketParameterOptions) => void; // 新增：选项更新回调
  bracketFormats?: BracketFormatConfig[]; // 括号格式配置
  onError?: (error: import('./types/errors').ErrorInfo) => void; // 错误回调
  enableErrorToast?: boolean; // 是否启用错误提示
  enableErrorBoundary?: boolean; // 是否启用错误边界
  // 新增：模型选择器相关属性
  availableModels?: ModelOption[];
  selectedProviderModel?: string;
  onModelSelect?: (modelId: string) => void;
  isImageGenerationModel?: boolean;
  onNavigateToProviders?: () => void; // 新增：导航到提供商页面的回调
  onNavigateToTemplateSettings?: () => void; // 新增：导航到提示词模板设置页面的回调
}

export default function InteractivePrompt({
  value,
  onChange,
  templates = [],
  bracketOptions: defaultBracketOptions,
  placeholder = "在这里输入您的问题或指令...",
  height = "12rem",
  className = "",
  useContentEditable = false,
  paramTemplate,
  onGenerateMoreOptions,
  onClear,
  onBracketOptionsUpdate,
  bracketFormats = DEFAULT_BRACKET_FORMATS,
  onError,
  enableErrorToast = true,
  enableErrorBoundary = true,
  // 新增属性默认值
  availableModels = [],
  selectedProviderModel = "",
  onModelSelect,
  isImageGenerationModel = false,
  onNavigateToProviders,
  onNavigateToTemplateSettings
}: InteractivePromptProps) {
  // 错误处理
  const { 
    errors, 
    handleError, 
    clearError, 
    clearAllErrors, 
    retry,
    hasErrors,
    hasCriticalErrors 
  } = useErrorHandler({
    onError,
    maxErrors: 5,
    clearErrorsAfter: 30000
  });

  // 验证配置
  const validationResult = useMemo(() => {
    return validateInteractivePromptConfig({
      bracketFormats,
      bracketOptions: defaultBracketOptions
    });
  }, [bracketFormats, defaultBracketOptions]);

  // 处理配置验证错误
  useEffect(() => {
    if (!validationResult.isValid) {
      validationResult.errors.forEach(error => {
        handleError(
          error,
          { component: 'InteractivePrompt', operation: 'config-validation' },
          ErrorType.CONFIG_ERROR,
          ErrorSeverity.HIGH
        );
      });
    }

    // 显示警告
    if (validationResult.warnings.length > 0 && process.env.NODE_ENV === 'development') {
      validationResult.warnings.forEach(warning => {
        handleError(
          warning,
          { component: 'InteractivePrompt', operation: 'config-validation' },
          ErrorType.CONFIG_ERROR,
          ErrorSeverity.LOW
        );
      });
    }
  }, [validationResult, handleError]);

  // 使用自定义hooks管理状态
  const brackets = useBracketParser(value, bracketFormats);
  const {
    selectedOptions,
    addSelectedOption,
    updateSelectedOption,
    clearSelectedOptions,
    replaceAllSelectedOptions
  } = useSelectedOptions();
  
  const {
    isShowingOptions,
    currentBracket,
    showOptions,
    hideOptions
  } = useOptionPanel();

  // 本地状态
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [localBracketOptions, setLocalBracketOptions] = useState<Record<string, string[]>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 新增：弹出菜单状态
  const [popupMenu, setPopupMenu] = useState<PopupMenuState>({
    type: null,
    position: { start: 0, end: 0 },
    triggerChar: '',
    isVisible: false
  });

  // 新增：检测弹出方向
  const [popupDirection, setPopupDirection] = useState<'up' | 'down'>('up');

  // 新增：智能检测弹出方向
  const detectPopupDirection = useCallback(() => {
    if (!textareaRef.current) return 'up';
    
    const rect = textareaRef.current.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    
    // 如果上方空间不足300px，则向下弹出
    const direction = spaceAbove < 300 ? 'down' : 'up';
    setPopupDirection(direction);
    return direction;
  }, []);

  // 初始化本地选项
  useEffect(() => {
    setLocalBracketOptions(defaultBracketOptions);
  }, [defaultBracketOptions]);

  // 合并模板选项和本地选项
  const bracketOptions = useMemo(() => {
    if (!paramTemplate) return localBracketOptions;
    
    const paramOptions: BracketParameterOptions = {};
    
    Object.entries(paramTemplate.parameterOptions || {}).forEach(([param, options]) => {
      paramOptions[param] = options;
    });
    
    return { ...localBracketOptions, ...paramOptions };
  }, [localBracketOptions, paramTemplate]);

  // 应用参数模板
  useEffect(() => {
    if (paramTemplate && !value) {
      onChange(typeof paramTemplate.prompt === 'string' ? paramTemplate.prompt : "");
    }
  }, [paramTemplate, value, onChange]);

  // 新增：检测@和#字符的函数
  const detectTriggerChars = useCallback((text: string, cursorPosition: number) => {
    // 检查光标前的字符
    if (cursorPosition > 0) {
      const charBefore = text[cursorPosition - 1];
      if (charBefore === '@') {
        return {
          type: 'model' as PopupMenuType,
          position: { start: cursorPosition - 1, end: cursorPosition },
          triggerChar: '@'
        };
      } else if (charBefore === '#') {
        return {
          type: 'template' as PopupMenuType,
          position: { start: cursorPosition - 1, end: cursorPosition },
          triggerChar: '#'
        };
      }
    }
    return null;
  }, []);

  // 新增：隐藏弹出菜单
  const hidePopupMenu = useCallback(() => {
    setPopupMenu(prev => ({ ...prev, isVisible: false }));
  }, []);

  // 新增：处理输入变化的函数
  const handleInputChange = useCallback((newValue: string) => {
    onChange(newValue);
    
    // 延迟检测光标位置，确保DOM已更新
    setTimeout(() => {
      const cursorPosition = textareaRef.current?.selectionStart || newValue.length;
      
      // 检测触发字符
      const trigger = detectTriggerChars(newValue, cursorPosition);
      
          if (trigger) {
      // 检测弹出方向
      detectPopupDirection();
      
      setPopupMenu({
        type: trigger.type,
        position: trigger.position,
        triggerChar: trigger.triggerChar,
        isVisible: true
      });
    } else {
      // 隐藏弹出菜单
      setPopupMenu(prev => ({ ...prev, isVisible: false }));
    }
    }, 0);
  }, [onChange, detectTriggerChars]);

  // 新增：处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (popupMenu.isVisible) {
      if (e.key === 'Escape') {
        e.preventDefault();
        hidePopupMenu();
      }
    }
  }, [popupMenu.isVisible, hidePopupMenu]);

  // 新增：处理模型选择
  const handleModelSelection = useCallback((modelId: string) => {
    if (!popupMenu.isVisible || popupMenu.type !== 'model') return;
    
    const { start, end } = popupMenu.position;
    const modelName = availableModels.find(m => m.id === modelId)?.name || modelId;
    const newValue = value.substring(0, start) + `@${modelName}` + value.substring(end);
    
    onChange(newValue);
    hidePopupMenu();
    
    if (onModelSelect) {
      onModelSelect(modelId);
    }
    
    // 设置光标位置
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = start + `@${modelName}`.length;
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        textareaRef.current.focus();
      }
    }, 0);
  }, [popupMenu, value, onChange, availableModels, onModelSelect, hidePopupMenu]);

  // 新增：处理模板选择
  const handleTemplateSelection = useCallback((templatePrompt: string) => {
    if (!popupMenu.isVisible || popupMenu.type !== 'template') return;
    
    const { start, end } = popupMenu.position;
    const template = templates.find(t => t.prompt === templatePrompt);
    const templateName = template?.title || 'Template';
    const newValue = value.substring(0, start) + `#${templateName}` + value.substring(end);
    
    onChange(newValue);
    hidePopupMenu();
    
    // 设置光标位置
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = start + `#${templateName}`.length;
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        textareaRef.current.focus();
      }
    }, 0);
  }, [popupMenu, value, onChange, templates, hidePopupMenu]);

  // 选项更新处理
  const handleOptionsUpdated = useCallback((paramName: string, updatedOptions: string[]) => {
    setLocalBracketOptions(prev => {
      const updated = {
        ...prev,
        [paramName]: updatedOptions
      };
      
      if (onBracketOptionsUpdate) {
        onBracketOptionsUpdate(updated);
      }
      
      return updated;
    });
  }, [onBracketOptionsUpdate]);

  // 模板选择处理
  const handleTemplateSelect = (prompt: string): void => {
    onChange(prompt);
    setSelectedTemplate("");
    clearSelectedOptions();
  };

  // 清空提示词
  const clearPrompt = () => {
    onChange("");
    clearSelectedOptions();
    hidePopupMenu(); // 清空时也隐藏弹出菜单
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    
    if (onClear) {
      onClear();
    }
  };

  // 括号点击处理
  const handleBracketClick = (bracketContent: string, startPos: number, endPos: number) => {
    if (bracketOptions[bracketContent]) {
      showOptions({
        position: {start: startPos, end: endPos},
        options: bracketOptions[bracketContent],
        type: bracketContent,
        originalContent: bracketContent
      });
    }
  };

  // 已选择选项点击处理
  const handleSelectedOptionClick = (selectedOption: SelectedOption) => {
    // 提取括号内的内容，支持 [*], {*}, {{*}} 格式
    let bracketKey = '';
    const bracket = selectedOption.originalBracket;
    
    if (bracket.startsWith('{{') && bracket.endsWith('}}')) {
      bracketKey = bracket.slice(2, -2);
    } else if ((bracket.startsWith('{') && bracket.endsWith('}')) || 
               (bracket.startsWith('[') && bracket.endsWith(']'))) {
      bracketKey = bracket.slice(1, -1);
    }
    
    if (bracketOptions[bracketKey]) {
      showOptions({
        position: selectedOption.position,
        options: bracketOptions[bracketKey],
        type: bracketKey,
        originalContent: bracketKey,
        optionId: selectedOption.id
      });
    }
  };

  // 选项选择处理
  const handleOptionSelect = async (option: string) => {
    if (!currentBracket) {
      handleError(
        '未找到当前括号信息',
        { component: 'InteractivePrompt', operation: 'option-select' },
        ErrorType.STATE_ERROR,
        ErrorSeverity.MEDIUM
      );
      return;
    }

    try {
      const { start, end } = currentBracket.position;
      
      // 验证位置的有效性
      if (start < 0 || end > value.length || start >= end) {
        handleError(
          '选项位置信息无效',
          { 
            component: 'InteractivePrompt', 
            operation: 'option-select',
            input: { start, end, textLength: value.length }
          },
          ErrorType.STATE_ERROR,
          ErrorSeverity.MEDIUM
        );
        return;
      }

      const originalBracket = value.substring(start, end);
      const newPrompt = value.substring(0, start) + 
                       option + 
                       value.substring(end);
      
      if (currentBracket.optionId) {
        // 更新现有选项
        updateSelectedOption(
          currentBracket.optionId,
          option,
          {
            start: start,
            end: start + option.length
          }
        );
      } else {
        // 添加新选项
        addSelectedOption(
          option,
          currentBracket.type,
          originalBracket,
          {
            start: start,
            end: start + option.length
          }
        );
      }
      
      onChange(newPrompt);
      hideOptions();
      
      if (textareaRef.current) {
        textareaRef.current.focus();
      }

      // 清除相关的错误
      clearAllErrors();

    } catch (error) {
      handleError(
        error instanceof Error ? error.message : '选项选择失败',
        { 
          component: 'InteractivePrompt', 
          operation: 'option-select',
          input: { option, currentBracket }
        },
        ErrorType.STATE_ERROR,
        ErrorSeverity.MEDIUM
      );
    }
  };

  const renderContent = () => (
    <div className={`space-y-2 ${className}`}>
      <PromptHeader
        value={value}
        paramTemplate={paramTemplate}
        templates={templates}
        selectedTemplate={selectedTemplate}
        onTemplateSelect={handleTemplateSelect}
      />
      
      <div className="relative">
        <PromptEditor
          value={value}
          onChange={handleInputChange} // 使用新的处理函数
          selectedOptions={selectedOptions}
          onSelectedOptionsChange={replaceAllSelectedOptions}
          brackets={brackets}
          onBracketClick={handleBracketClick}
          onSelectedOptionClick={handleSelectedOptionClick}
          placeholder={placeholder}
          height={height}
          useContentEditable={useContentEditable}
          bracketOptions={bracketOptions}
          onGenerateMoreOptions={onGenerateMoreOptions}
          onBracketOptionsUpdate={onBracketOptionsUpdate}
          onKeyDown={handleKeyDown}
          ref={textareaRef}
        />
        
        {currentBracket && (
          <OptionPanel
            isVisible={isShowingOptions}
            onClose={hideOptions}
            onOptionSelect={handleOptionSelect}
            options={currentBracket.options}
            type={currentBracket.type}
            parameterName={currentBracket.originalContent ? currentBracket.originalContent : undefined}
            onGenerateMoreOptions={onGenerateMoreOptions}
            onOptionsUpdated={handleOptionsUpdated}
          />
        )}

        {/* 新增：模型选择器弹出菜单 */}
        {popupMenu.isVisible && popupMenu.type === 'model' && (
          <div className={`absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg p-2 min-w-[300px] animate-in duration-200 ${
            popupDirection === 'up' 
              ? 'bottom-full mb-2 slide-in-from-bottom-2' 
              : 'top-full mt-2 slide-in-from-top-2'
          }`}>
            {/* 箭头指示器 */}
            {popupDirection === 'up' ? (
              <>
                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200 dark:border-t-gray-600"></div>
                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-gray-800 transform -translate-y-px"></div>
              </>
            ) : (
              <>
                <div className="absolute bottom-full left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-200 dark:border-b-gray-600"></div>
                <div className="absolute bottom-full left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white dark:border-b-gray-800 transform translate-y-px"></div>
              </>
            )}
            
            <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              📱 选择模型
            </div>
            <div className="max-h-60 overflow-y-auto">
              {availableModels.length > 0 ? (
                availableModels.map(model => (
                  <div
                    key={model.id}
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded text-sm transition-colors duration-150 flex items-center justify-between"
                    onClick={() => handleModelSelection(model.id)}
                  >
                    <span>{model.name}</span>
                    {isImageGenerationModel && <span className="text-gray-500 ml-2 text-xs">(图像生成)</span>}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                  没有可用的模型
                </div>
              )}
              
              {/* 添加模型选项 */}
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <div
                  className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer rounded text-sm transition-colors duration-150 flex items-center gap-2 text-blue-600 dark:text-blue-400"
                  onClick={() => {
                    hidePopupMenu();
                    // 调用导航回调
                    onNavigateToProviders?.();
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>添加新模型</span>
                  <svg className="w-3 h-3 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={hidePopupMenu}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-150"
              >
                ⌨️ 取消 (ESC)
              </button>
            </div>
          </div>
        )}

        {/* 新增：模板选择器弹出菜单 */}
        {popupMenu.isVisible && popupMenu.type === 'template' && (
          <div className={`absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg p-2 min-w-[300px] animate-in duration-200 ${
            popupDirection === 'up' 
              ? 'bottom-full mb-2 slide-in-from-bottom-2' 
              : 'top-full mt-2 slide-in-from-top-2'
          }`}>
            {/* 箭头指示器 */}
            {popupDirection === 'up' ? (
              <>
                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200 dark:border-t-gray-600"></div>
                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-gray-800 transform -translate-y-px"></div>
              </>
            ) : (
              <>
                <div className="absolute bottom-full left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-200 dark:border-b-gray-600"></div>
                <div className="absolute bottom-full left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white dark:border-b-gray-800 transform translate-y-px"></div>
              </>
            )}
            
            <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              📝 选择模板
            </div>
            <div className="max-h-60 overflow-y-auto">
              {templates.length > 0 ? (
                templates.map(template => (
                  <div
                    key={template.title}
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded transition-colors duration-150"
                    onClick={() => handleTemplateSelection(template.prompt)}
                  >
                    <div className="text-sm font-medium flex items-center">
                      <span className="mr-2">🔧</span>
                      {template.title}
                    </div>
                    {typeof template.prompt === 'string' && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1 ml-6">
                        {template.prompt.substring(0, 60)}...
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                  没有可用的模板
                </div>
              )}

              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <div
                  className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer rounded text-sm transition-colors duration-150 flex items-center gap-2 text-blue-600 dark:text-blue-400"
                  onClick={() => {
                    hidePopupMenu();
                    // 调用导航回调
                    onNavigateToTemplateSettings?.();
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>添加提示词模板</span>
                  <svg className="w-3 h-3 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={hidePopupMenu}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-150"
              >
                ⌨️ 取消 (ESC)
              </button>
            </div>
          </div>
        )}
        
        <PromptActions 
          onClear={clearPrompt} 
          disabled={hasCriticalErrors}
        />
      </div>
      
      <PromptFooter bracketFormats={bracketFormats} />
      
      {/* 错误提示 */}
      {enableErrorToast && hasErrors && (
        <ErrorToast
          errors={errors}
          onDismiss={clearError}
          onRetry={(errorId) => {
            const error = errors.find(e => e.id === errorId);
            if (error) {
              retry(() => {
                // 根据错误类型执行重试逻辑
                switch (error.type) {
                  case ErrorType.GENERATION_ERROR:
                    // 重试选项生成
                    if (currentBracket && onGenerateMoreOptions) {
                      return onGenerateMoreOptions(currentBracket.type, currentBracket.options);
                    }
                    break;
                  case ErrorType.PARSE_ERROR:
                    // 重新解析
                    // 这会通过 useBracketParser hook 自动处理
                    break;
                  default:
                    // 通用重试：清除错误
                    clearError(errorId);
                }
              });
            }
          }}
          position="top-right"
        />
      )}
      
      <style jsx global>{`
        [contenteditable="true"]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          cursor: text;
        }
      `}</style>
    </div>
  );

  // 如果启用错误边界，用ErrorBoundary包装
  if (enableErrorBoundary) {
    return (
      <ErrorBoundary
        onError={(error, errorInfo) => {
          handleError(
            error.message,
            { 
              component: 'InteractivePrompt', 
              operation: 'render',
              stackTrace: errorInfo.componentStack || undefined
            },
            ErrorType.UNKNOWN_ERROR,
            ErrorSeverity.CRITICAL
          );
        }}
        resetKeys={[value, bracketFormats.length, Object.keys(bracketOptions).length]}
      >
        {renderContent()}
      </ErrorBoundary>
    );
  }

  return renderContent();
} 
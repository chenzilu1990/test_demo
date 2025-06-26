import React, { useState, useRef, useEffect } from 'react';
import { getContextStatusText, getContextSuggestion } from './useContextCalculation';

interface ContextIndicatorProps {
  totalTokens: number;
  activeTokens: number;
  contextWindowTokens: number;
  utilizationRate: number;
  remainingTokens: number;
  onClearContext?: () => void;
  onNewConversation?: () => void;
}

const ContextIndicator: React.FC<ContextIndicatorProps> = ({
  totalTokens,
  activeTokens,
  contextWindowTokens,
  utilizationRate,
  remainingTokens,
  onClearContext,
  onNewConversation
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const statusInfo = getContextStatusText(utilizationRate);
  const suggestion = getContextSuggestion(utilizationRate);

  const getProgressBarColor = (rate: number): string => {
    if (rate <= 70) return 'bg-green-500';
    if (rate <= 85) return 'bg-yellow-500';
    if (rate <= 95) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatTokenCount = (tokens: number): string => {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* 左侧：进度条和状态 */}
        <div className="flex items-center gap-3 flex-1">
          {/* 进度条 */}
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${getProgressBarColor(utilizationRate)}`}
                style={{ width: `${Math.min(100, utilizationRate)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-gray-600 dark:text-gray-400 min-w-fit">
              {formatTokenCount(activeTokens)} / {formatTokenCount(contextWindowTokens)}
            </span>
          </div>

          {/* 状态指示 */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({utilizationRate}%)
            </span>
          </div>

          {/* 建议提示 */}
          {suggestion && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{suggestion}</span>
            </div>
          )}
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2 ml-4">
          {/* 信息按钮 */}
          <button
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title="查看详细信息"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {utilizationRate > 70 && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 hover:shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                <span className="hidden sm:inline">管理上下文</span>
                <svg className={`w-3 h-3 transition-transform ${showMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* 下拉菜单 */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-2">上下文管理选项</h4>
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center justify-between">
                        <span>使用率</span>
                        <span className="font-mono font-medium">{utilizationRate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>剩余空间</span>
                        <span className="font-mono font-medium">{formatTokenCount(remainingTokens)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    {onClearContext && (
                      <button
                        onClick={() => {
                          onClearContext();
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <div className="flex-1 text-left">
                          <div className="font-medium">智能清理</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">选择清理策略优化空间</div>
                        </div>
                      </button>
                    )}
                    
                    {onNewConversation && (
                      <button
                        onClick={() => {
                          onNewConversation();
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <div className="flex-1 text-left">
                          <div className="font-medium">新建对话</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">开始全新的对话</div>
                        </div>
                      </button>
                    )}
                  </div>
                  
                  {utilizationRate > 90 && (
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        <strong>提示：</strong>上下文即将用满，建议清理或开启新对话
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 底部详细信息（仅在高使用率时显示） */}
      {utilizationRate > 90 && (
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            剩余可用: {formatTokenCount(remainingTokens)} tokens
          </span>
          <span>
            总计: {formatTokenCount(totalTokens)} tokens
          </span>
        </div>
      )}
    </div>
  );
};

export default ContextIndicator;
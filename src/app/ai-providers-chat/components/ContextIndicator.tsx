import React from 'react';
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
        {utilizationRate > 85 && (
          <div className="flex items-center gap-2 ml-4">
            {onClearContext && (
              <button
                onClick={onClearContext}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="清理历史消息，保留核心对话"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                <span className="hidden sm:inline">智能清理</span>
              </button>
            )}
            
            {onNewConversation && utilizationRate > 95 && (
              <button
                onClick={onNewConversation}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white hover:bg-blue-600 rounded transition-colors"
                title="开启新对话"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">新对话</span>
              </button>
            )}
          </div>
        )}
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
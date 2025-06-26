import React, { useState, useEffect } from 'react';
import { ConversationMessage } from './types';
import { CLEANUP_STRATEGIES, CleanupStrategy, getRecommendedStrategy } from '../utils/contextCleanup';

interface ContextCleanupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (strategy: CleanupStrategy) => void;
  messages: ConversationMessage[];
  contextWindowTokens: number;
  utilizationRate: number;
}

const ContextCleanupDialog: React.FC<ContextCleanupDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  messages,
  contextWindowTokens,
  utilizationRate
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<CleanupStrategy | null>(null);
  const [preview, setPreview] = useState<{
    keptMessages: ConversationMessage[];
    removedMessages: ConversationMessage[];
    savedTokens: number;
  } | null>(null);

  // 初始化推荐策略
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      const recommended = getRecommendedStrategy(messages, contextWindowTokens, utilizationRate);
      setSelectedStrategy(recommended);
    }
  }, [isOpen, messages, contextWindowTokens, utilizationRate]);

  // 更新预览
  useEffect(() => {
    if (selectedStrategy && selectedStrategy.preview) {
      const previewResult = selectedStrategy.preview(messages, contextWindowTokens);
      setPreview(previewResult);
    }
  }, [selectedStrategy, messages, contextWindowTokens]);

  if (!isOpen) return null;

  const formatTokenCount = (tokens: number): string => {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              智能清理上下文
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            选择清理策略，优化上下文窗口使用率
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Current Status */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                当前上下文使用率
              </span>
              <span className="text-sm font-mono text-gray-900 dark:text-white">
                {utilizationRate}%
              </span>
            </div>
            <div className="mt-2 w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  utilizationRate > 90 ? 'bg-red-500' : 
                  utilizationRate > 75 ? 'bg-orange-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${utilizationRate}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>当前消息数: {messages.length}</span>
              <span>上下文窗口: {formatTokenCount(contextWindowTokens)} tokens</span>
            </div>
          </div>

          {/* Strategy Selection */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              选择清理策略
            </h3>
            {CLEANUP_STRATEGIES.map((strategy) => {
              const recommended = getRecommendedStrategy(messages, contextWindowTokens, utilizationRate);
              const isRecommended = recommended.id === strategy.id;
              
              return (
                <button
                  key={strategy.id}
                  onClick={() => setSelectedStrategy(strategy)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedStrategy?.id === strategy.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{strategy.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {strategy.name}
                        </h4>
                        {isRecommended && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                            推荐
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {strategy.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Preview */}
          {preview && selectedStrategy && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-3">
                清理预览
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">将保留消息数:</span>
                  <span className="font-mono text-gray-900 dark:text-white">
                    {preview.keptMessages.length} / {messages.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">将清理消息数:</span>
                  <span className="font-mono text-red-600 dark:text-red-400">
                    -{preview.removedMessages.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">释放 Token 数:</span>
                  <span className="font-mono text-green-600 dark:text-green-400">
                    -{formatTokenCount(preview.savedTokens)}
                  </span>
                </div>
              </div>

              {/* Message Preview */}
              {preview.removedMessages.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    将被清理的消息预览:
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {preview.removedMessages.slice(0, 3).map((msg) => (
                      <div 
                        key={msg.id}
                        className="text-xs p-2 bg-red-100 dark:bg-red-900/20 rounded line-through opacity-60"
                      >
                        <span className="font-medium">
                          {msg.role === 'user' ? '您' : 'AI'}:
                        </span>{' '}
                        {msg.content.substring(0, 50)}
                        {msg.content.length > 50 && '...'}
                      </div>
                    ))}
                    {preview.removedMessages.length > 3 && (
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400 py-1">
                        还有 {preview.removedMessages.length - 3} 条消息...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              清理后的对话将保留核心内容
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => selectedStrategy && onConfirm(selectedStrategy)}
                disabled={!selectedStrategy}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                确认清理
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextCleanupDialog;
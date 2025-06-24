import React, { useState, memo, useCallback, useRef, useEffect } from 'react';
import { ConversationMessage } from './types';
import MarkdownRenderer from './MarkdownRenderer';
import './markdown-styles.css';

interface ChatDialogProps {
  conversation: ConversationMessage[];
  error: string;
  onSaveTemplate?: (content: string) => void;
  hasAvailableModels: boolean;
  onNavigateToProviders: () => void;
}

const ChatDialog: React.FC<ChatDialogProps> = memo(({ conversation, error, onSaveTemplate, hasAvailableModels, onNavigateToProviders }) => {
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  const handleSaveTemplate = useCallback((content: string) => {
    onSaveTemplate?.(content);
  }, [onSaveTemplate]);

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit' 
    });
  }, []);

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    if (isAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isAutoScroll]);

  // 当有新消息时自动滚动
  useEffect(() => {
    scrollToBottom();
  }, [conversation.length, scrollToBottom]);

  // 监听滚动事件，判断是否需要自动滚动
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAutoScroll(isAtBottom);
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 可以添加一个临时的复制成功提示
    } catch (err) {
      console.error('复制失败:', err);
    }
  }, []);

  const renderMessage = useCallback((msg: ConversationMessage) => {
    const isUser = msg.role === 'user';
    const showActions = hoveredMessageId === msg.id;
    
    return (
      <div
        key={msg.id}
        className={`group flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
        onMouseEnter={() => setHoveredMessageId(msg.id)}
        onMouseLeave={() => setHoveredMessageId(null)}
      >
        <div
          className={`relative max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-blue-500 text-white rounded-br-sm'
              : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-bl-sm'
          }`}
        >
          {/* 消息头部信息 */}
          <div className={`flex items-center justify-between mb-2 text-xs ${
            isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
          }`}>
            <span className="font-medium">
              {isUser ? '您' : `AI${msg.model ? ` (${msg.model})` : ''}`}
            </span>
            <span>{formatTime(msg.timestamp)}</span>
          </div>

          {/* 消息内容 */}
          <div className={`text-sm leading-relaxed ${
            isUser ? 'text-white' : 'text-gray-900 dark:text-gray-100'
          }`}>
            <MarkdownRenderer 
              content={msg.content} 
              isUser={isUser}
              className={isUser ? '' : 'prose-sm dark:prose-invert max-w-none'}
            />
            {msg.isStreaming && (
              <span className="inline-block ml-1 animate-pulse">▋</span>
            )}
            
            {/* 图片内容 */}
            {msg.imageUrl && (
              <div className="mt-3">
                <img
                  src={msg.imageUrl}
                  alt="Generated"
                  className="rounded-lg max-w-full h-auto shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                  loading="lazy"
                  onClick={() => window.open(msg.imageUrl, '_blank')}
                />
              </div>
            )}
          </div>
          
          {/* 操作按钮 */}
          {showActions && !msg.isStreaming && (
            <div className={`absolute top-2 ${isUser ? 'left-2' : 'right-2'} flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
              {/* 复制按钮 */}
              <button
                onClick={() => copyToClipboard(msg.content)}
                className="p-1 bg-black bg-opacity-20 text-white hover:bg-opacity-30 rounded-full transition-all"
                title="复制消息"
                aria-label="复制消息"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              
              {/* 保存模板按钮 - 仅用户消息显示 */}
              {isUser && onSaveTemplate && (
                <button
                  onClick={() => handleSaveTemplate(msg.content)}
                  className="p-1 bg-black bg-opacity-20 text-white hover:bg-opacity-30 rounded-full transition-all"
                  title="保存为模板"
                  aria-label="保存为模板"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </button>
              )}
              
              {/* 重新生成按钮 - 仅AI消息显示 */}
              {!isUser && (
                <button
                  onClick={() => {
                    // 这里可以触发重新生成的逻辑
                    console.log('重新生成回复');
                  }}
                  className="p-1 bg-black bg-opacity-20 text-gray-700 dark:text-gray-300 hover:bg-opacity-30 rounded-full transition-all"
                  title="重新生成回复"
                  aria-label="重新生成回复"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* 消息状态指示器 */}
          {!isUser && (
            <div className={`absolute -bottom-1 -left-1 w-2 h-2 rounded-full border-2 border-white dark:border-gray-800 ${
              msg.isStreaming ? 'bg-blue-400 animate-pulse' : 'bg-green-400'
            }`}></div>
          )}
        </div>
      </div>
    );
  }, [hoveredMessageId, onSaveTemplate, handleSaveTemplate, formatTime, copyToClipboard]);

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 rounded-xl shadow-inner overflow-hidden flex flex-col">
      {/* 对话内容区域 */}
      <div
        className="flex-1 overflow-y-auto p-6 space-y-4"
        onScroll={handleScroll}
      >
        {hasAvailableModels && conversation.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <svg
                className="w-10 h-10 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.451L3 21l2.451-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              开启智能对话之旅
            </h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-md mb-8 leading-relaxed">
              您好！我是您的 AI 助手，随时准备帮助您解答问题、提供建议或进行创意讨论
            </p>
            
            {/* 快捷功能卡片 */}
            <div className="grid grid-cols-3 gap-4 max-w-lg mb-8">
              <div className="group cursor-pointer">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-2 mx-auto group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <span className="text-base font-bold text-blue-600 dark:text-blue-400">@</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">切换模型</p>
                </div>
              </div>
              <div className="group cursor-pointer">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-2 mx-auto group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                    <span className="text-base font-bold text-purple-600 dark:text-purple-400">#</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">使用模板</p>
                </div>
              </div>
              <div className="group cursor-pointer">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2 mx-auto group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                    <span className="text-base font-bold text-green-600 dark:text-green-400">/</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">查看命令</p>
                </div>
              </div>
            </div>
            
            {/* 使用提示 */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 max-w-md">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">💡 小贴士</p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 按 <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs">Enter</kbd> 快速发送消息</li>
                <li>• 支持上传图片进行分析（部分模型）</li>
                <li>• 可以保存常用提示词为模板</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {conversation.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        )}

        {!hasAvailableModels && onNavigateToProviders && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <svg
                className="w-10 h-10 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              尚未配置 AI 模型
            </h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-md mb-6 leading-relaxed">
              您需要先配置至少一个 AI 模型才能开始对话。点击下方按钮前往设置页面添加您的第一个模型。
            </p>
            <button
              onClick={onNavigateToProviders}
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              配置 AI 模型
            </button>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              支持 OpenAI、Anthropic、Google Gemini 等多种模型
            </p>
          </div>
        )}
      </div>

      {/* 错误提示区域 */}
      {error && (
        <div
          className="mx-4 mb-4 rounded-lg border border-red-200 dark:border-red-800/50 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-4 shadow-sm"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                遇到了一点问题
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap leading-relaxed">
                {error}
              </p>
              <div className="mt-3 text-xs text-red-600 dark:text-red-400">
                <p className="font-medium mb-1">可能的解决方案：</p>
                <ul className="space-y-0.5 ml-4">
                  {error.includes('API') && <li>• 检查 API 密钥是否正确配置</li>}
                  {error.includes('网络') && <li>• 检查网络连接是否正常</li>}
                  {error.includes('限制') && <li>• 稍后再试或切换其他模型</li>}
                  <li>• 刷新页面后重试</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex-shrink-0 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
              title="刷新页面"
            >
              刷新
            </button>
          </div>
        </div>
      )}

      {/* 底部状态栏 */}
      {conversation.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{conversation.length} 条消息</span>
            {!isAutoScroll && (
              <button
                onClick={scrollToBottom}
                className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
                滚动到底部
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

ChatDialog.displayName = 'ChatDialog';

export default ChatDialog; 
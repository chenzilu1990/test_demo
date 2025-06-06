import React, { useState, memo, useCallback, useRef, useEffect } from 'react';
import { ConversationMessage } from './types';

interface ChatDialogProps {
  conversation: ConversationMessage[];
  error: string;
  onSaveTemplate?: (content: string) => void;
}

const ChatDialog: React.FC<ChatDialogProps> = memo(({ conversation, error, onSaveTemplate }) => {
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
            <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            
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
          {showActions && (
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
            </div>
          )}

          {/* 消息状态指示器 */}
          {!isUser && (
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"></div>
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
        {conversation.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.451L3 21l2.451-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">开始对话</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              在下方输入框中输入您的问题或指令，AI 将为您提供帮助。
              <br />
              您可以使用 @ 符号快速选择模型，# 符号选择模板。
            </p>
          </div>
        ) : (
          <>
            {conversation.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 错误提示区域 */}
      {error && (
        <div className="border-t border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-6 py-4" role="alert">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">发生错误</h4>
              <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">{error}</p>
            </div>
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
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
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
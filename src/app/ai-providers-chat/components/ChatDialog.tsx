import React, { useState, memo, useCallback } from 'react';
import { ConversationMessage } from './types';

interface ChatDialogProps {
  conversation: ConversationMessage[];
  error: string;
  onSaveTemplate?: (content: string) => void;
}

const ChatDialog: React.FC<ChatDialogProps> = memo(({ conversation, error, onSaveTemplate }) => {
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  const handleSaveTemplate = useCallback((content: string) => {
    onSaveTemplate?.(content);
  }, [onSaveTemplate]);

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString();
  }, []);

  const renderMessage = useCallback((msg: ConversationMessage) => {
    const isUser = msg.role === 'user';
    const showSaveButton = isUser && hoveredMessageId === msg.id && onSaveTemplate;
    
    return (
      <div
        key={msg.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
        onMouseEnter={() => setHoveredMessageId(msg.id)}
        onMouseLeave={() => setHoveredMessageId(null)}
      >
        <div
          className={`relative max-w-[70%] rounded-2xl px-4 py-2 ${
            isUser
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-gray-200 dark:bg-gray-700 rounded-bl-none'
          }`}
        >
          <div className="text-xs opacity-75 mb-1">
            {isUser ? '您' : `AI${msg.model ? ` (${msg.model})` : ''}`}
          </div>
          <div className="whitespace-pre-wrap break-words">{msg.content}</div>
          {msg.imageUrl && (
            <img
              src={msg.imageUrl}
              alt="Generated"
              className="mt-2 rounded-lg max-w-full"
              loading="lazy"
            />
          )}
          <div className="text-xs mt-1 opacity-75 text-right">
            {formatTime(msg.timestamp)}
          </div>
          
          {/* 保存模板按钮 - 仅用户消息显示 */}
          {showSaveButton && (
            <button
              onClick={() => handleSaveTemplate(msg.content)}
              className="absolute -top-2 -right-2 text-xs bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-2 py-1 rounded-full shadow-md transition-all"
              title="保存为模板"
              aria-label="保存为模板"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }, [hoveredMessageId, onSaveTemplate, handleSaveTemplate, formatTime]);

  return (
    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden flex flex-col min-h-0">
      {/* 对话内容 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">暂无对话记录</p>
          </div>
        ) : (
          conversation.map(renderMessage)
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800" role="alert">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
});

ChatDialog.displayName = 'ChatDialog';

export default ChatDialog; 
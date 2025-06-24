'use client';

import React, { useState } from 'react';
import { ConversationMeta } from './types';

interface ConversationListProps {
  conversations: ConversationMeta[];
  currentConversationId: string | null;
  isLoading?: boolean;
  onSelectConversation: (conversationId: string) => void;
  onCreateNew: () => void;
  onDeleteConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, title: string) => void;
  onDuplicateConversation: (conversationId: string) => void;
}

interface ConversationItemProps {
  conversation: ConversationMeta;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
  onDuplicate: () => void;
}

function ConversationItem({ 
  conversation, 
  isActive, 
  onSelect, 
  onDelete, 
  onRename, 
  onDuplicate 
}: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);

  const handleSaveEdit = () => {
    if (editTitle.trim() && editTitle.trim() !== conversation.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(conversation.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div
      className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        isActive 
          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
      onClick={onSelect}
    >
      {/* 对话标题 */}
      <div className="flex items-start justify-between mb-2">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            className="flex-1 text-sm font-medium bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h4 className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate pr-2">
            {conversation.title}
          </h4>
        )}
        
        {/* 操作按钮 */}
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xs"
              title="重命名"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xs"
              title="复制"
            >
              📋
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 hover:bg-red-200 dark:hover:bg-red-900/50 rounded text-xs"
              title="删除"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* 最后消息预览 */}
      {conversation.lastMessage && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
          {conversation.lastMessage.role === 'user' ? '你: ' : 'AI: '}
          {conversation.lastMessage.content.length > 50 
            ? conversation.lastMessage.content.substring(0, 50) + '...'
            : conversation.lastMessage.content
          }
        </div>
      )}

      {/* 元信息 */}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <div className="flex items-center gap-2">
          <span>{conversation.messageCount} 条消息</span>
          {conversation.model && (
            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              {conversation.model}
            </span>
          )}
        </div>
        <span>{formatTime(conversation.updatedAt)}</span>
      </div>
    </div>
  );
}

export default function ConversationList({
  conversations,
  currentConversationId,
  isLoading = false,
  onSelectConversation,
  onCreateNew,
  onDeleteConversation,
  onRenameConversation,
  onDuplicateConversation
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded mb-2 w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">对话历史</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {conversations.length} 个对话
          </span>
        </div>
        
        <button
          onClick={onCreateNew}
          className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>➕</span>
          新建对话
        </button>
      </div>

      {/* 对话列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {conversations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              还没有对话记录
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              开始一个新对话吧
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === currentConversationId}
                onSelect={() => onSelectConversation(conversation.id)}
                onDelete={() => onDeleteConversation(conversation.id)}
                onRename={(title) => onRenameConversation(conversation.id, title)}
                onDuplicate={() => onDuplicateConversation(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
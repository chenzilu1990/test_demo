import { useState, useEffect, useCallback } from 'react';
import { Conversation, ConversationMessage, ConversationMeta } from '../components/types';
import {
  loadConversations,
  saveConversation,
  deleteConversation,
  getConversation,
  getConversationMetas,
  createConversation,
  updateConversationTitle,
  updateConversationMessages,
  getCurrentConversationId,
  setCurrentConversationId,
  clearCurrentConversationId,
  duplicateConversation
} from '../utils/conversationStorage';

export interface UseConversationsReturn {
  // 对话列表
  conversations: ConversationMeta[];
  // 当前对话
  currentConversation: Conversation | null;
  // 当前对话ID
  currentConversationId: string | null;
  // 加载状态
  isLoading: boolean;
  // 错误状态
  error: string | null;
  
  // 操作方法
  createNewConversation: (model?: string, provider?: string) => string;
  selectConversation: (conversationId: string) => void;
  deleteCurrentConversation: () => void;
  deleteSpecificConversation: (conversationId: string) => void;
  renameConversation: (conversationId: string, title: string) => void;
  duplicateCurrentConversation: () => string | null;
  duplicateSpecificConversation: (conversationId: string) => string | null;
  updateCurrentConversationMessages: (messages: ConversationMessage[]) => void;
  refreshConversations: () => void;
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [currentConversationId, setCurrentConversationIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 刷新对话列表
  const refreshConversations = useCallback(() => {
    try {
      const conversationMetas = getConversationMetas();
      setConversations(conversationMetas);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh conversations:', err);
      setError('加载对话列表失败');
    }
  }, []);

  // 加载当前对话
  const loadCurrentConversation = useCallback((conversationId: string | null) => {
    if (!conversationId) {
      setCurrentConversation(null);
      return;
    }

    try {
      const conversation = getConversation(conversationId);
      if (conversation) {
        setCurrentConversation(conversation);
        setError(null);
      } else {
        // 如果对话不存在，清除当前对话ID
        clearCurrentConversationId();
        setCurrentConversationIdState(null);
        setCurrentConversation(null);
      }
    } catch (err) {
      console.error('Failed to load current conversation:', err);
      setError('加载当前对话失败');
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        // 加载对话列表
        const conversationMetas = getConversationMetas();
        setConversations(conversationMetas);
        
        // 加载当前对话ID
        const currentId = getCurrentConversationId();
        setCurrentConversationIdState(currentId);
        
        // 加载当前对话
        if (currentId) {
          const conversation = getConversation(currentId);
          if (conversation) {
            setCurrentConversation(conversation);
          } else {
            clearCurrentConversationId();
            setCurrentConversationIdState(null);
            setCurrentConversation(null);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to initialize conversations:', err);
        setError('初始化对话系统失败');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []); // 移除依赖，只在组件挂载时执行一次

  // 创建新对话
  const createNewConversation = useCallback((model?: string, provider?: string): string => {
    try {
      const newConversation = createConversation(model, provider);
      saveConversation(newConversation);
      
      // 设置为当前对话
      setCurrentConversationId(newConversation.id);
      setCurrentConversationIdState(newConversation.id);
      setCurrentConversation(newConversation);
      
      // 刷新对话列表
      refreshConversations();
      
      return newConversation.id;
    } catch (err) {
      console.error('Failed to create new conversation:', err);
      setError('创建新对话失败');
      throw err;
    }
  }, [refreshConversations]);

  // 选择对话
  const selectConversation = useCallback((conversationId: string) => {
    try {
      setCurrentConversationId(conversationId);
      setCurrentConversationIdState(conversationId);
      loadCurrentConversation(conversationId);
    } catch (err) {
      console.error('Failed to select conversation:', err);
      setError('切换对话失败');
    }
  }, [loadCurrentConversation]);

  // 删除当前对话
  const deleteCurrentConversation = useCallback(() => {
    if (!currentConversationId) return;
    
    try {
      deleteConversation(currentConversationId);
      
      // 清除当前对话
      clearCurrentConversationId();
      setCurrentConversationIdState(null);
      setCurrentConversation(null);
      
      // 刷新对话列表
      refreshConversations();
    } catch (err) {
      console.error('Failed to delete current conversation:', err);
      setError('删除对话失败');
    }
  }, [currentConversationId, refreshConversations]);

  // 删除指定对话
  const deleteSpecificConversation = useCallback((conversationId: string) => {
    try {
      deleteConversation(conversationId);
      
      // 如果删除的是当前对话，清除当前对话
      if (conversationId === currentConversationId) {
        clearCurrentConversationId();
        setCurrentConversationIdState(null);
        setCurrentConversation(null);
      }
      
      // 刷新对话列表
      refreshConversations();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setError('删除对话失败');
    }
  }, [currentConversationId, refreshConversations]);

  // 重命名对话
  const renameConversation = useCallback((conversationId: string, title: string) => {
    try {
      updateConversationTitle(conversationId, title);
      
      // 如果是当前对话，更新当前对话状态
      if (conversationId === currentConversationId && currentConversation) {
        setCurrentConversation({
          ...currentConversation,
          title,
          updatedAt: new Date()
        });
      }
      
      // 刷新对话列表
      refreshConversations();
    } catch (err) {
      console.error('Failed to rename conversation:', err);
      setError('重命名对话失败');
    }
  }, [currentConversationId, currentConversation, refreshConversations]);

  // 复制当前对话
  const duplicateCurrentConversation = useCallback((): string | null => {
    if (!currentConversationId) return null;
    
    try {
      const duplicatedConversation = duplicateConversation(currentConversationId);
      if (duplicatedConversation) {
        // 刷新对话列表
        refreshConversations();
        return duplicatedConversation.id;
      }
      return null;
    } catch (err) {
      console.error('Failed to duplicate current conversation:', err);
      setError('复制对话失败');
      return null;
    }
  }, [currentConversationId, refreshConversations]);

  // 复制指定对话
  const duplicateSpecificConversation = useCallback((conversationId: string): string | null => {
    try {
      const duplicatedConversation = duplicateConversation(conversationId);
      if (duplicatedConversation) {
        // 刷新对话列表
        refreshConversations();
        return duplicatedConversation.id;
      }
      return null;
    } catch (err) {
      console.error('Failed to duplicate conversation:', err);
      setError('复制对话失败');
      return null;
    }
  }, [refreshConversations]);

  // 更新当前对话消息
  const updateCurrentConversationMessages = useCallback((messages: ConversationMessage[]) => {
    if (!currentConversationId) return;
    
    try {
      updateConversationMessages(currentConversationId, messages);
      
      // 更新当前对话状态
      if (currentConversation) {
        setCurrentConversation({
          ...currentConversation,
          messages,
          updatedAt: new Date()
        });
      }
      
      // 刷新对话列表（因为最后消息可能有变化）
      refreshConversations();
    } catch (err) {
      console.error('Failed to update conversation messages:', err);
      setError('更新对话消息失败');
    }
  }, [currentConversationId, currentConversation, refreshConversations]);

  return {
    conversations,
    currentConversation,
    currentConversationId,
    isLoading,
    error,
    createNewConversation,
    selectConversation,
    deleteCurrentConversation,
    deleteSpecificConversation,
    renameConversation,
    duplicateCurrentConversation,
    duplicateSpecificConversation,
    updateCurrentConversationMessages,
    refreshConversations
  };
}
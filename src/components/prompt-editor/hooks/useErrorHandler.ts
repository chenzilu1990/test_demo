import { useState, useCallback, useRef } from 'react';
import { ErrorInfo, ErrorType, ErrorSeverity, ErrorContext, ErrorHandleResult } from '../types/errors';

interface UseErrorHandlerOptions {
  onError?: (error: ErrorInfo) => void;
  maxErrors?: number;
  clearErrorsAfter?: number; // 毫秒
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const { onError, maxErrors = 10, clearErrorsAfter = 30000 } = options;
  
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [isRecovering, setIsRecovering] = useState(false);
  const errorCountRef = useRef(0);

  // 生成错误ID
  const generateErrorId = useCallback(() => {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // 处理错误
  const handleError = useCallback((
    error: Error | string,
    context: ErrorContext,
    type: ErrorType = ErrorType.UNKNOWN_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): ErrorHandleResult => {
    try {
      const errorMessage = typeof error === 'string' ? error : error.message;
      const stackTrace = typeof error === 'object' && error.stack ? error.stack : undefined;

      const errorInfo: ErrorInfo = {
        id: generateErrorId(),
        type,
        severity,
        message: errorMessage,
        details: `Component: ${context.component}, Operation: ${context.operation}`,
        timestamp: Date.now(),
        recoverable: severity !== ErrorSeverity.CRITICAL,
        action: getRecommendedAction(type, severity)
      };

      // 添加到错误列表
      setErrors(prev => {
        const newErrors = [...prev, errorInfo];
        // 限制错误数量
        if (newErrors.length > maxErrors) {
          return newErrors.slice(-maxErrors);
        }
        return newErrors;
      });

      // 调用外部错误处理器
      if (onError) {
        onError(errorInfo);
      }

      // 增加错误计数
      errorCountRef.current += 1;

      // 自动清除错误
      if (clearErrorsAfter > 0) {
        setTimeout(() => {
          setErrors(prev => prev.filter(e => e.id !== errorInfo.id));
        }, clearErrorsAfter);
      }

      // 返回处理结果
      return {
        handled: true,
        fallbackValue: getFallbackValue(type, context),
        userMessage: getUserFriendlyMessage(type, severity),
        shouldRetry: isRetryable(type, severity)
      };

    } catch (handlingError) {
      // 错误处理本身出错，返回最小化处理结果
      console.error('Error in error handler:', handlingError);
      return {
        handled: false,
        userMessage: '发生未知错误，请刷新页面重试'
      };
    }
  }, [generateErrorId, maxErrors, clearErrorsAfter, onError]);

  // 清除特定错误
  const clearError = useCallback((errorId: string) => {
    setErrors(prev => prev.filter(e => e.id !== errorId));
  }, []);

  // 清除所有错误
  const clearAllErrors = useCallback(() => {
    setErrors([]);
    errorCountRef.current = 0;
  }, []);

  // 重试操作
  const retry = useCallback(async (operation: () => Promise<any> | any) => {
    setIsRecovering(true);
    try {
      const result = await operation();
      setIsRecovering(false);
      return result;
    } catch (error) {
      setIsRecovering(false);
      throw error;
    }
  }, []);

  // 获取最严重的错误
  const getMostSevereError = useCallback(() => {
    if (errors.length === 0) return null;
    
    const severityOrder = {
      [ErrorSeverity.CRITICAL]: 4,
      [ErrorSeverity.HIGH]: 3,
      [ErrorSeverity.MEDIUM]: 2,
      [ErrorSeverity.LOW]: 1
    };

    return errors.reduce((mostSevere, current) => {
      return severityOrder[current.severity] > severityOrder[mostSevere.severity] 
        ? current 
        : mostSevere;
    });
  }, [errors]);

  return {
    errors,
    errorCount: errorCountRef.current,
    isRecovering,
    handleError,
    clearError,
    clearAllErrors,
    retry,
    getMostSevereError,
    hasErrors: errors.length > 0,
    hasCriticalErrors: errors.some(e => e.severity === ErrorSeverity.CRITICAL)
  };
};

// 获取推荐操作
function getRecommendedAction(type: ErrorType, severity: ErrorSeverity): string {
  switch (type) {
    case ErrorType.CONFIG_ERROR:
      return '请检查配置参数是否正确';
    case ErrorType.PARSE_ERROR:
      return '请检查输入格式是否正确';
    case ErrorType.GENERATION_ERROR:
      return '请重试或检查网络连接';
    case ErrorType.NETWORK_ERROR:
      return '请检查网络连接后重试';
    default:
      return severity === ErrorSeverity.CRITICAL ? '请刷新页面' : '请重试操作';
  }
}

// 获取回退值
function getFallbackValue(type: ErrorType, context: ErrorContext): any {
  switch (type) {
    case ErrorType.PARSE_ERROR:
      return []; // 解析失败返回空数组
    case ErrorType.GENERATION_ERROR:
      return []; // 生成失败返回空选项
    case ErrorType.CONFIG_ERROR:
      return null; // 配置错误返回null
    default:
      return undefined;
  }
}

// 获取用户友好的错误消息
function getUserFriendlyMessage(type: ErrorType, severity: ErrorSeverity): string {
  if (severity === ErrorSeverity.CRITICAL) {
    return '系统遇到严重错误，请刷新页面重试';
  }

  switch (type) {
    case ErrorType.PARSE_ERROR:
      return '文本解析失败，请检查输入格式';
    case ErrorType.CONFIG_ERROR:
      return '配置参数有误，请检查设置';
    case ErrorType.GENERATION_ERROR:
      return '选项生成失败，请重试';
    case ErrorType.NETWORK_ERROR:
      return '网络连接异常，请检查网络后重试';
    case ErrorType.STATE_ERROR:
      return '状态同步异常，请重试操作';
    default:
      return '操作失败，请重试';
  }
}

// 判断错误是否可重试
function isRetryable(type: ErrorType, severity: ErrorSeverity): boolean {
  if (severity === ErrorSeverity.CRITICAL) {
    return false;
  }

  switch (type) {
    case ErrorType.NETWORK_ERROR:
    case ErrorType.GENERATION_ERROR:
      return true;
    case ErrorType.CONFIG_ERROR:
    case ErrorType.PARSE_ERROR:
      return false;
    default:
      return severity === ErrorSeverity.LOW || severity === ErrorSeverity.MEDIUM;
  }
} 
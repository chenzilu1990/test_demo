import React, { useEffect } from 'react';
import { ErrorInfo, ErrorSeverity } from '../types/errors';

interface ErrorToastProps {
  errors: ErrorInfo[];
  onDismiss: (errorId: string) => void;
  onRetry?: (errorId: string) => void;
  maxVisible?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  errors,
  onDismiss,
  onRetry,
  maxVisible = 3,
  position = 'top-right'
}) => {
  // 只显示最新的几个错误
  const visibleErrors = errors.slice(-maxVisible);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  if (visibleErrors.length === 0) {
    return null;
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-3 max-w-sm`}>
      {visibleErrors.map((error, index) => (
        <ErrorToastItem
          key={error.id}
          error={error}
          index={index}
          onDismiss={onDismiss}
          onRetry={onRetry}
        />
      ))}
    </div>
  );
};

interface ErrorToastItemProps {
  error: ErrorInfo;
  index: number;
  onDismiss: (errorId: string) => void;
  onRetry?: (errorId: string) => void;
}

const ErrorToastItem: React.FC<ErrorToastItemProps> = ({
  error,
  index,
  onDismiss,
  onRetry
}) => {
  // 自动消失（低优先级错误）
  useEffect(() => {
    if (error.severity === ErrorSeverity.LOW) {
      const timer = setTimeout(() => {
        onDismiss(error.id);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error.id, error.severity, onDismiss]);

  const getSeverityConfig = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return {
          bgColor: 'bg-red-500',
          textColor: 'text-white',
          borderColor: 'border-red-600',
          icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )
        };
      case ErrorSeverity.HIGH:
        return {
          bgColor: 'bg-orange-500',
          textColor: 'text-white',
          borderColor: 'border-orange-600',
          icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )
        };
      case ErrorSeverity.MEDIUM:
        return {
          bgColor: 'bg-yellow-500',
          textColor: 'text-white',
          borderColor: 'border-yellow-600',
          icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )
        };
      case ErrorSeverity.LOW:
        return {
          bgColor: 'bg-blue-500',
          textColor: 'text-white',
          borderColor: 'border-blue-600',
          icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )
        };
      default:
        return {
          bgColor: 'bg-gray-500',
          textColor: 'text-white',
          borderColor: 'border-gray-600',
          icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )
        };
    }
  };

  const config = getSeverityConfig();

  return (
    <div
      className={`
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        border-l-4 p-4 rounded-md shadow-lg transform transition-all duration-300 ease-in-out
        animate-slide-in-right
      `}
      style={{
        animationDelay: `${index * 100}ms`
      }}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {config.icon}
        </div>
        
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">
            {error.message}
          </p>
          
          {error.action && (
            <p className="mt-1 text-xs opacity-90">
              {error.action}
            </p>
          )}
          
          {error.details && (
            <details className="mt-2">
              <summary className="text-xs opacity-75 cursor-pointer hover:opacity-100">
                查看详情
              </summary>
              <p className="mt-1 text-xs opacity-75 font-mono">
                {error.details}
              </p>
            </details>
          )}
        </div>

        <div className="ml-4 flex space-x-2">
          {/* 重试按钮 */}
          {error.recoverable && onRetry && (
            <button
              onClick={() => onRetry(error.id)}
              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-current bg-white bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            >
              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              重试
            </button>
          )}

          {/* 关闭按钮 */}
          <button
            onClick={() => onDismiss(error.id)}
            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-current bg-white bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
          >
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// 添加动画样式
const animationStyles = `
  @keyframes slide-in-right {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out forwards;
  }
`;

// 注入样式
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = animationStyles;
  document.head.appendChild(styleElement);
}

export default ErrorToast; 
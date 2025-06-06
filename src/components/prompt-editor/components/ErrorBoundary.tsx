import React, { Component, ReactNode, ErrorInfo as ReactErrorInfo } from 'react';
import { ErrorInfo, ErrorType, ErrorSeverity } from '../types/errors';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: ErrorInfo, errorInfo: ReactErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ReactErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `boundary_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ReactErrorInfo) {
    const errorDetails: ErrorInfo = {
      id: this.state.errorId || 'unknown',
      type: ErrorType.UNKNOWN_ERROR,
      severity: ErrorSeverity.CRITICAL,
      message: error.message,
      details: `Component Stack: ${errorInfo.componentStack}`,
      timestamp: Date.now(),
      recoverable: true,
      action: '请刷新页面或重试操作'
    };

    this.setState({ errorInfo });

    // 调用外部错误处理器
    if (this.props.onError) {
      this.props.onError(errorDetails, errorInfo);
    }

    // 开发环境下输出详细错误信息
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 ErrorBoundary 捕获到错误');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // 如果之前有错误，检查是否应该重置
    if (hasError && prevProps.children !== this.props.children && resetOnPropsChange) {
      this.resetErrorBoundary();
    }

    // 检查重置键是否变化
    if (hasError && resetKeys && resetKeys.length > 0) {
      const prevResetKeys = prevProps.resetKeys || [];
      const hasResetKeyChanged = resetKeys.some((key, index) => key !== prevResetKeys[index]);
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // 如果提供了自定义的 fallback，使用它
      if (fallback) {
        return fallback;
      }

      // 否则使用默认的错误UI
      return <DefaultErrorFallback 
        error={error} 
        errorInfo={errorInfo}
        onRetry={this.handleRetry}
        onReload={this.handleReload}
      />;
    }

    return children;
  }
}

// 默认错误降级组件
interface DefaultErrorFallbackProps {
  error: Error | null;
  errorInfo: ReactErrorInfo | null;
  onRetry: () => void;
  onReload: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  errorInfo,
  onRetry,
  onReload
}) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="border border-red-200 rounded-lg p-6 m-4 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
            组件渲染出错
          </h3>
          
          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
            <p>很抱歉，组件在渲染过程中遇到了错误。</p>
            {error && (
              <p className="mt-1 font-mono text-xs bg-red-100 dark:bg-red-800/50 p-2 rounded border">
                {error.message}
              </p>
            )}
          </div>

          {/* 开发环境下显示详细信息 */}
          {isDevelopment && errorInfo && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-red-800 dark:text-red-200">
                查看详细错误信息（开发模式）
              </summary>
              <div className="mt-2 text-xs bg-red-100 dark:bg-red-800/50 p-3 rounded border overflow-auto max-h-40">
                <div className="mb-2">
                  <strong>组件栈:</strong>
                  <pre className="whitespace-pre-wrap text-xs">{errorInfo.componentStack}</pre>
                </div>
                {error?.stack && (
                  <div>
                    <strong>错误栈:</strong>
                    <pre className="whitespace-pre-wrap text-xs">{error.stack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* 操作按钮 */}
          <div className="mt-4 flex space-x-3">
            <button
              onClick={onRetry}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-800/50 dark:text-red-200 dark:hover:bg-red-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              重试
            </button>
            
            <button
              onClick={onReload}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新页面
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 简化的错误边界Hook
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}; 
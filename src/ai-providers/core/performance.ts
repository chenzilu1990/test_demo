import { PerformanceMetrics, PerformanceMonitor } from '../types';

export class SimplePerformanceMonitor implements PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private activeRequests: Map<string, { provider: string; model: string; startTime: Date }> = new Map();

  startRequest(provider: string, model: string): string {
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.activeRequests.set(requestId, {
      provider,
      model,
      startTime: new Date()
    });
    return requestId;
  }

  endRequest(
    requestId: string, 
    status: 'success' | 'error' | 'timeout', 
    tokensUsed?: any, 
    error?: string
  ): void {
    const activeRequest = this.activeRequests.get(requestId);
    if (!activeRequest) {
      console.warn(`Performance monitor: Request ${requestId} not found`);
      return;
    }

    const endTime = new Date();
    const duration = endTime.getTime() - activeRequest.startTime.getTime();

    const metric: PerformanceMetrics = {
      requestId,
      provider: activeRequest.provider,
      model: activeRequest.model,
      startTime: activeRequest.startTime,
      endTime,
      duration,
      tokensUsed: tokensUsed ? {
        prompt: tokensUsed.prompt_tokens || 0,
        completion: tokensUsed.completion_tokens || 0,
        total: tokensUsed.total_tokens || 0
      } : undefined,
      status,
      error
    };

    this.metrics.push(metric);
    this.activeRequests.delete(requestId);

    // 保留最近1000条记录
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  getMetrics(provider?: string, model?: string): PerformanceMetrics[] {
    let filtered = this.metrics;

    if (provider) {
      filtered = filtered.filter(m => m.provider === provider);
    }

    if (model) {
      filtered = filtered.filter(m => m.model === model);
    }

    return filtered.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  clearMetrics(): void {
    this.metrics = [];
    this.activeRequests.clear();
  }

  // 获取统计信息
  getStats(provider?: string, model?: string) {
    const metrics = this.getMetrics(provider, model);
    
    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        averageDuration: 0,
        totalTokens: 0,
        errorRate: 0
      };
    }

    const successCount = metrics.filter(m => m.status === 'success').length;
    const errorCount = metrics.filter(m => m.status === 'error').length;
    const totalDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const totalTokens = metrics.reduce((sum, m) => sum + (m.tokensUsed?.total || 0), 0);

    return {
      totalRequests: metrics.length,
      successRate: (successCount / metrics.length) * 100,
      errorRate: (errorCount / metrics.length) * 100,
      averageDuration: totalDuration / metrics.length,
      totalTokens,
      averageTokensPerRequest: totalTokens / metrics.length
    };
  }

  // 获取最近的错误
  getRecentErrors(limit: number = 10): PerformanceMetrics[] {
    return this.metrics
      .filter(m => m.status === 'error')
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  // 获取性能趋势数据
  getTrendData(hours: number = 24): { timestamp: Date; successRate: number; averageDuration: number }[] {
    const now = new Date();
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
    
    const recentMetrics = this.metrics.filter(m => m.startTime >= startTime);
    
    // 按小时分组
    const hourlyData: { [hour: string]: PerformanceMetrics[] } = {};
    
    recentMetrics.forEach(metric => {
      const hour = new Date(metric.startTime);
      hour.setMinutes(0, 0, 0);
      const hourKey = hour.toISOString();
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = [];
      }
      hourlyData[hourKey].push(metric);
    });

    return Object.entries(hourlyData).map(([hourKey, metrics]) => {
      const successCount = metrics.filter(m => m.status === 'success').length;
      const totalDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
      
      return {
        timestamp: new Date(hourKey),
        successRate: metrics.length > 0 ? (successCount / metrics.length) * 100 : 0,
        averageDuration: metrics.length > 0 ? totalDuration / metrics.length : 0
      };
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

// 全局性能监控实例
export const globalPerformanceMonitor = new SimplePerformanceMonitor(); 
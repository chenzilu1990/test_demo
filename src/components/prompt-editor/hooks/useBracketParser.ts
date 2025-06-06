import { useMemo } from 'react';
import { BracketFormatConfig } from '../types';
import { ErrorType, ErrorSeverity, ParseError } from '../types/errors';
import { useErrorHandler } from './useErrorHandler';

interface ParsedBracket {
  content: string;
  start: number;
  end: number;
  formatConfig?: BracketFormatConfig;
}

export const useBracketParser = (text: string, bracketFormats: BracketFormatConfig[]) => {
  const { handleError } = useErrorHandler({
    onError: (error) => {
      // 开发环境下输出详细错误信息
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔍 Bracket parsing error:', error);
      }
    }
  });

  const brackets = useMemo(() => {
    // 输入验证
    if (!text || typeof text !== 'string') {
      return [];
    }

    if (!bracketFormats || !Array.isArray(bracketFormats) || bracketFormats.length === 0) {
      const result = handleError(
        '括号格式配置为空或无效',
        { component: 'useBracketParser', operation: 'validate-formats', input: bracketFormats },
        ErrorType.CONFIG_ERROR,
        ErrorSeverity.MEDIUM
      );
      return result.fallbackValue || [];
    }

    try {
      const parsedBrackets: ParsedBracket[] = [];
      const allMatches: Array<{
        content: string;
        start: number;
        end: number;
        type: string;
        fullMatch: string;
        priority: number;
        formatConfig: BracketFormatConfig;
      }> = [];

      // 验证并使用配置化的格式匹配
      bracketFormats.forEach((formatConfig, index) => {
        try {
          // 验证格式配置
          if (!formatConfig.regex || !(formatConfig.regex instanceof RegExp)) {
            handleError(
              `格式配置 ${index} 的正则表达式无效`,
              { component: 'useBracketParser', operation: 'validate-regex', input: formatConfig },
              ErrorType.CONFIG_ERROR,
              ErrorSeverity.MEDIUM
            );
            return;
          }

          if (!formatConfig.type || typeof formatConfig.type !== 'string') {
            handleError(
              `格式配置 ${index} 的类型无效`,
              { component: 'useBracketParser', operation: 'validate-type', input: formatConfig },
              ErrorType.CONFIG_ERROR,
              ErrorSeverity.MEDIUM
            );
            return;
          }

          if (typeof formatConfig.priority !== 'number') {
            handleError(
              `格式配置 ${index} 的优先级无效`,
              { component: 'useBracketParser', operation: 'validate-priority', input: formatConfig },
              ErrorType.CONFIG_ERROR,
              ErrorSeverity.LOW
            );
            return;
          }

          let match;
          // 重新创建正则表达式以重置lastIndex，并添加超时保护
          const tempRegex = new RegExp(formatConfig.regex.source, formatConfig.regex.flags);
          const maxIterations = 1000; // 防止无限循环
          let iterations = 0;

          while ((match = tempRegex.exec(text)) !== null && iterations < maxIterations) {
            iterations++;

            // 检查是否有有效的捕获组
            if (match.length < 2) {
              handleError(
                `格式 "${formatConfig.type}" 的正则表达式缺少捕获组`,
                { 
                  component: 'useBracketParser', 
                  operation: 'extract-content', 
                  input: { regex: formatConfig.regex.source, match: match[0] }
                },
                ErrorType.PARSE_ERROR,
                ErrorSeverity.LOW
              );
              continue;
            }

            allMatches.push({
              content: match[1] || '', // 确保捕获组存在
              start: match.index,
              end: match.index + match[0].length,
              type: formatConfig.type,
              fullMatch: match[0],
              priority: formatConfig.priority,
              formatConfig
            });

            // 防止无限循环
            if (tempRegex.lastIndex === match.index) {
              tempRegex.lastIndex++;
            }
          }

          // 检查是否因为迭代次数过多而退出
          if (iterations >= maxIterations) {
            handleError(
              `格式 "${formatConfig.type}" 的正则表达式可能导致性能问题`,
              { 
                component: 'useBracketParser', 
                operation: 'regex-execution', 
                input: { regex: formatConfig.regex.source, text: text.substring(0, 100) }
              },
              ErrorType.PARSE_ERROR,
              ErrorSeverity.HIGH
            );
          }

        } catch (regexError) {
          handleError(
            regexError instanceof Error ? regexError.message : '正则表达式执行失败',
            { 
              component: 'useBracketParser', 
              operation: 'regex-execution', 
              input: { formatConfig, text: text.substring(0, 100) }
            },
            ErrorType.PARSE_ERROR,
            ErrorSeverity.MEDIUM
          );
        }
      });

      // 按位置和优先级排序（位置优先，然后按优先级倒序）
      allMatches.sort((a, b) => {
        if (a.start !== b.start) return a.start - b.start;
        return b.priority - a.priority; // 优先级高的排前面
      });

      // 过滤重叠的匹配项
      for (let i = 0; i < allMatches.length; i++) {
        const current = allMatches[i];
        let isOverlapped = false;

        // 检查是否与已添加的匹配项重叠
        for (const existing of parsedBrackets) {
          if (!(current.end <= existing.start || current.start >= existing.end)) {
            isOverlapped = true;
            break;
          }
        }

        if (!isOverlapped) {
          // 验证匹配结果的合理性
          if (current.start < 0 || current.end > text.length || current.start >= current.end) {
            handleError(
              '解析结果位置无效',
              { 
                component: 'useBracketParser', 
                operation: 'validate-position', 
                input: { start: current.start, end: current.end, textLength: text.length }
              },
              ErrorType.PARSE_ERROR,
              ErrorSeverity.LOW
            );
            continue;
          }

          parsedBrackets.push({
            content: current.content,
            start: current.start,
            end: current.end,
            formatConfig: current.formatConfig
          });
        }
      }

      // 最终按位置排序
      return parsedBrackets.sort((a, b) => a.start - b.start);

    } catch (parseError) {
      const result = handleError(
        parseError instanceof Error ? parseError.message : '解析过程中发生未知错误',
        { 
          component: 'useBracketParser', 
          operation: 'parse-text', 
          input: { text: text.substring(0, 100), formatsCount: bracketFormats.length }
        },
        ErrorType.PARSE_ERROR,
        ErrorSeverity.HIGH
      );

      // 返回空数组作为回退值
      return result.fallbackValue || [];
    }
  }, [text, bracketFormats, handleError]);

  return brackets;
}; 
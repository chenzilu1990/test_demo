'use client';

import React, { memo, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Options as HighlightOptions } from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = memo(({ content, className = '', isUser = false }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // 检测暗色模式
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    // 监听主题变化
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // 配置语法高亮选项
  const highlightOptions: HighlightOptions = {
    detect: true, // 自动检测语言
    plainText: ['txt', 'text'], // 纯文本语言
  };

  // 用户消息不解析 Markdown，直接显示纯文本
  if (isUser) {
    return <div className="whitespace-pre-wrap break-words">{content}</div>;
  }

  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, highlightOptions]]}
        components={{
        // 自定义链接组件，确保在新标签页打开
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            {children}
          </a>
        ),
        // 自定义代码块组件
        pre: ({ children }) => (
          <pre className={`overflow-x-auto rounded-lg p-4 my-2 ${
            isDarkMode 
              ? 'bg-gray-900 hljs-github-dark' 
              : 'bg-gray-50 border border-gray-200 hljs-github'
          }`}>
            {children}
          </pre>
        ),
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match;
          
          if (isInline) {
            return (
              <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 text-sm font-mono" {...props}>
                {children}
              </code>
            );
          }
          
          return (
            <code className={`${className} ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} font-mono`} {...props}>
              {children}
            </code>
          );
        },
        // 自定义表格样式
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
            {children}
          </td>
        ),
        // 自定义列表样式
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
        ),
        // 自定义引用块样式
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 my-2 italic text-gray-700 dark:text-gray-300">
            {children}
          </blockquote>
        ),
        // 自定义标题样式
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold mt-3 mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-bold mt-2 mb-1">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-base font-bold mt-2 mb-1">{children}</h4>
        ),
        h5: ({ children }) => (
          <h5 className="text-sm font-bold mt-1 mb-1">{children}</h5>
        ),
        h6: ({ children }) => (
          <h6 className="text-xs font-bold mt-1 mb-1">{children}</h6>
        ),
        // 自定义段落间距
        p: ({ children }) => (
          <p className="my-2 leading-relaxed">{children}</p>
        ),
        // 自定义水平线
        hr: () => (
          <hr className="my-4 border-t border-gray-300 dark:border-gray-600" />
        ),
        // 自定义强调样式
        strong: ({ children }) => (
          <strong className="font-bold">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        // 自定义删除线
        del: ({ children }) => (
          <del className="line-through text-gray-500 dark:text-gray-400">{children}</del>
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';

export default MarkdownRenderer;
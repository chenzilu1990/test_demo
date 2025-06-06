import React from 'react';
import { BracketFormatConfig } from '../types';

interface PromptFooterProps {
  bracketFormats: BracketFormatConfig[];
}

export const PromptFooter: React.FC<PromptFooterProps> = ({
  bracketFormats
}) => {
  const formatDescriptions = bracketFormats
    .map(format => format.description)
    .filter(Boolean)
    .join('、');

  return (
    <div className="text-xs text-gray-500">
      <p>
        提示：点击蓝色的 {formatDescriptions} 内容可以选择选项，点击绿色高亮的已选项可以重新选择。
      </p>
    </div>
  );
}; 
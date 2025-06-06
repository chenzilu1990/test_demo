import React from 'react';
import TemplateSelector from '../TemplateSelector';
import { PromptTemplate } from '../types';

interface PromptHeaderProps {
  value: string;
  paramTemplate?: PromptTemplate;
  templates?: PromptTemplate[];
  selectedTemplate: string;
  onTemplateSelect: (prompt: string) => void;
}

export const PromptHeader: React.FC<PromptHeaderProps> = ({
  value,
  paramTemplate,
  templates = [],
  selectedTemplate,
  onTemplateSelect
}) => {
  return (
    <div className="flex justify-between items-center">
      <div className="text-xs text-gray-500">
        {paramTemplate && (
          <span className="mr-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded">
            {paramTemplate.title}
          </span>
        )}
        {value.length} 个字符
      </div>
      
      <TemplateSelector 
        templates={templates} 
        onTemplateSelect={onTemplateSelect}
        selectedTemplate={selectedTemplate}
      />
    </div>
  );
}; 
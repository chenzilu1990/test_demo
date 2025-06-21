import React from 'react';
import { PromptTemplate } from '@/components/default-prompt-editor';

interface TemplatePreviewProps {
  template: PromptTemplate;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template }) => {
  return (
    <div className="mb-4">
      <h3 className="font-medium mb-2">生成的模板:</h3>
      <div className="border border-green-200 dark:border-green-800 rounded-lg overflow-hidden">
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
          <span className="font-medium">标题:</span> {template.title}
        </div>
        <div className="p-3 bg-white dark:bg-gray-800">
          <div className="mb-3">
            <span className="font-medium">模板:</span> 
            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-x-auto whitespace-pre-wrap">
              {template.prompt}
            </pre>
          </div>
          <div>
            <span className="font-medium">参数选项:</span>
            <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(template.parameterOptions || {}).map(([param, options]) => (
                <div key={param} className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                  <div className="font-medium text-sm">{param}:</div>
                  <div className="text-sm mt-1 flex flex-wrap gap-1">
                    {options.map((option, i) => (
                      <span 
                        key={i} 
                        className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded"
                      >
                        {option}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview; 
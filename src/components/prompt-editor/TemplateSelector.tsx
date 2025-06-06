import { PromptTemplate } from './types';

interface TemplateSelectorProps {
  templates: PromptTemplate[];
  onTemplateSelect: (template: string) => void;
  selectedTemplate: string;
}

export default function TemplateSelector({ 
  templates, 
  onTemplateSelect, 
  selectedTemplate 
}: TemplateSelectorProps) {
  if (templates.length === 0) return null;
  
  return (
    <select
      value={selectedTemplate}
      onChange={(e) => {
        const selected = e.target.value;
        if (selected) {
          const template = templates.find(t => t.title === selected || t.prompt === selected);
          if (template) onTemplateSelect(template.prompt);
        }
      }}
      className="text-sm p-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
    >
      <option value="">选择模板...</option>
      {templates.map((t, index) => (
        <option key={index} value={t.title || t.prompt}>
          {t.title || (t.prompt.length > 30 ? t.prompt.substring(0, 30) + '...' : t.prompt)}
        </option>
      ))}
    </select>
  );
}

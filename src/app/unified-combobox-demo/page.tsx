"use client";

import { useState } from "react";
import Link from "next/link";
import PromptEditor, { 
  UnifiedComboboxFeature,
  PromptTemplateNode,
  MentionNode,
  RegexBlockNode,
  PromptTemplatePlugin,
  MentionPlugin,
  RegexBlockPlugin,
  PromptTemplateData,
  PromptTemplateFeature
} from "@/components/default-prompt-editor";
import { PromptTemplate } from "@/components/default-prompt-editor";


// ai-provider-model
const aiProviderModelOptions = [
  { id: '1', name: 'gpt-4o', provider: 'openai' },
  { id: '2', name: 'gpt-4o-mini', provider: 'openai' },
  { id: '3', name: 'gpt-3.5-turbo', provider: 'openai' },
  { id: '4', name: 'gpt-3.5-turbo-mini', provider: 'openai' },
  { id: '5', name: 'claude-3-5-sonnet-20240620', provider: 'anthropic' },
  { id: '6', name: 'claude-3-5-haiku-20240307', provider: 'anthropic' },
  { id: '7', name: 'claude-3-7-sonnet-20250219', provider: 'anthropic' }
];
// prompt-template
const promptTemplateOptions: PromptTemplate[] = [
  {
    title: "Meeting Invite",
    prompt:
      "Dear [name], I would like to schedule a meeting on [date] at [time] to discuss [topic].",
    parameterOptions: {
      name: ["John", "Jane", "Team", "Everyone"],
      date: ["Today", "Tomorrow", "Next Monday", "Next Week"],
      time: ["10:00 AM", "2:00 PM", "3:30 PM", "4:00 PM"],
      topic: ["Project Planning", "Code Review", "Sprint Retrospective", "Design Discussion"],
    },
  },
  {
    title: "Project Update",
    prompt: "Hi team, Here's the update on [project]: [status]. Next steps: [actions].",
    parameterOptions: {
      project: ["Website Redesign", "Mobile App", "API Development", "Database Migration"],
      status: ["On Track", "Delayed", "Completed", "In Progress"],
      actions: ["Implement new features", "Fix bugs", "Optimize performance", "Refactor code"],
    },
  },
  {
    title: "Bug Report",
    prompt: "Bug found in [component]: [description]. Steps to reproduce: [steps]. Expected: [expected], Actual: [actual].",
    parameterOptions: {
      component: ["Login Form", "Dashboard", "API Endpoint", "Database Query"],
      description: ["User cannot log in", "Data not displayed correctly", "API returns 500 error", "Database connection issue"],
      steps: ["Click login button", "Enter username and password", "Click submit button", "Check error message"],
      expected: ["User can log in successfully", "Data is displayed correctly", "API returns 200 status code", "Database connection is successful"],
      actual: ["User cannot log in", "Data is not displayed correctly", "API returns 500 error", "Database connection is not successful"],
    },
  },
]








export default function UnifiedComboboxDemo() {
  const [content, setContent] = useState('Try typing @ for mentions, # for templates, [ for variables, or / for regex patterns.');

  const handleChange = (newContent: any) => {
    const text = typeof newContent === 'string' ? newContent : newContent.text;
    setContent(text);
  };

  const getAllPromptTemplateOptions = (
    promptTemplateOptions: PromptTemplate[]
  ): { id: string; name: string; template: string }[] => {
  return promptTemplateOptions.map((template) => ({
    id: template.title || '',
    name: template.title || '',
    template: template.prompt || '',
  }));
}

  const getAllVariableOptions = (
    promptTemplateOptions: PromptTemplate[]
  ): Record<string, string[]> => {
    return promptTemplateOptions.reduce((acc, template) => {
      Object.keys(template.parameterOptions || {}).forEach((key) => {
        acc[key] = template.parameterOptions?.[key] || [];
      });
      return acc;
    }, {} as Record<string, string[]>);
  }
  return (
    <div className="min-h-screen p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Unified Combobox Plugin Demo</h1>
        <Link href="/" className="text-blue-500 hover:underline">
          返回首页
        </Link>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">


        {/* Editor */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">编辑器</h2>

          <PromptEditor
            value={content}
            onChange={handleChange}
            placeholder="尝试输入 @、#、[ 或 / 来触发自动完成..."
            style={{
              minHeight: "200px",
              padding: "12px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              backgroundColor: "white",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
            className="dark:bg-gray-900 dark:border-gray-700"
            editorConfig={{
              nodes: [PromptTemplateNode, MentionNode, RegexBlockNode],
            }}
          >
            {/* Base plugins for node support */}
            <PromptTemplateFeature
              parameterOptions={getAllVariableOptions(promptTemplateOptions)}
            />
            {/* <MentionPlugin /> */}
            {/* <RegexBlockPlugin /> */}

            {/* Unified combobox for all triggers */}
            <UnifiedComboboxFeature
              mentionOptions={aiProviderModelOptions}
              // onSelectMention={(mention) => {
              //   console.log("Selected mention:", mention);
              // }}
              templateOptions={getAllPromptTemplateOptions(promptTemplateOptions)}
              // onSelectTemplate={(template) => {
              //   console.log("Selected template:", template);
              // }}
              // variableOptions={getAllVariableOptions(promptTemplateOptions)}
              // onSelectVariable={(variable, value) => {
              //   console.log(`Selected ${value} for variable ${variable}`);
              // }}
              commandOptions={[{ id: '1', command: 'translate' }, { id: '2', command: 'summarize' }, { id: '3', command: 'explain' }, { id: '4', command: 'generate' }, { id: '5', command: 'rewrite' }, { id: '6', command: 'proofread' }, { id: '7', command: 'improve' }]}

            />
          </PromptEditor>
        </div>

        {/* Current Content */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <pre className="p-4 bg-gray-100 dark:bg-gray-700 rounded overflow-auto whitespace-pre-wrap">
            {content}
          </pre>
        </div>
      </div>
    </div>

  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import InteractivePrompt from "@/components/InteractivePrompt";
import { articleOptions, articleTemplates } from "@/components/promptConfig";

export default function PromptDemo() {
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  
  // 模拟生成内容
  const handleGenerate = () => {
    // 实际应用中，这里可能是调用AI接口
    setGeneratedContent(`基于您的提示词：\n\n"${prompt}"\n\n我们已模拟生成内容。在实际应用中，这里会调用AI接口生成真实内容。`);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">交互式提示词组件演示</h1>
        <Link href="/" className="text-blue-500 hover:underline">
          返回首页
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">文章创作助手</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            使用下方的交互式提示词编辑器，快速创建专业的文章创作提示。点击蓝色的[方括号]选择参数。
          </p>
          
          <div className="mb-6">
            <InteractivePrompt
              value={prompt}
              onChange={setPrompt}
              templates={articleTemplates}
              bracketOptions={articleOptions}
              height="10rem"
              placeholder="输入您的文章创作需求，或从上方选择模板..."
            />
          </div>
          
          <button
            onClick={handleGenerate}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            生成内容
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">生成结果</h2>
          
          {generatedContent ? (
            <div className="p-4 bg-gray-100 rounded-md h-72 overflow-auto dark:bg-gray-700">
              <p className="whitespace-pre-wrap">{generatedContent}</p>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-72 text-gray-400">
              <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
              <p>点击"生成内容"按钮查看结果</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">关于交互式提示词组件</h2>
        <p className="mb-4">
          这个演示展示了<code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">InteractivePrompt</code>组件的通用性和可复用性。
          该组件可以轻松集成到任何需要结构化输入的场景中。
        </p>
        
        <h3 className="text-lg font-medium mb-2">主要特点：</h3>
        <ul className="list-disc list-inside space-y-1 mb-4">
          <li>支持自定义方括号选项</li>
          <li>内置模板选择功能</li>
          <li>实时交互式编辑</li>
          <li>完全可定制的UI</li>
          <li>易于集成到现有项目</li>
        </ul>
        
        <p>
          在实际应用中，您可以根据不同的使用场景自定义方括号选项和模板，
          例如：SEO内容生成、营销文案创作、产品描述、用户画像分析等。
        </p>
      </div>
    </div>
  );
} 
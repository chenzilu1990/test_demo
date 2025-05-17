"use client";

import { useState } from "react";
import Link from "next/link";
import InteractivePrompt from "@/components/InteractivePrompt";
import { allBracketOptions, allPromptTemplates } from "@/components/promptConfig";

export default function MultiSceneDemo() {
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  
  // 模拟生成内容
  const handleGenerate = () => {
    setGeneratedContent(`基于您的跨场景提示词：\n\n"${prompt}"\n\n我们已模拟生成内容。此页面展示了如何在一个应用中支持多种场景的提示词模板。`);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">多场景提示词演示</h1>
        <Link href="/" className="text-blue-500 hover:underline">
          返回首页
        </Link>
      </div>
      
      <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">跨场景提示词编辑器</h2>
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          这个页面演示了如何使用集成的配置支持多种场景的提示词。模板下拉菜单中包含了用户画像分析和文章创作的所有模板。
        </p>
        
        <div className="mb-6">
          <InteractivePrompt
            value={prompt}
            onChange={setPrompt}
            templates={allPromptTemplates}
            bracketOptions={allBracketOptions}
            height="10rem"
            placeholder="从下拉菜单选择任意场景的模板，包括用户画像和文章创作..."
          />
        </div>
        
        <button
          onClick={handleGenerate}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          生成内容
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">配置管理优势</h2>
          
          <div className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-900 rounded-md">
              <h3 className="font-medium mb-1">中心化配置</h3>
              <p className="text-sm">所有方括号选项和模板都集中在一个配置文件中，便于管理和更新</p>
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
              <h3 className="font-medium mb-1">灵活组合</h3>
              <p className="text-sm">可以根据需要导入特定场景的配置，或者合并多个场景的配置</p>
            </div>
            
            <div className="p-3 bg-purple-50 dark:bg-purple-900 rounded-md">
              <h3 className="font-medium mb-1">易于扩展</h3>
              <p className="text-sm">只需在配置文件中添加新的选项和模板，无需修改组件代码</p>
            </div>
            
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900 rounded-md">
              <h3 className="font-medium mb-1">代码复用</h3>
              <p className="text-sm">同一个组件可以在不同页面以不同配置重复使用，减少重复代码</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
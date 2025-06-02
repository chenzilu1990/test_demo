"use client";

import Link from "next/link";
import ParameterizedTemplateExample from "@/app/ai-providers-chat/components/ParameterizedTemplateExample";

export default function PromptTemplateDemo() {
  return (
    <div className="min-h-screen p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">参数化模板演示</h1>
        <div className="space-x-4">
          <Link href="/prompt-demo" className="text-blue-500 hover:underline">
            提示词演示
          </Link>
          <Link href="/" className="text-blue-500 hover:underline">
            返回首页
          </Link>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <ParameterizedTemplateExample />
      </div>
      
      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">关于参数化模板</h2>
        <p className="mb-4">
          参数化模板功能允许你预定义带有可选参数的提示词模板。这在需要标准化输入格式的场景中非常有用。
        </p>
        
        <h3 className="text-lg font-medium mb-2">技术特点：</h3>
        <ul className="list-disc list-inside space-y-1 mb-4">
          <li>支持 <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">PromptTemplate</code> 类型</li>
          <li>自动解析模板中的方括号参数</li>
          <li>支持动态生成更多选项（模拟 LLM 功能）</li>
          <li>选项缓存和更新机制</li>
          <li>基于 Lexical 编辑器的富文本交互</li>
        </ul>
        
        <h3 className="text-lg font-medium mb-2">使用场景：</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>标准化的客服对话模板</li>
          <li>结构化的数据查询</li>
          <li>表单式的内容生成</li>
          <li>多参数的 AI 提示词构建</li>
        </ul>
      </div>
    </div>
  );
} 
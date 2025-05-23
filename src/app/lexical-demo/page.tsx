"use client";

import { useState } from "react";
import Link from "next/link";
import LexicalPromptEditor from "@/components/lexical-editor/LexicalPromptEditor";
import { BracketOption } from "@/components/types";

export default function LexicalDemo() {
  const [prompt, setPrompt] = useState("我的目标市场是[国家]，目标用户是[性别]，目标[年龄段]，品类是[产品或品类]，产品优势是[产品优势或卖点]请帮我做目标用户画像分析");

  // 方括号选项配置
  const bracketOptions: Record<string, BracketOption> = {
    "国家": { 
      type: "国家", 
      options: ["中国", "美国", "日本", "韩国", "德国", "法国", "英国", "澳大利亚"] 
    },
    "性别": { 
      type: "性别", 
      options: ["男性", "女性", "不限"] 
    },
    "年龄段": { 
      type: "年龄段", 
      options: ["18-24岁", "25-34岁", "35-44岁", "45-54岁", "55岁以上", "不限"] 
    },
    "产品或品类": { 
      type: "产品或品类", 
      options: ["美妆护肤", "服装鞋帽", "家居用品", "电子产品", "食品饮料", "运动健身", "母婴用品"] 
    },
    "产品优势或卖点": { 
      type: "产品优势", 
      options: ["价格实惠", "质量上乘", "设计独特", "功能创新", "使用方便", "环保健康"] 
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lexical 参数化提示词编辑器</h1>
        <Link href="/" className="text-blue-500 hover:underline">
          返回首页
        </Link>
      </div>
      
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">智能提示词编辑器</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            基于 Lexical 构建的富文本编辑器，支持参数化提示词模板。点击蓝色方括号选择参数，点击绿色已选值重新编辑。
          </p>
          
          <LexicalPromptEditor
            value={prompt}
            onChange={setPrompt}
            bracketOptions={bracketOptions}
            height="10rem"
            placeholder="在这里输入您的提示词模板..."
          />
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">当前提示词</h2>
          <pre className="p-4 bg-gray-100 dark:bg-gray-700 rounded overflow-auto whitespace-pre-wrap">
            {prompt}
          </pre>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Lexical 编辑器优势</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded">
              <h3 className="font-semibold mb-2">🎯 自定义节点</h3>
              <p className="text-sm">支持创建自定义节点类型，完美适配参数化内容</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900 rounded">
              <h3 className="font-semibold mb-2">⚡ 高性能</h3>
              <p className="text-sm">现代架构设计，性能优于传统富文本编辑器</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900 rounded">
              <h3 className="font-semibold mb-2">🔧 可扩展</h3>
              <p className="text-sm">强大的插件系统，轻松添加新功能</p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900 rounded">
              <h3 className="font-semibold mb-2">💾 序列化</h3>
              <p className="text-sm">支持多种序列化格式，便于数据存储和传输</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

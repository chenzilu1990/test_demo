"use client";

import { useState } from "react";
import InteractivePrompt from "@/components/prompt-editor/InteractivePrompt";
import { BracketParameterOptions } from "@/components/prompt-editor/types";
import { PromptTemplate } from "@/components/prompt-editor/types";

/**
 * 参数化模板示例组件
 * 演示如何正确使用 InteractivePrompt 的 PromptTemplate 功能
 */
export default function ParameterizedTemplateExample() {
  const [prompt, setPrompt] = useState("");
  
  // 定义参数化模板
  const paramTemplate: PromptTemplate = {
    title: "旅行规划助手",
    prompt: "请为我规划一次去[目的地]的[天数]天旅行，预算约[预算]元，出行方式是[交通方式]。",
    parameterOptions: {
      "目的地": ["日本", "泰国", "新加坡", "韩国", "马来西亚"],
      "天数": ["3", "5", "7", "10", "14"],
      "预算": ["5000", "10000", "15000", "20000", "30000"],
      "交通方式": ["飞机", "火车", "自驾", "邮轮"]
    }
  };

  // 基础的方括号选项（可以为空，因为 paramTemplate 已包含所需选项）
  const bracketOptions: BracketParameterOptions = {};

  // 处理生成更多选项
  const handleGenerateMoreOptions = async (paramName: string, currentOptions: string[]) => {
    console.log(`正在为 ${paramName} 生成更多选项...`);
    
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 根据参数名返回不同的新选项
    const newOptionsMap: Record<string, string[]> = {
      "目的地": ["越南", "印度尼西亚", "菲律宾"],
      "天数": ["21", "30"],
      "预算": ["50000", "100000"],
      "交通方式": ["高铁", "巴士"]
    };
    
    return newOptionsMap[paramName] || [];
  };

  // 处理选项更新
  const handleBracketOptionsUpdate = (updatedOptions: BracketParameterOptions) => {
    console.log("方括号选项已更新:", updatedOptions);
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">参数化模板示例</h2>
      
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          使用 useContentEditable = true 模式，支持参数化模板：
        </p>
        
        <InteractivePrompt
          value={prompt}
          onChange={setPrompt}
          bracketOptions={bracketOptions}
          paramTemplate={paramTemplate}
          useContentEditable={true}
          onGenerateMoreOptions={handleGenerateMoreOptions}
          onBracketOptionsUpdate={handleBracketOptionsUpdate}
          placeholder="选择模板或输入自定义提示词..."
          height="10rem"
        />
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <p className="text-sm font-semibold mb-2">当前提示词：</p>
        <p className="text-sm">{prompt || "（空）"}</p>
      </div>
      
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 提示：</p>
        <ul className="list-disc list-inside space-y-1">
          <li>点击蓝色方括号可选择预定义选项</li>
          <li>在选项面板中点击"生成更多"可动态添加新选项</li>
          <li>选择后的内容会变为绿色，可点击重新选择</li>
          <li>模板会自动加载并解析参数</li>
        </ul>
      </div>
    </div>
  );
} 
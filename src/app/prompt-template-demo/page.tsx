"use client";

import { useState } from "react";
import Link from "next/link";
import PromptEditor from "@/components/default-prompt-editor";
import { PromptTemplateFeature, PromptTemplateNode } from "@/components/default-prompt-editor/plugins/prompt-template";
import type { PromptTemplate } from "@/components/prompt-editor/types";

// 预定义的模板
const templates: PromptTemplate[] = [
  {
    title: "跨境电商用户画像",
    prompt: "我的目标市场是[国家]，目标用户是[性别]，目标[年龄段]，品类是[产品或品类]，产品优势是[产品优势或卖点]，请帮我做目标用户画像分析",
    parameterOptions: {
      "国家": ["美国", "中国", "日本", "韩国", "英国", "法国", "德国"],
      "性别": ["男性", "女性", "不限"],
      "年龄段": ["18-25岁", "26-35岁", "36-45岁", "46-55岁", "56岁以上"],
      "产品或品类": ["电子产品", "服装鞋帽", "美妆护肤", "食品饮料", "家居用品", "运动户外"],
      "产品优势或卖点": ["高性价比", "品质卓越", "创新设计", "环保可持续", "便捷实用", "个性定制"]
    }
  },
  {
    title: "产品描述生成",
    prompt: "为{产品名称}撰写一段[语言]的产品描述，突出{核心卖点}，字数控制在[字数范围]字左右",
    parameterOptions: {
      "产品名称": ["智能手表", "蓝牙耳机", "护肤套装", "运动鞋", "咖啡机"],
      "语言": ["中文", "英文", "日文", "韩文", "法文"],
      "核心卖点": ["性能强劲", "外观时尚", "使用便捷", "性价比高", "品质保证"],
      "字数范围": ["100-200", "200-300", "300-500", "500-800"]
    }
  },
  {
    title: "邮件模板",
    prompt: "写一封{{邮件类型}}邮件给{{收件人}}，关于{{主题}}，语气要{{语气风格}}",
    parameterOptions: {
      "邮件类型": ["商务", "感谢", "道歉", "询问", "通知"],
      "收件人": ["客户", "同事", "上级", "合作伙伴", "供应商"],
      "主题": ["项目进展", "会议安排", "合作提案", "问题反馈", "订单确认"],
      "语气风格": ["正式", "友好", "专业", "轻松", "严肃"]
    }
  }
];

export default function PromptTemplateDemo() {
  const [currentTemplate, setCurrentTemplate] = useState<PromptTemplate>(templates[0]);
  const [prompt, setPrompt] = useState(currentTemplate.prompt);
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});

  const handleTemplateChange = (template: PromptTemplate) => {
    setCurrentTemplate(template);
    setPrompt(template.prompt);
    setSelectedValues({});
  };

  const handleOptionSelect = (parameterName: string, selectedValue: string) => {
    setSelectedValues(prev => ({
      ...prev,
      [parameterName]: selectedValue
    }));
  };

  return (
    <div className="min-h-screen p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">PromptTemplate 格式支持演示</h1>
        <Link href="/" className="text-blue-500 hover:underline">
          返回首页
        </Link>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* 模板选择器 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">选择模板</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template, index) => (
              <button
                key={index}
                onClick={() => handleTemplateChange(template)}
                className={`p-4 rounded-lg border transition-all ${
                  currentTemplate.title === template.title
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <h3 className="font-semibold text-left">{template.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-left">
                  {template.prompt.substring(0, 50)}...
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* 编辑器 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">智能提示词编辑器</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            支持 [参数]、{`{参数}`} 和 {`{{参数}}`} 三种格式。点击蓝色参数选择值，点击绿色已选值重新编辑。
          </p>

          <PromptEditor
            value={prompt}
            onChange={(content) => {
              if (typeof content === "string") {
                setPrompt(content);
              } else {
                setPrompt(content.text);
              }
            }}
            placeholder="在这里输入或编辑提示词..."
            style={{
              minHeight: "200px",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              backgroundColor: "white",
            }}
            editorConfig={{
              nodes: [PromptTemplateNode],
            }}
          >
            <PromptTemplateFeature 
              parameterOptions={currentTemplate.parameterOptions || {}}
              onSelectOption={handleOptionSelect}
            />
          </PromptEditor>
        </div>

        {/* 当前内容 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">当前提示词</h2>
          <pre className="p-4 bg-gray-100 dark:bg-gray-700 rounded overflow-auto whitespace-pre-wrap">
            {prompt}
          </pre>
        </div>

        {/* 已选择的参数值 */}
        {Object.keys(selectedValues).length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">已选择的参数值</h2>
            <div className="space-y-2">
              {Object.entries(selectedValues).map(([param, value]) => (
                <div key={param} className="flex items-center gap-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {param}:
                  </span>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 功能说明 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">功能特性</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
              <h3 className="font-semibold mb-2">📝 多格式支持</h3>
              <p className="text-sm">
                支持方括号[]、单花括号{}、双花括号{{}}三种参数格式
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded">
              <h3 className="font-semibold mb-2">🎯 智能识别</h3>
              <p className="text-sm">
                自动识别文本中的参数并转换为可交互节点
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded">
              <h3 className="font-semibold mb-2">✨ 实时转换</h3>
              <p className="text-sm">
                输入时实时转换参数格式，无需手动操作
              </p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <h3 className="font-semibold mb-2">🔄 双向编辑</h3>
              <p className="text-sm">
                支持选择参数值后重新编辑，灵活调整内容
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
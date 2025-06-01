// types.ts - 提取共用类型定义
export interface PromptTemplate {
  name: string;
  template: string;
}

// 提示词示例
const userProfile = "美国市场中，目标群体为女性，年龄段20-35岁，关注品类为电子产品，产品优势为高性价比。"

// 带参数的模板类型定义
export interface PromptTemplateWithOptions  {
  title: string;
  template: string;
  parameterOptions: Record<string, string[]>;
}

// 带参数的模板示例
const userProfileTemplate: PromptTemplateWithOptions = {
  "title": "目标用户画像分析",
  "template": "[国家]市场中，目标群体为[性别]，年龄段[年龄段]，关注品类为[产品或品类]，产品优势为[产品优势]。",
  "parameterOptions": {
    "国家": ["美国", "中国", "印度", "英国", "德国"],
    "性别": ["男性", "女性", "非二元性别"],
    "年龄段": ["13-19岁", "20-35岁", "36-55岁", "56岁及以上"],
    "产品或品类": ["电子产品", "服装和配饰", "美容产品", "健康和健身", "家居用品"],
    "产品优势": ["高性价比", "创新功能", "环保材料", "简易操作", "时尚设计"]
  }
}

export interface BracketOption {
  type: string;
  options: string[];
}

export interface SelectedOption {
  id: string;           // 唯一标识符
  type: string;
  originalBracket: string; // 原始方括号内容，如 "[国家]"
  selectedValue: string;   // 已选择的值，如 "中国"
  position: {start: number; end: number};
}


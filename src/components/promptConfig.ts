import { BracketOption, PromptTemplate } from "./types";

/**
 * 用户画像分析相关配置
 */
export const userProfileOptions: Record<string, BracketOption> = {
  "国家": { 
    type: "国家", 
    options: ["中国", "美国", "日本", "韩国", "德国", "法国", "英国", "澳大利亚", "加拿大", "其他"] 
  },
  "性别": { 
    type: "性别", 
    options: ["男性", "女性", "不限"] 
  },
  "年龄段": { 
    type: "年龄段", 
    options: ["18-24岁", "25-34岁", "35-44岁", "45-54岁", "55岁以上", "不限"] 
  },
  "产品或品类（输入越详细分析越精准）": { 
    type: "产品或品类", 
    options: ["美妆护肤", "服装鞋帽", "家居用品", "电子产品", "食品饮料", "运动健身", "母婴用品", "其他"] 
  },
  "产品优势或卖点": { 
    type: "产品优势", 
    options: ["价格实惠", "质量上乘", "设计独特", "功能创新", "使用方便", "环保健康", "其他"] 
  }
};

/**
 * 亚马逊标题优化-案例
 * 我想让你作为一位爆品标题写作专家，根据产品的核心关键词生成一个150-200字符的亚马逊标题，注意要求植入该核心产品相关的热点流行词，制作出非常吸引人购买的标题。产品的核心关键词是：[自行车]。请使用[英文]回答，给出10条回复，同时确保产品的核心关键词内容所有都完全出现在标题中。
 */
export const amazonTitleOptions: Record<string, BracketOption> = {
  "核心关键词": {
    type: "核心关键词",
    options: ["自行车", "电动车", "摩托车", "汽车", "手机", "电脑", "电视", "冰箱", "洗衣机", "空调", "热水器", "其他"]
  },
  "语言": {
    type: "语言",
    options: ["中文", "英文", "日文", "韩文", "法文", "德文", "其他"] 
  },
  "字数": {
    type: "字数",
    options: ["150-200字", "200-300字", "300-400字", "400-500字"]
  }
};


export const userProfileTemplates: PromptTemplate[] = [
  { 
    name: "通用对话", 
    template: "你好，请回答我的问题：" 
  },
  { 
    name: "知识问答", 
    template: "请详细解释以下概念：" 
  },
  { 
    name: "创意写作", 
    template: "请基于以下主题创作一篇短文：" 
  },
  { 
    name: "代码生成", 
    template: "请用以下编程语言实现这个功能：\n\n功能描述：" 
  },
  { 
    name: "翻译助手", 
    template: "请将以下内容翻译成英文：" 
  },
  {
    name: "用户画像分析",
    template: "我的目标市场是[国家]，目标用户是[性别]，目标[年龄段]，品类是[产品或品类（输入越详细分析越精准）]，产品优势是[产品优势或卖点]请帮我做目标用户画像分析"
  }
];

/**
 * 文章创作相关配置
 */
export const articleOptions: Record<string, BracketOption> = {
  "主题": { 
    type: "主题", 
    options: ["科技创新", "环境保护", "健康生活", "文化艺术", "教育发展", "旅行探索"] 
  },
  "风格": { 
    type: "风格", 
    options: ["严肃学术", "轻松诙谐", "深度思考", "简洁明了", "富有感情", "专业技术"] 
  },
  "长度": { 
    type: "长度", 
    options: ["短文(300字以内)", "中等(500-800字)", "长文(1000字以上)"] 
  },
  "受众": { 
    type: "受众", 
    options: ["普通大众", "专业人士", "学生群体", "老年人", "青少年", "儿童"] 
  },
  "格式": { 
    type: "格式", 
    options: ["议论文", "说明文", "记叙文", "演讲稿", "新闻报道", "博客文章"] 
  }
};

export const articleTemplates: PromptTemplate[] = [
  {
    name: "文章创作",
    template: "请以[主题]为主题，采用[风格]的风格，写一篇[长度]的[格式]，面向[受众]。"
  },
  {
    name: "故事创作",
    template: "请创作一个关于[主题]的短故事，风格要[风格]，适合[受众]阅读。"
  },
  {
    name: "演讲稿",
    template: "请为我准备一份关于[主题]的演讲稿，风格[风格]，长度大约[长度]，面向[受众]。"
  },
  {
    name: "亚马逊标题优化-案例",
    template: "我想让你作为一位爆品标题写作专家，根据产品的核心关键词生成一个150-200字符的亚马逊标题，注意要求植入该核心产品相关的热点流行词，制作出非常吸引人购买的标题。产品的核心关键词是：[核心关键词]。请使用[语言]回答，给出10条回复，同时确保产品的核心关键词内容所有都完全出现在标题中。"
  }
];

/**
 * 融合所有选项，可用于支持多场景的通用应用
 */
export const allBracketOptions: Record<string, BracketOption> = {
  ...userProfileOptions,
  ...articleOptions
};

/**
 * 融合所有模板，可用于支持多场景的通用应用
 */
export const allPromptTemplates: PromptTemplate[] = [
  ...userProfileTemplates,
  ...articleTemplates
]; 
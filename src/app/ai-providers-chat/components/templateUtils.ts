import { PromptTemplate } from '@/components/prompt-editor/types';
import { AIProvider, ChatMessage } from '@/ai-providers/types';

export const SYSTEM_PROMPT = `你是一个专业的提示词模板生成器。你需要将用户的提示词转换为带参数的模板格式，参数必须用方括号[]包裹。
输出必须是有效的JSON格式，包含以下字段：
1. title: 简短描述模板用途的标题
2. prompt: 将原始提示词中的具体内容替换为参数的模板
3. parameterOptions: 为每个参数提供可选值的对象，每个参数至少提供5个选项

确保JSON格式有效，每个参数必须有参数选项。每个参数的选项要尽量覆盖不同的可能值，有代表性。`;

export const createUserInstruction = (userPrompt: string): string => {
  return `请将以下提示词转换为带参数的模板：
${userPrompt}

输出格式示例：
{
  "title": "目标用户画像分析",
  "prompt": "[国家]市场中，目标群体为[性别]，年龄段[年龄段]，关注品类为[产品或品类]，产品优势为[产品优势]。",
  "parameterOptions": {
    "国家": ["美国", "中国", "印度", "英国", "德国"],
    "性别": ["男性", "女性", "非二元性别"],
    "年龄段": ["13-19岁", "20-35岁", "36-55岁", "56岁及以上"],
    "产品或品类": ["电子产品", "服装和配饰", "美容产品", "健康和健身", "家居用品"],
    "产品优势": ["高性价比", "创新功能", "环保材料", "简易操作", "时尚设计"]
  }
}

注意：直接输出JSON格式，不要添加额外的解释文字。`;
};

/**
 * 从AI响应中提取JSON内容
 */
export const extractJSON = (content: string): string => {
  // 如果内容被代码块包裹(```json ... ```)，提取代码块内容
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1];
  }
  
  // 尝试匹配整个内容作为JSON
  const jsonMatch = content.match(/\s*(\{[\s\S]*\})\s*/);
  if (jsonMatch && jsonMatch[1]) {
    return jsonMatch[1];
  }
  
  return content;
};

/**
 * 验证生成的模板格式
 */
export const validateTemplate = (template: any): template is PromptTemplate => {
  if (!template || typeof template !== 'object') return false;
  
  if (!template.title || typeof template.title !== 'string') return false;
  if (!template.prompt || typeof template.prompt !== 'string') return false;
  if (!template.parameterOptions || typeof template.parameterOptions !== 'object') return false;
  
  // 验证参数选项
  for (const [param, options] of Object.entries(template.parameterOptions)) {
    if (!Array.isArray(options) || options.length === 0) {
      throw new Error(`参数 "${param}" 的选项格式不正确`);
    }
    // 确保所有选项都是字符串
    if (!options.every(opt => typeof opt === 'string')) {
      throw new Error(`参数 "${param}" 的选项必须都是字符串`);
    }
  }
  
  return true;
};

/**
 * 解析模型ID，返回实际的模型ID部分
 */
export const parseModelId = (selectedModel: string): string => {
  const modelIdParts = selectedModel.split(':');
  if (modelIdParts.length !== 2) {
    throw new Error('无效的模型ID格式');
  }
  
  const modelId = modelIdParts[1];
  if (!modelId) {
    throw new Error('无效的模型ID');
  }
  
  return modelId;
};

/**
 * 生成模板的核心函数
 */
export const generateTemplateFromPrompt = async (
  provider: AIProvider,
  selectedModel: string,
  userPrompt: string
): Promise<PromptTemplate> => {
  const modelId = parseModelId(selectedModel);
  
  console.log(`使用模型 ${selectedModel} 生成模板`);

  // 构建消息数组，使用正确的类型
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: createUserInstruction(userPrompt) }
  ];

  // 调用AI生成模板
  const response = await provider.chat({
    model: modelId,
    messages,
    temperature: 0.7,
    max_tokens: 2000
  });

  // 解析响应
  if (!response?.choices?.[0]?.message?.content) {
    throw new Error('AI返回的响应格式无效或内容为空');
  }
  
  const content = response.choices[0].message.content;
  // 处理可能的数组类型 content
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  console.log('生成的模板原始内容：', contentStr);

  const jsonStr = extractJSON(contentStr);
  console.log('提取的JSON字符串：', jsonStr);

  try {
    const template = JSON.parse(jsonStr);
    
    if (!validateTemplate(template)) {
      throw new Error('生成的模板格式不正确');
    }
    
    return template;
  } catch (parseError: any) {
    console.error('JSON解析错误:', parseError);
    throw new Error(`无法解析生成的模板: ${parseError.message}`);
  }
}; 
/**
 * 浏览器控制台执行脚本
 * 在提示词模板管理页面的浏览器控制台中粘贴执行以下代码
 */

// 将所有初始化逻辑包装在一个立即执行函数中
export const initEcommerceTemplatesInBrowser = () => {
  console.log('🚀 开始初始化跨境电商模板...');
  
  // 动态导入并执行初始化
  import('./initEcommerceTemplates').then(({ initializeEcommerceTemplates }) => {
    const result = initializeEcommerceTemplates();
    
    // 显示结果
    console.log(result.summary);
    
    // 刷新页面以显示新模板
    setTimeout(() => {
      console.log('🔄 正在刷新页面以显示新模板...');
      window.location.reload();
    }, 2000);
    
  }).catch(error => {
    console.error('❌ 初始化失败:', error);
  });
};

// 在浏览器控制台中可以直接调用的全局函数
if (typeof window !== 'undefined') {
  (window as any).initEcommerceTemplates = initEcommerceTemplatesInBrowser;
}

// 控制台执行代码（复制粘贴到控制台）
export const BROWSER_EXECUTION_CODE = `
// 跨境电商模板初始化脚本
// 复制以下代码到浏览器控制台中执行

(function() {
  console.log('🚀 开始初始化跨境电商模板和标签...');
  
  // 标签数据
  const ECOMMERCE_TAGS = [
    { name: '跨境电商', color: 'bg-blue-500' },
    { name: '亚马逊', color: 'bg-orange-500' },
    { name: '产品运营', color: 'bg-green-500' },
    { name: '市场调研', color: 'bg-purple-500' },
    { name: '营销推广', color: 'bg-pink-500' },
    { name: '品牌建设', color: 'bg-indigo-500' },
    { name: 'SEO优化', color: 'bg-yellow-500' },
    { name: '运营售后', color: 'bg-red-500' },
    { name: '供应链管理', color: 'bg-teal-500' },
    { name: '物流仓储', color: 'bg-cyan-500' }
  ];
  
  // 创建标签
  function createTags() {
    const existingTags = JSON.parse(localStorage.getItem('ai-template-tags') || '[]');
    const createdTagIds = [];
    
    for (const tagData of ECOMMERCE_TAGS) {
      const existing = existingTags.find(tag => tag.name === tagData.name);
      if (existing) {
        createdTagIds.push(existing.id);
        console.log(\`标签 "\${tagData.name}" 已存在，跳过创建\`);
        continue;
      }
      
      const newTag = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name: tagData.name,
        color: tagData.color,
        createdAt: new Date().toISOString()
      };
      
      existingTags.push(newTag);
      createdTagIds.push(newTag.id);
      console.log(\`✅ 成功创建标签: \${tagData.name}\`);
    }
    
    localStorage.setItem('ai-template-tags', JSON.stringify(existingTags));
    return { existingTags, createdTagIds };
  }
  
  // 创建模板
  function createTemplates(allTags) {
    const templates = [
      {
        title: 'Amazon产品标题优化器',
        prompt: \`作为亚马逊SEO专家，我需要为产品创建优化的标题。请根据以下信息生成一个150-200字符的亚马逊产品标题：

产品名称：{productName}
核心关键词：{coreKeywords}
产品特点：{features}
目标受众：{targetAudience}
产品用途：{usage}

要求：
1. 标题中必须包含所有核心关键词
2. 突出3个最重要的卖点
3. 包含2个主要使用场景
4. 明确目标用户群体
5. 符合亚马逊标题规范
6. 吸引点击和转化

请提供5个不同的标题选项，并说明每个标题的优势。\`,
        parameterOptions: {
          productName: ['无线蓝牙耳机', 'LED台灯', '瑜伽垫', '咖啡杯'],
          coreKeywords: ['wireless bluetooth earbuds', 'LED desk lamp', 'yoga mat', 'travel mug'],
          features: ['防水', '长续航', '快充', '降噪', '便携'],
          targetAudience: ['运动爱好者', '办公人群', '学生', '旅行者'],
          usage: ['健身房', '办公室', '居家', '旅行', '户外']
        },
        tags: ['跨境电商', '亚马逊', 'SEO优化', '产品运营']
      },
      {
        title: 'Amazon产品5点描述生成器',
        prompt: \`作为资深亚马逊卖家，请根据以下产品信息编写Amazon产品的5点描述（Bullet Points）：

产品名称：{productName}
产品类别：{category}
核心功能：{coreFeatures}
材质规格：{specifications}
使用场景：{useScenarios}
竞争优势：{advantages}

要求：
1. 每点控制在250字符以内
2. 第一点突出核心功能和主要卖点
3. 包含关键词但避免堆砌
4. 使用有说服力的语言
5. 突出产品独特性和竞争优势
6. 包含技术参数和材质信息
7. 呼应目标客户的痛点

请按重要性排序输出5个bullet points。\`,
        parameterOptions: {
          productName: ['蓝牙音箱', '空气净化器', '按摩椅', '智能手表'],
          category: ['电子产品', '家居用品', '健康美容', '运动户外'],
          coreFeatures: ['音质清晰', '高效净化', '深度按摩', '健康监测'],
          specifications: ['防水IPX7', 'HEPA滤网', '零重力设计', '50米防水'],
          useScenarios: ['户外野餐', '卧室睡眠', '办公减压', '运动健身'],
          advantages: ['续航12小时', '99.97%过滤', '4D按摩技术', '7天续航']
        },
        tags: ['跨境电商', '亚马逊', '产品运营', 'SEO优化']
      },
      {
        title: '产品市场洞察分析器',
        prompt: \`作为市场研究专家，请对以下产品在目标市场的消费者行为进行深度分析：

产品类别：{productCategory}
目标市场：{targetMarket}
价格区间：{priceRange}
销售平台：{platform}
竞争环境：{competition}

请从以下维度进行分析：

**1. 目标用户画像**
- 年龄、性别、收入水平
- 生活方式和消费习惯
- 购买决策因素

**2. 使用场景分析**
- 主要使用场景
- 购买时机和频率
- 季节性影响

**3. 用户痛点和需求**
- 当前解决方案的不足
- 未被满足的需求
- 潜在的新需求

**4. 市场机会和建议**
- 产品优化方向
- 营销策略建议
- 定价策略建议

请提供具体且可操作的洞察。\`,
        parameterOptions: {
          productCategory: ['智能家居', '美容护肤', '健身器材', '厨房用品', '宠物用品'],
          targetMarket: ['美国', '欧洲', '日本', '澳洲', '东南亚'],
          priceRange: ['10-30美元', '30-100美元', '100-300美元', '300美元以上'],
          platform: ['Amazon', 'eBay', 'Shopify独立站', '多平台'],
          competition: ['激烈', '中等', '较少', '蓝海市场']
        },
        tags: ['跨境电商', '市场调研', '产品运营', '营销推广']
      },
      {
        title: 'Amazon广告关键词策略师',
        prompt: \`作为Amazon PPC广告专家，请为以下产品制定全面的关键词广告策略：

产品名称：{productName}
产品类别：{category}
主要特征：{mainFeatures}
目标客户：{targetCustomer}
预算范围：{budget}
竞争程度：{competitionLevel}

请提供以下关键词策略：

**1. 核心关键词（5-8个）**
- 搜索量大、转化率高的主要关键词
- 建议出价范围

**2. 长尾关键词（10-15个）**
- 精准度高、竞争较小的长尾词
- 适合的匹配类型

**3. 竞品关键词（3-5个）**
- 主要竞争对手品牌词
- 投放策略建议

**4. 防御性关键词（3-5个）**
- 保护自己品牌的关键词
- 避免被竞争对手截流

**5. 否定关键词列表**
- 避免无效点击的否定词

**6. 出价策略建议**
- 不同阶段的出价策略
- 优化建议

请提供具体的执行方案。\`,
        parameterOptions: {
          productName: ['无线充电器', '瑜伽服装', '咖啡机', '宠物玩具'],
          category: ['电子配件', '运动服饰', '小家电', '宠物用品'],
          mainFeatures: ['快速充电', '透气舒适', '一键操作', '耐咬安全'],
          targetCustomer: ['商务人士', '健身爱好者', '咖啡爱好者', '宠物主人'],
          budget: ['每日50美元', '每日100美元', '每日200美元', '每日500美元'],
          competitionLevel: ['高竞争', '中等竞争', '低竞争']
        },
        tags: ['跨境电商', '亚马逊', '营销推广', 'SEO优化']
      },
      {
        title: '客户评价回复模板生成器',
        prompt: \`作为专业的客户服务专家，请为以下情况生成合适的评价回复模板：

评价类型：{reviewType}
评价星级：{rating}
产品类别：{productCategory}
主要问题：{mainIssue}
客户情绪：{customerEmotion}
解决方案：{solution}

请生成一个专业、真诚且有效的回复，要求：

**回复原则：**
1. 真诚感谢客户反馈
2. 承认问题（如果存在）
3. 提供具体解决方案
4. 邀请进一步沟通
5. 展现品牌专业形象

**回复结构：**
- 开头：感谢和问候
- 中间：回应具体问题
- 结尾：后续支持承诺

**语言要求：**
- 专业但不失温度
- 简洁明了，避免模板化
- 体现品牌价值观
- 符合平台规范

请生成英文回复，并提供中文说明。\`,
        parameterOptions: {
          reviewType: ['正面评价', '负面评价', '中性评价', '产品问题', '物流问题'],
          rating: ['5星好评', '4星好评', '3星中评', '2星差评', '1星差评'],
          productCategory: ['电子产品', '服装配饰', '家居用品', '美容护肤'],
          mainIssue: ['产品质量', '物流延迟', '包装破损', '使用困难', '期望不符'],
          customerEmotion: ['满意', '失望', '愤怒', '疑惑', '中性'],
          solution: ['免费更换', '退款处理', '技术支持', '补偿优惠', '流程改进']
        },
        tags: ['跨境电商', '运营售后', '亚马逊', '品牌建设']
      }
    ];
    
    const existingTemplates = JSON.parse(localStorage.getItem('ai-prompt-templates') || '[]');
    const tagNameToId = {};
    allTags.forEach(tag => {
      tagNameToId[tag.name] = tag.id;
    });
    
    for (const templateData of templates) {
      const templateTagIds = templateData.tags.map(tagName => tagNameToId[tagName]).filter(Boolean);
      
      const newTemplate = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        title: templateData.title,
        prompt: templateData.prompt,
        parameterOptions: templateData.parameterOptions,
        createdAt: new Date().toISOString(),
        usageCount: 0,
        tags: templateTagIds
      };
      
      existingTemplates.push(newTemplate);
      console.log(\`✅ 成功创建模板: \${templateData.title}\`);
    }
    
    localStorage.setItem('ai-prompt-templates', JSON.stringify(existingTemplates));
    return templates.length;
  }
  
  try {
    // 执行初始化
    const { existingTags, createdTagIds } = createTags();
    const templateCount = createTemplates(existingTags);
    
    // 显示结果
    console.log(\`
🎉 跨境电商模板初始化完成！

📊 创建统计:
• 标签: \${ECOMMERCE_TAGS.length} 个
• 模板: \${templateCount} 个

🏷️ 创建的标签:
\${ECOMMERCE_TAGS.map(tag => \`• \${tag.name}\`).join('\\n')}

📝 创建的模板:
• Amazon产品标题优化器
• Amazon产品5点描述生成器  
• 产品市场洞察分析器
• Amazon广告关键词策略师
• 客户评价回复模板生成器

✅ 所有模板都已配置好参数选项，可以直接使用！
\`);
    
    // 2秒后刷新页面
    setTimeout(() => {
      console.log('🔄 正在刷新页面以显示新模板...');
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
  }
})();
`;

console.log('📋 浏览器执行代码已准备就绪！');
console.log('请复制 BROWSER_EXECUTION_CODE 中的代码到控制台执行。'); 
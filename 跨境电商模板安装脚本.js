// 跨境电商模板一键安装脚本（修正版）
// 请复制以下代码到浏览器控制台执行

(function() {
  console.log('🚀 开始初始化跨境电商模板和标签...');
  
  // 正确的localStorage key
  const TEMPLATES_KEY = 'ai-prompt-templates';
  const TAGS_KEY = 'ai-template-tags';
  
  // 标签数据
  const ECOMMERCE_TAGS = [
    { name: '跨境电商', color: '#3B82F6' },
    { name: '亚马逊', color: '#F97316' },
    { name: '产品运营', color: '#10B981' },
    { name: '市场调研', color: '#8B5CF6' },
    { name: '营销推广', color: '#EC4899' },
    { name: '品牌建设', color: '#6366F1' },
    { name: 'SEO优化', color: '#EAB308' },
    { name: '运营售后', color: '#EF4444' },
    { name: '供应链管理', color: '#14B8A6' },
    { name: '物流仓储', color: '#06B6D4' }
  ];
  
  // 创建标签
  function createTags() {
    let existingTags = [];
    try {
      const saved = localStorage.getItem(TAGS_KEY);
      if (saved) {
        existingTags = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('读取现有标签失败，将创建新的标签列表');
      existingTags = [];
    }
    
    const createdTagIds = [];
    
    for (const tagData of ECOMMERCE_TAGS) {
      const existing = existingTags.find(tag => tag.name === tagData.name);
      if (existing) {
        createdTagIds.push(existing.id);
        console.log(`标签 "${tagData.name}" 已存在，跳过创建`);
        continue;
      }
      
      const newTag = {
        id: 'tag_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: tagData.name,
        color: tagData.color,
        createdAt: new Date().toISOString()
      };
      
      existingTags.push(newTag);
      createdTagIds.push(newTag.id);
      console.log(`✅ 成功创建标签: ${tagData.name}`);
    }
    
    try {
      localStorage.setItem(TAGS_KEY, JSON.stringify(existingTags));
    } catch (error) {
      console.error('保存标签失败:', error);
      throw error;
    }
    
    return { existingTags, createdTagIds };
  }
  
  // 创建模板
  function createTemplates(allTags) {
    const templates = [
      {
        title: 'Amazon产品标题优化器',
        prompt: `作为亚马逊SEO专家，我需要为产品创建优化的标题。请根据以下信息生成一个150-200字符的亚马逊产品标题：

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

请提供5个不同的标题选项，并说明每个标题的优势。`,
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
        prompt: `作为资深亚马逊卖家，请根据以下产品信息编写Amazon产品的5点描述（Bullet Points）：

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

请按重要性排序输出5个bullet points。`,
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
        prompt: `作为市场研究专家，请对以下产品在目标市场的消费者行为进行深度分析：

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

请提供具体且可操作的洞察。`,
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
        prompt: `作为Amazon PPC广告专家，请为以下产品制定全面的关键词广告策略：

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

请提供具体的执行方案。`,
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
        prompt: `作为专业的客户服务专家，请为以下情况生成合适的评价回复模板：

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

请生成英文回复，并提供中文说明。`,
        parameterOptions: {
          reviewType: ['正面评价', '负面评价', '中性评价', '产品问题', '物流问题'],
          rating: ['5星好评', '4星好评', '3星中评', '2星差评', '1星差评'],
          productCategory: ['电子产品', '服装配饰', '家居用品', '美容护肤'],
          mainIssue: ['产品质量', '物流延迟', '包装破损', '使用困难', '期望不符'],
          customerEmotion: ['满意', '失望', '愤怒', '疑惑', '中性'],
          solution: ['免费更换', '退款处理', '技术支持', '补偿优惠', '流程改进']
        },
        tags: ['跨境电商', '运营售后', '亚马逊', '品牌建设']
      },
      {
        title: '产品差异化定位分析师',
        prompt: `作为产品策略专家，请帮助分析产品的差异化定位策略：

产品名称：{productName}
产品类别：{category}
主要功能：{mainFunction}
目标市场：{targetMarket}
主要竞品：{competitors}
成本限制：{costConstraint}

请从以下角度进行差异化分析：

**1. 功能差异化**
- 独特功能点
- 技术创新方向
- 性能提升建议

**2. 设计差异化**
- 外观设计创新
- 用户体验优化
- 包装设计建议

**3. 价格差异化**
- 价格定位策略
- 成本优化方案
- 价值感知提升

**4. 服务差异化**
- 售前服务创新
- 售后服务优势
- 客户体验提升

**5. 营销差异化**
- 独特卖点提炼
- 目标客群细分
- 传播策略建议

**6. 渠道差异化**
- 销售渠道创新
- 分销策略优化

请提供具体可执行的差异化方案。`,
        parameterOptions: {
          productName: ['蓝牙耳机', '智能手环', '空气炸锅', '化妆镜'],
          category: ['数码配件', '可穿戴设备', '厨房电器', '美容工具'],
          mainFunction: ['音乐播放', '健康监测', '健康烹饪', '化妆照明'],
          targetMarket: ['欧美市场', '亚洲市场', '全球市场'],
          competitors: ['Apple AirPods', 'Fitbit', 'Ninja Foodi', '其他品牌'],
          costConstraint: ['成本敏感', '中等成本', '高端定位']
        },
        tags: ['跨境电商', '产品运营', '品牌建设', '市场调研']
      },
      {
        title: 'FBA库存管理策略顾问',
        prompt: `作为Amazon FBA运营专家，请为以下产品制定库存管理策略：

产品名称：{productName}
销售历史：{salesHistory}
季节性特征：{seasonality}
库存周转：{inventoryTurnover}
资金状况：{cashFlow}
供应商情况：{supplierInfo}
竞争环境：{competition}

请提供完整的库存管理方案：

**1. 库存预测分析**
- 基于历史数据的销量预测
- 季节性调整因子
- 市场趋势影响评估

**2. 安全库存计算**
- 最低库存阈值
- 补货点设置
- 缺货风险评估

**3. 采购计划制定**
- 采购数量建议
- 采购时间节点
- 供应商管理策略

**4. 成本优化方案**
- FBA费用优化
- 存储成本控制
- 资金周转改善

**5. 风险管控措施**
- 滞销库存处理
- 断货应急预案
- 多仓储备策略

**6. 绩效监控指标**
- 关键KPI设定
- 监控频率建议
- 调整触发条件

请提供具体可执行的管理方案。`,
        parameterOptions: {
          productName: ['季节性玩具', '运动器材', '家居装饰', '电子配件'],
          salesHistory: ['稳定增长', '波动较大', '新品上市', '成熟产品'],
          seasonality: ['强季节性', '弱季节性', '无季节性', '反季节性'],
          inventoryTurnover: ['高周转(>12次/年)', '中周转(6-12次/年)', '低周转(<6次/年)'],
          cashFlow: ['资金充足', '资金紧张', '现金流正常'],
          supplierInfo: ['稳定供应商', '多个供应商', '新供应商', '供应不稳'],
          competition: ['激烈竞争', '中等竞争', '相对垄断']
        },
        tags: ['跨境电商', '亚马逊', '供应链管理', '物流仓储']
      }
    ];
    
    let existingTemplates = [];
    try {
      const saved = localStorage.getItem(TEMPLATES_KEY);
      if (saved) {
        existingTemplates = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('读取现有模板失败，将创建新的模板列表');
      existingTemplates = [];
    }
    
    const tagNameToId = {};
    allTags.forEach(tag => {
      tagNameToId[tag.name] = tag.id;
    });
    
    let successCount = 0;
    for (const templateData of templates) {
      try {
        // 检查是否已存在相同标题的模板
        const existingTemplate = existingTemplates.find(t => t.title === templateData.title);
        if (existingTemplate) {
          console.log(`模板 "${templateData.title}" 已存在，跳过创建`);
          continue;
        }
        
        const templateTagIds = templateData.tags.map(tagName => tagNameToId[tagName]).filter(Boolean);
        
        const newTemplate = {
          id: 'param_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          title: templateData.title,
          prompt: templateData.prompt,
          parameterOptions: templateData.parameterOptions,
          createdAt: new Date().toISOString(),
          usageCount: 0,
          tags: templateTagIds
        };
        
        existingTemplates.push(newTemplate);
        console.log(`✅ 成功创建模板: ${templateData.title}`);
        successCount++;
      } catch (error) {
        console.error(`创建模板 "${templateData.title}" 失败:`, error);
      }
    }
    
    try {
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(existingTemplates));
    } catch (error) {
      console.error('保存模板失败:', error);
      throw error;
    }
    
    return successCount;
  }
  
  try {
    // 执行初始化
    const { existingTags, createdTagIds } = createTags();
    const templateCount = createTemplates(existingTags);
    
    // 显示结果
    console.log(`
🎉 跨境电商模板初始化完成！

📊 创建统计:
• 标签: ${ECOMMERCE_TAGS.length} 个
• 模板: ${templateCount} 个

🏷️ 创建的标签:
${ECOMMERCE_TAGS.map(tag => `• ${tag.name}`).join('\n')}

📝 创建的模板:
• Amazon产品标题优化器
• Amazon产品5点描述生成器  
• 产品市场洞察分析器
• Amazon广告关键词策略师
• 客户评价回复模板生成器
• 产品差异化定位分析师
• FBA库存管理策略顾问

✅ 所有模板都已配置好参数选项，可以直接使用！
`);
    
    // 2秒后刷新页面
    setTimeout(() => {
      console.log('🔄 正在刷新页面以显示新模板...');
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    alert('初始化失败，请检查控制台错误信息');
  }
})(); 
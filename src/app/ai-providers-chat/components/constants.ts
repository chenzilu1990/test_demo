// 路由常量
export const ROUTES = {
  // 路由常量暂时为空，可以根据需要添加
} as const;

// UI 常量
export const UI_CONSTANTS = {
  MAX_MESSAGE_WIDTH: '70%',
  INPUT_HEIGHT: '8rem',
  MODAL_MAX_WIDTH: 'max-w-3xl',
  MODAL_MAX_HEIGHT: 'max-h-[90vh]'
} as const;

// 文本常量 - 可以后续替换为国际化
export const TEXT = {
  // 通用
  CANCEL: '取消',
  SAVE: '保存',
  CLEAR: '清空',
  SEND: '发送',
  LOADING: '处理中...',
  GENERATING: '正在生成...',
  
  // 模型选择
  SELECT_MODEL: '选择模型',
  SELECT_MODEL_PLACEHOLDER: '请选择模型',
  NO_MODELS_AVAILABLE: '无可用的文本模型',
  NO_TEXT_MODELS: '当前服务商没有可用的文本模型',
  CONFIGURE_PROVIDER_FIRST: '请先在 AI 服务商配置中心配置并测试服务商',
  CURRENT_MODEL: '当前模型',
  
  // 对话
  NO_CONVERSATION: '暂无对话记录',
  YOU: '您',
  AI: 'AI',
  SAVE_AS_TEMPLATE: '保存为模板',
  
  // 输入提示
  IMAGE_GENERATION_PLACEHOLDER: '描述您想要生成的图像...',
  CHAT_PLACEHOLDER: '输入您的问题或指令...',
  IMAGE_HINT_BASE: '提示：可以使用 [图像尺寸]',
  IMAGE_HINT_DALLE3: ', [图像质量], [图像风格]',
  CHAT_HINT: '提示：可以使用 [温度]、[最大令牌] 来调整参数',
  PARAMETER_SUFFIX: ' 来设置参数',
  
  // 模板生成
  GENERATE_TEMPLATE: '生成提示词模板',
  ORIGINAL_PROMPT: '原始提示词:',
  NO_PROMPT_SELECTED: '未选择提示词',
  START_GENERATING: '开始生成模板',
  GENERATED_TEMPLATE: '生成的模板:',
  TEMPLATE_TITLE: '标题:',
  TEMPLATE_CONTENT: '模板:',
  PARAMETER_OPTIONS: '参数选项:',
  SAVE_TEMPLATE: '保存模板',
  GENERATING_TEMPLATE: '正在生成模板...',
  
  // 错误消息
  SELECT_PROVIDER_FIRST: '请先选择AI提供商',
  INPUT_PROMPT_FIRST: '请先输入提示词',
  SELECT_TEXT_MODEL_FIRST: '请选择一个文本模型',
  TEMPLATE_GENERATION_ERROR: '生成模板时发生错误',
  
  // 模式
  IMAGE_GENERATION_MODE: ' - 图像生成模式',
  CHAT_MODE: ' - 对话模式',
  IMAGE_GENERATION_LABEL: ' (图像生成)',
  GENERATE_IMAGE: '生成图像'
} as const;

// 动画和过渡时间（毫秒）
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
} as const;

// API 相关常量
export const API_CONSTANTS = {
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 2000,
  MIN_PARAMETER_OPTIONS: 5
} as const; 
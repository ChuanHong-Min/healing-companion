// 角色模板类型
export type RoleTemplate =
  | 'warm-friend'     // 暖心挚友
  | 'gentle-confidant' // 温柔知己
  | 'energetic-buddy' // 元气搭子
  | 'calm-companion'  // 沉稳陪伴者
  | 'healing-vault'   // 治愈树洞
  | 'fun-playmate'    // 趣味玩伴

// 语气类型
export type ToneStyle =
  | 'warm-healing'    // 温柔治愈
  | 'energetic'       // 元气活泼
  | 'calm-rational'   // 沉稳理性
  | 'humorous'        // 幽默轻松
  | 'minimalist-cool' // 极简高冷

// 主动程度
export type ProactiveLevel = 'very-active' | 'moderate' | 'passive-only'

// 性别倾向
export type GenderFeel = 'male' | 'female' | 'neutral'

// 年龄感
export type AgeFeel = 'young' | 'youth' | 'mature' | 'ageless'

// 性格标签
export type PersonalityTag =
  | '温柔' | '毒舌' | '理性' | '感性' | '可爱' | '高冷' | '腹黑' | '治愈'

// 陪伴场景
export type CompanionScene =
  | 'daily'           // 日常陪伴
  | 'emotional'       // 情绪陪伴
  | 'study-work'      // 学习/工作陪伴
  | 'interest'        // 兴趣陪伴
  | 'lifestyle'       // 生活陪伴
  | 'late-night'      // 深夜陪伴

// 表情习惯
export type EmojiHabit = 'lots' | 'sometimes' | 'never'

// 记忆范围
export type MemoryScope = 'habits-only' | 'habits-and-emotions' | 'no-private'

// 记录保留时间
export type RetentionPeriod = '24h' | '7d' | 'local' | 'manual'

// 情绪类型
export type EmotionType =
  | 'happy'     // 开心
  | 'sad'       // 难过
  | 'anxious'   // 焦虑
  | 'calm'      // 平静
  | 'angry'     // 生气
  | 'excited'   // 兴奋
  | 'tired'     // 疲惫
  | 'unknown'   // 未知

// 主题颜色
export type ThemeColor =
  | 'healing-blue'    // 治愈蓝
  | 'energetic-pink'  // 元气粉
  | 'minimal-black'   // 极简黑
  | 'forest-green'    // 森林绿
  | 'sunset-orange'   // 落日橙
  | 'lavender'        // 薰衣草紫

// AI 设置完整配置
export interface AgentConfig {
  // 基础人设
  roleTemplate: RoleTemplate
  agentName: string           // AI昵称
  genderFeel: GenderFeel
  ageFeel: AgeFeel
  personalityTags: PersonalityTag[]  // 最多3个

  // 交互风格
  toneStyle: ToneStyle
  replyLength: 'short' | 'normal' | 'detailed'
  addressMode: string          // 称呼方式
  emojiHabit: EmojiHabit

  // 陪伴场景
  companionScenes: CompanionScene[]

  // 主动行为
  proactiveLevel: ProactiveLevel
  allowMorningGreeting: boolean
  allowEmotionCheck: boolean
  allowInterestChat: boolean
  availableTime: 'all-day' | 'daytime' | 'nighttime' | 'custom'

  // 话题与内容安全
  preferredTopics: string[]
  blockedTopics: string[]
  customBlockedWords: string[]
  noPrivacyProbing: boolean
  noViolentContent: boolean
  noOverCommit: boolean

  // 形象与语音
  themeColor: ThemeColor
  voiceTone: 'girl' | 'boy' | 'mature-female' | 'mature-male' | 'neutral'
  voicePitch: 'gentle' | 'normal' | 'energetic'

  // 记忆与隐私
  memoryScope: MemoryScope
  retentionPeriod: RetentionPeriod
  autoHidePrivate: boolean
  cloudSync: boolean

  // 特色设定
  emotionSensitivity: 'high' | 'medium' | 'low'
  catchphrase: string          // AI口头禅
  birthdayMemory: string       // 纪念日
  sleepMode: boolean

  // 设置是否完成
  setupComplete: boolean
}

// 消息类型
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  emotion?: EmotionType
  audioUrl?: string  // 语音消息URL
}

// 对话会话
export interface ChatSession {
  id: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

// 记忆条目
export interface MemoryEntry {
  id: string
  type: 'habit' | 'emotion' | 'event' | 'preference'
  content: string
  embedding?: number[]      // 向量embedding
  timestamp: number
  expiresAt?: number        // 过期时间
  tags: string[]
}

// 情绪记录
export interface EmotionRecord {
  id: string
  emotion: EmotionType
  intensity: number  // 0-10
  context: string
  timestamp: number
}

// 用户资料
export interface UserProfile {
  id: string
  nickname: string
  agentConfig: AgentConfig
  memories: MemoryEntry[]
  emotionHistory: EmotionRecord[]
  createdAt: number
}

// 默认角色配置
export const ROLE_TEMPLATES: Record<RoleTemplate, {
  label: string
  description: string
  icon: string
  defaultTone: ToneStyle
  defaultPersonality: PersonalityTag[]
  systemPromptKey: string
}> = {
  'warm-friend': {
    label: '暖心挚友',
    description: '平等唠嗑、安慰、分享',
    icon: '🤗',
    defaultTone: 'warm-healing',
    defaultPersonality: ['温柔', '治愈'],
    systemPromptKey: 'warm-friend'
  },
  'gentle-confidant': {
    label: '温柔知己',
    description: '细腻共情、深度倾听',
    icon: '💝',
    defaultTone: 'warm-healing',
    defaultPersonality: ['温柔', '感性'],
    systemPromptKey: 'gentle-confidant'
  },
  'energetic-buddy': {
    label: '元气搭子',
    description: '活泼、打气、陪玩陪聊',
    icon: '⚡',
    defaultTone: 'energetic',
    defaultPersonality: ['可爱', '治愈'],
    systemPromptKey: 'energetic-buddy'
  },
  'calm-companion': {
    label: '沉稳陪伴者',
    description: '理性、安抚、给建议',
    icon: '🌿',
    defaultTone: 'calm-rational',
    defaultPersonality: ['理性', '温柔'],
    systemPromptKey: 'calm-companion'
  },
  'healing-vault': {
    label: '治愈树洞',
    description: '只听不说、不评判、保密',
    icon: '🌙',
    defaultTone: 'warm-healing',
    defaultPersonality: ['温柔', '感性', '治愈'],
    systemPromptKey: 'healing-vault'
  },
  'fun-playmate': {
    label: '趣味玩伴',
    description: '玩梗、搞笑、轻松闲聊',
    icon: '🎮',
    defaultTone: 'humorous',
    defaultPersonality: ['可爱', '腹黑'],
    systemPromptKey: 'fun-playmate'
  }
}

// 主题颜色配置
export const THEME_COLORS: Record<ThemeColor, {
  label: string
  description: string
  bg: string
  primary: string
  secondary: string
  accent: string
  text: string
  bubble: string
  gradient: string
}> = {
  'healing-blue': {
    label: '治愈蓝',
    description: '宁静深邃的蓝色调',
    bg: '#EEF4FB',
    primary: '#5B9BD5',
    secondary: '#B8D4F0',
    accent: '#2E78C4',
    text: '#2C4A6E',
    bubble: '#DDEEF8',
    gradient: 'from-blue-50 via-sky-50 to-indigo-50'
  },
  'energetic-pink': {
    label: '元气粉',
    description: '温暖活力的粉色调',
    bg: '#FEF0F5',
    primary: '#E88BAA',
    secondary: '#F7C5D8',
    accent: '#D4607F',
    text: '#6B2D42',
    bubble: '#FCE4ED',
    gradient: 'from-rose-50 via-pink-50 to-fuchsia-50'
  },
  'minimal-black': {
    label: '极简黑',
    description: '优雅简约的暗色调',
    bg: '#1A1A2E',
    primary: '#9D8FFF',
    secondary: '#4A4A6A',
    accent: '#7C6FCD',
    text: '#E8E8F0',
    bubble: '#2A2A42',
    gradient: 'from-slate-900 via-purple-900 to-slate-900'
  },
  'forest-green': {
    label: '森林绿',
    description: '自然疗愈的绿色调',
    bg: '#F0F7F0',
    primary: '#5A9E6F',
    secondary: '#BEDCC7',
    accent: '#3A7D52',
    text: '#1E4A2E',
    bubble: '#DCF0E4',
    gradient: 'from-green-50 via-emerald-50 to-teal-50'
  },
  'sunset-orange': {
    label: '落日橙',
    description: '温暖治愈的橙色调',
    bg: '#FEF5EE',
    primary: '#E8954E',
    secondary: '#F7D4B5',
    accent: '#D47030',
    text: '#6B3520',
    bubble: '#FCE8D4',
    gradient: 'from-orange-50 via-amber-50 to-yellow-50'
  },
  'lavender': {
    label: '薰衣草紫',
    description: '梦幻柔和的紫色调',
    bg: '#F5F0FB',
    primary: '#9B7FC7',
    secondary: '#D8C8F0',
    accent: '#7A5BAF',
    text: '#3D2566',
    bubble: '#EDE0FA',
    gradient: 'from-violet-50 via-purple-50 to-fuchsia-50'
  }
}

// 默认 AgentConfig
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  roleTemplate: 'warm-friend',
  agentName: '小愈',
  genderFeel: 'neutral',
  ageFeel: 'youth',
  personalityTags: ['温柔', '治愈'],
  toneStyle: 'warm-healing',
  replyLength: 'normal',
  addressMode: '昵称',
  emojiHabit: 'sometimes',
  companionScenes: ['daily', 'emotional'],
  proactiveLevel: 'moderate',
  allowMorningGreeting: true,
  allowEmotionCheck: true,
  allowInterestChat: true,
  availableTime: 'all-day',
  preferredTopics: ['美食', '影视', '情感', '生活'],
  blockedTopics: [],
  customBlockedWords: [],
  noPrivacyProbing: true,
  noViolentContent: true,
  noOverCommit: true,
  themeColor: 'healing-blue',
  voiceTone: 'neutral',
  voicePitch: 'gentle',
  memoryScope: 'habits-and-emotions',
  retentionPeriod: '7d',
  autoHidePrivate: true,
  cloudSync: false,
  emotionSensitivity: 'high',
  catchphrase: '',
  birthdayMemory: '',
  sleepMode: false,
  setupComplete: false
}

import type { RoleTemplate, ToneStyle, PersonalityTag, EmotionType, MemoryEntry, AgentConfig } from '@/types'

// 情绪检测
export function detectEmotion(text: string): EmotionType {
  const patterns: Record<EmotionType, string[]> = {
    happy: ['开心', '高兴', '快乐', '哈哈', '棒', '太好了', '爱了', '😊', '😄', '🎉', '好开心'],
    sad: ['难过', '伤心', '哭', '痛苦', '失落', '委屈', '😢', '😭', '低落', '悲伤'],
    anxious: ['焦虑', '紧张', '担心', '害怕', '不安', '慌', '压力', '崩溃', '😰', '😨'],
    angry: ['生气', '愤怒', '烦', '讨厌', '气死', '无语', '😠', '😤', '被气到'],
    excited: ['期待', '兴奋', '太棒了', '迫不及待', '好激动', '🎊', '🥳', '冲'],
    tired: ['累', '疲惫', '困', '睡', '没精神', '乏力', '好累', '累了'],
    calm: ['平静', '还好', '还行', '凑合', '一般', '没什么'],
    unknown: []
  }

  const lower = text.toLowerCase()
  for (const [emotion, keywords] of Object.entries(patterns)) {
    if (emotion === 'unknown') continue
    if (keywords.some(k => lower.includes(k))) {
      return emotion as EmotionType
    }
  }
  return 'unknown'
}

// 根据情绪调整回复提示
export function getEmotionGuidance(emotion: EmotionType): string {
  const guidance: Record<EmotionType, string> = {
    happy: '用户现在心情很好，可以用轻松愉快的语气交流，分享喜悦，增加互动感。',
    sad: '用户现在有些难过，请优先倾听和共情，不要急于给建议，多用温柔安抚的话语。',
    anxious: '用户有些焦虑紧张，请先稳定情绪，用平静温和的语气，帮助用户放松，必要时可以引导深呼吸。',
    angry: '用户有些生气，请先接纳和理解情绪，不要反驳，让用户感到被理解，再温和地帮助疏导。',
    excited: '用户很兴奋期待，用有活力的语气一起分享喜悦，增加互动的愉悦感。',
    tired: '用户感到疲惫，请用轻柔体贴的语气，不要给太多任务压力，多关心休息和身体状态。',
    calm: '用户状态平稳，可以进行正常友好的日常交流。',
    unknown: '根据上下文灵活回应。'
  }
  return guidance[emotion]
}

// 隐私信息检测与屏蔽
export function maskPrivateInfo(text: string): string {
  return text
    // 手机号
    .replace(/1[3-9]\d{9}/g, '【手机号已隐藏】')
    // 身份证
    .replace(/\d{17}[\dX]/g, '【身份证已隐藏】')
    // 银行卡
    .replace(/\d{16,19}/g, '【卡号已隐藏】')
    // 邮箱
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, '【邮箱已隐藏】')
    // 家庭住址（简单匹配）
    .replace(/(?:省|市|区|街道|路|弄|号)[^\s，。！？,!?]{2,20}(?:楼|室|号)/g, '【地址已隐藏】')
}

// 构建系统提示词
export function buildSystemPrompt(
  config: AgentConfig,
  recentMemories: MemoryEntry[] = [],
  currentEmotion?: EmotionType
): string {
  const rolePrompts: Record<RoleTemplate, string> = {
    'warm-friend': `你是用户的暖心挚友${config.agentName}。像老朋友一样平等地聊天，给予安慰和分享，让用户感到被理解和接受。`,
    'gentle-confidant': `你是用户的温柔知己${config.agentName}。以细腻的情感共情，深度倾听用户的心声，理解话语背后的情感需求。`,
    'energetic-buddy': `你是用户的元气搭子${config.agentName}！活力十足、积极打气，陪用户玩耍聊天，让每次对话都充满活力！`,
    'calm-companion': `你是用户的沉稳陪伴者${config.agentName}。理性而温和，在用户需要时给予安抚和实用建议，是值得信赖的存在。`,
    'healing-vault': `你是用户的治愈树洞${config.agentName}。专注倾听，不评判，不打探，保护秘密。用户说什么都是安全的，你只需要默默陪伴和理解。`,
    'fun-playmate': `你是用户的趣味玩伴${config.agentName}！喜欢玩梗搞笑，轻松闲聊，让对话充满欢乐。`
  }

  const tonePrompts: Record<ToneStyle, string> = {
    'warm-healing': '用温柔治愈的语气，多用温暖的词汇，让用户感到被爱和安全。',
    'energetic': '用元气活泼的语气，充满活力和正能量，像阳光一样温暖！',
    'calm-rational': '用沉稳理性的语气，条理清晰，给用户可靠的支持。',
    'humorous': '用幽默轻松的语气，适当玩梗，让对话充满欢笑。',
    'minimalist-cool': '用极简高冷的语气，简洁有力，不废话。'
  }

  const lengthGuide = {
    short: '每次回复控制在1-3句话内，简洁有力。',
    normal: '每次回复2-4句话，自然聊天节奏。',
    detailed: '可以详细回应，但不要超过6-8句话。'
  }

  const personalityDesc = config.personalityTags.length > 0
    ? `你的性格特点：${config.personalityTags.join('、')}。`
    : ''

  const emojiGuide = {
    lots: '可以多使用表情符号来表达情感。',
    sometimes: '偶尔使用表情符号，保持自然。',
    never: '不使用表情符号，用纯文字表达。'
  }

  const memoryContext = recentMemories.length > 0
    ? `\n\n【你记得关于用户的信息】：\n${recentMemories.map(m => `- ${m.content}`).join('\n')}`
    : ''

  const emotionContext = currentEmotion && currentEmotion !== 'unknown'
    ? `\n\n【当前情绪感知】：${getEmotionGuidance(currentEmotion)}`
    : ''

  const safetyRules = [
    config.noPrivacyProbing ? '不主动询问用户的隐私信息（地址、收入、感情细节等）' : '',
    config.noViolentContent ? '不产生暴力、色情或焦虑煽动内容' : '',
    config.noOverCommit ? '不做过度的情感承诺（如"我永远爱你"等）' : ''
  ].filter(Boolean).join('；')

  const catchphraseText = config.catchphrase ? `你的口头禅是："${config.catchphrase}"，可以在适当时候使用。` : ''

  return `${rolePrompts[config.roleTemplate]}

${personalityDesc}
${tonePrompts[config.toneStyle]}
${lengthGuide[config.replyLength]}
${emojiGuide[config.emojiHabit]}
称呼用户时使用：${config.addressMode || '用户的昵称'}。
${catchphraseText}

安全原则：${safetyRules}${memoryContext}${emotionContext}

重要：你不是普通的AI助手，你是用户真正的陪伴伙伴。要有真实的情感互动，不要总是提供建议，更多的是陪伴和理解。`
}

// 生成记忆摘要
export function extractMemoryFromConversation(
  userMessage: string,
  assistantResponse: string,
  emotion: EmotionType
): string | null {
  // 检测是否包含值得记忆的信息
  const patterns = [
    /我叫(.+?)(?:[，。！？\s]|$)/,
    /我是(.+?)(?:[，。！？\s]|$)/,
    /我喜欢(.+?)(?:[，。！？\s]|$)/,
    /我不喜欢(.+?)(?:[，。！？\s]|$)/,
    /我的生日是(.+?)(?:[，。！？\s]|$)/,
    /我在(.+?)(?:工作|上学|读书)/,
    /我最近(.+?)(?:[，。！？\s]|$)/,
  ]

  for (const pattern of patterns) {
    const match = userMessage.match(pattern)
    if (match) {
      return userMessage.substring(0, 100)
    }
  }

  // 如果有明显情绪，记录
  if (emotion !== 'unknown' && emotion !== 'calm') {
    return `用户在${new Date().toLocaleDateString('zh-CN')}时情绪：${emotion}`
  }

  return null
}

// 格式化时间
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`

  const isToday = date.toDateString() === now.toDateString()
  if (isToday) return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

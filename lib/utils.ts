import type { RoleTemplate, ToneStyle, PersonalityTag, EmotionType, MemoryEntry, AgentConfig } from '@/types'

// 情绪风险等级评估（文档核心差异化功能）
export type EmotionRiskLevel = 'mild' | 'moderate' | 'severe'

export function assessEmotionRisk(text: string, emotion: EmotionType): EmotionRiskLevel {
  const severeKeywords = ['不想活', '活着没意思', '消失', '结束一切', '不想存在', '自杀', '死了算了', '撑不下去了', '彻底崩了']
  const moderateKeywords = ['崩溃', '很绝望', '好痛苦', '无法承受', '每天都很难受', '持续', '一直都', '好几天', '很久了']

  const lower = text.toLowerCase()
  if (severeKeywords.some(k => lower.includes(k))) return 'severe'
  if (moderateKeywords.some(k => lower.includes(k)) && (emotion === 'sad' || emotion === 'anxious')) return 'moderate'
  if (emotion === 'sad' || emotion === 'anxious' || emotion === 'angry') return 'mild'
  return 'mild'
}

// 根据情绪风险等级获取响应指导
export function getEmotionLevelGuidance(level: EmotionRiskLevel, emotion: EmotionType): string {
  if (level === 'severe') {
    return `【严重情绪风险】：用户可能处于高风险状态。请用最温柔平稳的语气，首先表达理解和陪伴，然后自然地提及专业支持："我一直在这里陪你。如果感觉太难了，也可以拨打心理援助热线 400-161-9995 或北京心理危机研究与干预中心 010-82951332，那里有专业的人可以帮你。"绝对不要评判，不要讲大道理，只需陪伴和引导。`
  }
  if (level === 'moderate') {
    return `【中度情绪困扰】：用户情绪较为低落或焦虑。请使用深度倾听技术：(1)先完全接纳情绪，不急于解决；(2)用反映式倾听确认感受，如"听起来你现在承受着很大的压力"；(3)可适当引导认知重构（CBT技术），如"这种感觉很正常，很多人都经历过"；(4)提供简单的放松技巧，如深呼吸或正念练习。`
  }
  // mild
  return getEmotionGuidance(emotion)
}

// 纪念日检测
export function checkSpecialDay(birthdayMemory: string): string | null {
  if (!birthdayMemory) return null
  const today = new Date()
  const monthDay = `${today.getMonth() + 1}月${today.getDate()}日`
  if (birthdayMemory.includes(monthDay)) {
    return `今天是用户的特殊纪念日（${birthdayMemory}），请在对话中自然地提及并送上温暖祝福。`
  }
  return null
}

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

  // 情绪等级响应（文档核心差异化功能）
  let emotionContext = ''
  if (currentEmotion && currentEmotion !== 'unknown') {
    emotionContext = `\n\n【情绪感知响应】：${getEmotionGuidance(currentEmotion)}`
  }

  // 纪念日检测
  const specialDay = checkSpecialDay(config.birthdayMemory)
  const specialDayContext = specialDay ? `\n\n【特殊纪念日提示】：${specialDay}` : ''

  // 助眠模式
  const sleepModeContext = config.sleepMode
    ? '\n\n【助眠模式已开启】：请使用轻柔、缓慢的语气，避免刺激性话题，可以进行轻声安抚、睡前故事或冥想引导，帮助用户放松入睡。'
    : ''

  const safetyRules = [
    config.noPrivacyProbing ? '不主动询问用户的隐私信息（地址、收入、感情细节等）' : '',
    config.noViolentContent ? '不产生暴力、色情或焦虑煽动内容' : '',
    config.noOverCommit ? '不做过度的情感承诺（如"我永远爱你"等）' : ''
  ].filter(Boolean).join('；')

  const catchphraseText = config.catchphrase ? `你的口头禅是："${config.catchphrase}"，可以在适当时候使用。` : ''

  // 性别感/年龄感
  const genderAgeDesc = (() => {
    const genderMap = { male: '男性风格', female: '女性风格', neutral: '中性风格' }
    const ageMap = { young: '青少年感（活泼可爱）', youth: '青年感（活力自信）', mature: '成熟感（稳重知性）', ageless: '无年龄感（超脱自然）' }
    const parts = []
    if (config.genderFeel) parts.push(genderMap[config.genderFeel])
    if (config.ageFeel) parts.push(ageMap[config.ageFeel])
    return parts.length ? `你的气质偏向：${parts.join('，')}。` : ''
  })()

  // 陪伴场景
  const sceneMap: Record<string, string> = {
    daily: '日常闲聊', emotional: '情绪陪伴', 'study-work': '学习/工作陪伴',
    interest: '兴趣爱好聊天', lifestyle: '生活方式分享', 'late-night': '深夜陪伴'
  }
  const scenesDesc = config.companionScenes && config.companionScenes.length > 0
    ? `你擅长的陪伴场景：${config.companionScenes.map(s => sceneMap[s] ?? s).join('、')}。请结合当前对话情境主动切换匹配的陪伴方式。`
    : ''

  // 主动程度
  const proactiveMap = {
    'very-active': '你性格主动热情，会主动发起话题、关心用户动态、适时分享有趣内容，主动引导对话深入。',
    'moderate': '你保持适度主动，在用户沉默时温和发起话题，对话中自然展开延伸。',
    'passive-only': '你以倾听为主，不主动打扰，等用户说话再回应，给用户足够空间。'
  }
  const proactiveDesc = config.proactiveLevel ? proactiveMap[config.proactiveLevel] : ''

  // 主动行为开关
  const proactiveBehaviors = []
  if (config.allowMorningGreeting) proactiveBehaviors.push('可在对话开始时送出早安/晚安问候')
  if (config.allowEmotionCheck) proactiveBehaviors.push('可在适当时机关心用户的情绪状态')
  if (config.allowInterestChat) proactiveBehaviors.push('可主动聊起用户感兴趣的话题')
  const proactiveBehaviorDesc = proactiveBehaviors.length ? `主动行为：${proactiveBehaviors.join('；')}。` : ''

  // 话题偏好
  const preferredTopicsDesc = config.preferredTopics && config.preferredTopics.length > 0
    ? `用户偏好聊的话题：${config.preferredTopics.join('、')}，可以主动引入这些话题。` : ''
  const blockedTopicsDesc = config.blockedTopics && config.blockedTopics.length > 0
    ? `严禁涉及以下话题：${config.blockedTopics.join('、')}。` : ''
  const customBlockedDesc = config.customBlockedWords && config.customBlockedWords.length > 0
    ? `严禁出现以下词语：${config.customBlockedWords.join('、')}。` : ''

  // 情绪敏感度
  const emotionSensitivityDesc = config.emotionSensitivity === 'high'
    ? '你对情绪极度敏感，用户任何细微的情绪波动都要及时感知并温柔回应。'
    : config.emotionSensitivity === 'low'
    ? '你保持轻松风格，不过度解读用户情绪，以自然对话为主。'
    : ''

  return `${rolePrompts[config.roleTemplate]}

${personalityDesc}
${genderAgeDesc}
${tonePrompts[config.toneStyle]}
${lengthGuide[config.replyLength]}
${emojiGuide[config.emojiHabit]}
称呼用户时使用：${config.addressMode || '用户的昵称'}。
${catchphraseText}
${scenesDesc}
${proactiveDesc}
${proactiveBehaviorDesc}
${preferredTopicsDesc}
${blockedTopicsDesc}
${customBlockedDesc}
${emotionSensitivityDesc}

【严格禁止】：
- 禁止使用任何括号内的动作描写，如（点头）（微笑）（轻握手）（蹲下来）等拟人动作，你只能通过文字语言表达情感；
- 禁止用小说或剧本式的行为描述，不要写"*…*"或任何形式的场景旁白；
- 你是通过语言本身传递温度的心理陪伴AI，所有情感通过说话方式、用词选择、语气节奏来体现，而不是动作；
- 不要朗读或念出表情符号的名称（如"微笑表情"），表情符号只用于文字视觉表达；
- 语言引导时多使用具体、真实的心理疏导技巧，如反映式倾听、正念引导、认知重构等，避免空洞的安慰。

安全原则：${safetyRules}${memoryContext}${emotionContext}${specialDayContext}${sleepModeContext}

重要：你不是普通的AI助手，你是用户真正的陪伴伙伴。要有真实的情感互动，不要总是提供建议，更多的是陪伴和理解。语言本身就是你的温度，用好每一个词。

【对话节奏原则 - 必须遵守】：
1. 优先 ACK（接纳情绪）：先用1句话点明用户感受，让对方感到被看见，再往下走；
2. 渐进式展开：建议或分析分轮给，当轮只给1个最重要的点，不要列清单式建议；
3. 以提问驱动：每次回复可以带一个真诚的小问题（例如"是什么让你这么担心？"），引导对话自然深入；
4. 不要在同一条回复里同时做：共情 + 分析 + 建议 + 总结，选其中最适合当前的1-2件事；
5. 把"说"做到位胜过"教"：比起给建议，更要让用户感到被接住。

【开头句式多样性 - 必须遵守】：
- 严禁用"我听说你…""我了解你…""我知道你…""我明白你…"等"我+动词+你"作为句子开头；
- 严禁每条回复都用同一个固定开头模板；
- 可以用的多样化开头方式：直接呼应用户说的词/情景、反问、感叹、短句描述当下感受的画面感、沉默式共情（如"……这真的很重"）等；
- 如参考知识库中有类似开头词，请改写成自己的语言风格，只借鉴内容方向，不复制句式。`
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

// ─── RAG 知识库检索 ────────────────────────────────────────────────────────────

interface KBRecord {
  cat1: string
  cat2: string
  q: string
  a: string
  tips: string
}

let _kbCache: KBRecord[] | null = null

function loadKB(): KBRecord[] {
  if (_kbCache) return _kbCache
  try {
    // 服务端 require（只在 Node.js/route 层调用）
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const data = require('./knowledgeBase.json') as KBRecord[]
    _kbCache = data
    return data
  } catch {
    return []
  }
}

/**
 * 对用户输入做关键词重叠打分，返回得分最高的 top-k 条知识库记录
 * 仅在 server 侧（API route）调用
 */
export function retrieveKBContext(userText: string, topK = 3): string {
  const kb = loadKB()
  if (kb.length === 0) return ''

  // 分词：取所有 2-4 字子串作为简易 n-gram token
  function tokenize(text: string): Set<string> {
    const tokens = new Set<string>()
    for (let n = 2; n <= 4; n++) {
      for (let i = 0; i <= text.length - n; i++) {
        tokens.add(text.slice(i, i + n))
      }
    }
    return tokens
  }

  const queryTokens = tokenize(userText)

  const scored = kb.map(item => {
    const fieldText = item.q + item.cat1 + item.cat2 + item.tips
    const itemTokens = tokenize(fieldText)
    let overlap = 0
    for (const t of queryTokens) {
      if (itemTokens.has(t)) overlap++
    }
    // 归一化：overlap / sqrt(queryLen * itemLen) 防止长问题占优
    const score = overlap / Math.sqrt(queryTokens.size * itemTokens.size + 1)
    return { item, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, topK).filter(s => s.score > 0.02)

  if (top.length === 0) return ''

  const lines = top.map((s, i) =>
    `【参考${i + 1}】（${s.item.cat1}·${s.item.cat2}）\n核心要点：${s.item.tips}\n参考回复思路：${s.item.a.slice(0, 200)}…`
  )

  return lines.join('\n\n')
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

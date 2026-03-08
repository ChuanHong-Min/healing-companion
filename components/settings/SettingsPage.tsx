'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { THEME_COLORS, ROLE_TEMPLATES } from '@/types'
import type {
  RoleTemplate, ToneStyle, ProactiveLevel, GenderFeel, AgeFeel,
  PersonalityTag, CompanionScene, MemoryScope, RetentionPeriod, ThemeColor
} from '@/types'
import Link from 'next/link'

const PERSONALITY_TAGS: PersonalityTag[] = ['温柔', '毒舌', '理性', '感性', '可爱', '高冷', '腹黑', '治愈']
const TOPICS = ['美食', '影视', '游戏', '情感', '职场', '学习', '星座', '生活', '二次元']

type SettingSection =
  | 'identity'
  | 'interaction'
  | 'scenes'
  | 'proactive'
  | 'topics'
  | 'appearance'
  | 'memory'
  | 'privacy'

export function SettingsPage() {
  const { config, setConfig, clearMessages, clearMemories } = useAppStore()
  const theme = THEME_COLORS[config.themeColor]
  const [activeSection, setActiveSection] = useState<SettingSection>('identity')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleTopic = (topic: string, blocked = false) => {
    if (blocked) {
      const current = config.blockedTopics
      setConfig({
        blockedTopics: current.includes(topic)
          ? current.filter(t => t !== topic)
          : [...current, topic]
      })
    } else {
      const current = config.preferredTopics
      setConfig({
        preferredTopics: current.includes(topic)
          ? current.filter(t => t !== topic)
          : [...current, topic]
      })
    }
  }

  const togglePersonality = (tag: PersonalityTag) => {
    const current = config.personalityTags
    if (current.includes(tag)) {
      setConfig({ personalityTags: current.filter(t => t !== tag) })
    } else if (current.length < 3) {
      setConfig({ personalityTags: [...current, tag] })
    }
  }

  const toggleScene = (scene: CompanionScene) => {
    const current = config.companionScenes
    setConfig({
      companionScenes: current.includes(scene)
        ? current.filter(s => s !== scene)
        : [...current, scene]
    })
  }

  const sections: { id: SettingSection; label: string; icon: string }[] = [
    { id: 'identity', label: '人设与身份', icon: '🎭' },
    { id: 'interaction', label: '交互风格', icon: '💬' },
    { id: 'scenes', label: '陪伴场景', icon: '🌟' },
    { id: 'proactive', label: '主动行为', icon: '📅' },
    { id: 'topics', label: '话题安全', icon: '🛡️' },
    { id: 'appearance', label: '形象与语音', icon: '🎨' },
    { id: 'memory', label: '记忆与隐私', icon: '🔒' },
    { id: 'privacy', label: '数据管理', icon: '🗂️' },
  ]

  const SelectButton = <T extends string>({
    value, current, label, onClick
  }: { value: T; current: T; label: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border-2"
      style={{
        borderColor: current === value ? theme.primary : 'transparent',
        backgroundColor: current === value ? `${theme.primary}15` : `${theme.bg}`,
        color: current === value ? theme.primary : theme.text
      }}
    >
      {label}
    </button>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 border-b backdrop-blur-sm"
        style={{ borderColor: `${theme.secondary}40`, backgroundColor: `${theme.bg}e0` }}
      >
        <Link
          href="/chat"
          className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-70 transition"
          style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}
        >
          ←
        </Link>
        <h1 className="flex-1 font-bold text-lg">个性化设置</h1>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90"
          style={{ backgroundColor: theme.primary }}
        >
          {saved ? '✓ 已保存' : '保存'}
        </button>
      </div>

      <div className="flex h-[calc(100vh-56px)]">
        {/* 侧边导航 */}
        <div
          className="w-16 sm:w-44 flex-shrink-0 border-r py-4 overflow-y-auto"
          style={{ borderColor: `${theme.secondary}40` }}
        >
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 text-sm font-medium transition-all ${
                activeSection === s.id ? 'opacity-100' : 'opacity-50 hover:opacity-75'
              }`}
              style={{
                backgroundColor: activeSection === s.id ? `${theme.primary}15` : 'transparent',
                color: activeSection === s.id ? theme.primary : theme.text
              }}
            >
              <span className="text-lg">{s.icon}</span>
              <span className="hidden sm:block">{s.label}</span>
            </button>
          ))}
        </div>

        {/* 主内容区 */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* 人设与身份 */}
          {activeSection === 'identity' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">🎭 人设与身份</h2>

              <div>
                <label className="block text-sm font-medium mb-2 opacity-70">AI昵称</label>
                <input
                  type="text"
                  value={config.agentName}
                  onChange={e => setConfig({ agentName: e.target.value })}
                  maxLength={10}
                  className="px-4 py-2 rounded-xl border-2 outline-none w-full max-w-xs bg-white/50"
                  style={{ borderColor: `${theme.primary}50`, color: theme.text }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 opacity-70">角色模板</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(Object.entries(ROLE_TEMPLATES) as [RoleTemplate, typeof ROLE_TEMPLATES[RoleTemplate]][]).map(([key, role]) => (
                    <button
                      key={key}
                      onClick={() => setConfig({ roleTemplate: key })}
                      className="p-3 rounded-xl border-2 text-left transition-all"
                      style={{
                        borderColor: config.roleTemplate === key ? theme.primary : 'transparent',
                        backgroundColor: config.roleTemplate === key ? `${theme.primary}15` : `${theme.bg}`
                      }}
                    >
                      <span className="text-xl">{role.icon}</span>
                      <div className="text-sm font-medium mt-1">{role.label}</div>
                      <div className="text-xs opacity-50">{role.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 opacity-70">性别感</label>
                <div className="flex flex-wrap gap-2">
                  {[{v:'male',l:'男感'},{v:'female',l:'女感'},{v:'neutral',l:'无性别'}].map(item => (
                    <SelectButton
                      key={item.v}
                      value={item.v as GenderFeel}
                      current={config.genderFeel}
                      label={item.l}
                      onClick={() => setConfig({ genderFeel: item.v as GenderFeel })}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 opacity-70">年龄感</label>
                <div className="flex flex-wrap gap-2">
                  {[{v:'young',l:'少年'},{v:'youth',l:'青年'},{v:'mature',l:'成熟'},{v:'ageless',l:'无年龄'}].map(item => (
                    <SelectButton
                      key={item.v}
                      value={item.v as AgeFeel}
                      current={config.ageFeel}
                      label={item.l}
                      onClick={() => setConfig({ ageFeel: item.v as AgeFeel })}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 opacity-70">
                  性格标签（最多3个，已选{config.personalityTags.length}/3）
                </label>
                <div className="flex flex-wrap gap-2">
                  {PERSONALITY_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => togglePersonality(tag)}
                      className="px-3 py-1.5 rounded-xl text-sm transition-all border-2"
                      style={{
                        borderColor: config.personalityTags.includes(tag) ? theme.primary : 'transparent',
                        backgroundColor: config.personalityTags.includes(tag) ? `${theme.primary}15` : `${theme.bg}`,
                        opacity: !config.personalityTags.includes(tag) && config.personalityTags.length >= 3 ? 0.4 : 1
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 opacity-70">口头禅（可选）</label>
                <input
                  type="text"
                  value={config.catchphrase}
                  onChange={e => setConfig({ catchphrase: e.target.value })}
                  placeholder="如：没问题的～、加油哦"
                  maxLength={20}
                  className="px-4 py-2 rounded-xl border-2 outline-none w-full max-w-xs bg-white/50"
                  style={{ borderColor: `${theme.primary}50`, color: theme.text }}
                />
              </div>
            </div>
          )}

          {/* 交互风格 */}
          {activeSection === 'interaction' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">💬 交互风格</h2>

              <div>
                <label className="block text-sm font-medium mb-3 opacity-70">说话语气</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    {v:'warm-healing',l:'温柔治愈'},
                    {v:'energetic',l:'元气活泼'},
                    {v:'calm-rational',l:'沉稳理性'},
                    {v:'humorous',l:'幽默轻松'},
                    {v:'minimalist-cool',l:'极简高冷'}
                  ].map(item => (
                    <SelectButton
                      key={item.v}
                      value={item.v as ToneStyle}
                      current={config.toneStyle}
                      label={item.l}
                      onClick={() => setConfig({ toneStyle: item.v as ToneStyle })}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 opacity-70">回复长度</label>
                <div className="flex flex-wrap gap-2">
                  {[{v:'short',l:'简洁短句'},{v:'normal',l:'正常聊天'},{v:'detailed',l:'细致啰嗦'}].map(item => (
                    <SelectButton
                      key={item.v}
                      value={item.v as 'short'|'normal'|'detailed'}
                      current={config.replyLength}
                      label={item.l}
                      onClick={() => setConfig({ replyLength: item.v as 'short'|'normal'|'detailed' })}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 opacity-70">称呼方式</label>
                <input
                  type="text"
                  value={config.addressMode}
                  onChange={e => setConfig({ addressMode: e.target.value })}
                  placeholder="昵称 / 宝贝 / 家人 / 自定义"
                  maxLength={10}
                  className="px-4 py-2 rounded-xl border-2 outline-none w-full max-w-xs bg-white/50"
                  style={{ borderColor: `${theme.primary}50`, color: theme.text }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 opacity-70">表情习惯</label>
                <div className="flex flex-wrap gap-2">
                  {[{v:'lots',l:'爱用表情'},{v:'sometimes',l:'偶尔用'},{v:'never',l:'不用表情'}].map(item => (
                    <SelectButton
                      key={item.v}
                      value={item.v as 'lots'|'sometimes'|'never'}
                      current={config.emojiHabit}
                      label={item.l}
                      onClick={() => setConfig({ emojiHabit: item.v as 'lots'|'sometimes'|'never' })}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 opacity-70">情绪感知敏感度</label>
                <div className="flex flex-wrap gap-2">
                  {[{v:'high',l:'高敏感'},{v:'medium',l:'中等'},{v:'low',l:'低敏感'}].map(item => (
                    <SelectButton
                      key={item.v}
                      value={item.v as 'high'|'medium'|'low'}
                      current={config.emotionSensitivity}
                      label={item.l}
                      onClick={() => setConfig({ emotionSensitivity: item.v as 'high'|'medium'|'low' })}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 陪伴场景 */}
          {activeSection === 'scenes' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">🌟 陪伴场景</h2>
              <p className="text-sm opacity-60">选择你希望AI陪伴你的场景，AI会自动适配对应行为</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {v:'daily' as CompanionScene,l:'日常陪伴',d:'早安晚安、日常碎碎念',e:'🌅'},
                  {v:'emotional' as CompanionScene,l:'情绪陪伴',d:'难过安慰、焦虑疏导',e:'💝'},
                  {v:'study-work' as CompanionScene,l:'学习/工作陪伴',d:'专注监督、计划提醒',e:'📚'},
                  {v:'interest' as CompanionScene,l:'兴趣陪伴',d:'追剧/游戏/追星搭子',e:'🎮'},
                  {v:'lifestyle' as CompanionScene,l:'生活陪伴',d:'决策辅助、作息提醒',e:'🏠'},
                  {v:'late-night' as CompanionScene,l:'深夜陪伴',d:'熬夜陪聊、助眠安抚',e:'🌙'}
                ].map(item => (
                  <button
                    key={item.v}
                    onClick={() => toggleScene(item.v)}
                    className="p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3"
                    style={{
                      borderColor: config.companionScenes.includes(item.v) ? theme.primary : 'transparent',
                      backgroundColor: config.companionScenes.includes(item.v) ? `${theme.primary}15` : `${theme.bg}`
                    }}
                  >
                    <span className="text-2xl">{item.e}</span>
                    <div>
                      <div className="font-medium">{item.l}</div>
                      <div className="text-xs opacity-50">{item.d}</div>
                    </div>
                    {config.companionScenes.includes(item.v) && (
                      <span className="ml-auto" style={{ color: theme.primary }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 主动行为 */}
          {activeSection === 'proactive' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">📅 主动行为边界</h2>

              <div>
                <label className="block text-sm font-medium mb-3 opacity-70">主动程度</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    {v:'very-active' as ProactiveLevel,l:'非常主动'},
                    {v:'moderate' as ProactiveLevel,l:'适度主动'},
                    {v:'passive-only' as ProactiveLevel,l:'仅被动回复'}
                  ].map(item => (
                    <SelectButton
                      key={item.v}
                      value={item.v}
                      current={config.proactiveLevel}
                      label={item.l}
                      onClick={() => setConfig({ proactiveLevel: item.v })}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium opacity-70">主动行为开关</label>
                {[
                  {key:'allowMorningGreeting' as const, label:'发早安晚安'},
                  {key:'allowEmotionCheck' as const, label:'主动关心情绪'},
                  {key:'allowInterestChat' as const, label:'主动聊共同兴趣'},
                  {key:'sleepMode' as const, label:'助眠模式（睡前温柔聊天）'}
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: `${theme.bg}` }}>
                    <span className="text-sm">{item.label}</span>
                    <button
                      onClick={() => setConfig({ [item.key]: !config[item.key] })}
                      className="w-12 h-6 rounded-full transition-all duration-300 relative"
                      style={{ backgroundColor: config[item.key] ? theme.primary : '#d1d5db' }}
                    >
                      <span
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300"
                        style={{ left: config[item.key] ? '26px' : '4px' }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 话题与安全 */}
          {activeSection === 'topics' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">🛡️ 话题与内容安全</h2>

              <div>
                <label className="block text-sm font-medium mb-3 opacity-70">喜欢聊的话题（多选）</label>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map(topic => (
                    <button
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className="px-3 py-1.5 rounded-xl text-sm transition-all border-2"
                      style={{
                        borderColor: config.preferredTopics.includes(topic) ? theme.primary : 'transparent',
                        backgroundColor: config.preferredTopics.includes(topic) ? `${theme.primary}15` : `${theme.bg}`
                      }}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium opacity-70">安全边界</label>
                {[
                  {key:'noPrivacyProbing' as const, label:'不打探隐私（地址/收入等）'},
                  {key:'noViolentContent' as const, label:'不聊暴力/色情内容'},
                  {key:'noOverCommit' as const, label:'不做过度情感承诺'},
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: `${theme.bg}` }}>
                    <span className="text-sm">{item.label}</span>
                    <button
                      onClick={() => setConfig({ [item.key]: !config[item.key] })}
                      className="w-12 h-6 rounded-full transition-all duration-300 relative"
                      style={{ backgroundColor: config[item.key] ? theme.primary : '#d1d5db' }}
                    >
                      <span
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300"
                        style={{ left: config[item.key] ? '26px' : '4px' }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 形象与语音 */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">🎨 形象与语音</h2>

              <div>
                <label className="block text-sm font-medium mb-3 opacity-70">颜色主题</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(Object.entries(THEME_COLORS) as [ThemeColor, typeof THEME_COLORS[ThemeColor]][]).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => setConfig({ themeColor: key })}
                      className="p-3 rounded-xl border-2 text-center transition-all"
                      style={{
                        borderColor: config.themeColor === key ? t.primary : 'transparent',
                        background: `linear-gradient(135deg, ${t.primary}20, ${t.secondary}30)`
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full mx-auto mb-2"
                        style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})` }}
                      />
                      <div className="text-sm font-medium">{t.label}</div>
                      <div className="text-xs opacity-50">{t.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 opacity-70">语音音色</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    {v:'girl',l:'少女'},
                    {v:'boy',l:'少年'},
                    {v:'mature-female',l:'御姐'},
                    {v:'mature-male',l:'青叔'},
                    {v:'neutral',l:'中性'}
                  ].map(item => (
                    <SelectButton
                      key={item.v}
                      value={item.v as typeof config.voiceTone}
                      current={config.voiceTone}
                      label={item.l}
                      onClick={() => setConfig({ voiceTone: item.v as typeof config.voiceTone })}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 opacity-70">语调节奏</label>
                <div className="flex flex-wrap gap-2">
                  {[{v:'gentle',l:'温柔慢速'},{v:'normal',l:'正常速度'},{v:'energetic',l:'活力快速'}].map(item => (
                    <SelectButton
                      key={item.v}
                      value={item.v as typeof config.voicePitch}
                      current={config.voicePitch}
                      label={item.l}
                      onClick={() => setConfig({ voicePitch: item.v as typeof config.voicePitch })}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 记忆与隐私 */}
          {activeSection === 'memory' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">🔒 记忆与隐私</h2>

              <div>
                <label className="block text-sm font-medium mb-3 opacity-70">记忆范围</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    {v:'habits-only' as MemoryScope,l:'仅记习惯'},
                    {v:'habits-and-emotions' as MemoryScope,l:'记习惯+情绪'},
                    {v:'no-private' as MemoryScope,l:'不记私人信息'}
                  ].map(item => (
                    <SelectButton
                      key={item.v}
                      value={item.v}
                      current={config.memoryScope}
                      label={item.l}
                      onClick={() => setConfig({ memoryScope: item.v })}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 opacity-70">记录保留时间</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    {v:'24h' as RetentionPeriod,l:'24小时'},
                    {v:'7d' as RetentionPeriod,l:'7天'},
                    {v:'local' as RetentionPeriod,l:'本地长期'},
                    {v:'manual' as RetentionPeriod,l:'手动清空'}
                  ].map(item => (
                    <SelectButton
                      key={item.v}
                      value={item.v}
                      current={config.retentionPeriod}
                      label={item.l}
                      onClick={() => setConfig({ retentionPeriod: item.v })}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium opacity-70">隐私开关</label>
                {[
                  {key:'autoHidePrivate' as const, label:'自动屏蔽隐私信息（手机号/地址等）'},
                  {key:'cloudSync' as const, label:'云端同步（关闭为仅本地存储）'}
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: `${theme.bg}` }}>
                    <span className="text-sm">{item.label}</span>
                    <button
                      onClick={() => setConfig({ [item.key]: !config[item.key] })}
                      className="w-12 h-6 rounded-full transition-all duration-300 relative"
                      style={{ backgroundColor: config[item.key] ? theme.primary : '#d1d5db' }}
                    >
                      <span
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300"
                        style={{ left: config[item.key] ? '26px' : '4px' }}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 opacity-70">纪念日记忆（可选）</label>
                <input
                  type="text"
                  value={config.birthdayMemory}
                  onChange={e => setConfig({ birthdayMemory: e.target.value })}
                  placeholder="如：生日 12月25日"
                  maxLength={30}
                  className="px-4 py-2 rounded-xl border-2 outline-none w-full max-w-xs bg-white/50"
                  style={{ borderColor: `${theme.primary}50`, color: theme.text }}
                />
              </div>
            </div>
          )}

          {/* 数据管理 */}
          {activeSection === 'privacy' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">🗂️ 数据管理</h2>
              <p className="text-sm opacity-60">所有数据均存储在您的本地浏览器中，不会上传云端</p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (confirm('确定清空所有对话记录？')) clearMessages()
                  }}
                  className="w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 hover:opacity-80 transition"
                  style={{ borderColor: `${theme.secondary}50` }}
                >
                  <span className="text-xl">🗑️</span>
                  <div>
                    <div className="font-medium">清空对话记录</div>
                    <div className="text-xs opacity-50">清除所有聊天历史</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    if (confirm('确定清空所有记忆？')) clearMemories()
                  }}
                  className="w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 hover:opacity-80 transition"
                  style={{ borderColor: `${theme.secondary}50` }}
                >
                  <span className="text-xl">🧹</span>
                  <div>
                    <div className="font-medium">清空记忆</div>
                    <div className="text-xs opacity-50">清除AI对你的所有记忆</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    if (confirm('确定重置所有设置到默认状态？')) {
                      window.location.href = '/setup'
                    }
                  }}
                  className="w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 hover:opacity-80 transition"
                  style={{ borderColor: `${theme.secondary}50` }}
                >
                  <span className="text-xl">🔄</span>
                  <div>
                    <div className="font-medium">重新设置</div>
                    <div className="text-xs opacity-50">回到初始引导界面</div>
                  </div>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

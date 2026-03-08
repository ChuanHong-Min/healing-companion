'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/appStore'
import { ROLE_TEMPLATES, THEME_COLORS, VOICE_PRESETS } from '@/types'
import type { RoleTemplate, ToneStyle, ProactiveLevel, ThemeColor, VoicePreset } from '@/types'
import { ThemeSelector } from '@/components/ui/ThemeSelector'

const toneOptions: { value: ToneStyle; label: string; emoji: string; desc: string }[] = [
  { value: 'warm-healing', label: '温柔治愈', emoji: '🌸', desc: '轻柔温暖，让你放松' },
  { value: 'energetic', label: '轻松幽默', emoji: '⚡', desc: '活力满满，充满欢笑' },
  { value: 'minimalist-cool', label: '简洁高冷', emoji: '🌙', desc: '简单直接，不废话' },
  { value: 'calm-rational', label: '理性稳重', emoji: '🌿', desc: '沉稳可靠，给你建议' }
]

const proactiveOptions: { value: ProactiveLevel; label: string; emoji: string; desc: string }[] = [
  { value: 'very-active', label: '很主动', emoji: '💌', desc: '早安晚安+主动关心' },
  { value: 'moderate', label: '适中', emoji: '✨', desc: '偶尔主动来找你' },
  { value: 'passive-only', label: '仅被动回复', emoji: '🤫', desc: '等你来找我就好' }
]

const MALE_PRESETS: VoicePreset[] = ['uncle', 'teen-boy', 'bubble-boy', 'puppy-boy']
const FEMALE_PRESETS: VoicePreset[] = ['loli', 'oneesan', 'girl', 'bubble-girl']

const STEP_LABELS = ['选择伙伴', '聊天风格', '选择音色', '主动程度', '个性化外观']

export function SetupWizard() {
  const router = useRouter()
  const { config, setConfig } = useAppStore()
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState<RoleTemplate>('warm-friend')
  const [selectedTone, setSelectedTone] = useState<ToneStyle>('warm-healing')
  const [selectedProactive, setSelectedProactive] = useState<ProactiveLevel>('moderate')
  const [selectedTheme, setSelectedTheme] = useState<ThemeColor>('healing-blue')
  const [agentName, setAgentName] = useState('小愈')

  // 音色相关
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female')
  const [selectedVoice, setSelectedVoice] = useState<VoicePreset>('girl')
  const [previewingVoice, setPreviewingVoice] = useState<VoicePreset | null>(null)
  const [customVoiceDataUrl, setCustomVoiceDataUrl] = useState<string | undefined>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const theme = THEME_COLORS[selectedTheme]
  const totalSteps = 5

  const handleFinish = () => {
    const roleInfo = ROLE_TEMPLATES[selectedRole]
    setConfig({
      roleTemplate: selectedRole,
      toneStyle: selectedTone,
      proactiveLevel: selectedProactive,
      themeColor: selectedTheme,
      agentName,
      personalityTags: roleInfo.defaultPersonality,
      voiceTone: selectedVoice,
      voiceGender,
      customVoiceDataUrl,
      setupComplete: true
    })
    router.push('/chat')
  }

  // 试听音色（用浏览器 speechSynthesis 预览）
  const previewVoice = useCallback((preset: VoicePreset) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    setPreviewingVoice(preset)

    const cfg = VOICE_PRESETS[preset]
    const utterance = new SpeechSynthesisUtterance('你好！我是你的专属伙伴，很高兴认识你~')
    utterance.lang = 'zh-CN'
    utterance.pitch = cfg.pitch
    utterance.rate = cfg.rate
    utterance.volume = 1.0

    const voices = window.speechSynthesis.getVoices()
    const zhVoices = voices.filter(v => v.lang.startsWith('zh'))
    if (zhVoices.length > 0) {
      if (cfg.gender === 'female') {
        const v = zhVoices.find(x => x.name.toLowerCase().includes('female') || x.name.includes('女') || x.name.toLowerCase().includes('meijia') || x.name.toLowerCase().includes('tingting'))
        utterance.voice = v ?? zhVoices[0]
      } else if (cfg.gender === 'male') {
        const v = zhVoices.find(x => x.name.toLowerCase().includes('male') || x.name.includes('男'))
        utterance.voice = v ?? zhVoices[zhVoices.length - 1]
      } else {
        utterance.voice = zhVoices[0]
      }
    }

    utterance.onend = () => setPreviewingVoice(null)
    utterance.onerror = () => setPreviewingVoice(null)

    const doSpeak = () => window.speechSynthesis.speak(utterance)
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null
        doSpeak()
      }
    } else {
      doSpeak()
    }
  }, [])

  // 上传自定义音色音频
  const handleVoiceUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setCustomVoiceDataUrl(dataUrl)
      setSelectedVoice('custom')
      setVoiceGender('female') // default, user can change
    }
    reader.readAsDataURL(file)
  }, [])

  const currentPresets = voiceGender === 'male' ? MALE_PRESETS : FEMALE_PRESETS

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start p-4 pb-8 transition-all duration-700"
      style={{ background: `linear-gradient(135deg, ${theme.bg}, ${theme.secondary}20)` }}
    >
      {/* 进度条 */}
      <div className="w-full max-w-md mb-4 mt-2">
        <div className="flex items-center justify-between mb-2">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex items-center">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500"
                style={{
                  backgroundColor: s <= step ? theme.primary : '#e5e7eb',
                  color: s <= step ? 'white' : '#9ca3af'
                }}
              >
                {s < step ? '✓' : s}
              </div>
              {s < totalSteps && (
                <div
                  className="h-1 w-8 sm:w-14 mx-0.5 transition-all duration-500"
                  style={{ backgroundColor: s < step ? theme.primary : '#e5e7eb' }}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-xs opacity-60">{STEP_LABELS[step - 1]}</p>
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-6">

        {/* Step 1: 选择角色 */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-1 text-center" style={{ color: theme.text }}>
              你希望我是什么角色？✨
            </h2>
            <p className="text-center text-sm opacity-60 mb-4">选一个最对你胃口的</p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(ROLE_TEMPLATES) as [RoleTemplate, typeof ROLE_TEMPLATES[RoleTemplate]][]).map(([key, role]) => (
                <button
                  key={key}
                  onClick={() => setSelectedRole(key)}
                  className={`p-4 rounded-2xl text-left transition-all duration-300 border-2 ${
                    selectedRole === key ? 'scale-105' : 'hover:scale-102 border-transparent'
                  }`}
                  style={{
                    borderColor: selectedRole === key ? theme.primary : 'transparent',
                    backgroundColor: selectedRole === key ? `${theme.primary}15` : `${theme.bg}`,
                  }}
                >
                  <div className="text-2xl mb-1">{role.icon}</div>
                  <div className="font-semibold text-sm" style={{ color: theme.text }}>
                    {role.label}
                  </div>
                  <div className="text-xs opacity-60 mt-0.5">{role.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: 选择语气 */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-1 text-center" style={{ color: theme.text }}>
              你更喜欢什么语气？🎵
            </h2>
            <p className="text-center text-sm opacity-60 mb-4">这影响我说话的方式</p>
            <div className="space-y-3">
              {toneOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedTone(option.value)}
                  className={`w-full p-4 rounded-2xl text-left flex items-center gap-4 transition-all duration-300 border-2`}
                  style={{
                    borderColor: selectedTone === option.value ? theme.primary : 'transparent',
                    backgroundColor: selectedTone === option.value ? `${theme.primary}15` : theme.bg
                  }}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <div>
                    <div className="font-semibold" style={{ color: theme.text }}>{option.label}</div>
                    <div className="text-xs opacity-60">{option.desc}</div>
                  </div>
                  {selectedTone === option.value && (
                    <span className="ml-auto text-lg" style={{ color: theme.primary }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: 音色选择（新增） */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold mb-1 text-center" style={{ color: theme.text }}>
              选一个喜欢的声音 🎤
            </h2>
            <p className="text-center text-sm opacity-60 mb-3">点击卡片可以试听</p>

            {/* 男/女 切换 Tab */}
            <div className="flex rounded-2xl p-1 mb-4" style={{ backgroundColor: `${theme.secondary}40` }}>
              {(['female', 'male'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    setVoiceGender(g)
                    // 切换性别时默认选该性别第一个
                    const presets = g === 'male' ? MALE_PRESETS : FEMALE_PRESETS
                    if (!presets.includes(selectedVoice as VoicePreset)) {
                      setSelectedVoice(presets[0])
                    }
                  }}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-300"
                  style={{
                    backgroundColor: voiceGender === g ? theme.primary : 'transparent',
                    color: voiceGender === g ? 'white' : theme.text
                  }}
                >
                  {g === 'female' ? '👩 女生音色' : '👦 男生音色'}
                </button>
              ))}
            </div>

            {/* 音色卡片 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {currentPresets.map((presetId) => {
                const preset = VOICE_PRESETS[presetId]
                const isSelected = selectedVoice === presetId
                const isPreviewing = previewingVoice === presetId
                return (
                  <button
                    key={presetId}
                    onClick={() => {
                      setSelectedVoice(presetId)
                      previewVoice(presetId)
                    }}
                    className="p-3 rounded-2xl text-left transition-all duration-300 border-2 relative"
                    style={{
                      borderColor: isSelected ? theme.primary : 'transparent',
                      backgroundColor: isSelected ? `${theme.primary}15` : theme.bg
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{preset.emoji}</span>
                      {isPreviewing && (
                        <span className="text-xs animate-pulse" style={{ color: theme.primary }}>
                          ♪ 播放中
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-sm" style={{ color: theme.text }}>{preset.label}</div>
                    <div className="text-xs opacity-60 mt-0.5">{preset.desc}</div>
                    {isSelected && !isPreviewing && (
                      <div
                        className="absolute top-2 right-2 text-xs w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.primary, color: 'white' }}
                      >✓</div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* 进阶：上传自定义音色 */}
            <div
              className="rounded-2xl p-4 border-2 border-dashed transition-all duration-300"
              style={{
                borderColor: selectedVoice === 'custom' ? theme.primary : `${theme.secondary}80`,
                backgroundColor: selectedVoice === 'custom' ? `${theme.primary}10` : 'transparent'
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-sm font-medium" style={{ color: theme.text }}>🎙️ 进阶：上传自定义音色</span>
                  <div className="text-xs opacity-50 mt-0.5">上传一段 10-30 秒的清晰人声</div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: theme.primary }}
                >
                  {customVoiceDataUrl ? '重新上传' : '上传音频'}
                </button>
              </div>
              {customVoiceDataUrl && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-green-500 font-medium">✓ 已上传</span>
                  <button
                    onClick={() => {
                      setSelectedVoice('custom')
                      previewVoice('custom')
                    }}
                    className="text-xs px-2 py-0.5 rounded-lg border"
                    style={{ borderColor: theme.primary, color: theme.primary }}
                  >
                    试听
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleVoiceUpload}
              />
            </div>

            <p className="text-center text-xs opacity-40 mt-3">
              语音效果依赖设备系统声音，实际体验因设备而异
            </p>
          </div>
        )}

        {/* Step 4: 主动程度 */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold mb-1 text-center" style={{ color: theme.text }}>
              我可以主动找你吗？💭
            </h2>
            <p className="text-center text-sm opacity-60 mb-4">选择你舒服的节奏</p>
            <div className="space-y-3">
              {proactiveOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedProactive(option.value)}
                  className={`w-full p-4 rounded-2xl text-left flex items-center gap-4 transition-all duration-300 border-2`}
                  style={{
                    borderColor: selectedProactive === option.value ? theme.primary : 'transparent',
                    backgroundColor: selectedProactive === option.value ? `${theme.primary}15` : theme.bg
                  }}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <div>
                    <div className="font-semibold" style={{ color: theme.text }}>{option.label}</div>
                    <div className="text-xs opacity-60">{option.desc}</div>
                  </div>
                  {selectedProactive === option.value && (
                    <span className="ml-auto text-lg" style={{ color: theme.primary }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: 主题 & 昵称 */}
        {step === 5 && (
          <div>
            <h2 className="text-xl font-bold mb-1 text-center" style={{ color: theme.text }}>
              最后，给我起个名字 🌈
            </h2>
            <p className="text-center text-sm opacity-60 mb-4">还可以选择你喜欢的颜色风格</p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 opacity-70">给我起名字</label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="小愈、Luna、阿橘..."
                maxLength={10}
                className="w-full px-4 py-3 rounded-2xl border-2 outline-none transition-all duration-300 bg-white/70 text-center text-lg font-medium"
                style={{ borderColor: theme.primary, color: theme.text }}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-3 opacity-70">选择颜色主题</label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.entries(THEME_COLORS) as [ThemeColor, typeof THEME_COLORS[ThemeColor]][]).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTheme(key)}
                    className={`p-3 rounded-2xl transition-all duration-300 border-2 text-center`}
                    style={{
                      background: `linear-gradient(135deg, ${t.primary}30, ${t.secondary}40)`,
                      borderColor: selectedTheme === key ? t.primary : 'transparent'
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full mx-auto mb-1"
                      style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})` }}
                    />
                    <div className="text-xs font-medium" style={{ color: t.text }}>{t.label}</div>
                    {selectedTheme === key && (
                      <div className="text-xs mt-0.5" style={{ color: t.primary }}>✓ 已选</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 导航按钮 */}
        <div className="flex gap-3 mt-4">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 rounded-2xl border-2 font-medium transition-all duration-300 hover:opacity-80"
              style={{ borderColor: theme.primary, color: theme.primary }}
            >
              上一步
            </button>
          )}
          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 py-3 rounded-2xl font-bold text-white transition-all duration-300 hover:opacity-90 hover:scale-105 shadow-lg"
              style={{ backgroundColor: theme.primary }}
            >
              下一步 →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex-1 py-3 rounded-2xl font-bold text-white transition-all duration-300 hover:opacity-90 hover:scale-105 shadow-lg"
              style={{ backgroundColor: theme.primary }}
            >
              开始聊天 🌸
            </button>
          )}
        </div>
      </div>

      {/* 跳过按钮 */}
      <button
        onClick={() => {
          setConfig({ setupComplete: true })
          router.push('/chat')
        }}
        className="mt-4 text-sm opacity-40 hover:opacity-70 transition-opacity"
      >
        跳过设置，先看看
      </button>
    </div>
  )
}

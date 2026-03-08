'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/appStore'
import { ROLE_TEMPLATES, THEME_COLORS } from '@/types'
import type { RoleTemplate, ToneStyle, ProactiveLevel, ThemeColor } from '@/types'
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

export function SetupWizard() {
  const router = useRouter()
  const { config, setConfig } = useAppStore()
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState<RoleTemplate>('warm-friend')
  const [selectedTone, setSelectedTone] = useState<ToneStyle>('warm-healing')
  const [selectedProactive, setSelectedProactive] = useState<ProactiveLevel>('moderate')
  const [selectedTheme, setSelectedTheme] = useState<ThemeColor>('healing-blue')
  const [agentName, setAgentName] = useState('小愈')

  const theme = THEME_COLORS[selectedTheme]

  const handleFinish = () => {
    const roleInfo = ROLE_TEMPLATES[selectedRole]
    setConfig({
      roleTemplate: selectedRole,
      toneStyle: selectedTone,
      proactiveLevel: selectedProactive,
      themeColor: selectedTheme,
      agentName,
      personalityTags: roleInfo.defaultPersonality,
      setupComplete: true
    })
    router.push('/chat')
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 transition-all duration-700"
      style={{ background: `linear-gradient(135deg, ${theme.bg}, ${theme.secondary}20)` }}
    >
      {/* 进度条 */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500"
                style={{
                  backgroundColor: s <= step ? theme.primary : '#e5e7eb',
                  color: s <= step ? 'white' : '#9ca3af'
                }}
              >
                {s < step ? '✓' : s}
              </div>
              {s < 4 && (
                <div
                  className="h-1 w-12 sm:w-20 mx-1 transition-all duration-500"
                  style={{ backgroundColor: s < step ? theme.primary : '#e5e7eb' }}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-sm opacity-60">
          {step === 1 && '选择你的专属伙伴'}
          {step === 2 && '选择聊天风格'}
          {step === 3 && '选择主动程度'}
          {step === 4 && '个性化外观'}
        </p>
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8">

        {/* Step 1: 选择角色 */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: theme.text }}>
              你希望我是什么角色？✨
            </h2>
            <p className="text-center text-sm opacity-60 mb-6">选一个最对你胃口的</p>
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
            <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: theme.text }}>
              你更喜欢什么语气？🎵
            </h2>
            <p className="text-center text-sm opacity-60 mb-6">这影响我说话的方式</p>
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

        {/* Step 3: 主动程度 */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: theme.text }}>
              我可以主动找你吗？💭
            </h2>
            <p className="text-center text-sm opacity-60 mb-6">选择你舒服的节奏</p>
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

        {/* Step 4: 主题 & 昵称 */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: theme.text }}>
              最后，给我起个名字 🌈
            </h2>
            <p className="text-center text-sm opacity-60 mb-6">还可以选择你喜欢的颜色风格</p>

            <div className="mb-6">
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

            <div className="mb-6">
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
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 rounded-2xl border-2 font-medium transition-all duration-300 hover:opacity-80"
              style={{ borderColor: theme.primary, color: theme.primary }}
            >
              上一步
            </button>
          )}
          {step < 4 ? (
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

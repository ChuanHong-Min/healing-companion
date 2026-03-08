'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useAppStore } from '@/store/appStore'
import { THEME_COLORS } from '@/types'
import { ThemeSelector } from '@/components/ui/ThemeSelector'
import { VoiceCallModal } from './VoiceCallModal'

const EMOTION_COLORS: Record<string, string> = {
  happy: '#fbbf24',
  sad: '#60a5fa',
  anxious: '#f87171',
  angry: '#ef4444',
  excited: '#a78bfa',
  tired: '#94a3b8',
  calm: '#34d399',
  unknown: '#9ca3af'
}

const EMOTION_LABELS: Record<string, string> = {
  happy: '开心', sad: '难过', anxious: '焦虑',
  angry: '生气', excited: '兴奋', tired: '疲惫',
  calm: '平静', unknown: ''
}

export function ChatHeader() {
  const { config, clearMessages, currentEmotion } = useAppStore()
  const theme = THEME_COLORS[config.themeColor]
  const [showMenu, setShowMenu] = useState(false)
  const [showVoiceCall, setShowVoiceCall] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const menuPortal = showMenu && mounted ? createPortal(
    <>
      {/* 点击外部关闭遮罩 */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 9998 }}
        onClick={() => setShowMenu(false)}
      />
      {/* 下拉菜单 — 渲染到 body，避免被 overflow:hidden 裁剪 */}
      <div
        className="fixed top-14 right-4 w-52 rounded-2xl shadow-2xl border overflow-hidden"
        style={{ backgroundColor: theme.bg, borderColor: `${theme.secondary}40`, zIndex: 9999 }}
      >
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3.5 hover:opacity-70 transition-opacity text-sm"
          style={{ color: theme.text }}
          onClick={() => setShowMenu(false)}
        >
          ⚙️ 个性化设置
        </Link>
        <button
          onClick={() => { clearMessages(); setShowMenu(false) }}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:opacity-70 transition-opacity text-sm text-left"
          style={{ color: theme.text }}
        >
          🗑️ 清空对话
        </button>
        <div className="border-t" style={{ borderColor: `${theme.secondary}40` }} />
        <div className="px-4 py-3">
          <p className="text-xs opacity-50 mb-2">主题颜色</p>
          <ThemeSelector compact />
        </div>
      </div>
    </>,
    document.body
  ) : null

  return (
    <div
      className="px-4 py-3 flex items-center gap-3 border-b backdrop-blur-sm relative"
      style={{ borderColor: `${theme.secondary}40`, backgroundColor: `${theme.bg}e0` }}
    >
      {/* AI 头像 */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm"
        style={{ backgroundColor: `${theme.primary}20` }}
      >
        🌸
      </div>

      {/* AI 名字 & 情绪状态 */}
      <div className="flex-1">
        <h1 className="font-bold text-base" style={{ color: theme.text }}>
          {config.agentName}
        </h1>
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: '#34d399' }}
          />
          <span className="text-xs opacity-50">在线</span>
          {currentEmotion && currentEmotion !== 'unknown' && EMOTION_LABELS[currentEmotion] && (
            <>
              <span className="text-xs opacity-30">·</span>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${EMOTION_COLORS[currentEmotion]}20`,
                  color: EMOTION_COLORS[currentEmotion]
                }}
              >
                {EMOTION_LABELS[currentEmotion]}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 语音通话按钮 */}
      <button
        onClick={() => setShowVoiceCall(true)}
        className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm"
        style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}
        title="语音通话"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
        </svg>
      </button>

      {/* 主题选择器（宽屏显示） */}
      <div className="hidden sm:block">
        <ThemeSelector compact />
      </div>

      {/* 菜单按钮 */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:opacity-70"
        style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}
      >
        ⋯
      </button>

      {/* 下拉菜单（Portal 到 body，彻底避免被 overflow:hidden 裁剪） */}
      {menuPortal}

      {/* 语音通话全屏弹窗 */}
      {showVoiceCall && (
        <VoiceCallModal onClose={() => setShowVoiceCall(false)} />
      )}
    </div>
  )
}

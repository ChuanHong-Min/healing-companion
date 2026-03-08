'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAppStore } from '@/store/appStore'
import { THEME_COLORS } from '@/types'
import { ThemeSelector } from '@/components/ui/ThemeSelector'

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

      {/* 主题选择器 */}
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

      {/* 下拉菜单 */}
      {showMenu && (
        <div
          className="absolute top-full right-4 mt-1 w-48 rounded-2xl shadow-xl border overflow-hidden z-50"
          style={{ backgroundColor: theme.bg, borderColor: `${theme.secondary}40` }}
        >
          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-3 hover:opacity-70 transition-opacity text-sm"
            style={{ color: theme.text }}
            onClick={() => setShowMenu(false)}
          >
            ⚙️ 设置
          </Link>
          <button
            onClick={() => { clearMessages(); setShowMenu(false) }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:opacity-70 transition-opacity text-sm text-left"
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
      )}

      {/* 点击外部关闭菜单 */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}

'use client'
import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { THEME_COLORS } from '@/types'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { config } = useAppStore()
  const theme = THEME_COLORS[config.themeColor]

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-bg', theme.bg)
    root.style.setProperty('--color-primary', theme.primary)
    root.style.setProperty('--color-secondary', theme.secondary)
    root.style.setProperty('--color-accent', theme.accent)
    root.style.setProperty('--color-text', theme.text)
    root.style.setProperty('--color-bubble', theme.bubble)
  }, [theme])

  return (
    <div
      className="min-h-screen transition-colors duration-700"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {children}
    </div>
  )
}

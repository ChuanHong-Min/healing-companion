'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/appStore'
import { THEME_COLORS } from '@/types'

export default function Home() {
  const router = useRouter()
  const { config } = useAppStore()
  const theme = THEME_COLORS[config.themeColor]

  useEffect(() => {
    if (config.setupComplete) {
      router.push('/chat')
    } else {
      router.push('/setup')
    }
  }, [config.setupComplete, router])

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${theme.bg}, ${theme.secondary}30)` }}
    >
      <div className="text-center animate-pulse">
        <div className="text-5xl mb-4 animate-float">🌸</div>
        <p className="text-lg font-medium opacity-60" style={{ color: theme.text }}>
          治愈伙伴正在启动...
        </p>
      </div>
    </div>
  )
}

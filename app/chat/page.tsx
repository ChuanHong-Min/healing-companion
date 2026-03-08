'use client'
import { useAppStore } from '@/store/appStore'
import { THEME_COLORS } from '@/types'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { ChatMessages } from '@/components/chat/ChatMessages'
import { ChatInput } from '@/components/chat/ChatInput'

export default function ChatPage() {
  const { config } = useAppStore()
  const theme = THEME_COLORS[config.themeColor]

  return (
    <div
      className="flex flex-col h-screen max-w-2xl mx-auto relative overflow-hidden"
      style={{ backgroundColor: theme.bg }}
    >
      {/* 治愈系背景装饰 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 20% 20%, ${theme.secondary}30 0%, transparent 50%),
                       radial-gradient(ellipse at 80% 80%, ${theme.primary}15 0%, transparent 50%)`
        }}
      />

      {/* 聊天界面 */}
      <div className="relative z-10 flex flex-col h-full">
        <ChatHeader />
        <ChatMessages />
        <ChatInput />
      </div>
    </div>
  )
}

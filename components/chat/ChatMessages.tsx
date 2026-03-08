'use client'
import { useRef, useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { THEME_COLORS } from '@/types'
import { formatTime } from '@/lib/utils'
import type { Message } from '@/types'

const EMOTION_EMOJI: Record<string, string> = {
  happy: '😊',
  sad: '🥺',
  anxious: '😰',
  angry: '😤',
  excited: '🎉',
  tired: '😴',
  calm: '😌',
  unknown: ''
}

function MessageBubble({ message, agentName }: {
  message: Message
  agentName: string
}) {
  const { config } = useAppStore()
  const theme = THEME_COLORS[config.themeColor]
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}>
      {!isUser && (
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-lg mr-2 flex-shrink-0 shadow-sm"
          style={{ backgroundColor: `${theme.primary}20` }}
        >
          🌸
        </div>
      )}
      <div className={`max-w-[78%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!isUser && (
          <span className="text-xs opacity-50 ml-1">{agentName}</span>
        )}
        <div
          className="px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm"
          style={{
            backgroundColor: isUser ? theme.primary : theme.bubble,
            color: isUser ? 'white' : theme.text,
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px'
          }}
        >
          {message.content || (
            <span className="flex gap-1 py-1">
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.primary, animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.primary, animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.primary, animationDelay: '300ms' }} />
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 px-1">
          <span className="text-xs opacity-30">{formatTime(message.timestamp)}</span>
          {message.emotion && message.emotion !== 'unknown' && (
            <span className="text-xs">{EMOTION_EMOJI[message.emotion]}</span>
          )}
        </div>
      </div>

      {isUser && (
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-lg ml-2 flex-shrink-0 shadow-sm"
          style={{ backgroundColor: `${theme.primary}20` }}
        >
          👤
        </div>
      )}
    </div>
  )
}

export function ChatMessages() {
  const { config, messages } = useAppStore()
  const theme = THEME_COLORS[config.themeColor]
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const welcomeMessage = `嗨～我是${config.agentName}！很高兴认识你 ${
    config.roleTemplate === 'warm-friend' ? '🤗 有什么想聊的都可以说呀' :
    config.roleTemplate === 'gentle-confidant' ? '💝 我会好好听你说的' :
    config.roleTemplate === 'energetic-buddy' ? '⚡ 今天要怎么一起玩呢！' :
    config.roleTemplate === 'calm-companion' ? '🌿 有什么需要帮忙的吗' :
    config.roleTemplate === 'healing-vault' ? '🌙 这里是你的安全空间，说什么都好' :
    '🎮 来聊聊吧，一起开心！'
  }`

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
      {/* 欢迎消息 */}
      {messages.length === 0 && (
        <div className="flex justify-start mb-4">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg mr-2 flex-shrink-0"
            style={{ backgroundColor: `${theme.primary}20` }}
          >
            🌸
          </div>
          <div className="max-w-[78%]">
            <span className="text-xs opacity-50 ml-1 block mb-1">{config.agentName}</span>
            <div
              className="px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm"
              style={{
                backgroundColor: theme.bubble,
                color: theme.text,
                borderRadius: '18px 18px 18px 4px'
              }}
            >
              {welcomeMessage}
            </div>
          </div>
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          agentName={config.agentName}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

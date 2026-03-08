'use client'
import { useState, useCallback, useRef } from 'react'
import { useAppStore } from '@/store/appStore'
import type { Message } from '@/types'
import { generateId } from '@/lib/utils'
import type { EmotionRiskLevel } from '@/lib/utils'

export function useChat() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [emotionRiskLevel, setEmotionRiskLevel] = useState<EmotionRiskLevel>('mild')
  const abortControllerRef = useRef<AbortController | null>(null)
  const { config, messages, addMessage, addMemory, setCurrentEmotion, memories } = useAppStore()

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now()
    }
    addMessage(userMessage)
    setIsStreaming(true)

    const assistantId = generateId()
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    }
    addMessage(assistantMessage)

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          config,
          memories: memories.slice(-10)
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) throw new Error('请求失败')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('无法读取响应')

      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          try {
            const parsed = JSON.parse(data)

            if (parsed.type === 'delta') {
              accumulatedText += parsed.text
              useAppStore.setState(state => ({
                messages: state.messages.map(msg =>
                  msg.id === assistantId
                    ? { ...msg, content: accumulatedText, emotion: parsed.emotion }
                    : msg
                )
              }))
            } else if (parsed.type === 'done') {
              setCurrentEmotion(parsed.emotion)
              if (parsed.riskLevel) setEmotionRiskLevel(parsed.riskLevel as EmotionRiskLevel)

              if (parsed.memory && config.memoryScope !== 'no-private') {
                const memory = {
                  id: generateId(),
                  type: 'emotion' as const,
                  content: parsed.memory,
                  timestamp: Date.now(),
                  tags: [parsed.emotion],
                  expiresAt: config.retentionPeriod === '24h'
                    ? Date.now() + 24 * 60 * 60 * 1000
                    : config.retentionPeriod === '7d'
                    ? Date.now() + 7 * 24 * 60 * 60 * 1000
                    : undefined
                }
                addMemory(memory)
              }
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    } catch (error: unknown) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Chat error:', error)
        useAppStore.setState(state => ({
          messages: state.messages.map(msg =>
            msg.id === assistantId
              ? { ...msg, content: '抱歉，我暂时连不上服务器，稍后再试试吧 🌸' }
              : msg
          )
        }))
      }
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [isStreaming, config, messages, memories, addMessage, addMemory, setCurrentEmotion])

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  return { sendMessage, isStreaming, stopStreaming, emotionRiskLevel }
}

'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { THEME_COLORS, VOICE_PRESETS } from '@/types'
import { useVoice } from '@/hooks/useVoice'
import { generateId } from '@/lib/utils'

type CallState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking'

interface VoiceCallModalProps {
  onClose: () => void
}

export function VoiceCallModal({ onClose }: VoiceCallModalProps) {
  const [callState, setCallState] = useState<CallState>('connecting')
  const [callDuration, setCallDuration] = useState(0)
  const [userSpeech, setUserSpeech] = useState('')
  const [agentSpeech, setAgentSpeech] = useState('')
  const { config, messages, addMessage, addMemory, memories, setCurrentEmotion } = useAppStore()
  const theme = THEME_COLORS[config.themeColor]
  const voicePreset = VOICE_PRESETS[config.voiceTone] ?? VOICE_PRESETS['neutral']
  const { speak, stopSpeaking, isSpeaking, startRecording, stopRecording, isRecording } = useVoice()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isActiveRef = useRef(true)

  // 通话计时
  useEffect(() => {
    if (callState !== 'idle' && callState !== 'connecting') {
      timerRef.current = setInterval(() => {
        setCallDuration(d => d + 1)
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [callState])

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = (sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // 向 AI 发送消息并获取语音回复
  const sendToAI = useCallback(async (userText: string) => {
    if (!isActiveRef.current) return
    setCallState('thinking')
    setAgentSpeech('')

    const userMsg = {
      id: generateId(),
      role: 'user' as const,
      content: userText,
      timestamp: Date.now()
    }
    addMessage(userMsg)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          config,
          memories: memories.slice(-10)
        })
      })

      if (!response.ok || !isActiveRef.current) return

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      if (!reader) return

      while (isActiveRef.current) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const parsed = JSON.parse(line.slice(6))
            if (parsed.type === 'delta') {
              fullText += parsed.text
              setAgentSpeech(fullText)
            } else if (parsed.type === 'done') {
              setCurrentEmotion(parsed.emotion)
              if (parsed.memory && config.memoryScope !== 'no-private') {
                addMemory({
                  id: generateId(),
                  type: 'emotion',
                  content: parsed.memory,
                  timestamp: Date.now(),
                  tags: [parsed.emotion]
                })
              }
            }
          } catch { /* ignore */ }
        }
      }

      if (!isActiveRef.current || !fullText) return

      // 把 AI 回复存入消息
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: fullText,
        timestamp: Date.now()
      })

      // 语音播放回复
      setCallState('speaking')
      await speak(fullText)

      if (isActiveRef.current) {
        // 播放完后自动开始监听用户说话
        setCallState('listening')
        startListening()
      }
    } catch (err) {
      console.error('语音通话 AI 请求失败:', err)
      if (isActiveRef.current) {
        setCallState('listening')
        startListening()
      }
    }
  }, [addMemory, addMessage, config, memories, messages, setCurrentEmotion, speak])

  // 开始监听用户说话
  const startListening = useCallback(() => {
    if (!isActiveRef.current) return
    setUserSpeech('')
    setCallState('listening')
    startRecording(
      (text) => {
        if (!isActiveRef.current || !text.trim()) return
        setUserSpeech(text)
        sendToAI(text)
      },
      () => {
        // 出错后继续监听
        if (isActiveRef.current) {
          setTimeout(() => startListening(), 1000)
        }
      }
    )
  }, [sendToAI, startRecording])

  // 组件挂载后延迟0.8s接通，模拟真实电话感
  useEffect(() => {
    isActiveRef.current = true
    const connectTimer = setTimeout(() => {
      if (!isActiveRef.current) return
      setCallState('listening')
      // 先让 AI 打个招呼
      sendToAI('你好，我想和你语音聊聊')
    }, 800)
    return () => {
      clearTimeout(connectTimer)
      isActiveRef.current = false
      stopSpeaking()
      stopRecording()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleHangUp = () => {
    isActiveRef.current = false
    stopSpeaking()
    stopRecording()
    onClose()
  }

  const stateLabel: Record<CallState, string> = {
    idle: '准备中...',
    connecting: '连接中...',
    listening: '在听你说话...',
    thinking: '思考中...',
    speaking: `${config.agentName}正在说话`
  }

  return (
    <div
      className="fixed inset-0 z-[500] flex flex-col items-center justify-between py-12 px-6"
      style={{
        background: `linear-gradient(160deg, ${theme.primary} 0%, ${theme.accent}ee 50%, ${theme.secondary}dd 100%)`,
      }}
    >
      {/* 顶部：通话时长 */}
      <div className="text-center">
        <p className="text-white/70 text-sm">语音通话</p>
        {callState !== 'connecting' && (
          <p className="text-white text-lg font-mono mt-1">{formatDuration(callDuration)}</p>
        )}
      </div>

      {/* 中部：AI 头像 + 状态 */}
      <div className="flex flex-col items-center gap-6">
        {/* AI 头像：随状态变化动画 */}
        <div className="relative">
          {/* 外圈波纹（说话/监听时） */}
          {(callState === 'speaking' || callState === 'listening') && (
            <>
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-30"
                style={{ backgroundColor: 'white', transform: 'scale(1.4)' }}
              />
              <div
                className="absolute inset-0 rounded-full animate-pulse opacity-20"
                style={{ backgroundColor: 'white', transform: 'scale(1.7)', animationDelay: '0.3s' }}
              />
            </>
          )}
          <div
            className="relative w-28 h-28 rounded-full flex items-center justify-center text-5xl shadow-2xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.25)', border: '3px solid rgba(255,255,255,0.5)' }}
          >
            🌸
          </div>
        </div>

        {/* AI 名字 */}
        <div className="text-center">
          <h2 className="text-white text-2xl font-bold">{config.agentName}</h2>
          <p className="text-white/80 text-sm mt-1">
            {voicePreset.emoji} {voicePreset.label} · {stateLabel[callState]}
          </p>
        </div>

        {/* 字幕区：显示当前在说的内容 */}
        <div
          className="w-full max-w-sm min-h-16 px-4 py-3 rounded-2xl text-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
        >
          {callState === 'listening' && userSpeech && (
            <p className="text-white/90 text-sm">你：{userSpeech}</p>
          )}
          {callState === 'listening' && !userSpeech && (
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          {callState === 'thinking' && (
            <p className="text-white/60 text-sm animate-pulse">正在思考...</p>
          )}
          {callState === 'speaking' && agentSpeech && (
            <p className="text-white text-sm leading-relaxed line-clamp-3">{agentSpeech}</p>
          )}
          {callState === 'connecting' && (
            <p className="text-white/60 text-sm animate-pulse">正在接通 {config.agentName}...</p>
          )}
        </div>

        {/* 麦克风状态指示 */}
        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <span className="w-2 h-2 bg-red-400 rounded-full animate-ping" />
            <span className="text-white/80 text-xs">麦克风已开启</span>
          </div>
        )}
      </div>

      {/* 底部：挂断按钮 */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleHangUp}
          className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-transform active:scale-95"
          style={{ backgroundColor: '#ef4444' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
        </button>
        <p className="text-white/60 text-xs">点击挂断</p>
      </div>
    </div>
  )
}

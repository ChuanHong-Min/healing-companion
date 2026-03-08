'use client'
import { useState, useRef, useCallback } from 'react'
import { useAppStore } from '@/store/appStore'
import { THEME_COLORS } from '@/types'
import { useChat } from '@/hooks/useChat'
import { useVoice } from '@/hooks/useVoice'

export function ChatInput() {
  const [inputText, setInputText] = useState('')
  const [voiceError, setVoiceError] = useState('')
  const { config } = useAppStore()
  const theme = THEME_COLORS[config.themeColor]
  const { sendMessage, isStreaming, emotionRiskLevel } = useChat()
  const { startRecording, stopRecording, isRecording, transcript } = useVoice()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(async () => {
    const text = inputText.trim()
    if (!text || isStreaming) return
    setInputText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    await sendMessage(text)
  }, [inputText, isStreaming, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value)
    // 自动调整高度
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }

  const handleVoiceClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      setVoiceError('')
      startRecording(
        (text) => {
          setInputText(prev => prev + text)
        },
        (errMsg) => {
          setVoiceError(errMsg)
          // 3秒后自动清除错误提示
          setTimeout(() => setVoiceError(''), 4000)
        }
      )
    }
  }

  return (
    <div
      className="px-4 py-3 border-t backdrop-blur-sm"
      style={{ borderColor: `${theme.secondary}40`, backgroundColor: `${theme.bg}e0` }}
    >
      {/* 严重情绪风险提示横幅 */}
      {emotionRiskLevel === 'severe' && (
        <div className="mb-2 px-4 py-3 rounded-xl text-sm flex items-start gap-2 bg-red-50 border border-red-200">
          <span className="text-red-500 mt-0.5 flex-shrink-0">🆘</span>
          <div>
            <p className="text-red-700 font-medium">如果你现在很痛苦，你并不孤单</p>
            <p className="text-red-600 text-xs mt-0.5">
              心理援助热线：<span className="font-bold">400-161-9995</span>（全国）· 北京危机干预：<span className="font-bold">010-82951332</span>
            </p>
          </div>
        </div>
      )}

      {/* 中度情绪提示 */}
      {emotionRiskLevel === 'moderate' && (
        <div className="mb-2 px-3 py-2 rounded-xl text-xs flex items-center gap-2"
          style={{ backgroundColor: `${theme.primary}10`, color: theme.primary }}>
          <span>💝</span>
          <span>我在认真听，慢慢说，不着急</span>
        </div>
      )}

      {/* 录音提示 */}
      {isRecording && (
        <div
          className="mb-2 px-3 py-2 rounded-xl text-sm flex items-center gap-2 animate-pulse"
          style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}
        >
          <span className="w-2 h-2 bg-red-400 rounded-full animate-ping" />
          <span>正在录音... {transcript && `"${transcript}"`}</span>
        </div>
      )}

      {/* 语音错误提示 */}
      {voiceError && (
        <div className="mb-2 px-3 py-2 rounded-xl text-sm flex items-center gap-2 bg-orange-50 border border-orange-200">
          <span>🎤</span>
          <span className="text-orange-700">{voiceError}</span>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* 语音按钮 */}
        <button
          onClick={handleVoiceClick}
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            isRecording ? 'animate-pulse shadow-lg scale-110' : 'hover:scale-105'
          }`}
          style={{
            backgroundColor: isRecording ? '#ef4444' : `${theme.primary}15`,
            color: isRecording ? 'white' : theme.primary
          }}
          title={isRecording ? '点击停止录音' : '点击开始语音输入'}
        >
          {isRecording ? '⏹' : '🎤'}
        </button>

        {/* 输入框 */}
        <div
          className="flex-1 rounded-2xl px-4 py-2 flex items-end border-2 transition-all duration-300"
          style={{ borderColor: `${theme.primary}40`, backgroundColor: 'white' }}
        >
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? `${config.agentName}正在思考...` : `和${config.agentName}说些什么...`}
            disabled={isStreaming}
            rows={1}
            className="flex-1 resize-none outline-none text-sm leading-6 bg-transparent"
            style={{ color: theme.text, maxHeight: '120px' }}
          />
        </div>

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || isStreaming}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          style={{ backgroundColor: theme.primary }}
        >
          {isStreaming ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-white text-lg">↑</span>
          )}
        </button>
      </div>

      <p className="text-center text-xs opacity-30 mt-1">Enter 发送 · Shift+Enter 换行 · 🎤 语音输入</p>
    </div>
  )
}

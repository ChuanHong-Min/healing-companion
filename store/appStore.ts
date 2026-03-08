import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AgentConfig, Message, MemoryEntry, EmotionRecord, ThemeColor } from '@/types'
import { DEFAULT_AGENT_CONFIG, THEME_COLORS } from '@/types'

interface AppState {
  // 配置
  config: AgentConfig
  setConfig: (config: Partial<AgentConfig>) => void
  resetConfig: () => void

  // 消息
  messages: Message[]
  addMessage: (message: Message) => void
  clearMessages: () => void

  // 记忆
  memories: MemoryEntry[]
  addMemory: (memory: MemoryEntry) => void
  removeMemory: (id: string) => void
  clearMemories: () => void

  // 情绪历史
  emotionHistory: EmotionRecord[]
  addEmotionRecord: (record: EmotionRecord) => void

  // 当前主题
  themeColor: ThemeColor
  setThemeColor: (color: ThemeColor) => void

  // 是否正在加载
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // 语音模式
  voiceMode: boolean
  setVoiceMode: (enabled: boolean) => void

  // 当前情绪
  currentEmotion: string | null
  setCurrentEmotion: (emotion: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      config: DEFAULT_AGENT_CONFIG,
      setConfig: (partial) =>
        set((state) => ({ config: { ...state.config, ...partial } })),
      resetConfig: () => set({ config: DEFAULT_AGENT_CONFIG }),

      messages: [],
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages.slice(-100), message]
        })),
      clearMessages: () => set({ messages: [] }),

      memories: [],
      addMemory: (memory) =>
        set((state) => ({ memories: [...state.memories, memory] })),
      removeMemory: (id) =>
        set((state) => ({ memories: state.memories.filter((m) => m.id !== id) })),
      clearMemories: () => set({ memories: [] }),

      emotionHistory: [],
      addEmotionRecord: (record) =>
        set((state) => ({
          emotionHistory: [...state.emotionHistory.slice(-500), record]
        })),

      themeColor: 'healing-blue',
      setThemeColor: (color) =>
        set((state) => ({
          themeColor: color,
          config: { ...state.config, themeColor: color }
        })),

      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),

      voiceMode: false,
      setVoiceMode: (enabled) => set({ voiceMode: enabled }),

      currentEmotion: null,
      setCurrentEmotion: (emotion) => set({ currentEmotion: emotion })
    }),
    {
      name: 'healing-companion-storage',
      partialize: (state) => ({
        // customVoiceDataUrl 可能很大（base64 音频），单独用 key 存以避免主存储超限
        config: { ...state.config, customVoiceDataUrl: undefined },
        memories: state.memories,
        emotionHistory: state.emotionHistory,
        themeColor: state.themeColor
      })
    }
  )
)

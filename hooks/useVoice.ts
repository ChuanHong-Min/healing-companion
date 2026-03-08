'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { VOICE_PRESETS } from '@/types'

// 把长文本分割成短句（按标点），模拟人说话时的自然停顿与语速变化
function splitIntoChunks(text: string): string[] {
  // 先按换行分割，再按句末标点分割
  const raw = text
    .replace(/\n+/g, '。')
    .split(/(?<=[。！？…~～，,、；;：:\s]{1,2})/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
  return raw
}

// 在 base rate 上叠加随机微扰，模拟人说话忽快忽慢
function jitter(base: number, variance: number): number {
  return base + (Math.random() * 2 - 1) * variance
}

export function useVoice() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const { config } = useAppStore()
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const speakingRef = useRef(false)
  const utteranceQueueRef = useRef<SpeechSynthesisUtterance[]>([])

  // 获取当前音色配置（优先用 voiceTone preset，fallback neutral）
  const getPreset = useCallback(() => {
    return VOICE_PRESETS[config.voiceTone] ?? VOICE_PRESETS['neutral']
  }, [config.voiceTone])

  // 从系统可用声音里选最匹配的中文声音
  const pickVoice = useCallback((gender: 'male' | 'female' | 'neutral') => {
    const voices = window.speechSynthesis.getVoices()
    const zhVoices = voices.filter(v => v.lang.startsWith('zh'))
    if (zhVoices.length === 0) return null

    if (gender === 'female') {
      const match = zhVoices.find(v =>
        v.name.toLowerCase().includes('female') ||
        v.name.includes('女') ||
        v.name.toLowerCase().includes('meijia') ||
        v.name.toLowerCase().includes('tingting')
      )
      return match ?? zhVoices[0]
    }
    if (gender === 'male') {
      const match = zhVoices.find(v =>
        v.name.toLowerCase().includes('male') ||
        v.name.includes('男') ||
        v.name.toLowerCase().includes('yu') ||
        v.name.toLowerCase().includes('lekuo')
      )
      return match ?? zhVoices[zhVoices.length - 1]
    }
    return zhVoices[0]
  }, [])

  // 用自定义音色（上传音频）播放 —— 浏览器端直接播放 DataURL
  const speakCustom = useCallback((text: string) => {
    if (!config.customVoiceDataUrl) return false
    // 自定义音色目前以系统TTS为底层，但用预设参数微调
    // 如果未来接入云端克隆API，在这里替换实现
    return false
  }, [config.customVoiceDataUrl])

  // TTS - 文字转语音（自然语速版）
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    window.speechSynthesis.cancel()
    speakingRef.current = false
    setIsSpeaking(false)
    utteranceQueueRef.current = []

    // 尝试自定义音色
    if (config.voiceTone === 'custom' && speakCustom(text)) return

    const preset = getPreset()

    // 根据 voicePitch 配置计算语速/音调倍率
    // gentle=慢速温柔(×0.85)，normal=正常(×1.0)，energetic=活泼快速(×1.12)
    const pitchMultiplier = config.voicePitch === 'gentle' ? 0.88 : config.voicePitch === 'energetic' ? 1.12 : 1.0
    const rateMultiplier = config.voicePitch === 'gentle' ? 0.85 : config.voicePitch === 'energetic' ? 1.10 : 1.0

    // 按短句分割，让每句可以有细微语速差异
    const chunks = splitIntoChunks(text)
    if (chunks.length === 0) return

    speakingRef.current = true
    setIsSpeaking(true)

    const voice = pickVoice(preset.gender)

    let idx = 0
    const speakNext = () => {
      if (!speakingRef.current || idx >= chunks.length) {
        speakingRef.current = false
        setIsSpeaking(false)
        return
      }
      const chunk = chunks[idx++]
      const utterance = new SpeechSynthesisUtterance(chunk)
      utterance.lang = 'zh-CN'
      // 对 pitch/rate 加随机扰动，再叠加 voicePitch 倍率
      utterance.pitch = Math.max(0.5, Math.min(2.0, jitter(preset.pitch * pitchMultiplier, preset.pitchVariance)))
      utterance.rate = Math.max(0.4, Math.min(2.0, jitter(preset.rate * rateMultiplier, preset.rateVariance)))
      utterance.volume = 1.0
      if (voice) utterance.voice = voice
      utterance.onend = speakNext
      utterance.onerror = () => {
        speakingRef.current = false
        setIsSpeaking(false)
      }
      window.speechSynthesis.speak(utterance)
    }

    // iOS/Safari 需要等 voices 加载
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null
        speakNext()
      }
    } else {
      speakNext()
    }
  }, [config.voiceTone, config.voicePitch, getPreset, pickVoice, speakCustom])

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speakingRef.current = false
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  // STT - 语音转文字
  const startRecording = useCallback((onResult: (text: string) => void) => {
    if (typeof window === 'undefined') return

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      console.warn('浏览器不支持语音识别')
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => setIsRecording(true)
    recognition.onend = () => setIsRecording(false)
    recognition.onerror = () => setIsRecording(false)

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1]
      const text = result[0].transcript
      setTranscript(text)
      if (result.isFinal) {
        onResult(text)
        setTranscript('')
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      speakingRef.current = false
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (recognitionRef.current) recognitionRef.current.stop()
    }
  }, [])

  return {
    speak,
    stopSpeaking,
    isSpeaking,
    startRecording,
    stopRecording,
    isRecording,
    transcript
  }
}

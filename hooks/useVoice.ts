'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { VOICE_PRESETS } from '@/types'

// 把长文本分割成短句（按标点），模拟人说话时的自然停顿与语速变化
function splitIntoChunks(text: string): string[] {
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
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 获取当前音色配置（优先用 voiceTone preset，fallback neutral）
  const getPreset = useCallback(() => {
    return VOICE_PRESETS[config.voiceTone] ?? VOICE_PRESETS['neutral']
  }, [config.voiceTone])

  // 从系统可用声音里选最匹配的中文声音（Web Speech API 降级用）
  const pickVoice = useCallback((gender: 'male' | 'female' | 'neutral') => {
    const voices = window.speechSynthesis.getVoices()
    const zhVoices = voices.filter(v => v.lang.startsWith('zh'))
    if (zhVoices.length === 0) return null

    if (gender === 'female') {
      const match = zhVoices.find(v =>
        v.name.toLowerCase().includes('female') ||
        v.name.includes('女') ||
        v.name.toLowerCase().includes('meijia') ||
        v.name.toLowerCase().includes('tingting') ||
        v.name.toLowerCase().includes('xiaoyi') ||
        v.name.toLowerCase().includes('xiaoxiao')
      )
      return match ?? zhVoices[0]
    }
    if (gender === 'male') {
      const match = zhVoices.find(v =>
        v.name.toLowerCase().includes('male') ||
        v.name.includes('男') ||
        v.name.toLowerCase().includes('yunxi') ||
        v.name.toLowerCase().includes('lekuo')
      )
      return match ?? zhVoices[zhVoices.length - 1]
    }
    return zhVoices[0]
  }, [])

  // 用 Web Speech API 朗读（降级方案）
  const speakWithWebAPI = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const preset = getPreset()
    const pitchMultiplier = config.voicePitch === 'gentle' ? 0.88 : config.voicePitch === 'energetic' ? 1.12 : 1.0
    const rateMultiplier = config.voicePitch === 'gentle' ? 0.85 : config.voicePitch === 'energetic' ? 1.10 : 1.0
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
      utterance.pitch = Math.max(0.5, Math.min(2.0, jitter(preset.pitch * pitchMultiplier, preset.pitchVariance)))
      utterance.rate = Math.max(0.4, Math.min(2.0, jitter(preset.rate * rateMultiplier, preset.rateVariance)))
      utterance.volume = 1.0
      if (voice) utterance.voice = voice
      utterance.onend = speakNext
      utterance.onerror = () => { speakingRef.current = false; setIsSpeaking(false) }
      window.speechSynthesis.speak(utterance)
    }
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null
        speakNext()
      }
    } else {
      speakNext()
    }
  }, [config.voicePitch, getPreset, pickVoice])

  // TTS - 优先用 Edge TTS（真实 Neural 声音），降级用 Web Speech API
  const speak = useCallback(async (text: string) => {
    if (typeof window === 'undefined') return
    // 停止之前的播放
    speakingRef.current = false
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setIsSpeaking(false)

    if (!text.trim()) return

    try {
      speakingRef.current = true
      setIsSpeaking(true)
      const resp = await fetch('/api/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.slice(0, 500),
          voiceTone: config.voiceTone,
          voicePitch: config.voicePitch
        })
      })

      if (resp.ok && resp.headers.get('Content-Type')?.includes('audio')) {
        const blob = await resp.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = () => {
          URL.revokeObjectURL(url)
          speakingRef.current = false
          setIsSpeaking(false)
        }
        audio.onerror = () => {
          URL.revokeObjectURL(url)
          speakingRef.current = false
          setIsSpeaking(false)
        }
        if (speakingRef.current) await audio.play()
      } else {
        // Edge TTS 失败，降级到 Web Speech API
        speakWithWebAPI(text)
      }
    } catch {
      // 网络错误降级
      speakWithWebAPI(text)
    }
  }, [config.voiceTone, config.voicePitch, speakWithWebAPI])

  const stopSpeaking = useCallback(() => {
    speakingRef.current = false
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }, [])

  // STT - 语音转文字（含权限检测与错误提示）
  const startRecording = useCallback((
    onResult: (text: string) => void,
    onError?: (msg: string) => void
  ) => {
    if (typeof window === 'undefined') return

    // 检测 API 支持
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      const msg = '当前浏览器不支持语音识别，请使用 Chrome 或 Edge 浏览器'
      console.warn(msg)
      onError?.(msg)
      return
    }

    // 请求麦克风权限（提前授权，避免无提示退出）
    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then(() => {
        const recognition = new SpeechRecognitionAPI()
        recognition.lang = 'zh-CN'
        recognition.continuous = false
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
          setIsRecording(true)
          setTranscript('')
        }
        recognition.onend = () => {
          setIsRecording(false)
        }
        recognition.onerror = (event: Event & { error?: string }) => {
          setIsRecording(false)
          setTranscript('')
          const errorCode = (event as SpeechRecognitionErrorEvent).error
          let msg = '语音识别出错'
          if (errorCode === 'not-allowed') msg = '麦克风权限被拒绝，请在浏览器设置中允许访问麦克风'
          else if (errorCode === 'no-speech') msg = '未检测到声音，请靠近麦克风再试'
          else if (errorCode === 'network') msg = '网络错误，请检查网络连接'
          else if (errorCode === 'aborted') msg = '录音已中止'
          console.warn('语音识别错误:', errorCode, msg)
          onError?.(msg)
        }

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
      })
      .catch(() => {
        const msg = '无法访问麦克风，请在浏览器地址栏点击🔒允许麦克风权限'
        console.warn(msg)
        onError?.(msg)
      })
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
      if (audioRef.current) audioRef.current.pause()
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

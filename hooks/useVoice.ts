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
  // transcript: 录音中实时显示的占位文字（MediaRecorder 无实时识别，仅显示状态）
  const [transcript, setTranscript] = useState('')
  const { config } = useAppStore()
  const speakingRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // ─── TTS 相关 ────────────────────────────────────────────────────────────────

  const getPreset = useCallback(() => {
    return VOICE_PRESETS[config.voiceTone] ?? VOICE_PRESETS['neutral']
  }, [config.voiceTone])

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

  const speak = useCallback(async (text: string) => {
    if (typeof window === 'undefined') return
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
        speakWithWebAPI(text)
      }
    } catch {
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

  // ─── STT：MediaRecorder + Whisper（完全离线不依赖 Google）────────────────────
  //
  // 工作流：
  //   startRecording() → MediaRecorder 开始录音，每 200ms 收集 chunk
  //   stopRecording()  → 停止录音，自动把所有 chunk 合成 Blob → POST /api/transcribe
  //                       → onResult(text) 回调
  //
  // VoiceCallModal 在外部做"停顿检测"：
  //   监听 recordingDuration（秒），若 silenceDuration 达到阈值就调 stopRecording()

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const isTranscribingRef = useRef(false)
  const onResultCallbackRef = useRef<((text: string) => void) | null>(null)
  const onErrorCallbackRef = useRef<((msg: string) => void) | null>(null)

  const startRecording = useCallback(async (
    onResult: (text: string) => void,
    onError?: (msg: string) => void
  ) => {
    if (typeof window === 'undefined') return

    // 清理上一次
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop() } catch { /* ignore */ }
    }
    audioChunksRef.current = []
    onResultCallbackRef.current = onResult
    onErrorCallbackRef.current = onError ?? null

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // 选 webm/opus（Chrome/Firefox），降级 ogg，再降级不指定格式
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = async () => {
        // 停止麦克风轨道，释放资源
        stream.getTracks().forEach(t => t.stop())
        setIsRecording(false)
        setTranscript('')

        const chunks = audioChunksRef.current
        audioChunksRef.current = []

        if (chunks.length === 0 || isTranscribingRef.current) return
        const totalSize = chunks.reduce((s, b) => s + b.size, 0)
        if (totalSize < 1000) {
          // 录音太短，忽略
          return
        }

        isTranscribingRef.current = true
        try {
          const audioBlob = new Blob(chunks, { type: mimeType || 'audio/webm' })
          const formData = new FormData()
          formData.append('audio', audioBlob, 'audio.webm')

          setTranscript('识别中...')
          const resp = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
          })

          if (!resp.ok) {
            const errData = await resp.json().catch(() => ({})) as { error?: string }
            onErrorCallbackRef.current?.(errData.error ?? '语音识别失败，请重试')
            setTranscript('')
            return
          }

          const data = await resp.json() as { text?: string }
          const text = (data.text ?? '').trim()
          setTranscript('')
          if (text) {
            onResultCallbackRef.current?.(text)
          }
        } catch (err) {
          console.error('Transcribe error:', err)
          onErrorCallbackRef.current?.('网络错误，语音识别失败')
          setTranscript('')
        } finally {
          isTranscribingRef.current = false
        }
      }

      recorder.start(200) // 每 200ms emit 一个 chunk
      setIsRecording(true)
      setTranscript('正在录音...')
    } catch (err) {
      setIsRecording(false)
      setTranscript('')
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          onError?.('麦克风权限被拒绝，请点击地址栏 🔒 允许麦克风权限')
        } else if (err.name === 'NotFoundError') {
          onError?.('未找到麦克风设备，请检查麦克风是否连接')
        } else {
          onError?.(`麦克风访问失败：${err.message}`)
        }
      } else {
        onError?.('无法启动录音，请刷新页面重试')
      }
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop() } catch { /* ignore */ }
    }
    // setIsRecording 和 setTranscript 在 onstop 里设置，这里只设置视觉反馈
    setIsRecording(false)
  }, [])

  useEffect(() => {
    return () => {
      speakingRef.current = false
      if (audioRef.current) audioRef.current.pause()
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop() } catch { /* ignore */ }
      }
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

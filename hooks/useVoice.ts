'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/appStore'

export function useVoice() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const { config } = useAppStore()
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // TTS - 文字转语音
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    window.speechSynthesis.cancel()
    setIsSpeaking(false)

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'

    const rateMap: Record<string, number> = {
      gentle: 0.85,
      normal: 1.0,
      energetic: 1.15
    }
    utterance.rate = rateMap[config.voicePitch] ?? 1.0

    const pitchMap: Record<string, number> = {
      girl: 1.4,
      boy: 0.8,
      'mature-female': 1.1,
      'mature-male': 0.7,
      neutral: 1.0
    }
    utterance.pitch = pitchMap[config.voiceTone] ?? 1.0
    utterance.volume = 1.0

    const voices = window.speechSynthesis.getVoices()
    const zhVoices = voices.filter(v => v.lang.startsWith('zh'))
    if (zhVoices.length > 0) {
      const wantFemale = config.voiceTone === 'girl' || config.voiceTone === 'mature-female'
      const voiceIndex = wantFemale
        ? zhVoices.findIndex(v => v.name.toLowerCase().includes('female') || v.name.includes('女'))
        : zhVoices.findIndex(v => v.name.toLowerCase().includes('male') || v.name.includes('男'))
      utterance.voice = voiceIndex >= 0 ? zhVoices[voiceIndex] : zhVoices[0]
    }

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [config.voicePitch, config.voiceTone])

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
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

import { NextRequest, NextResponse } from 'next/server'
import type { VoicePreset } from '@/types'

// Edge TTS 音色映射：每个预设对应微软 Neural 声音
// 这些都是免费的、无需API key的微软 Edge 浏览器内置 TTS 服务
const EDGE_TTS_VOICES: Record<VoicePreset | string, { voice: string; pitch?: string; rate?: string }> = {
  'loli':        { voice: 'zh-CN-XiaoyiNeural',    pitch: '+8Hz',  rate: '+5%'  }, // 活泼可爱，偏萝莉
  'girl':        { voice: 'zh-CN-XiaoxiaoNeural',  pitch: '+2Hz',  rate: '+0%'  }, // 温柔少女（最自然）
  'bubble-girl': { voice: 'zh-CN-XiaochenNeural',  pitch: '+4Hz',  rate: '+8%'  }, // 软糯活泼
  'oneesan':     { voice: 'zh-CN-XiaohanNeural',   pitch: '-3Hz',  rate: '-5%'  }, // 成熟御姐
  'teen-boy':    { voice: 'zh-CN-YunxiNeural',     pitch: '+3Hz',  rate: '+5%'  }, // 少男/年轻男声
  'puppy-boy':   { voice: 'zh-CN-YunxiNeural',     pitch: '+6Hz',  rate: '-3%'  }, // 奶狗（高一点慢一点）
  'bubble-boy':  { voice: 'zh-CN-YunfengNeural',   pitch: '+2Hz',  rate: '+3%'  }, // 气泡男
  'uncle':       { voice: 'zh-CN-YunjianNeural',   pitch: '-5Hz',  rate: '-8%'  }, // 青叔磁性
  'neutral':     { voice: 'zh-CN-XiaoxiaoNeural',  pitch: '+0Hz',  rate: '+0%'  }, // 中性
  'custom':      { voice: 'zh-CN-XiaoxiaoNeural',  pitch: '+0Hz',  rate: '+0%'  }, // fallback
}

// 语调节奏修正
const PITCH_RATE_MOD: Record<string, { pitchMod: number; rateMod: number }> = {
  'gentle':    { pitchMod: -1, rateMod: -10 },
  'normal':    { pitchMod: 0,  rateMod: 0   },
  'energetic': { pitchMod: 2,  rateMod: 12  },
}

function buildSSML(text: string, voiceConfig: { voice: string; pitch?: string; rate?: string }): string {
  const pitch = voiceConfig.pitch ?? '+0Hz'
  const rate  = voiceConfig.rate  ?? '+0%'
  // 转义 XML 特殊字符
  const safeText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
  <voice name="${voiceConfig.voice}">
    <prosody pitch="${pitch}" rate="${rate}">${safeText}</prosody>
  </voice>
</speak>`
}

// POST /api/speech  →  返回 audio/mpeg 二进制流
export async function POST(request: NextRequest) {
  try {
    const { text, voiceTone, voicePitch } = await request.json() as {
      text: string
      voiceTone: VoicePreset
      voicePitch: 'gentle' | 'normal' | 'energetic'
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: '文本不能为空' }, { status: 400 })
    }

    const baseConfig = EDGE_TTS_VOICES[voiceTone] ?? EDGE_TTS_VOICES['neutral']
    const mod = PITCH_RATE_MOD[voicePitch] ?? PITCH_RATE_MOD['normal']

    // 解析基础 pitch/rate 并叠加修正
    const basePitchHz = parseInt(baseConfig.pitch ?? '0', 10)
    const baseRatePct = parseInt(baseConfig.rate ?? '0', 10)
    const finalPitch = `${basePitchHz + mod.pitchMod}Hz`
    const finalRate  = `${baseRatePct + mod.rateMod}%`

    const voiceConfig = { voice: baseConfig.voice, pitch: finalPitch, rate: finalRate }

    // 限制文本长度，避免超时（Edge TTS 建议单次 < 500字）
    const truncatedText = text.slice(0, 500)
    const ssml = buildSSML(truncatedText, voiceConfig)

    // 调用微软 Edge TTS（通过 speech.platform.bing.com，与 Edge 浏览器朗读使用同一入口）
    const ttsUrl = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1'
    const params = new URLSearchParams({
      TrustedClientToken: '6A5AA1D4EAFF4E9FB37E23D68491D6F4',  // Edge 浏览器公共 token（只读朗读）
      ConnectionId: crypto.randomUUID().replace(/-/g, '')
    })

    const headers = {
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'Mozilla/5.0',
    }

    const ttsResp = await fetch(`${ttsUrl}?${params}`, {
      method: 'POST',
      headers,
      body: ssml,
    })

    if (!ttsResp.ok) {
      console.error('Edge TTS 失败:', ttsResp.status, await ttsResp.text())
      // 降级：返回 fallback 提示，客户端再用 Web Speech API
      return NextResponse.json({
        success: false,
        fallback: true,
        voiceConfig: {
          lang: 'zh-CN',
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0
        }
      })
    }

    const audioBuffer = await ttsResp.arrayBuffer()
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      }
    })
  } catch (error) {
    console.error('TTS 服务异常:', error)
    return NextResponse.json({ error: '语音服务暂时不可用', fallback: true }, { status: 500 })
  }
}

// GET /api/speech  →  返回支持状态
export async function GET() {
  return NextResponse.json({
    supported: true,
    provider: 'Edge TTS (Microsoft Neural)',
    voices: Object.entries(EDGE_TTS_VOICES).map(([key, cfg]) => ({
      preset: key,
      voice: cfg.voice
    }))
  })
}

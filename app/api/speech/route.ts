import { NextRequest, NextResponse } from 'next/server'

// TTS API - 使用浏览器内置 Web Speech API 的服务端代理
// 也可以集成阿里云/Azure TTS
export async function POST(request: NextRequest) {
  try {
    const { text, voiceTone, voicePitch } = await request.json()

    // 返回语音配置，实际 TTS 在客户端使用 Web Speech API 完成
    // 这里可以扩展为调用第三方 TTS 服务
    return NextResponse.json({
      success: true,
      text,
      voiceConfig: {
        lang: 'zh-CN',
        rate: voicePitch === 'gentle' ? 0.85 : voicePitch === 'energetic' ? 1.1 : 1.0,
        pitch: voiceTone === 'girl' ? 1.3 : voiceTone === 'boy' ? 0.8 : 1.0,
        volume: 1.0
      }
    })
  } catch (error) {
    return NextResponse.json({ error: '语音服务不可用' }, { status: 500 })
  }
}

// STT - 语音转文字（通过 Web Speech API 在客户端处理）
export async function GET() {
  return NextResponse.json({
    supported: true,
    message: '语音识别通过浏览器 Web Speech API 支持'
  })
}

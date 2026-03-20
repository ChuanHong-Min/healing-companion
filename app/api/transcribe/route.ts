import { NextRequest, NextResponse } from 'next/server'

// 语音识别可单独配置 API 地址和 Key（内网 API 通常不支持 Whisper）
// 优先读 WHISPER_API_BASE_URL / WHISPER_API_KEY，没配则回退到主 API 配置
const API_BASE_URL =
  process.env.WHISPER_API_BASE_URL ||
  process.env.XINLIU_API_BASE_URL ||
  'https://api.openai.com/v1'
const API_KEY =
  process.env.WHISPER_API_KEY ||
  process.env.XINLIU_API_KEY ||
  ''

// POST /api/transcribe
// 接收 multipart/form-data（包含 audio 文件），
// 转发至 OpenAI 兼容的 /audio/transcriptions 接口（Whisper）
export async function POST(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json({ error: 'API Key 未配置' }, { status: 500 })
    }

    // 从请求中取出音频 blob
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    if (!audioFile) {
      return NextResponse.json({ error: '未收到音频数据' }, { status: 400 })
    }

    // 构建转发给 Whisper 的 FormData
    const upstream = new FormData()
    upstream.append('file', audioFile, 'audio.webm')
    upstream.append('model', 'whisper-1')
    upstream.append('language', 'zh')
    upstream.append('response_format', 'json')

    const resp = await fetch(`${API_BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      body: upstream,
    })

    if (!resp.ok) {
      const errText = await resp.text()
      console.error('Whisper API error:', resp.status, errText)
      return NextResponse.json(
        { error: `语音识别服务错误: ${resp.status}` },
        { status: 502 }
      )
    }

    const result = await resp.json() as { text?: string }
    const text = (result.text ?? '').trim()
    return NextResponse.json({ text })
  } catch (error) {
    console.error('Transcribe route error:', error)
    return NextResponse.json({ error: '语音转文字服务暂时不可用' }, { status: 500 })
  }
}

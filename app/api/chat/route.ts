import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt, detectEmotion, maskPrivateInfo, extractMemoryFromConversation } from '@/lib/utils'
import type { AgentConfig, MemoryEntry, Message } from '@/types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, config, memories = [] }: {
      messages: Message[]
      config: AgentConfig
      memories: MemoryEntry[]
    } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 })
    }

    const lastUserMessage = messages[messages.length - 1]
    const userText = lastUserMessage.content

    // 检测情绪
    const emotion = detectEmotion(userText)

    // 隐私保护
    const safeText = config.autoHidePrivate ? maskPrivateInfo(userText) : userText

    // 构建系统提示
    const systemPrompt = buildSystemPrompt(config, memories, emotion)

    // 构建消息历史（保留最近20条）
    const recentMessages = messages.slice(-20)
    const anthropicMessages = recentMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.role === 'user'
        ? (config.autoHidePrivate ? maskPrivateInfo(msg.content) : msg.content)
        : msg.content
    }))

    // 调用 Claude API（流式）
    const stream = await client.messages.stream({
      model: 'claude-opus-4-5',
      max_tokens: 500,
      system: systemPrompt,
      messages: anthropicMessages
    })

    // 返回流式响应
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        let fullText = ''
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const text = event.delta.text
              fullText += text
              const data = JSON.stringify({ type: 'delta', text, emotion })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }
          // 提取记忆
          const memoryContent = extractMemoryFromConversation(userText, fullText, emotion)
          const done = JSON.stringify({
            type: 'done',
            emotion,
            memory: memoryContent
          })
          controller.enqueue(encoder.encode(`data: ${done}\n\n`))
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    })

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: '服务暂时不可用，请稍后重试' },
      { status: 500 }
    )
  }
}

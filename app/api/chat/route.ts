import { NextRequest, NextResponse } from 'next/server'
import { buildSystemPrompt, detectEmotion, maskPrivateInfo, extractMemoryFromConversation, assessEmotionRisk, getEmotionLevelGuidance } from '@/lib/utils'
import type { AgentConfig, MemoryEntry, Message } from '@/types'

const XINLIU_API_KEY = process.env.XINLIU_API_KEY || ''
const XINLIU_API_BASE_URL = process.env.XINLIU_API_BASE_URL || 'https://apis.iflow.cn/v1'
const XINLIU_MODEL = process.env.XINLIU_MODEL || 'deepseek-v3'

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

    // 检测情绪及风险等级
    const emotion = detectEmotion(userText)
    const riskLevel = assessEmotionRisk(userText, emotion)

    // 构建系统提示（传入情绪等级指导）
    const baseSystemPrompt = buildSystemPrompt(config, memories, emotion)
    const emotionLevelGuidance = riskLevel !== 'mild'
      ? `\n\n【情绪分级响应 - ${riskLevel === 'severe' ? '严重' : '中度'}】：${getEmotionLevelGuidance(riskLevel, emotion)}`
      : ''
    const systemPrompt = baseSystemPrompt + emotionLevelGuidance

    // 构建消息历史（保留最近20条）
    const recentMessages = messages.slice(-20)
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.role === 'user'
          ? (config.autoHidePrivate ? maskPrivateInfo(msg.content) : msg.content)
          : msg.content
      }))
    ]

    // 调用心流平台 OpenAI 兼容 API（流式）
    const upstream = await fetch(`${XINLIU_API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XINLIU_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: XINLIU_MODEL,
        messages: chatMessages,
        stream: true,
        max_tokens: 4096,
        temperature: 0.7
      })
    })

    if (!upstream.ok) {
      const errText = await upstream.text()
      console.error('Xinliu API error:', upstream.status, errText)
      return NextResponse.json({ error: `上游服务错误: ${upstream.status}` }, { status: 502 })
    }

    // 将上游 SSE 流转发给客户端，同时注入情绪信息
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader()
        let fullText = ''
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            // 保留最后一行（可能不完整）
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed) continue
              if (!trimmed.startsWith('data:')) continue
              // 兼容 "data: {...}" 和 "data:{...}" 两种格式
              const dataStr = trimmed.slice(5).trimStart()
              if (dataStr === '[DONE]') continue

              try {
                const json = JSON.parse(dataStr)
                const text = json.choices?.[0]?.delta?.content ?? ''
                if (text) {
                  fullText += text
                  const data = JSON.stringify({ type: 'delta', text, emotion })
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                }
              } catch {
                // 忽略解析失败的行
              }
            }
          }

          // 提取记忆，发送完成事件
          const memoryContent = extractMemoryFromConversation(userText, fullText, emotion)
          const done = JSON.stringify({
            type: 'done',
            emotion,
            riskLevel,
            memory: memoryContent
          })
          controller.enqueue(encoder.encode(`data: ${done}\n\n`))
          controller.close()
        } catch (error) {
          controller.error(error)
        } finally {
          reader.releaseLock()
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

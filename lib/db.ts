// IndexedDB 本地存储管理
import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Message, MemoryEntry, EmotionRecord, AgentConfig, UserProfile } from '@/types'

interface HealingDB extends DBSchema {
  messages: {
    key: string
    value: Message
    indexes: { 'by-timestamp': number }
  }
  memories: {
    key: string
    value: MemoryEntry
    indexes: { 'by-timestamp': number; 'by-type': string }
  }
  emotions: {
    key: string
    value: EmotionRecord
    indexes: { 'by-timestamp': number }
  }
  config: {
    key: string
    value: { key: string; value: unknown }
  }
}

let db: IDBPDatabase<HealingDB> | null = null

export async function getDB(): Promise<IDBPDatabase<HealingDB>> {
  if (db) return db
  db = await openDB<HealingDB>('healing-companion', 1, {
    upgrade(database) {
      // 消息表
      if (!database.objectStoreNames.contains('messages')) {
        const msgStore = database.createObjectStore('messages', { keyPath: 'id' })
        msgStore.createIndex('by-timestamp', 'timestamp')
      }
      // 记忆表
      if (!database.objectStoreNames.contains('memories')) {
        const memStore = database.createObjectStore('memories', { keyPath: 'id' })
        memStore.createIndex('by-timestamp', 'timestamp')
        memStore.createIndex('by-type', 'type')
      }
      // 情绪记录表
      if (!database.objectStoreNames.contains('emotions')) {
        const emoStore = database.createObjectStore('emotions', { keyPath: 'id' })
        emoStore.createIndex('by-timestamp', 'timestamp')
      }
      // 配置表
      if (!database.objectStoreNames.contains('config')) {
        database.createObjectStore('config', { keyPath: 'key' })
      }
    }
  })
  return db
}

// 消息操作
export async function saveMessage(message: Message) {
  const database = await getDB()
  await database.put('messages', message)
}

export async function getMessages(limit = 50): Promise<Message[]> {
  const database = await getDB()
  const all = await database.getAllFromIndex('messages', 'by-timestamp')
  return all.slice(-limit)
}

export async function clearMessages() {
  const database = await getDB()
  await database.clear('messages')
}

// 记忆操作
export async function saveMemory(memory: MemoryEntry) {
  const database = await getDB()
  await database.put('memories', memory)
}

export async function getMemories(type?: string): Promise<MemoryEntry[]> {
  const database = await getDB()
  if (type) {
    return database.getAllFromIndex('memories', 'by-type', type)
  }
  return database.getAll('memories')
}

export async function deleteMemory(id: string) {
  const database = await getDB()
  await database.delete('memories', id)
}

export async function clearAllMemories() {
  const database = await getDB()
  await database.clear('memories')
}

// 清理过期记忆
export async function cleanExpiredMemories() {
  const database = await getDB()
  const all = await database.getAll('memories')
  const now = Date.now()
  const expired = all.filter(m => m.expiresAt && m.expiresAt < now)
  for (const mem of expired) {
    await database.delete('memories', mem.id)
  }
}

// 情绪操作
export async function saveEmotion(record: EmotionRecord) {
  const database = await getDB()
  await database.put('emotions', record)
}

export async function getEmotionHistory(days = 7): Promise<EmotionRecord[]> {
  const database = await getDB()
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const all = await database.getAllFromIndex('emotions', 'by-timestamp')
  return all.filter(e => e.timestamp >= cutoff)
}

// 配置操作
export async function saveConfig(key: string, value: unknown) {
  const database = await getDB()
  await database.put('config', { key, value })
}

export async function loadConfig<T>(key: string): Promise<T | null> {
  const database = await getDB()
  const entry = await database.get('config', key)
  return entry ? (entry.value as T) : null
}

export async function saveAgentConfig(config: AgentConfig) {
  await saveConfig('agentConfig', config)
}

export async function loadAgentConfig(): Promise<AgentConfig | null> {
  return loadConfig<AgentConfig>('agentConfig')
}

// 向量相似度搜索（简单版本）
export async function searchSimilarMemories(query: string, limit = 5): Promise<MemoryEntry[]> {
  const database = await getDB()
  const all = await database.getAll('memories')
  // 简单关键词匹配（后续可替换为真正的向量搜索）
  const queryWords = query.toLowerCase().split(/\s+/)
  const scored = all.map(mem => {
    const content = mem.content.toLowerCase()
    const score = queryWords.reduce((acc, word) => {
      return acc + (content.includes(word) ? 1 : 0)
    }, 0)
    return { mem, score }
  })
  return scored
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.mem)
}

// 一键清空所有数据
export async function clearAllData() {
  const database = await getDB()
  await database.clear('messages')
  await database.clear('memories')
  await database.clear('emotions')
  await database.clear('config')
}

# 🌸 治愈伙伴 - Healing Companion AI

一款治愈系、情感陪伴型 AI 智能体，懂你、陪你、治愈你。

## 🌐 在线体验
https://www.agentspacex.top/chat

## ✨ 功能特性

### MVP 第一阶段
- **6种角色模板**：暖心挚友、温柔知己、元气搭子、沉稳陪伴者、治愈树洞、趣味玩伴
- **3步引导设置**：快速上手，首次进入只需3步即可生成专属 AI
- **实时对话**：流式 SSE 响应，qwen3-vl-plus 驱动
- **情绪识别**：自动检测用户情绪状态（开心/难过/焦虑/平静等）
- **本地记忆**：IndexedDB 存储对话历史和用户习惯记忆
- **6款治愈主题**：治愈蓝、元气粉、极简黑、森林绿、落日橙、薰衣草紫
- **高级设置**：7大模块完整配置（人设/交互/场景/主动行为/话题/形象/记忆）

### 第二阶段增强版
- **🎤 语音输入（STT）**：浏览器 Web Speech API，中文语音识别
- **🔊 语音输出（TTS）**：支持少女/少年/御姐/青叔/中性多种音色
- **🧠 记忆系统升级**：关键词向量搜索，长期记忆检索
- **🛡️ 隐私保护**：自动屏蔽手机号、身份证、地址等隐私信息

## 🚀 快速部署（Vercel）

### 方法一：一键部署（推荐）

点击上方 "Deploy with Vercel" 按钮，按提示：
1. 登录 / 注册 Vercel 账号
2. 填入 `XINLIU_API_KEY`（在 [iflow.cn](https://iflow.cn/) 获取）
3. 点击 Deploy，等待约 2 分钟自动完成

### 方法二：从已有仓库部署

1. 打开 [vercel.com/new](https://vercel.com/new)
2. 选择 GitHub → 导入 `ChuanHong-Min/healing-companion`
3. 在 **Environment Variables** 里添加：
   ```
   XINLIU_API_KEY = sk-xxxxxxxxxxxxxxxx
   ```
4. 点击 **Deploy**

## 🖥️ 本地开发

### 环境要求
- Node.js 18+
- 心流平台 API Key（[获取地址](https://iflow.cn/)）

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/ChuanHong-Min/healing-companion.git
cd healing-companion

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 Anthropic API Key
```

### 配置 API Key

编辑 `.env.local` 文件：
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

> 获取 API Key：https://console.anthropic.com/

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 生产构建

```bash
npm run build
npm start
```

## 📁 项目结构

```
healing-companion/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── chat/          # Claude API 流式接口
│   │   └── speech/        # 语音配置接口
│   ├── chat/              # 聊天页面
│   ├── setup/             # 首次引导设置
│   └── settings/          # 高级设置页面
├── components/
│   ├── chat/              # 聊天组件（消息/输入/头部）
│   ├── setup/             # 设置引导向导
│   ├── settings/          # 高级设置页面
│   └── ui/                # 基础 UI 组件
├── hooks/
│   ├── useChat.ts         # 聊天 hook（流式响应）
│   └── useVoice.ts        # 语音 hook（TTS/STT）
├── lib/
│   ├── db.ts              # IndexedDB 存储管理
│   └── utils.ts           # 工具函数（情绪检测/系统提示构建）
├── store/
│   └── appStore.ts        # Zustand 全局状态
└── types/
    └── index.ts           # TypeScript 类型定义
```

## 🎨 主题颜色

| 主题 | 说明 |
|------|------|
| 🔵 治愈蓝 | 宁静深邃，适合放松休息 |
| 🌸 元气粉 | 温暖活力，适合积极互动 |
| 🌙 极简黑 | 优雅简约，适合夜间使用 |
| 🌿 森林绿 | 自然疗愈，适合减压放松 |
| 🌅 落日橙 | 温暖治愈，适合情绪陪伴 |
| 💜 薰衣草紫 | 梦幻柔和，适合深度倾诉 |

## 🔧 技术栈

- **框架**：Next.js 15 + TypeScript
- **样式**：Tailwind CSS
- **状态管理**：Zustand
- **本地存储**：IndexedDB（idb）
- **AI 引擎**：Anthropic Claude claude-opus-4-5
- **语音**：Web Speech API（浏览器原生）
- **部署**：Vercel

## 📋 功能对照表

| 功能 | 状态 |
|------|------|
| 6种角色模板 | ✅ 已完成 |
| 3步引导设置 | ✅ 已完成 |
| 实时流式对话 | ✅ 已完成 |
| 情绪识别 | ✅ 已完成 |
| 本地记忆系统 | ✅ 已完成 |
| 6款治愈主题 | ✅ 已完成 |
| 7大设置模块 | ✅ 已完成 |
| 语音输入(STT) | ✅ 已完成 |
| 语音输出(TTS) | ✅ 已完成 |
| 记忆系统升级 | ✅ 已完成 |
| 隐私信息保护 | ✅ 已完成 |
| PWA 支持 | ✅ 已完成 |

## 📝 许可证

MIT

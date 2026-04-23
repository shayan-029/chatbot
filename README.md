# ✦ Grok Chat

A full-stack AI chatbot powered by **Grok (xAI)** built with Next.js 14, TypeScript, and Tailwind CSS. Features real-time streaming responses, conversation memory, system prompt customization, and a polished dark UI.

---

## ✨ Features

| Feature | Details |
|---------|---------|
| **Streaming responses** | Real-time token-by-token text via Server-Sent Events |
| **Conversation memory** | Full history sent to Grok every turn |
| **System prompt presets** | Assistant · Code Expert · Socratic · Ultra Concise |
| **Custom system prompts** | Write your own persona in the UI |
| **Stop generation** | Cancel streaming mid-response |
| **Error handling** | Dismissible error banner, graceful API failures |
| **Markdown rendering** | Bold, inline code, fenced code blocks |
| **Suggestion chips** | One-click example prompts on the empty state |

---

## 🗂 Project Structure

```
grok-chatbot/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts        ← Grok API proxy, streaming SSE
│   ├── components/
│   │   ├── ChatInput.tsx       ← Textarea + send/stop button
│   │   ├── ChatMessage.tsx     ← Message bubble with markdown
│   │   ├── ChatWindow.tsx      ← Scrollable feed + empty state
│   │   ├── ErrorBanner.tsx     ← Dismissible error notification
│   │   ├── SystemPromptPanel.tsx ← Preset + custom prompt picker
│   │   └── TypingIndicator.tsx ← Animated three-dot loader
│   ├── hooks/
│   │   └── useChat.ts          ← All chat state, streaming logic
│   ├── lib/
│   │   ├── prompts.ts          ← System prompt presets
│   │   └── utils.ts            ← Shared helpers
│   ├── types/
│   │   └── index.ts            ← Shared TypeScript interfaces
│   ├── globals.css             ← Global styles + keyframes
│   ├── layout.tsx              ← Root HTML layout
│   └── page.tsx                ← Main chat page
├── .env.example                ← Template — copy to .env.local
├── .env.local                  ← Your secrets (git-ignored)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 🚀 Setup & Run

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
GROK_API_KEY=your_grok_api_key_here
GROK_MODEL=grok-3-latest          # optional
```

Get your API key at [https://console.x.ai/](https://console.x.ai/)

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for production

```bash
npm run build
npm start
```

---

## 🔌 API Reference

### `POST /api/chat`

**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "systemPrompt": "You are a helpful assistant.",
  "stream": true
}
```

**Streaming response** (`text/event-stream`):
```
data: {"content":"Hi"}
data: {"content":" there"}
data: [DONE]
```

**Non-streaming response** (`application/json`):
```json
{ "message": "Hi there! How can I help you?" }
```

---

## 🔒 Security Notes

- **API key lives server-side only** — it is never sent to the browser
- The `.env.local` file is excluded from git via `.gitignore`
- All Grok requests are proxied through Next.js API routes

---

## 🛠 Tech Stack

- **Next.js 14** (App Router) — full-stack React framework  
- **TypeScript** — end-to-end type safety  
- **Tailwind CSS** — utility-first styling  
- **Grok API** — `grok-3-latest` model via `https://api.x.ai/v1`  
- **React hooks** — no Redux, no external state manager  
- **Web Streams API** — native streaming, zero extra libraries  

---

## 📄 License

MIT

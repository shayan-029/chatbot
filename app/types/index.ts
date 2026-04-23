// =============================================
// Shared Types — used across frontend & backend
// =============================================

/** A single message in the conversation */
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isStreaming?: boolean; // true while the AI is still typing
}

/** What the /api/chat endpoint expects */
export interface ChatRequest {
  messages: Pick<Message, "role" | "content">[];
  systemPrompt?: string;
  stream?: boolean;
}

/** Non-streaming response from /api/chat */
export interface ChatResponse {
  message: string;
  error?: string;
}

/** Shape of each message sent to the Grok API */
export interface GrokMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/** Full Grok API request body */
export interface GrokRequest {
  model: string;
  messages: GrokMessage[];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
}

/** Non-streaming Grok API response */
export interface GrokResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** A single chunk from a streaming Grok API response */
export interface GrokStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

/** Available system prompt presets */
export interface SystemPromptPreset {
  id: string;
  label: string;
  prompt: string;
  icon: string;
}

/** A saved conversation stored in localStorage */
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  systemPrompt: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

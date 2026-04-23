import { NextRequest, NextResponse } from "next/server";
import type { ChatRequest, GrokMessage, GrokStreamChunk } from "@/app/types";
import { DEFAULT_SYSTEM_PROMPT } from "@/app/lib/prompts";

// Force dynamic so Next.js never caches this route or its fetch calls
export const dynamic = "force-dynamic";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";
const MAX_TOKENS = 800;       // tokens reserved for the response
const INPUT_CHAR_LIMIT = 12000; // ~3000 tokens for conversation history
const TIMEOUT_MS = 30_000;

/**
 * Keep only the most recent messages that fit within INPUT_CHAR_LIMIT.
 * Always retains at least the last user message so the request never fails.
 */
function trimConversation(messages: GrokMessage[]): GrokMessage[] {
  let chars = 0;
  const kept: GrokMessage[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    chars += messages[i].content.length + 20; // +20 for role/overhead
    if (chars > INPUT_CHAR_LIMIT && kept.length > 0) break;
    kept.unshift(messages[i]);
  }
  return kept;
}

/** Parse retry-after seconds from a Groq 429 message */
function parseRetryAfter(text: string): number {
  const match = text.match(/try again in (\d+\.?\d*)s/i);
  return match ? Math.ceil(parseFloat(match[1]) * 1000) + 300 : 8000;
}

/** Call the Groq API with a manual timeout (avoids AbortSignal.timeout quirks) */
async function callGroq(
  apiKey: string,
  messages: GrokMessage[],
  stream: boolean
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        stream,
        temperature: 0.7,
        max_tokens: MAX_TOKENS,
      }),
      // Prevent Next.js from caching external fetch calls
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return response;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/** Turn a fetch error into a human-readable string */
function fetchErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  // Node's fetch wraps the real reason in err.cause
  const cause = (err as Error & { cause?: unknown }).cause;
  if (cause instanceof Error) {
    const code = (cause as Error & { code?: string }).code ?? "";
    if (code === "ENOTFOUND" || code === "EAI_AGAIN")
      return "Could not resolve api.groq.com — check your internet connection.";
    if (code === "ECONNREFUSED")
      return "Connection to api.groq.com was refused — check your firewall or proxy.";
    if (code === "ECONNRESET" || code === "ETIMEDOUT")
      return "Connection to api.groq.com timed out — try again.";
    return `${err.message}: ${cause.message}`;
  }
  if (err.name === "AbortError") return "Request timed out after 30 seconds.";
  return err.message;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { messages, systemPrompt, stream = true } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "messages array is required and must not be empty." },
      { status: 400 }
    );
  }

  const systemMsg: GrokMessage = { role: "system", content: systemPrompt ?? DEFAULT_SYSTEM_PROMPT };
  const conversation = trimConversation(
    messages.map((m) => ({ role: m.role, content: m.content }))
  );
  const groqMessages: GrokMessage[] = [systemMsg, ...conversation];

  // Call Groq — auto-retry once on 429
  let groqResponse: Response;
  try {
    groqResponse = await callGroq(apiKey, groqMessages, stream);

    if (groqResponse.status === 429) {
      const errorText = await groqResponse.text();
      const waitMs = parseRetryAfter(errorText);
      console.warn(`[/api/chat] Rate limited — retrying in ${waitMs}ms`);
      await new Promise((r) => setTimeout(r, waitMs));
      groqResponse = await callGroq(apiKey, groqMessages, stream);
    }
  } catch (err) {
    const message = fetchErrorMessage(err);
    console.error("[/api/chat] Network error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Handle non-200 responses
  if (!groqResponse.ok) {
    const errorText = await groqResponse.text();
    let friendly = "Something went wrong. Please try again.";
    try {
      const parsed = JSON.parse(errorText);
      const raw: string = parsed?.error?.message ?? "";
      if (groqResponse.status === 429) {
        const match = raw.match(/try again in (\d+\.?\d*)s/i);
        friendly = match
          ? `Rate limit reached. Please wait ${Math.ceil(parseFloat(match[1]))} seconds and try again.`
          : "Rate limit reached. Please wait a moment and try again.";
      } else {
        friendly = raw || friendly;
      }
    } catch { /* use default */ }
    return NextResponse.json({ error: friendly }, { status: groqResponse.status });
  }

  // Non-streaming response
  if (!stream) {
    const data = await groqResponse.json();
    return NextResponse.json({ message: data.choices?.[0]?.message?.content ?? "" });
  }

  // Streaming — pipe SSE chunks to the client
  const encoder = new TextEncoder();
  const responseBody = groqResponse.body;
  if (!responseBody) {
    return NextResponse.json({ error: "No response body from Groq." }, { status: 502 });
  }

  const readable = new ReadableStream({
    async start(controller) {
      const reader = responseBody.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const payload = trimmed.slice(6);
            if (payload === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
            try {
              const chunk: GrokStreamChunk = JSON.parse(payload);
              const delta = chunk.choices?.[0]?.delta?.content;
              if (delta) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`)
                );
              }
            } catch { /* skip malformed chunk */ }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

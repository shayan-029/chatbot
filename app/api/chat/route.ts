import { NextRequest, NextResponse } from "next/server";
import type { ChatRequest, GrokMessage, GrokStreamChunk } from "@/app/types";
import { DEFAULT_SYSTEM_PROMPT } from "@/app/lib/prompts";

// =============================================
// /api/chat  — Grok (xAI) streaming chat endpoint
// =============================================

const GROK_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROK_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

/**
 * POST /api/chat
 *
 * Accepts a list of messages and proxies them to the Grok API.
 * Supports both streaming (SSE) and non-streaming JSON responses.
 */
export async function POST(req: NextRequest) {
  // ── 1. Validate the API key is configured ────────────────────────────────
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  // ── 2. Parse the incoming request body ───────────────────────────────────
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

  // ── 3. Build the message list for Grok (prepend system prompt) ───────────
  const systemMessage: GrokMessage = {
    role: "system",
    content: systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
  };

  const grokMessages: GrokMessage[] = [
    systemMessage,
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  // ── 4. Call the Grok API ──────────────────────────────────────────────────
  let grokResponse: Response;
  try {
    grokResponse = await fetch(GROK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        messages: grokMessages,
        stream,
        temperature: 0.7,
        max_tokens: 4096,
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/chat] Network error calling Groq API:", message);
    return NextResponse.json(
      { error: `Failed to reach the Groq API: ${message}` },
      { status: 502 }
    );
  }

  // ── 5. Handle Grok API errors ─────────────────────────────────────────────
  if (!grokResponse.ok) {
    const errorText = await grokResponse.text();
    console.error(`[/api/chat] Grok API error ${grokResponse.status}:`, errorText);
    return NextResponse.json(
      {
        error: `Grok API returned ${grokResponse.status}: ${errorText}`,
      },
      { status: grokResponse.status }
    );
  }

  // ── 6a. Non-streaming path ────────────────────────────────────────────────
  if (!stream) {
    const data = await grokResponse.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ message: content });
  }

  // ── 6b. Streaming path — pipe SSE chunks to the client ───────────────────
  const encoder = new TextEncoder();
  const grokBody = grokResponse.body;

  if (!grokBody) {
    return NextResponse.json({ error: "No response body from Grok." }, { status: 502 });
  }

  const readableStream = new ReadableStream({
    async start(controller) {
      const reader = grokBody.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Accumulate chunks — a single read() may contain multiple SSE lines
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // Keep the last (potentially incomplete) line in the buffer
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();

            // SSE lines begin with "data: "
            if (!trimmed.startsWith("data: ")) continue;

            const payload = trimmed.slice(6); // strip "data: "

            // Grok sends "data: [DONE]" as the last event
            if (payload === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }

            // Parse the JSON chunk and forward just the delta content
            try {
              const chunk: GrokStreamChunk = JSON.parse(payload);
              const delta = chunk.choices?.[0]?.delta?.content;
              if (delta) {
                // Forward as SSE so the frontend can consume it easily
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`)
                );
              }
            } catch {
              // Malformed chunk — skip silently
            }
          }
        }

        // Signal completion if we didn't receive [DONE]
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        console.error("[/api/chat] Stream read error:", err);
        controller.error(err);
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable Nginx buffering if deployed there
    },
  });
}

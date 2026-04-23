"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Message, ChatRequest } from "@/app/types";
import { generateId } from "@/app/lib/utils";
import { DEFAULT_SYSTEM_PROMPT } from "@/app/lib/prompts";

// =============================================
// useChat — core hook for the chatbot UI
// =============================================

interface UseChatOptions {
  conversationId?: string | null;
  initialMessages?: Message[];
  systemPrompt?: string;
  onMessagesChange?: (messages: Message[]) => void;
  onError?: (error: string) => void;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setSystemPrompt: (prompt: string) => void;
  currentSystemPrompt: string;
  stopStreaming: () => void;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>(options.initialMessages ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSystemPrompt, setCurrentSystemPrompt] = useState(
    options.systemPrompt ?? DEFAULT_SYSTEM_PROMPT
  );

  // Ref to abort ongoing fetch when the user wants to stop
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset messages when the active conversation changes
  useEffect(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setMessages(options.initialMessages ?? []);
    setIsLoading(false);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.conversationId]);

  // Persist messages to the parent after streaming finishes
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      options.onMessagesChange?.(messages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  /** Stop any in-progress streaming response */
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Mark the last message as no longer streaming
    setMessages((prev) =>
      prev.map((m, i) =>
        i === prev.length - 1 && m.role === "assistant"
          ? { ...m, isStreaming: false }
          : m
      )
    );
    setIsLoading(false);
  }, []);

  /** Send a message and stream back the AI reply */
  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      setError(null);

      // ── 1. Add the user message immediately ───────────────────────────────
      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      // Build the full updated message list for the API call
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // ── 2. Add a placeholder assistant message that will be streamed into ─
      const assistantId = generateId();
      const assistantPlaceholder: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantPlaceholder]);
      setIsLoading(true);

      // ── 3. Create an AbortController so we can cancel the request ─────────
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const requestBody: ChatRequest = {
          // Only send role + content to the API (not our local id/timestamp)
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
          systemPrompt: currentSystemPrompt,
          stream: true,
        };

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error ?? `Server error: ${response.status}`);
        }

        // ── 4. Read the SSE stream ─────────────────────────────────────────
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body to read.");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith("data: ")) continue;

            const payload = trimmedLine.slice(6);
            if (payload === "[DONE]") break;

            try {
              const parsed: { content: string } = JSON.parse(payload);
              if (parsed.content) {
                accumulated += parsed.content;
                // Update the assistant message content in real time
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: accumulated, isStreaming: true }
                      : m
                  )
                );
              }
            } catch {
              // Skip malformed SSE line
            }
          }
        }

        // ── 5. Mark streaming as done ──────────────────────────────────────
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false } : m
          )
        );
      } catch (err: unknown) {
        if ((err as Error).name === "AbortError") {
          // User cancelled — already handled in stopStreaming()
          return;
        }

        const errorMsg =
          err instanceof Error ? err.message : "Something went wrong.";
        setError(errorMsg);
        options.onError?.(errorMsg);

        // Replace the placeholder with an error message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: `⚠️ Error: ${errorMsg}`,
                  isStreaming: false,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [messages, isLoading, currentSystemPrompt, options]
  );

  /** Clear all messages and start fresh */
  const clearMessages = useCallback(() => {
    stopStreaming();
    setMessages([]);
    setError(null);
  }, [stopStreaming]);

  /** Update the system prompt (takes effect on next message) */
  const setSystemPrompt = useCallback((prompt: string) => {
    setCurrentSystemPrompt(prompt);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    setSystemPrompt,
    currentSystemPrompt,
    stopStreaming,
  };
}

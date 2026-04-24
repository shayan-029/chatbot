"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Message, ChatRequest } from "@/app/types";
import { generateId } from "@/app/lib/utils";
import { DEFAULT_SYSTEM_PROMPT } from "@/app/lib/prompts";

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
  sendMessage: (content: string) => void;
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

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<Message[]>(messages);
  const onMessagesChangeRef = useRef(options.onMessagesChange);
  const onErrorRef = useRef(options.onError);

  useEffect(() => {
    onMessagesChangeRef.current = options.onMessagesChange;
    onErrorRef.current = options.onError;
  });

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Reset when switching conversations
  useEffect(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setMessages(options.initialMessages ?? []);
    setIsLoading(false);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.conversationId]);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setMessages((prev) => {
      const next = prev.map((m) =>
        m.isStreaming ? { ...m, isStreaming: false } : m
      );
      return next;
    });
    setIsLoading(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      setError(null);

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      const assistantId = generateId();
      const assistantPlaceholder: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      // Snapshot history before state update
      const historyForApi = [...messagesRef.current, userMessage].map(
        ({ role, content }) => ({ role, content })
      );

      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
      setIsLoading(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const body: ChatRequest = {
          messages: historyForApi,
          systemPrompt: currentSystemPrompt,
          stream: true,
        };

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error ?? `Server error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body.");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith("data: ")) continue;
            const payload = trimmedLine.slice(6);
            if (payload === "[DONE]") break;
            try {
              const parsed: { content: string } = JSON.parse(payload);
              if (parsed.content) {
                accumulated += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: accumulated, isStreaming: true }
                      : m
                  )
                );
              }
            } catch {
              // skip malformed chunk
            }
          }
        }

        // Mark streaming done
        const finalMessages = messagesRef.current.map((m) =>
          m.id === assistantId ? { ...m, content: accumulated, isStreaming: false } : m
        );
        setMessages(finalMessages);
        // Save to DB — called outside state setter to avoid React Strict Mode double-invoke
        onMessagesChangeRef.current?.(finalMessages);
      } catch (err: unknown) {
        if ((err as Error).name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "Something went wrong.";
        setError(msg);
        onErrorRef.current?.(msg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `⚠️ Error: ${msg}`, isStreaming: false }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [isLoading, currentSystemPrompt]
  );

  const clearMessages = useCallback(() => {
    stopStreaming();
    setMessages([]);
    setError(null);
  }, [stopStreaming]);

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

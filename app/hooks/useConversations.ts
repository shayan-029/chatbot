"use client";

import { useState, useCallback, useEffect } from "react";
import type { Conversation, Message } from "@/app/types";
import { generateId } from "@/app/lib/utils";
import { DEFAULT_SYSTEM_PROMPT } from "@/app/lib/prompts";

const STORAGE_KEY = "groq-chat-conversations";
const ACTIVE_KEY = "groq-chat-active-id";

function load(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(convs: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage once on mount
  useEffect(() => {
    const convs = load();
    const savedId = localStorage.getItem(ACTIVE_KEY);
    const validId = convs.find((c) => c.id === savedId)?.id ?? convs[0]?.id ?? null;
    setConversations(convs);
    setActiveId(validId);
    setHydrated(true);
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  const createConversation = useCallback((systemPrompt = DEFAULT_SYSTEM_PROMPT): Conversation => {
    const conv: Conversation = {
      id: generateId(),
      title: "New Chat",
      messages: [],
      systemPrompt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConversations((prev) => {
      const updated = [conv, ...prev];
      save(updated);
      return updated;
    });
    setActiveId(conv.id);
    localStorage.setItem(ACTIVE_KEY, conv.id);
    return conv;
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
    localStorage.setItem(ACTIVE_KEY, id);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      save(updated);
      // Switch active if deleted the current one
      setActiveId((current) => {
        if (current !== id) return current;
        const next = updated[0]?.id ?? null;
        if (next) localStorage.setItem(ACTIVE_KEY, next);
        else localStorage.removeItem(ACTIVE_KEY);
        return next;
      });
      return updated;
    });
  }, []);

  // Called by useChat after messages change
  const updateMessages = useCallback((id: string, messages: Message[]) => {
    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== id) return c;
        const title =
          c.title === "New Chat" && messages.length > 0
            ? messages[0].content.slice(0, 40) + (messages[0].content.length > 40 ? "…" : "")
            : c.title;
        return { ...c, messages, title, updatedAt: new Date().toISOString() };
      });
      save(updated);
      return updated;
    });
  }, []);

  return {
    conversations,
    activeId,
    activeConversation,
    hydrated,
    createConversation,
    selectConversation,
    deleteConversation,
    updateMessages,
  };
}

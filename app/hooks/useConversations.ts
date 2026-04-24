"use client";

import { useState, useCallback, useEffect } from "react";
import type { Conversation, Message } from "@/app/types";
import { generateId } from "@/app/lib/utils";
import { DEFAULT_SYSTEM_PROMPT } from "@/app/lib/prompts";

// ── localStorage helpers (used as fallback) ──────────────────────────────────
const LS_KEY = "turtle-ai-conversations";

function lsLoad(): Conversation[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); }
  catch { return []; }
}
function lsSave(convs: Conversation[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(convs)); } catch {}
}

// ── MongoDB API helpers ───────────────────────────────────────────────────────
async function apiCall<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiCallWithRetry<T>(url: string, opts?: RequestInit, retries = 3): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await apiCall<T>(url, opts);
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt))); // 1s, 2s, 4s
    }
  }
  throw new Error("All retries exhausted");
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId]           = useState<string | null>(null);
  const [hydrated, setHydrated]           = useState(false);
  const [mongoAvailable, setMongoAvailable] = useState(true);

  // On mount — try MongoDB, migrate localStorage data if needed, fall back if unavailable
  useEffect(() => {
    apiCallWithRetry<Conversation[]>("/api/conversations")
      .then(async (remoteData) => {
        setMongoAvailable(true);

        const local = lsLoad();

        // If MongoDB is empty but localStorage has conversations, migrate them up
        if (remoteData.length === 0 && local.length > 0) {
          const migrated: Conversation[] = [];
          for (const conv of local) {
            try {
              const doc = await apiCall<Conversation>("/api/conversations", {
                method: "POST",
                body: JSON.stringify({
                  title: conv.title,
                  messages: conv.messages,
                  systemPrompt: conv.systemPrompt,
                }),
              });
              migrated.push(doc);
            } catch {
              migrated.push(conv); // keep local copy if one fails
            }
          }
          lsSave([]); // clear localStorage after migration
          setConversations(migrated);
          if (migrated.length > 0) setActiveId(migrated[0].id);
        } else {
          setConversations(remoteData);
          if (remoteData.length > 0) setActiveId(remoteData[0].id);
        }
      })
      .catch(() => {
        setMongoAvailable(false);
        const local = lsLoad();
        setConversations(local);
        if (local.length > 0) setActiveId(local[0].id);
      })
      .finally(() => setHydrated(true));
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  const createConversation = useCallback(
    async (systemPrompt = DEFAULT_SYSTEM_PROMPT): Promise<Conversation> => {
      if (mongoAvailable) {
        try {
          const doc = await apiCallWithRetry<Conversation>("/api/conversations", {
            method: "POST",
            body: JSON.stringify({ title: "New Chat", messages: [], systemPrompt }),
          });
          setConversations((prev) => [doc, ...prev]);
          setActiveId(doc.id);
          return doc;
        } catch {
          setMongoAvailable(false);
        }
      }
      // localStorage fallback
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
        lsSave(updated);
        return updated;
      });
      setActiveId(conv.id);
      return conv;
    },
    [mongoAvailable]
  );

  const selectConversation = useCallback((id: string) => setActiveId(id), []);

  const deleteConversation = useCallback(
    async (id: string) => {
      // Remove from UI immediately
      setConversations((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        lsSave(updated.filter((c) => !c.id.match(/^[0-9a-f]{24}$/)));
        setActiveId((cur) => (cur === id ? updated[0]?.id ?? null : cur));
        return updated;
      });

      // Always attempt MongoDB delete — even if mongoAvailable was false before
      try {
        await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      } catch {
        // Network error — already removed from UI, nothing more to do
      }
    },
    []
  );

  const updateMessages = useCallback(
    async (id: string, messages: Message[]) => {
      const clean = messages.map(({ id: mid, role, content, timestamp }) => ({
        id: mid, role, content, timestamp,
      }));
      const firstUser = clean.find((m) => m.role === "user");
      const title = firstUser
        ? firstUser.content.slice(0, 50) + (firstUser.content.length > 50 ? "…" : "")
        : undefined;
      const update: Record<string, unknown> = { messages: clean };
      if (title) update.title = title;

      if (mongoAvailable) {
        try {
          const res = await fetch(`/api/conversations/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(update),
          });

          // Local ID not in MongoDB — create a fresh document and swap the ID
          if (res.status === 404) {
            const conv = conversations.find((c) => c.id === id);
            const created = await apiCall<Conversation>("/api/conversations", {
              method: "POST",
              body: JSON.stringify({
                title: update.title ?? conv?.title ?? "New Chat",
                messages: clean,
                systemPrompt: conv?.systemPrompt ?? "",
              }),
            });
            setConversations((prev) => prev.map((c) => (c.id === id ? created : c)));
            setActiveId((cur) => (cur === id ? created.id : cur));
            lsSave([]);
            return;
          }

          if (res.ok) {
            const updated: Conversation = await res.json();
            setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
            return;
          }
          // Non-404 error — fall through to localStorage but don't disable MongoDB permanently
          console.warn("[updateMessages] PUT failed:", res.status);
        } catch (err) {
          console.warn("[updateMessages] error:", err);
          // Only disable MongoDB if it's a network-level failure
          if (err instanceof TypeError && err.message.includes("fetch")) {
            setMongoAvailable(false);
          }
        }
      }
      // localStorage fallback
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === id
            ? { ...c, ...update, messages, updatedAt: new Date().toISOString() }
            : c
        );
        lsSave(updated);
        return updated;
      });
    },
    [mongoAvailable, conversations]
  );

  return {
    conversations,
    activeId,
    activeConversation,
    hydrated,
    mongoAvailable,
    createConversation,
    selectConversation,
    deleteConversation,
    updateMessages,
  };
}

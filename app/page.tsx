"use client";

import { useEffect, useCallback, useState } from "react";
import { useChat } from "./hooks/useChat";
import { useConversations } from "./hooks/useConversations";
import ChatWindow from "./components/ChatWindow";
import ChatInput from "./components/ChatInput";
import SystemPromptPanel from "./components/SystemPromptPanel";
import ErrorBanner from "./components/ErrorBanner";
import Sidebar from "./components/Sidebar";
import SetupBanner from "./components/SetupBanner";

export default function Home() {
  const {
    conversations,
    activeId,
    activeConversation,
    hydrated,
    createConversation,
    selectConversation,
    deleteConversation,
    updateMessages,
    mongoAvailable,
  } = useConversations();

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    setSystemPrompt,
    currentSystemPrompt,
    stopStreaming,
  } = useChat({
    conversationId: activeId,
    initialMessages: activeConversation?.messages ?? [],
    systemPrompt: activeConversation?.systemPrompt,
    onMessagesChange: (msgs) => {
      if (activeId) updateMessages(activeId, msgs);
    },
  });

  const [localError, setLocalError] = useState<string | null>(null);
  const [apiConfigured, setApiConfigured] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setApiConfigured(d.groqConfigured))
      .catch(() => {});
  }, []);
  const displayError = error ?? localError;

  useEffect(() => {
    if (hydrated && conversations.length === 0) {
      createConversation();
    }
  }, [hydrated, conversations.length, createConversation]);

  useEffect(() => {
    const handler = (e: Event) => {
      const text = (e as CustomEvent<{ text: string }>).detail?.text;
      if (text) sendMessage(text);
    };
    window.addEventListener("grok:suggest", handler);
    return () => window.removeEventListener("grok:suggest", handler);
  }, [sendMessage]);

  const handleNewChat = useCallback(() => {
    stopStreaming();
    createConversation(currentSystemPrompt);
  }, [createConversation, currentSystemPrompt, stopStreaming]);

  const handleSelect = useCallback((id: string) => {
    stopStreaming();
    selectConversation(id);
  }, [selectConversation, stopStreaming]);

  const handleDismissError = useCallback(() => setLocalError(null), []);

  return (
    <div className="relative flex h-screen overflow-hidden" style={{ zIndex: 1 }}>
      {!apiConfigured && <SetupBanner />}

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelect}
        onNew={handleNewChat}
        onDelete={deleteConversation}
      />

      {/* ── Main chat area ───────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── Header ───────────────────────────────────────────── */}
        <header className="
          relative flex-shrink-0 flex items-center justify-between px-4 py-3 pl-14
          border-b border-accent/25
          bg-surface-card/95 backdrop-blur-xl
        ">
          {/* Gradient glow line at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-80" />

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="
              relative h-11 w-11 rounded-2xl
              bg-gradient-to-br from-accent via-accent/80 to-accent/40
              flex items-center justify-center text-2xl
              shadow-xl shadow-accent/40
              ring-1 ring-accent/60
            ">
              🐢
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/60 animate-pulse" />
            </div>

            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold bg-gradient-to-r from-white via-accent/90 to-accent/70 bg-clip-text text-transparent">
                Turtle.ai
              </span>
              <span className="text-[10px] text-text-muted">
                {activeConversation?.title && activeConversation.title !== "New Chat"
                  ? activeConversation.title
                  : "llama-3.1-8b-instant · fast"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {!mongoAvailable && (
              <span title="MongoDB not connected — chats saved locally only"
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full
                  bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                ⚠ Local only
              </span>
            )}
            {messages.length > 0 && (
              <span className="text-xs text-text-muted px-2 py-0.5 rounded-full border border-surface-border bg-surface-elevated">
                {messages.length} msg{messages.length !== 1 ? "s" : ""}
              </span>
            )}
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                disabled={isLoading}
                className="
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                  text-text-secondary hover:text-red-400
                  border border-surface-border hover:border-red-400/30
                  bg-surface-elevated transition-all duration-150
                  disabled:opacity-40 disabled:cursor-not-allowed
                "
                title="Clear conversation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                Clear
              </button>
            )}
          </div>
        </header>

        {/* ── Message area ──────────────────────────────────────── */}
        <main className="flex-1 overflow-hidden relative">
          <ChatWindow messages={messages} isLoading={isLoading} />
        </main>

        {/* ── Bottom bar ────────────────────────────────────────── */}
        <footer className="
          relative flex-shrink-0
          border-t border-accent/15
          bg-surface-card/95 backdrop-blur-xl
          px-4 pt-2.5 pb-4 space-y-2
        ">
          {/* Top glow line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

          {displayError && (
            <ErrorBanner error={displayError} onDismiss={handleDismissError} />
          )}
          <div className="flex items-center justify-between">
            <SystemPromptPanel
              currentPrompt={currentSystemPrompt}
              onUpdate={setSystemPrompt}
              onApply={() => sendMessage("Hello! Please introduce yourself based on your role.")}
              disabled={isLoading}
            />
            <span className="text-[10px] text-text-muted select-none hidden sm:block">
              Shift+Enter for newline
            </span>
          </div>
          <ChatInput
            onSend={sendMessage}
            onStop={stopStreaming}
            isLoading={isLoading}
          />
        </footer>
      </div>
    </div>
  );
}

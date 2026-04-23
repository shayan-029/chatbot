"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/app/types";
import ChatMessage from "./ChatMessage";

// =============================================
// ChatWindow — scrollable message feed
// =============================================

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

const WELCOME_SUGGESTIONS = [
  "Explain quantum computing simply",
  "Write a Python function to reverse a linked list",
  "What makes a great product strategy?",
  "Debug: why might my React component re-render too often?",
];

export default function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Empty state with suggested prompts
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-8 px-4">
        {/* Logo mark */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-16 w-16 rounded-2xl bg-accent/10 border border-accent/20
              flex items-center justify-center text-3xl"
            aria-hidden="true"
          >
            ✦
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-text-primary">
              Start a conversation
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Powered by Grok · xAI
            </p>
          </div>
        </div>

        {/* Suggestion chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
          {WELCOME_SUGGESTIONS.map((s) => (
            <SuggestionChip key={s} text={s} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-6 py-6 px-4 overflow-y-auto h-full"
    >
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {/* Invisible anchor for auto-scroll */}
      <div ref={bottomRef} className="h-px" aria-hidden="true" />
    </div>
  );
}

// ── Suggestion chip (clicking it dispatches a custom event) ──────────────────

function SuggestionChip({ text }: { text: string }) {
  const handleClick = () => {
    // Fire a custom event that the parent page can listen to
    window.dispatchEvent(
      new CustomEvent("grok:suggest", { detail: { text } })
    );
  };

  return (
    <button
      onClick={handleClick}
      className="
        text-left px-4 py-3 rounded-xl text-sm
        bg-surface-elevated border border-surface-border
        text-text-secondary hover:text-text-primary hover:border-accent/40
        transition-all duration-150
        leading-snug
      "
    >
      {text}
    </button>
  );
}

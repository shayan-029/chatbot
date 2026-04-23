"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/app/types";
import ChatMessage from "./ChatMessage";

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="relative flex flex-col items-center justify-center h-full gap-8 px-4 overflow-hidden">
        {/* Background frog watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span
            className="text-[260px] leading-none opacity-[0.04] animate-frog-float"
            aria-hidden="true"
          >
            🐸
          </span>
        </div>

        {/* Welcome card */}
        <div className="relative flex flex-col items-center gap-4 z-10">
          <div className="
            h-24 w-24 rounded-3xl
            bg-gradient-to-br from-accent/30 to-accent/10
            border-2 border-accent/60
            flex items-center justify-center text-5xl
            shadow-2xl shadow-accent/40
            animate-frog-float
          ">
            🐸
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-accent via-accent/90 to-accent/50 bg-clip-text text-transparent drop-shadow-lg">
              Frog.ai
            </h2>
            <p className="text-sm text-text-secondary mt-1.5">
              Powered by Groq · ultra-fast AI
            </p>
          </div>
        </div>

        {/* Suggestion chips */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
          {WELCOME_SUGGESTIONS.map((s) => (
            <SuggestionChip key={s} text={s} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-6 py-6 px-4 overflow-y-auto h-full">
      {/* Faint frog watermark behind messages */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
        <span className="text-[320px] leading-none opacity-[0.025]">🐸</span>
      </div>

      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      <div ref={bottomRef} className="h-px" aria-hidden="true" />
    </div>
  );
}

function SuggestionChip({ text }: { text: string }) {
  return (
    <button
      onClick={() =>
        window.dispatchEvent(new CustomEvent("grok:suggest", { detail: { text } }))
      }
      className="
        group text-left px-4 py-3 rounded-xl text-sm
        bg-surface-elevated border border-surface-border
        text-text-secondary hover:text-text-primary
        hover:border-accent/60 hover:bg-accent/10
        hover:shadow-md hover:shadow-accent/10
        transition-all duration-200 leading-snug
      "
    >
      <span className="text-accent/60 group-hover:text-accent mr-1.5 transition-colors">→</span>
      {text}
    </button>
  );
}

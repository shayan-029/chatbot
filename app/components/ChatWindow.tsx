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
        {/* Background turtle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-[280px] leading-none animate-turtle-float" aria-hidden="true">🐢</span>
        </div>

        {/* Welcome card */}
        <div className="relative flex flex-col items-center gap-5 z-10">
          <div className="
            h-28 w-28 rounded-3xl
            bg-gradient-to-br from-accent via-accent/70 to-accent/30
            flex items-center justify-center text-6xl
            shadow-2xl shadow-accent/50
            ring-2 ring-accent/40 ring-offset-2 ring-offset-surface
            animate-turtle-float
          ">
            🐢
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-accent to-accent/60 bg-clip-text text-transparent">
              Turtle.ai
            </h2>
            <p className="text-sm text-text-secondary">
              Powered by Groq · llama-3.1-8b-instant
            </p>
          </div>
        </div>

        {/* Suggestion chips */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
          {WELCOME_SUGGESTIONS.map((s) => (
            <SuggestionChip key={s} text={s} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden">

      {/* Single animated turtle — centered in chat area */}
      <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center" aria-hidden="true">
        <span className="text-[320px] leading-none animate-turtle-float">🐢</span>
      </div>

      {/* Scrollable messages on top */}
      <div className="relative flex flex-col gap-6 py-6 px-4 overflow-y-auto h-full">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={bottomRef} className="h-px" aria-hidden="true" />
      </div>
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
        group text-left px-4 py-3.5 rounded-2xl text-sm
        bg-surface-elevated/80 border border-accent/20
        text-text-secondary hover:text-text-primary
        hover:border-accent/60 hover:bg-accent/15
        hover:shadow-lg hover:shadow-accent/20
        backdrop-blur-sm transition-all duration-200 leading-snug
      "
    >
      <span className="text-accent/70 group-hover:text-accent mr-2 transition-colors font-bold">→</span>
      {text}
    </button>
  );
}

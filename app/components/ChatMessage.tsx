"use client";

import { memo } from "react";
import type { Message } from "@/app/types";
import { formatTime } from "@/app/lib/utils";
import TypingIndicator from "./TypingIndicator";

// =============================================
// ChatMessage — a single message bubble
// =============================================

interface ChatMessageProps {
  message: Message;
}

/**
 * Renders a user or assistant message.
 * Assistant messages support basic markdown-like formatting:
 *   **bold**, `code`, ```code blocks```
 */
function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isEmpty = message.content.length === 0;

  return (
    <div
      className={`flex w-full gap-3 animate-fade-up ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* ── Avatar ─────────────────────────────────────────────── */}
      <div
        className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold select-none
          ${isUser
            ? "bg-accent text-white"
            : "bg-surface-elevated border border-surface-border text-accent"
          }`}
        aria-hidden="true"
      >
        {isUser ? "U" : "G"}
      </div>

      {/* ── Bubble ─────────────────────────────────────────────── */}
      <div
        className={`flex flex-col gap-1 max-w-[75%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {/* Role label */}
        <span className="text-xs font-medium text-text-muted px-1">
          {isUser ? "You" : "Grok"}{" "}
          <span className="text-text-muted/60">
            · {formatTime(new Date(message.timestamp))}
          </span>
        </span>

        {/* Message body */}
        <div
          className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed
            ${isUser
              ? "bg-accent text-white rounded-tr-sm"
              : "bg-surface-elevated border border-surface-border text-text-primary rounded-tl-sm"
            }`}
        >
          {/* Show typing indicator when empty & streaming */}
          {!isUser && isEmpty && message.isStreaming ? (
            <TypingIndicator />
          ) : (
            <FormattedContent content={message.content} isUser={isUser} />
          )}

          {/* Streaming cursor */}
          {!isUser && message.isStreaming && !isEmpty && (
            <span
              className="inline-block w-0.5 h-4 bg-accent ml-0.5 align-middle"
              style={{ animation: "pulseDot 1s ease-in-out infinite" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Simple markdown renderer (no external deps) ──────────────────────────────

interface FormattedContentProps {
  content: string;
  isUser: boolean;
}

function FormattedContent({ content, isUser }: FormattedContentProps) {
  // Split into code blocks vs normal text
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        // Fenced code block
        if (part.startsWith("```") && part.endsWith("```")) {
          const inner = part.slice(3, -3);
          const firstNewline = inner.indexOf("\n");
          const lang = firstNewline > 0 ? inner.slice(0, firstNewline).trim() : "";
          const code = firstNewline > 0 ? inner.slice(firstNewline + 1) : inner;

          return (
            <pre
              key={i}
              className="rounded-lg bg-surface p-3 overflow-x-auto font-mono text-xs border border-surface-border"
            >
              {lang && (
                <div className="text-text-muted mb-1 text-[10px] uppercase tracking-widest">
                  {lang}
                </div>
              )}
              <code className="text-text-primary">{code}</code>
            </pre>
          );
        }

        // Normal text — handle inline formatting
        return (
          <InlineText key={i} text={part} isUser={isUser} />
        );
      })}
    </div>
  );
}

function InlineText({ text, isUser }: { text: string; isUser: boolean }) {
  // Split on **bold** and `code` patterns
  const segments = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  const result = segments.map((seg, i) => {
    if (seg.startsWith("**") && seg.endsWith("**")) {
      return <strong key={i} className="font-semibold">{seg.slice(2, -2)}</strong>;
    }
    if (seg.startsWith("`") && seg.endsWith("`")) {
      return (
        <code
          key={i}
          className={`rounded px-1 py-0.5 font-mono text-xs ${
            isUser
              ? "bg-white/20 text-white"
              : "bg-surface text-accent border border-surface-border"
          }`}
        >
          {seg.slice(1, -1)}
        </code>
      );
    }
    // Preserve line breaks
    return seg.split("\n").map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ));
  });

  return <p className="whitespace-pre-wrap break-words">{result}</p>;
}

// Memo to avoid re-rendering stable messages when a new one streams in
export default memo(ChatMessage);

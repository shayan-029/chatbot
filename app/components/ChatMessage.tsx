"use client";

import { memo, useState, useRef, useEffect } from "react";
import type { Message } from "@/app/types";
import { formatTime } from "@/app/lib/utils";
import TypingIndicator from "./TypingIndicator";

interface ChatMessageProps {
  message: Message;
}

function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isEmpty = message.content.length === 0;

  return (
    <div className={`flex w-full gap-3 animate-fade-up ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-base select-none
          ${isUser
            ? "bg-gradient-to-br from-accent to-accent/70 text-surface font-bold text-[10px] shadow-lg shadow-accent/40"
            : "bg-surface-elevated border border-accent/40 shadow-lg shadow-accent/20"
          }`}
        aria-hidden="true"
      >
        {isUser ? "You" : "🐸"}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        <span className="text-xs font-medium text-text-muted px-1">
          {isUser ? "You" : "Frog.ai"}{" "}
          <span className="text-text-muted/60">· {formatTime(new Date(message.timestamp))}</span>
        </span>

        <div
          className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed
            ${isUser
              ? "bg-gradient-to-br from-accent to-accent/75 text-surface font-medium rounded-tr-sm shadow-xl shadow-accent/30"
              : "bg-surface-elevated border border-accent/20 text-text-primary rounded-tl-sm shadow-md shadow-accent/10"
            }`}
        >
          {!isUser && isEmpty && message.isStreaming ? (
            <TypingIndicator />
          ) : (
            <FormattedContent content={message.content} isUser={isUser} />
          )}

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

// ── URL link chip with Open / Copy popup ─────────────────────────────────────

function LinkChip({ url, isUser }: { url: string; isUser: boolean }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for browsers that block clipboard without interaction
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const display = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const short = display.length > 45 ? display.slice(0, 45) + "…" : display;

  return (
    <span ref={ref} className="relative inline-block align-baseline mx-0.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-mono
          transition-all duration-150
          ${isUser
            ? "bg-surface/30 border border-surface/40 text-surface hover:bg-surface/40"
            : "bg-accent/10 border border-accent/40 text-accent hover:bg-accent/20"
          }`}
        title={url}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={2} className="h-3 w-3 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
        </svg>
        {short}
      </button>

      {open && (
        <div className="
          absolute bottom-full left-0 mb-2 z-50
          bg-surface-card border border-surface-border
          rounded-2xl shadow-2xl shadow-black/60
          p-2 flex flex-col gap-1.5 min-w-max
          animate-fade-up
        ">
          {/* URL preview */}
          <p className="text-[10px] text-text-muted px-2 py-1 font-mono truncate max-w-[260px]">
            {url}
          </p>
          <div className="flex gap-1.5">
            {/* Open */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="
                flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                bg-accent text-surface hover:bg-accent-hover
                transition-colors duration-150 shadow-md shadow-accent/20
              "
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={2.5} className="h-3 w-3">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Open
            </a>

            {/* Copy */}
            <button
              onClick={handleCopy}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                border transition-all duration-150
                ${copied
                  ? "bg-accent/10 border-accent/40 text-accent"
                  : "bg-surface-elevated border-surface-border text-text-secondary hover:text-text-primary hover:border-accent/30"
                }
              `}
            >
              {copied ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth={2.5} className="h-3 w-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </span>
  );
}

// ── Formatted content renderer ───────────────────────────────────────────────

function FormattedContent({ content, isUser }: { content: string; isUser: boolean }) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const inner = part.slice(3, -3);
          const firstNewline = inner.indexOf("\n");
          const lang = firstNewline > 0 ? inner.slice(0, firstNewline).trim() : "";
          const code = firstNewline > 0 ? inner.slice(firstNewline + 1) : inner;
          return (
            <pre key={i} className="rounded-lg bg-surface p-3 overflow-x-auto font-mono text-xs border border-surface-border">
              {lang && <div className="text-text-muted mb-1 text-[10px] uppercase tracking-widest">{lang}</div>}
              <code className="text-text-primary">{code}</code>
            </pre>
          );
        }
        return <InlineText key={i} text={part} isUser={isUser} />;
      })}
    </div>
  );
}

function InlineText({ text, isUser }: { text: string; isUser: boolean }) {
  // Split by URLs first (capturing group keeps the URL in the array)
  const urlParts = text.split(/(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g);

  return (
    <p className="whitespace-pre-wrap break-words">
      {urlParts.map((part, i) => {
        // URL segment
        if (/^https?:\/\//.test(part)) {
          return <LinkChip key={i} url={part} isUser={isUser} />;
        }

        // Plain text — handle **bold** and `code`
        const segments = part.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
        return segments.map((seg, j) => {
          if (seg.startsWith("**") && seg.endsWith("**")) {
            return <strong key={`${i}-${j}`} className="font-semibold">{seg.slice(2, -2)}</strong>;
          }
          if (seg.startsWith("`") && seg.endsWith("`")) {
            return (
              <code key={`${i}-${j}`}
                className={`rounded px-1 py-0.5 font-mono text-xs
                  ${isUser ? "bg-surface/20 text-surface" : "bg-surface text-accent border border-surface-border"}`}>
                {seg.slice(1, -1)}
              </code>
            );
          }
          return seg.split("\n").map((line, k, arr) => (
            <span key={`${i}-${j}-${k}`}>
              {line}
              {k < arr.length - 1 && <br />}
            </span>
          ));
        });
      })}
    </p>
  );
}

export default memo(ChatMessage);

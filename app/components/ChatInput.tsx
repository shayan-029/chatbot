"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";
import EmojiPicker from "./EmojiPicker";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function ChatInput({
  onSend,
  onStop,
  isLoading,
  disabled = false,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, isLoading]
  );

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, isLoading, onSend]);

  // Insert emoji at cursor position
  const handleEmojiSelect = useCallback((emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setValue((v) => v + emoji);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + emoji + value.slice(end);
    setValue(next);
    // Restore cursor after emoji
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }, [value]);

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="relative flex items-end gap-2 w-full">
      {/* Textarea */}
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          disabled={disabled}
          rows={1}
          className="
            w-full resize-none rounded-2xl px-4 py-3 pr-4
            bg-surface-elevated border border-surface-border
            text-text-primary text-sm placeholder:text-text-muted
            focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-150 leading-relaxed
          "
          style={{ maxHeight: "200px" }}
          aria-label="Chat message input"
        />
      </div>

      {/* Emoji picker button */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowEmoji((v) => !v)}
          disabled={disabled}
          title="Insert emoji"
          className="
            h-10 w-10 rounded-xl flex items-center justify-center text-lg
            bg-surface-elevated border border-surface-border
            hover:border-accent/40 hover:bg-surface
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-150
          "
        >
          😊
        </button>

        {showEmoji && (
          <EmojiPicker
            onSelect={handleEmojiSelect}
            onClose={() => setShowEmoji(false)}
          />
        )}
      </div>

      {/* Send / Stop button */}
      {isLoading ? (
        <button
          onClick={onStop}
          className="
            flex-shrink-0 h-10 w-10 rounded-xl
            bg-surface-elevated border border-surface-border
            text-text-secondary hover:text-text-primary hover:border-accent/50
            flex items-center justify-center
            transition-all duration-150
          "
          aria-label="Stop generation"
          title="Stop generation"
        >
          <span className="block h-3 w-3 rounded-sm bg-current" />
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="
            flex-shrink-0 h-10 w-10 rounded-xl
            bg-accent hover:bg-accent-hover
            disabled:bg-surface-elevated disabled:text-text-muted
            disabled:border disabled:border-surface-border
            text-white flex items-center justify-center
            transition-all duration-150
            shadow-lg shadow-accent/20 disabled:shadow-none
          "
          aria-label="Send message"
          title="Send message (Enter)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}

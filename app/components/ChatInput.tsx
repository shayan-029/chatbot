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

  const handleEmojiSelect = useCallback((emoji: string) => {
    const el = textareaRef.current;
    if (!el) { setValue((v) => v + emoji); return; }
    const start = el.selectionStart ?? value.length;
    const end   = el.selectionEnd   ?? value.length;
    const next  = value.slice(0, start) + emoji + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }, [value]);

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="relative w-full">
      {/* Input container */}
      <div className="
        relative flex items-end
        bg-surface-elevated border border-accent/30
        rounded-2xl overflow-hidden
        focus-within:border-accent/70
        focus-within:shadow-lg focus-within:shadow-accent/20
        transition-all duration-200
      ">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Message Turtle.ai…"
          disabled={disabled}
          rows={1}
          className="
            flex-1 resize-none bg-transparent
            px-4 py-3.5 pr-2
            text-text-primary text-sm placeholder:text-text-muted/60
            focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
            leading-relaxed
          "
          style={{ maxHeight: "200px" }}
          aria-label="Chat message input"
        />

        {/* Right-side action buttons */}
        <div className="flex items-center gap-1 px-2 pb-2 flex-shrink-0">

          {/* Emoji button */}
          <div className="relative">
            <button
              onClick={() => setShowEmoji((v) => !v)}
              disabled={disabled}
              title="Insert emoji"
              className="
                h-8 w-8 rounded-xl flex items-center justify-center text-base
                text-text-muted hover:text-text-primary
                hover:bg-surface transition-all duration-150
                disabled:opacity-40 disabled:cursor-not-allowed
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

          {/* Send / Stop */}
          {isLoading ? (
            <button
              onClick={onStop}
              title="Stop generation"
              className="
                h-8 w-8 rounded-xl flex items-center justify-center
                bg-red-500/20 border border-red-500/40
                text-red-400 hover:bg-red-500/30
                transition-all duration-150
              "
              aria-label="Stop generation"
            >
              <span className="block h-2.5 w-2.5 rounded-sm bg-current" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              title="Send message (Enter)"
              className="
                h-8 w-8 rounded-xl flex items-center justify-center
                bg-accent hover:bg-accent-hover
                disabled:bg-surface disabled:text-text-muted disabled:border disabled:border-surface-border
                text-white shadow-lg shadow-accent/30 disabled:shadow-none
                transition-all duration-150
              "
              aria-label="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth={2.5}
                strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

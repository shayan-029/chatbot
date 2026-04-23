"use client";

import { useEffect, useRef } from "react";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJIS = [
  // Smileys
  "😀","😂","😊","😍","🥰","😎","🤩","😜","😏","🙄",
  "😢","😭","😤","😡","🤬","😱","😨","🥺","😔","🤔",
  "🤗","😇","🥳","🤪","😴","🤤","🫠","😮","😬","🤭",
  // Gestures
  "👍","👎","👋","🤝","🙏","💪","✌️","🤞","👏","🫶",
  "🤙","☝️","👌","🤌","🫵","🖖","🤘","💅","🫰","🤜",
  // Hearts & symbols
  "❤️","🧡","💛","💚","💙","💜","🖤","💔","💕","💯",
  "⭐","✨","🔥","💥","🎉","🎊","🚀","💀","👀","🌈",
  // Animals & nature
  "🐶","🐱","🐻","🦊","🐼","🐨","🦁","🐸","🐙","🦋",
  // Food
  "🍕","🍔","🍟","🌮","🍜","🍩","🍪","🎂","🍫","☕",
  // Misc
  "🎮","🎵","🎶","📱","💻","🏆","⚡","🌙","☀️","🌊",
];

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="
        absolute bottom-full mb-2 right-0 z-50
        w-72 rounded-2xl border border-surface-border
        bg-surface-card shadow-2xl shadow-black/60
        p-3
      "
    >
      <p className="text-[10px] text-text-muted mb-2 px-1 uppercase tracking-widest font-semibold">
        Emojis
      </p>
      <div className="grid grid-cols-10 gap-0.5 max-h-52 overflow-y-auto">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="
              flex items-center justify-center h-8 w-8 rounded-lg text-lg
              hover:bg-surface-elevated transition-colors duration-100
              leading-none
            "
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

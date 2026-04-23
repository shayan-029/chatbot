"use client";

import { useState } from "react";
import type { SystemPromptPreset } from "@/app/types";
import { SYSTEM_PROMPT_PRESETS } from "@/app/lib/prompts";

// =============================================
// SystemPromptPanel — customize AI personality
// =============================================

interface SystemPromptPanelProps {
  currentPrompt: string;
  onUpdate: (prompt: string) => void;
  onApply?: () => void;
  disabled?: boolean;
}

export default function SystemPromptPanel({
  currentPrompt,
  onUpdate,
  onApply,
  disabled = false,
}: SystemPromptPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customText, setCustomText] = useState(currentPrompt);
  const [activePresetId, setActivePresetId] = useState<string>("default");

  const handlePresetSelect = (preset: SystemPromptPreset) => {
    setActivePresetId(preset.id);
    setCustomText(preset.prompt);
    onUpdate(preset.prompt);
  };

  const handleCustomApply = () => {
    if (!customText.trim()) return;
    setActivePresetId("custom");
    onUpdate(customText);
    setIsOpen(false);
    onApply?.();
  };

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        disabled={disabled}
        className="
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
          text-text-secondary hover:text-text-primary
          border border-surface-border hover:border-accent/40
          bg-surface-elevated transition-all duration-150
          disabled:opacity-40 disabled:cursor-not-allowed
        "
        title="Customize system prompt"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="h-3.5 w-3.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
          />
        </svg>
        System
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className="
            absolute bottom-full mb-2 left-0 z-50
            w-80 rounded-2xl border border-surface-border
            bg-surface-card shadow-2xl shadow-black/60
            p-4 space-y-4 animate-fade-up
          "
        >
          <div>
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">
              Presets
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {SYSTEM_PROMPT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-left
                    border transition-all duration-150
                    ${activePresetId === preset.id
                      ? "border-accent/60 bg-accent-glow text-text-primary"
                      : "border-surface-border bg-surface-elevated text-text-secondary hover:border-accent/30 hover:text-text-primary"
                    }
                  `}
                >
                  <span className="text-base">{preset.icon}</span>
                  <span className="font-medium">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">
              Custom Prompt
            </h3>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={4}
              className="
                w-full resize-none rounded-xl px-3 py-2
                bg-surface border border-surface-border
                text-text-primary text-xs placeholder:text-text-muted
                focus:outline-none focus:ring-1 focus:ring-accent/50
                leading-relaxed
              "
              placeholder="Enter a custom system prompt…"
            />
            <button
              onClick={handleCustomApply}
              className="
                mt-2 w-full py-1.5 rounded-xl text-xs font-medium
                bg-accent hover:bg-accent-hover text-white
                transition-colors duration-150
              "
            >
              Apply Custom Prompt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

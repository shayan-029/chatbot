"use client";

import { useState } from "react";
import type { Conversation } from "@/app/types";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: SidebarProps) {
  const [open, setOpen] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <>
      {/* Toggle button — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        title={open ? "Close sidebar" : "Open sidebar"}
        className="
          absolute top-3 left-3 z-20
          h-8 w-8 rounded-lg flex items-center justify-center
          text-text-muted hover:text-text-primary
          bg-surface-card border border-surface-border
          hover:border-accent/40 transition-all duration-150
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="h-4 w-4"
        >
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          )}
        </svg>
      </button>

      {/* Sidebar panel */}
      <aside
        className={`
          flex-shrink-0 flex flex-col
          bg-surface-card border-r border-surface-border
          transition-all duration-200 overflow-hidden
          ${open ? "w-60" : "w-0"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2 mt-0.5">
          {/* Spacer for the toggle button */}
          <div className="w-8" />
          <button
            onClick={onNew}
            title="New chat"
            className="
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
              text-accent hover:text-accent-hover font-medium
              border border-accent/20 hover:border-accent/50
              bg-accent/5 hover:bg-accent/10
              transition-all duration-150 ml-auto
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-3.5 w-3.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Conversation list */}
        <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
          {conversations.length === 0 && (
            <p className="text-xs text-text-muted text-center mt-8 px-2">
              No conversations yet. Start chatting!
            </p>
          )}

          {conversations.map((conv) => {
            const isActive = conv.id === activeId;
            const isHovered = conv.id === hoveredId;

            return (
              <div
                key={conv.id}
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`
                  group relative flex items-center gap-2 rounded-lg px-2 py-2 cursor-pointer
                  transition-all duration-150
                  ${isActive
                    ? "bg-accent/15 border border-accent/50 text-text-primary shadow-sm shadow-accent/20"
                    : "hover:bg-surface-elevated border border-transparent text-text-secondary hover:text-text-primary hover:border-accent/20"
                  }
                `}
                onClick={() => onSelect(conv.id)}
              >
                {/* Chat icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  className="h-3.5 w-3.5 flex-shrink-0 text-text-muted"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                  />
                </svg>

                {/* Title + date */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate leading-tight">{conv.title}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{formatDate(conv.updatedAt)}</p>
                </div>

                {/* Delete button */}
                {(isHovered || isActive) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                    title="Delete conversation"
                    className="
                      flex-shrink-0 h-5 w-5 rounded flex items-center justify-center
                      text-text-muted hover:text-red-400
                      transition-colors duration-100
                    "
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
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

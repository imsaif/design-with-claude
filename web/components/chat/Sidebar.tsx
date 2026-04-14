"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DwcIcon from "@/components/DwcIcon";
import {
  getConversations,
  createConversation,
  setActiveConversation,
  getMemory,
  type Conversation,
  type DesignerMemory,
} from "@/lib/store";

export function Sidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [memory, setMemory] = useState<DesignerMemory | null>(null);

  useEffect(() => {
    setConversations(getConversations());
    setMemory(getMemory());
  }, []);

  function handleNewChat() {
    const conv = createConversation();
    setActiveConversation(conv.id);
    setConversations(getConversations());
    window.location.href = "/app";
  }

  return (
    <aside className={`app-sidebar ${isCollapsed ? "app-sidebar-collapsed" : ""}`}>
      <div className="app-sidebar-header">
        <Link href="/" className="app-sidebar-logo">
          <DwcIcon className="h-5 w-auto" />
          {!isCollapsed && (
            <span>
              design<span style={{ color: "var(--accent)" }}>with</span>claude
            </span>
          )}
        </Link>
        <button
          className="app-sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isCollapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <>
          <button className="app-sidebar-new-chat" onClick={handleNewChat}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New chat
          </button>

          <Link href="/app/missions" className="app-sidebar-missions">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            Missions
          </Link>

          {memory && (
            <div className="app-sidebar-context">
              <div className="app-sidebar-context-label">Your project</div>
              <div className="app-sidebar-context-value">
                {memory.product_description.length > 60
                  ? memory.product_description.slice(0, 60) + "..."
                  : memory.product_description}
              </div>
              <div className="app-sidebar-context-meta">
                {memory.tech_stack.slice(0, 3).join(" · ")}
                {memory.tech_stack.length > 3 && ` +${memory.tech_stack.length - 3}`}
              </div>
            </div>
          )}

          <div className="app-sidebar-conversations">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                className="app-sidebar-conv"
                onClick={() => {
                  setActiveConversation(conv.id);
                  window.location.href = "/app";
                }}
              >
                {conv.title}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="app-sidebar-footer">
        <Link href="/app/settings" className="app-sidebar-settings">
          Settings
        </Link>
      </div>
    </aside>
  );
}

"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const agentsUsed = (message.metadata?.agents_used as string[]) || [];

  return (
    <div className={`chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-assistant"}`}>
      <div className="chat-bubble-content">
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        )}
        {isStreaming && <span className="chat-cursor" />}
      </div>
      {!isUser && agentsUsed.length > 0 && (
        <div className="chat-agent-tags">
          {agentsUsed.map((slug) => (
            <span key={slug} className="chat-agent-tag">
              {slug.replace(/-specialist|-designer/g, "").replace(/-/g, " ")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

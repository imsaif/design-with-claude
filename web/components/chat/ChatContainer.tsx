"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { UpgradePrompt } from "./UpgradePrompt";
import {
  getConversation,
  addMessage,
  getMemory,
  getMessageCount,
  incrementMessageCount,
  type ChatMessage,
} from "@/lib/store";

interface ChatContainerProps {
  conversationId: string;
  projectDescription?: string;
}

export function ChatContainer({
  conversationId,
  projectDescription,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [rateLimited, setRateLimited] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load existing messages from localStorage
  useEffect(() => {
    const conv = getConversation(conversationId);
    if (conv) {
      setMessages(conv.messages);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  async function handleSend(content: string) {
    // Check rate limit
    const { allowed } = getMessageCount();
    if (!allowed) {
      setRateLimited(true);
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    addMessage(conversationId, userMessage);

    setIsStreaming(true);
    setStreamingContent("");

    try {
      // Send memory + recent history to API so it has context
      const memory = getMemory();
      const recentHistory = messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, memory, history: recentHistory }),
      });

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      // Read SSE stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let metadata: Record<string, unknown> = {};

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.type === "content") {
                  assistantContent += parsed.text;
                  setStreamingContent(assistantContent);
                } else if (parsed.type === "message_complete") {
                  metadata = parsed.metadata || {};
                } else if (parsed.type === "error") {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
                  throw e;
                }
              }
            }
          }
        }
      }

      // Save completed assistant message
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: assistantContent,
        metadata,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      addMessage(conversationId, assistantMessage);
      incrementMessageCount();
    } catch (err) {
      console.error("Chat error:", err);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Something went wrong. Please try again.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      addMessage(conversationId, errorMessage);
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && !isStreaming && (
          <div className="chat-empty">
            <h2>What are you working on?</h2>
            {projectDescription ? (
              <p>
                I remember your project: <strong>{projectDescription.length > 80 ? projectDescription.slice(0, 80) + "..." : projectDescription}</strong>. Ask me anything about design, layout, colors, or getting unstuck.
              </p>
            ) : (
              <p>
                Ask me anything about design decisions, layout, colors, typography, or getting unstuck on technical walls.
              </p>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isStreaming && streamingContent && (
          <MessageBubble
            message={{
              id: "streaming",
              role: "assistant",
              content: streamingContent,
              created_at: new Date().toISOString(),
            }}
            isStreaming
          />
        )}

        {isStreaming && !streamingContent && (
          <div className="chat-thinking">
            <span className="chat-thinking-dot" />
            <span className="chat-thinking-dot" />
            <span className="chat-thinking-dot" />
          </div>
        )}

        {rateLimited && <UpgradePrompt />}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}

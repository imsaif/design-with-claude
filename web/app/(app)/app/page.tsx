"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  hasCompletedOnboarding,
  getOrCreateActiveConversation,
  getMemory,
} from "@/lib/store";
import { ChatContainer } from "@/components/chat/ChatContainer";

export default function AppPage() {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!hasCompletedOnboarding()) {
      router.push("/app/onboarding");
      return;
    }
    const conv = getOrCreateActiveConversation();
    setConversationId(conv.id);
  }, [router]);

  if (!mounted || !conversationId) {
    return <div className="chat-container" />;
  }

  const memory = getMemory();

  return (
    <ChatContainer
      conversationId={conversationId}
      projectDescription={memory?.product_description || undefined}
    />
  );
}

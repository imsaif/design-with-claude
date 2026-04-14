import { NextRequest } from "next/server";
import { routeToAgents } from "@/lib/agents/router";
import { buildSystemPrompt } from "@/lib/agents/system-prompt";
import { createChatStream } from "@/lib/agents/stream";

const MOCK_MODE = process.env.MOCK_MODE === "true" || !process.env.ANTHROPIC_API_KEY;

export async function POST(request: NextRequest) {
  const { message, memory, history } = await request.json();

  if (!message?.trim()) {
    return Response.json({ error: "Missing message" }, { status: 400 });
  }

  // Route to relevant agents
  const selectedAgents = routeToAgents(message.trim(), memory || null);
  const agentSlugs = selectedAgents.map((a) => a.slug);

  // Build system prompt
  const systemPrompt = buildSystemPrompt(memory || null, selectedAgents);

  // Build conversation messages
  const messages = [
    ...(history || []).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message.trim() },
  ];

  if (MOCK_MODE) {
    // Mock response for development without API key
    const mockContent = `I'd help you with that! Based on your question, I'm drawing on expertise from: **${agentSlugs.join(", ")}**.

This is a mock response because no Anthropic API key is set. Add \`ANTHROPIC_API_KEY\` to your \`.env.local\` to get real AI responses.

Your message was: "${message.trim()}"`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const words = mockContent.split(" ");
        for (let i = 0; i < words.length; i++) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "content", text: (i > 0 ? " " : "") + words[i] })}\n\n`
            )
          );
        }
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "message_complete", metadata: { agents_used: agentSlugs } })}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Real Claude streaming response
  const stream = createChatStream({ systemPrompt, messages });

  // Wrap to inject agent metadata into the completion event
  const encoder = new TextEncoder();
  let fullContent = "";

  const transform = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk);

      const text = new TextDecoder().decode(chunk);
      const lines = text.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content") {
              fullContent += parsed.text;
            } else if (parsed.type === "message_complete") {
              // Re-emit with agent metadata
              const enhanced = {
                ...parsed,
                metadata: { agents_used: agentSlugs, usage: parsed.usage },
              };
              // Replace the original event
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(enhanced)}\n\n`)
              );
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    },
  });

  const responseStream = stream.pipeThrough(transform);

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

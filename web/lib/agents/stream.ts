import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface StreamOptions {
  systemPrompt: string;
  messages: { role: "user" | "assistant"; content: string }[];
}

/**
 * Create a ReadableStream that yields SSE-formatted chunks from Claude's streaming API.
 */
export function createChatStream({ systemPrompt, messages }: StreamOptions): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: systemPrompt,
          messages,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "content", text: event.delta.text })}\n\n`
              )
            );
          }
        }

        // Get final message for metadata
        const finalMessage = await stream.finalMessage();

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "message_complete",
              usage: {
                input_tokens: finalMessage.usage.input_tokens,
                output_tokens: finalMessage.usage.output_tokens,
              },
            })}\n\n`
          )
        );

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: errorMessage })}\n\n`
          )
        );
        controller.close();
      }
    },
  });
}

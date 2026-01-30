/**
 * chat MCP Tool
 * Chat with xAI's Grok models
 */

import { z } from "zod";
import { getXAIClient, ChatMessage } from "../xai-client.js";

export const chatSchema = z.object({
  message: z
    .string()
    .describe("The user message to send to Grok"),
  model: z
    .string()
    .optional()
    .default("grok-3")
    .describe("Chat model (grok-3, grok-4, grok-3-mini, etc.)"),
  system_prompt: z
    .string()
    .optional()
    .describe("Optional system prompt to set context"),
  temperature: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .default(0.7)
    .describe("Sampling temperature (0-2)"),
  max_tokens: z
    .number()
    .optional()
    .describe("Maximum tokens in response"),
});

export type ChatInput = z.infer<typeof chatSchema>;

export const chatTool = {
  name: "chat",
  description:
    "Chat with xAI's Grok models. Send messages and receive AI-generated responses.",
  inputSchema: {
    type: "object" as const,
    properties: {
      message: {
        type: "string",
        description: "The user message to send to Grok",
      },
      model: {
        type: "string",
        description: "Chat model (grok-3, grok-4, grok-3-mini)",
        default: "grok-3",
      },
      system_prompt: {
        type: "string",
        description: "Optional system prompt to set context",
      },
      temperature: {
        type: "number",
        description: "Sampling temperature (0-2)",
        default: 0.7,
      },
      max_tokens: {
        type: "number",
        description: "Maximum tokens in response",
      },
    },
    required: ["message"],
  },
};

export async function handleChat(input: ChatInput): Promise<string> {
  const client = getXAIClient();
  const validated = chatSchema.parse(input);

  const messages: ChatMessage[] = [];

  if (validated.system_prompt) {
    messages.push({ role: "system", content: validated.system_prompt });
  }

  messages.push({ role: "user", content: validated.message });

  const response = await client.chatCompletion({
    model: validated.model,
    messages,
    temperature: validated.temperature,
    max_tokens: validated.max_tokens,
  });

  const reply = response.choices[0]?.message?.content || "No response";

  return JSON.stringify(
    {
      success: true,
      model: response.model,
      response: reply,
      usage: response.usage,
    },
    null,
    2
  );
}

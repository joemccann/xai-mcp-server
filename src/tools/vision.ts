/**
 * analyze_image MCP Tool
 * Analyze images using xAI's vision-capable Grok models
 * Based on: https://docs.x.ai/docs/guides/chat-completions
 */

import { z } from "zod";
import { getXAIClient } from "../xai-client.js";

export const visionSchema = z.object({
  image_url: z
    .string()
    .describe("URL of the image to analyze (JPEG, PNG, max 20MB) or base64 data URL"),
  prompt: z
    .string()
    .optional()
    .default("Describe this image in detail.")
    .describe("Question or instruction about the image"),
  detail: z
    .enum(["low", "high", "auto"])
    .optional()
    .default("auto")
    .describe("Image detail level: 'low' (faster, fewer tokens), 'high' (detailed), 'auto' (model decides)"),
  model: z
    .string()
    .optional()
    .default("grok-2-vision-1212")
    .describe("Vision-capable model (grok-2-vision-1212)"),
});

export type VisionInput = z.infer<typeof visionSchema>;

export const visionTool = {
  name: "analyze_image",
  description:
    "Analyze images using xAI's vision-capable Grok models. " +
    "Describe images, extract text (OCR), answer questions about visual content, " +
    "or identify objects and scenes. Supports JPEG and PNG up to 20MB.",
  inputSchema: {
    type: "object" as const,
    properties: {
      image_url: {
        type: "string",
        description: "URL of the image to analyze (JPEG, PNG, max 20MB) or base64 data URL",
      },
      prompt: {
        type: "string",
        description: "Question or instruction about the image",
        default: "Describe this image in detail.",
      },
      detail: {
        type: "string",
        enum: ["low", "high", "auto"],
        description: "Image detail level for analysis",
        default: "auto",
      },
      model: {
        type: "string",
        description: "Vision-capable model (grok-2-vision-1212)",
        default: "grok-2-vision-1212",
      },
    },
    required: ["image_url"],
  },
};

export async function handleVision(input: VisionInput): Promise<string> {
  const client = getXAIClient();
  const validated = visionSchema.parse(input);

  const analysis = await client.analyzeImage(
    validated.image_url,
    validated.prompt,
    validated.model,
    validated.detail
  );

  return JSON.stringify(
    {
      success: true,
      analysis,
      image_url: validated.image_url,
      prompt: validated.prompt,
      model: validated.model,
      detail: validated.detail,
    },
    null,
    2
  );
}

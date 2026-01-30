/**
 * analyze_image MCP Tool
 * Analyze images using xAI's vision-capable Grok models
 */

import { z } from "zod";
import { getXAIClient } from "../xai-client.js";

export const visionSchema = z.object({
  image_url: z
    .string()
    .describe("URL of the image to analyze (or base64 data URL)"),
  prompt: z
    .string()
    .optional()
    .default("Describe this image in detail.")
    .describe("Question or instruction about the image"),
  detail: z
    .enum(["low", "high", "auto"])
    .optional()
    .default("auto")
    .describe("Image detail level for analysis"),
  model: z
    .string()
    .optional()
    .default("grok-2-vision-1212")
    .describe("Vision model to use"),
});

export type VisionInput = z.infer<typeof visionSchema>;

export const visionTool = {
  name: "analyze_image",
  description:
    "Analyze images using xAI's vision-capable Grok models. Describe, extract text, or answer questions about images.",
  inputSchema: {
    type: "object" as const,
    properties: {
      image_url: {
        type: "string",
        description: "URL of the image to analyze (or base64 data URL)",
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
        description: "Vision model to use",
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
    validated.detail
  );

  return JSON.stringify(
    {
      success: true,
      analysis,
      image_url: validated.image_url,
      prompt: validated.prompt,
    },
    null,
    2
  );
}

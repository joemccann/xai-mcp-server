/**
 * generate_image MCP Tool
 * Generate images using xAI's Grok Imagine model
 * Based on: https://docs.x.ai/docs/guides/image-generation
 */

import { z } from "zod";
import { getXAIClient } from "../xai-client.js";

export const generateImageSchema = z.object({
  prompt: z
    .string()
    .describe("Text description of the image to generate"),
  n: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .default(1)
    .describe("Number of images to generate (1-10)"),
  model: z
    .string()
    .optional()
    .default("grok-2-image-1212")
    .describe("Image generation model (grok-2-image-1212, grok-imagine-image)"),
  aspect_ratio: z
    .enum(["16:9", "4:3", "1:1", "9:16", "3:4", "3:2", "2:3"])
    .optional()
    .describe("Aspect ratio for the generated image"),
  response_format: z
    .enum(["url", "b64_json"])
    .optional()
    .default("url")
    .describe("Response format: 'url' for hosted URL or 'b64_json' for base64"),
});

export type GenerateImageInput = z.infer<typeof generateImageSchema>;

export const generateImageTool = {
  name: "generate_image",
  description:
    "Generate images from text descriptions using xAI's Grok Imagine model. " +
    "Returns image URLs or base64 data. Supports multiple images and various aspect ratios.",
  inputSchema: {
    type: "object" as const,
    properties: {
      prompt: {
        type: "string",
        description: "Text description of the image to generate",
      },
      n: {
        type: "number",
        description: "Number of images to generate (1-10)",
        default: 1,
      },
      model: {
        type: "string",
        description: "Image generation model (grok-2-image-1212, grok-imagine-image)",
        default: "grok-2-image-1212",
      },
      aspect_ratio: {
        type: "string",
        enum: ["16:9", "4:3", "1:1", "9:16", "3:4", "3:2", "2:3"],
        description: "Aspect ratio for the generated image",
      },
      response_format: {
        type: "string",
        enum: ["url", "b64_json"],
        description: "Response format: 'url' or 'b64_json'",
        default: "url",
      },
    },
    required: ["prompt"],
  },
};

export async function handleGenerateImage(
  input: GenerateImageInput
): Promise<string> {
  const client = getXAIClient();
  const validated = generateImageSchema.parse(input);

  const response = await client.generateImage({
    model: validated.model,
    prompt: validated.prompt,
    n: validated.n,
    response_format: validated.response_format,
    aspect_ratio: validated.aspect_ratio,
  });

  if (validated.response_format === "b64_json") {
    const images = response.data.map((img, i) => ({
      index: i + 1,
      base64: `${img.b64_json?.substring(0, 100) ?? ""}...`, // Truncate for display
      revised_prompt: img.revised_prompt,
    }));
    return JSON.stringify(
      {
        success: true,
        images,
        count: images.length,
        note: "Base64 data truncated for display. Full data available in raw response.",
      },
      null,
      2
    );
  }

  const images = response.data.map((img, i) => ({
    index: i + 1,
    url: img.url,
    revised_prompt: img.revised_prompt,
  }));

  return JSON.stringify(
    {
      success: true,
      images,
      count: images.length,
    },
    null,
    2
  );
}

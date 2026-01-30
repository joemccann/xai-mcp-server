/**
 * generate_video MCP Tool
 * Generate videos using xAI's video generation capabilities
 */

import { z } from "zod";
import { getXAIClient } from "../xai-client.js";

export const generateVideoSchema = z.object({
  prompt: z
    .string()
    .describe("Text description of the video to generate"),
  model: z
    .string()
    .optional()
    .default("grok-2-video")
    .describe("Video generation model"),
  image: z
    .string()
    .optional()
    .describe("Optional input image URL or base64 to animate"),
  video: z
    .string()
    .optional()
    .describe("Optional input video URL to edit/extend"),
  duration: z
    .number()
    .min(1)
    .max(15)
    .optional()
    .default(5)
    .describe("Video duration in seconds (1-15)"),
  aspect_ratio: z
    .string()
    .optional()
    .describe("Aspect ratio (e.g., '16:9', '9:16', '1:1')"),
  wait_for_completion: z
    .boolean()
    .optional()
    .default(true)
    .describe("Wait for video generation to complete (polls status)"),
});

export type GenerateVideoInput = z.infer<typeof generateVideoSchema>;

export const generateVideoTool = {
  name: "generate_video",
  description:
    "Generate videos from text descriptions using xAI. Can also animate images or edit existing videos.",
  inputSchema: {
    type: "object" as const,
    properties: {
      prompt: {
        type: "string",
        description: "Text description of the video to generate",
      },
      model: {
        type: "string",
        description: "Video generation model",
        default: "grok-2-video",
      },
      image: {
        type: "string",
        description: "Optional input image URL or base64 to animate",
      },
      video: {
        type: "string",
        description: "Optional input video URL to edit/extend",
      },
      duration: {
        type: "number",
        description: "Video duration in seconds (1-15)",
        default: 5,
      },
      aspect_ratio: {
        type: "string",
        description: "Aspect ratio (e.g., '16:9', '9:16', '1:1')",
      },
      wait_for_completion: {
        type: "boolean",
        description: "Wait for video generation to complete",
        default: true,
      },
    },
    required: ["prompt"],
  },
};

export async function handleGenerateVideo(
  input: GenerateVideoInput
): Promise<string> {
  const client = getXAIClient();
  const validated = generateVideoSchema.parse(input);

  const response = await client.generateVideo({
    model: validated.model,
    prompt: validated.prompt,
    image: validated.image,
    video: validated.video,
    duration: validated.duration,
    aspect_ratio: validated.aspect_ratio,
  });

  if (!validated.wait_for_completion) {
    return JSON.stringify(
      {
        success: true,
        status: "pending",
        request_id: response.request_id,
        message: "Video generation started. Use the request_id to check status.",
      },
      null,
      2
    );
  }

  // Poll for completion
  const finalStatus = await client.pollVideoCompletion(response.request_id);

  if (finalStatus.status === "failed") {
    return JSON.stringify(
      {
        success: false,
        status: "failed",
        error: finalStatus.error || "Video generation failed",
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      success: true,
      status: "completed",
      video_url: finalStatus.video_url,
      request_id: response.request_id,
    },
    null,
    2
  );
}

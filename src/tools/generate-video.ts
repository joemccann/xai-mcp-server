/**
 * generate_video MCP Tool
 * Generate videos using xAI's Grok Imagine video model
 * Based on: https://docs.x.ai/docs/guides/video-generations
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
    .default("grok-imagine-video")
    .describe("Video generation model (grok-imagine-video)"),
  image_url: z
    .string()
    .optional()
    .describe("Input image URL to animate (for image-to-video generation)"),
  video_url: z
    .string()
    .optional()
    .describe("Input video URL to edit (max 8.7 seconds, must be publicly accessible)"),
  duration: z
    .number()
    .min(1)
    .max(15)
    .optional()
    .describe("Video duration in seconds (1-15). Note: video editing maintains original duration."),
  aspect_ratio: z
    .enum(["16:9", "4:3", "1:1", "9:16", "3:4", "3:2", "2:3"])
    .optional()
    .default("16:9")
    .describe("Aspect ratio for the generated video"),
  resolution: z
    .enum(["720p", "480p"])
    .optional()
    .default("720p")
    .describe("Video resolution"),
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
    "Generate videos from text descriptions using xAI's Grok Imagine. " +
    "Can also animate images (image-to-video) or edit existing videos. " +
    "Supports various aspect ratios and resolutions.",
  inputSchema: {
    type: "object" as const,
    properties: {
      prompt: {
        type: "string",
        description: "Text description of the video to generate or edit instructions",
      },
      model: {
        type: "string",
        description: "Video generation model (grok-imagine-video)",
        default: "grok-imagine-video",
      },
      image_url: {
        type: "string",
        description: "Input image URL to animate (for image-to-video generation)",
      },
      video_url: {
        type: "string",
        description: "Input video URL to edit (max 8.7 seconds)",
      },
      duration: {
        type: "number",
        description: "Video duration in seconds (1-15)",
        default: 5,
      },
      aspect_ratio: {
        type: "string",
        enum: ["16:9", "4:3", "1:1", "9:16", "3:4", "3:2", "2:3"],
        description: "Aspect ratio for the video",
        default: "16:9",
      },
      resolution: {
        type: "string",
        enum: ["720p", "480p"],
        description: "Video resolution",
        default: "720p",
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

  // Determine if this is a video edit or generation
  const isEdit = !!validated.video_url;

  let response;
  if (isEdit) {
    // Video editing via /videos/edits
    response = await client.editVideo({
      model: validated.model,
      prompt: validated.prompt,
      video_url: validated.video_url!,
      aspect_ratio: validated.aspect_ratio,
      resolution: validated.resolution,
    });
  } else {
    // Video generation via /videos/generations
    response = await client.generateVideo({
      model: validated.model,
      prompt: validated.prompt,
      image_url: validated.image_url,
      duration: validated.duration,
      aspect_ratio: validated.aspect_ratio,
      resolution: validated.resolution,
    });
  }

  if (!validated.wait_for_completion) {
    return JSON.stringify(
      {
        success: true,
        status: "pending",
        request_id: response.request_id,
        operation: isEdit ? "video_edit" : "video_generation",
        message: `Video ${isEdit ? "editing" : "generation"} started. Use the request_id to check status.`,
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
        request_id: response.request_id,
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      success: true,
      status: "completed",
      video_url: finalStatus.url,
      duration: finalStatus.duration,
      request_id: response.request_id,
      operation: isEdit ? "video_edit" : "video_generation",
    },
    null,
    2
  );
}

#!/usr/bin/env node
/**
 * xAI MCP Server
 * Model Context Protocol server for xAI's Grok APIs
 *
 * Provides tools for:
 * - Image generation (Grok Imagine)
 * - Chat completions
 * - Vision/image analysis
 * - Live web search
 * - Video generation
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  generateImageTool,
  handleGenerateImage,
  GenerateImageInput,
} from "./tools/generate-image.js";
import { chatTool, handleChat, ChatInput } from "./tools/chat.js";
import { visionTool, handleVision, VisionInput } from "./tools/vision.js";
import {
  liveSearchTool,
  handleLiveSearch,
  LiveSearchInput,
} from "./tools/live-search.js";
import {
  generateVideoTool,
  handleGenerateVideo,
  GenerateVideoInput,
} from "./tools/generate-video.js";

// Verify API key is available
if (!process.env.XAI_API_KEY) {
  console.error("Error: XAI_API_KEY environment variable is required");
  process.exit(1);
}

// Create the MCP server
const server = new Server(
  {
    name: "xai-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool listing handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      generateImageTool,
      chatTool,
      visionTool,
      liveSearchTool,
      generateVideoTool,
    ],
  };
});

// Register tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: string;

    switch (name) {
      case "generate_image":
        result = await handleGenerateImage(args as unknown as GenerateImageInput);
        break;
      case "chat":
        result = await handleChat(args as unknown as ChatInput);
        break;
      case "analyze_image":
        result = await handleVision(args as unknown as VisionInput);
        break;
      case "live_search":
        result = await handleLiveSearch(args as unknown as LiveSearchInput);
        break;
      case "generate_video":
        result = await handleGenerateVideo(args as unknown as GenerateVideoInput);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ success: false, error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start the server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("xAI MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

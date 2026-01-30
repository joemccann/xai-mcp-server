/**
 * live_search MCP Tool
 * Real-time web search using xAI's Grok models
 */

import { z } from "zod";
import { getXAIClient } from "../xai-client.js";

export const liveSearchSchema = z.object({
  query: z
    .string()
    .describe("Search query"),
  sources: z
    .array(z.enum(["web", "news", "x"]))
    .optional()
    .describe("Sources to search: web, news, x (Twitter/X)"),
  date_range: z
    .object({
      start: z.string().describe("Start date (YYYY-MM-DD)"),
      end: z.string().describe("End date (YYYY-MM-DD)"),
    })
    .optional()
    .describe("Date range filter"),
  max_results: z
    .number()
    .min(1)
    .max(20)
    .optional()
    .default(10)
    .describe("Maximum number of results"),
});

export type LiveSearchInput = z.infer<typeof liveSearchSchema>;

export const liveSearchTool = {
  name: "live_search",
  description:
    "Perform real-time web search using xAI's Grok. Search web, news, or X/Twitter for current information.",
  inputSchema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "Search query",
      },
      sources: {
        type: "array",
        items: {
          type: "string",
          enum: ["web", "news", "x"],
        },
        description: "Sources to search: web, news, x (Twitter/X)",
      },
      date_range: {
        type: "object",
        properties: {
          start: { type: "string", description: "Start date (YYYY-MM-DD)" },
          end: { type: "string", description: "End date (YYYY-MM-DD)" },
        },
        description: "Date range filter",
      },
      max_results: {
        type: "number",
        description: "Maximum number of results (1-20)",
        default: 10,
      },
    },
    required: ["query"],
  },
};

export async function handleLiveSearch(
  input: LiveSearchInput
): Promise<string> {
  const client = getXAIClient();
  const validated = liveSearchSchema.parse(input);

  const results = await client.liveSearch({
    query: validated.query,
    sources: validated.sources,
    date_range: validated.date_range,
    max_results: validated.max_results,
  });

  return JSON.stringify(
    {
      success: true,
      query: validated.query,
      sources: validated.sources || ["web"],
      results,
    },
    null,
    2
  );
}

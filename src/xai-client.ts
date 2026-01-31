/**
 * xAI API Client
 * Typed client for interacting with xAI's Grok APIs
 */

const XAI_BASE_URL = "https://api.x.ai/v1";

// ============ Types ============

export interface XAIConfig {
  apiKey: string;
  baseUrl?: string;
}

// Chat types
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

export interface ContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string; detail?: "low" | "high" | "auto" };
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Image generation types
export interface ImageGenerationRequest {
  model: string;
  prompt: string;
  n?: number;
  response_format?: "url" | "b64_json";
  aspect_ratio?: string;
}

export interface ImageGenerationResponse {
  created: number;
  data: {
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }[];
}

// Image edit types
export interface ImageEditRequest {
  model: string;
  prompt: string;
  image: string; // base64 or URL
  n?: number;
  response_format?: "url" | "b64_json";
}

// Video generation types
export interface VideoGenerationRequest {
  model: string;
  prompt: string;
  image?: string;
  video?: string;
  duration?: number;
  aspect_ratio?: string;
}

export interface VideoGenerationResponse {
  request_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  video_url?: string;
  error?: string;
}

// Search types (via chat with tools)
export interface SearchRequest {
  query: string;
  sources?: ("web" | "news" | "x")[];
  date_range?: { start: string; end: string };
  max_results?: number;
}

// Model types
export interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface ModelsResponse {
  object: string;
  data: Model[];
}

// ============ Client ============

export class XAIClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: XAIConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || XAI_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`xAI API error (${response.status}): ${error}`);
    }

    return response.json() as Promise<T>;
  }

  // ============ Models ============

  async listModels(): Promise<ModelsResponse> {
    return this.request<ModelsResponse>("/models");
  }

  async getModel(modelId: string): Promise<Model> {
    return this.request<Model>(`/models/${modelId}`);
  }

  // ============ Chat ============

  async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    return this.request<ChatCompletionResponse>("/chat/completions", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // ============ Image Generation ============

  async generateImage(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    return this.request<ImageGenerationResponse>("/images/generations", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async editImage(request: ImageEditRequest): Promise<ImageGenerationResponse> {
    return this.request<ImageGenerationResponse>("/images/edits", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // ============ Video Generation ============

  async generateVideo(
    request: VideoGenerationRequest
  ): Promise<VideoGenerationResponse> {
    return this.request<VideoGenerationResponse>("/videos/generations", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getVideoStatus(requestId: string): Promise<VideoGenerationResponse> {
    return this.request<VideoGenerationResponse>(`/videos/${requestId}`);
  }

  async pollVideoCompletion(
    requestId: string,
    maxAttempts = 60,
    intervalMs = 5000
  ): Promise<VideoGenerationResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getVideoStatus(requestId);
      if (status.status === "completed" || status.status === "failed") {
        return status;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error("Video generation timed out");
  }

  // ============ Live Search (via chat with search tool) ============

  async liveSearch(request: SearchRequest): Promise<string> {
    // xAI's live search is accessed via chat completions with special model
    // that has built-in search capabilities
    const searchPrompt = this.buildSearchPrompt(request);

    const response = await this.chatCompletion({
      model: "grok-3", // Grok models have live search capability
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant with access to real-time web search. Search the web and provide accurate, up-to-date information with sources.",
        },
        {
          role: "user",
          content: searchPrompt,
        },
      ],
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || "No results found";
  }

  private buildSearchPrompt(request: SearchRequest): string {
    let prompt = `Search for: ${request.query}`;

    if (request.sources && request.sources.length > 0) {
      prompt += `\nFocus on these sources: ${request.sources.join(", ")}`;
    }

    if (request.date_range) {
      prompt += `\nDate range: ${request.date_range.start} to ${request.date_range.end}`;
    }

    if (request.max_results) {
      prompt += `\nProvide up to ${request.max_results} results`;
    }

    return prompt;
  }

  // ============ Vision (via chat with image) ============

  async analyzeImage(
    imageUrl: string,
    prompt: string,
    detail: "low" | "high" | "auto" = "auto"
  ): Promise<string> {
    const response = await this.chatCompletion({
      model: "grok-2-vision-1212", // Vision-capable model
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl, detail } },
          ],
        },
      ],
    });

    return response.choices[0]?.message?.content || "No analysis available";
  }
}

// Singleton factory
let clientInstance: XAIClient | null = null;

export function getXAIClient(): XAIClient {
  if (!clientInstance) {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "XAI_API_KEY is not configured.\n\n" +
        "To fix this, add your xAI API key to ~/.claude/mcp.json:\n\n" +
        '  "xai": {\n' +
        '    "command": "xai-mcp-server",\n' +
        '    "env": {\n' +
        '      "XAI_API_KEY": "your-api-key-here"\n' +
        "    }\n" +
        "  }\n\n" +
        "Get your API key at: https://console.x.ai/\n" +
        "Then restart Claude Code."
      );
    }
    clientInstance = new XAIClient({ apiKey });
  }
  return clientInstance;
}

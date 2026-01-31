---
name: xai-grok
description: xAI Grok APIs for image generation, chat, vision, live search, and video. Use when the user asks to use Grok, xAI, or Grok Imagine for generating images, chatting with Grok, analyzing images with Grok Vision, searching the web/news/X with Grok, or generating videos. Triggers on "grok", "xai", "grok imagine", "ask grok", "grok vision", "grok search".
allowed-tools: mcp__xai__generate_image, mcp__xai__chat, mcp__xai__analyze_image, mcp__xai__live_search, mcp__xai__generate_video
---

# xAI Grok MCP Server

Access xAI's Grok APIs through the MCP server.

## When to Use This Skill

Use this skill when the user:
- Asks to generate images with Grok or Grok Imagine
- Wants to chat with Grok models
- Asks Grok to analyze or describe an image
- Wants to search the web, news, or X/Twitter with Grok
- Asks to generate videos with Grok

**Trigger phrases:** "grok", "xai", "grok imagine", "ask grok", "grok vision", "use grok"

## Available Tools

| Tool | Description |
|------|-------------|
| `generate_image` | Generate images using Grok Imagine |
| `chat` | Chat with Grok models (grok-3, grok-4, grok-3-mini) |
| `analyze_image` | Analyze images with Grok Vision |
| `live_search` | Real-time web, news, and X/Twitter search |
| `generate_video` | Generate videos from text prompts |

## Image Generation

Generate images with Grok Imagine:

```
User: "Using grok imagine, create a cyberpunk cityscape"
Tool: generate_image
Parameters:
  prompt: "cyberpunk cityscape at night with neon lights"
  n: 1 (optional, 1-10)
  aspect_ratio: "16:9" (optional)
```

### Supported Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | required | Image description |
| `n` | number | 1 | Number of images (1-10) |
| `model` | string | grok-2-image | Image model |
| `aspect_ratio` | string | - | "16:9", "1:1", "4:3", etc. |
| `response_format` | string | url | "url" or "b64_json" |

## Chat with Grok

Chat with Grok language models:

```
User: "Ask Grok to explain quantum computing"
Tool: chat
Parameters:
  message: "Explain quantum computing in simple terms"
  model: "grok-3" (optional)
```

### Supported Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `message` | string | required | Message to send |
| `model` | string | grok-3 | grok-3, grok-4, grok-3-mini |
| `system_prompt` | string | - | System context |
| `temperature` | number | 0.7 | Sampling temperature (0-2) |
| `max_tokens` | number | - | Max response tokens |

## Image Analysis (Vision)

Analyze images with Grok Vision:

```
User: "Use Grok to analyze this image: https://example.com/photo.jpg"
Tool: analyze_image
Parameters:
  image_url: "https://example.com/photo.jpg"
  prompt: "What do you see in this image?"
```

### Supported Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `image_url` | string | required | Image URL or base64 |
| `prompt` | string | "Describe this image" | Question/instruction |
| `detail` | string | auto | "low", "high", "auto" |
| `model` | string | grok-2-vision-1212 | Vision model |

## Live Search

Search web, news, or X/Twitter:

```
User: "Search for the latest SpaceX news using Grok"
Tool: live_search
Parameters:
  query: "SpaceX launches"
  sources: ["news"]
```

### Supported Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | required | Search query |
| `sources` | array | ["web"] | "web", "news", "x" |
| `date_range` | object | - | {start, end} YYYY-MM-DD |
| `max_results` | number | 10 | Max results (1-20) |

## Video Generation

Generate videos from text:

```
User: "Generate a video of clouds moving across a blue sky"
Tool: generate_video
Parameters:
  prompt: "clouds moving across a blue sky, timelapse"
  duration: 5
```

### Supported Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | required | Video description |
| `model` | string | grok-2-video | Video model |
| `duration` | number | 5 | Duration (1-15 seconds) |
| `image` | string | - | Input image to animate |
| `video` | string | - | Input video to edit |
| `aspect_ratio` | string | - | "16:9", "9:16", etc. |
| `wait_for_completion` | boolean | true | Wait for video |

## Troubleshooting

### MCP Server Not Connected

1. Check `/mcp` in Claude Code
2. Verify `~/.claude/mcp.json` has the xai entry
3. Restart Claude Code

### API Key Issues

Ensure `XAI_API_KEY` is set in `~/.claude/mcp.json`:
```json
"env": {
  "XAI_API_KEY": "xai-your-key-here"
}
```

Get your API key from: https://x.ai/api

# xAI MCP Server

A Model Context Protocol (MCP) server for xAI's Grok APIs. Use this server to access Grok's capabilities directly from Claude Code.

## Features

- **Image Generation** - Generate images from text prompts using Grok Imagine
- **Chat** - Converse with Grok models (grok-3, grok-4, etc.)
- **Vision** - Analyze and describe images
- **Live Search** - Real-time web, news, and X/Twitter search
- **Video Generation** - Generate videos from text prompts

## Installation

```bash
# Clone and install
cd xai-for-agents
npm install
npm run build
```

## Configuration

### 1. Set your xAI API Key

Get your API key from [x.ai](https://x.ai/api).

```bash
export XAI_API_KEY="your-api-key-here"
```

### 2. Configure Claude Code

Add to your `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "xai": {
      "command": "node",
      "args": ["/path/to/xai-for-agents/dist/index.js"],
      "env": {
        "XAI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Replace `/path/to/xai-for-agents` with the actual path to this directory.

## Usage Examples

Once configured, you can use these tools in Claude Code:

### Generate an Image

```
"Using grok imagine, generate an image of a cat in a tree."
```

Claude will invoke the `generate_image` tool and return the image URL.

### Chat with Grok

```
"Ask Grok to explain quantum computing."
```

### Analyze an Image

```
"Analyze this image: https://example.com/image.jpg"
```

### Search the Web

```
"Search for the latest news about AI."
```

### Generate a Video

```
"Generate a 5-second video of a sunset over mountains."
```

## Available Tools

| Tool | Description |
|------|-------------|
| `generate_image` | Generate images from text prompts |
| `chat` | Chat with Grok models |
| `analyze_image` | Analyze images using Grok vision |
| `live_search` | Search web, news, or X |
| `generate_video` | Generate videos from prompts |

## Tool Parameters

### generate_image

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Yes | Text description of the image |
| `n` | number | No | Number of images (1-10, default: 1) |
| `model` | string | No | Model (default: grok-2-image) |
| `aspect_ratio` | string | No | e.g., "16:9", "1:1" |
| `response_format` | string | No | "url" or "b64_json" |

### chat

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | Yes | Message to send to Grok |
| `model` | string | No | Model (default: grok-3) |
| `system_prompt` | string | No | System context |
| `temperature` | number | No | 0-2, default: 0.7 |
| `max_tokens` | number | No | Max response tokens |

### analyze_image

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image_url` | string | Yes | URL or base64 data URL |
| `prompt` | string | No | Question about the image |
| `detail` | string | No | "low", "high", or "auto" |

### live_search

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search query |
| `sources` | array | No | ["web", "news", "x"] |
| `date_range` | object | No | { start, end } dates |
| `max_results` | number | No | Max results (1-20) |

### generate_video

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Yes | Video description |
| `duration` | number | No | Seconds (1-15) |
| `image` | string | No | Input image to animate |
| `aspect_ratio` | string | No | e.g., "16:9" |

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Run directly
npm start
```

## License

MIT

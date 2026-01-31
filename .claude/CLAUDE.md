# xAI MCP Server - Development Notes

## Project Status

This MCP server provides xAI Grok APIs (image generation, chat, vision, search, video) to Claude Code.

## Critical Installation Notes

### MCP Server Registration

**IMPORTANT:** MCP servers MUST be added using the CLI command, NOT by editing config files directly.

```bash
# Correct method
claude mcp add xai -e XAI_API_KEY=your-key -- $(which node) ~/.xai-mcp-server/dist/index.js

# Verify
claude mcp list
```

**What DOESN'T work:**
- Editing `~/.claude/mcp.json` directly (this file is not read by Claude Code)
- Editing `~/.claude/settings.json` mcpServers section
- The mcp.json file in ~/.claude is NOT the correct location

### nvm Users

For users with nvm, the absolute path to node is required:
```bash
claude mcp add xai -e XAI_API_KEY=key -- /Users/username/.nvm/versions/node/v22.x.x/bin/node ~/.xai-mcp-server/dist/index.js
```

Use `$(which node)` to get the correct path automatically.

### Session Restart Required

MCP servers only load when Claude Code starts. After adding an MCP server:
1. Exit ALL Claude Code sessions
2. Start a fresh session with `claude`
3. Verify with `/mcp` command

## Skill File

The skill file at `~/.claude/skills/xai-grok/SKILL.md` enables Claude to discover and use the MCP tools.

Triggers: "grok", "xai", "grok imagine", "ask grok", "grok vision", "grok search"

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `mcp__xai__generate_image` | Generate images using Grok Imagine |
| `mcp__xai__chat` | Chat with Grok models |
| `mcp__xai__analyze_image` | Analyze images with Grok Vision |
| `mcp__xai__live_search` | Real-time web, news, X search |
| `mcp__xai__generate_video` | Generate videos |

## Troubleshooting

### "MCP server not connected" in skill

1. Run `claude mcp list` - should show `xai: ... - ✓ Connected`
2. If not listed, add with `claude mcp add`
3. If listed but skill can't access: **restart Claude Code completely**

### Tools not appearing after install

The install script uses `claude mcp add` which requires Claude CLI. If the CLI isn't available during install, manual addition is needed.

### API Key Issues

```bash
# Remove and re-add with correct key
claude mcp remove xai
claude mcp add xai -e XAI_API_KEY=xai-your-key -- $(which node) ~/.xai-mcp-server/dist/index.js
```

## Files

- `install.sh` - One-liner installer (uses `claude mcp add`)
- `skill/SKILL.md` - Skill definition (copied to ~/.claude/skills/xai-grok/)
- `src/` - MCP server source code
- `dist/` - Compiled JavaScript

## Testing

After installation and restart:
```
/mcp                              # Should show xai as connected
/xai-grok generate an image of... # Should invoke generate_image tool
```

## Repository

https://github.com/joemccann/xai-mcp-server

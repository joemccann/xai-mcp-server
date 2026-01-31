#!/bin/bash
set -e

# xAI MCP Server Installer
# Installs the xAI MCP server and configures Claude Code

REPO="joemccann/xai-mcp-server"
INSTALL_DIR="$HOME/.xai-mcp-server"
SETTINGS_FILE="$HOME/.claude/settings.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════╗"
echo "║      xAI MCP Server Installer         ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ required. Found: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js $(node -v) detected"

# Check for git
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed.${NC}"
    exit 1
fi

# Clone or update repository
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}→${NC} Updating existing installation..."
    cd "$INSTALL_DIR"
    git pull origin main
else
    echo -e "${YELLOW}→${NC} Cloning repository..."
    git clone "https://github.com/$REPO.git" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Install dependencies and build
echo -e "${YELLOW}→${NC} Installing dependencies..."
npm install --silent

echo -e "${GREEN}✓${NC} Build complete"

# Get API key
echo ""
echo -e "${BLUE}xAI API Key Setup${NC}"
echo "Get your API key from: https://x.ai/api"
echo ""

if [ -t 0 ]; then
    read -p "Enter your xAI API key (or press Enter to skip): " API_KEY
else
    API_KEY=""
fi

if [ -z "$API_KEY" ]; then
    API_KEY="xai-your-api-key-here"
    echo -e "${YELLOW}⚠${NC}  Skipped. You'll need to add your API key to ~/.claude/settings.json"
fi

# Configure Claude Code
echo ""
echo -e "${YELLOW}→${NC} Configuring Claude Code..."

mkdir -p "$HOME/.claude"

# Create or update settings.json
if [ -f "$SETTINGS_FILE" ]; then
    # Check if jq is available for JSON manipulation
    if command -v jq &> /dev/null; then
        # Use jq to merge settings
        TEMP_FILE=$(mktemp)
        jq --arg dir "$INSTALL_DIR" --arg key "$API_KEY" '
            .mcpServers.xai = {
                "command": "node",
                "args": [($dir + "/dist/index.js")],
                "env": {
                    "XAI_API_KEY": $key
                }
            }
        ' "$SETTINGS_FILE" > "$TEMP_FILE" && mv "$TEMP_FILE" "$SETTINGS_FILE"
        echo -e "${GREEN}✓${NC} Updated existing settings.json"
    else
        echo -e "${YELLOW}⚠${NC}  Cannot auto-update settings.json (jq not installed)"
        echo "   Please manually add the xai server configuration."
    fi
else
    # Create new settings file
    cat > "$SETTINGS_FILE" << EOF
{
  "mcpServers": {
    "xai": {
      "command": "node",
      "args": ["$INSTALL_DIR/dist/index.js"],
      "env": {
        "XAI_API_KEY": "$API_KEY"
      }
    }
  }
}
EOF
    echo -e "${GREEN}✓${NC} Created settings.json"
fi

# Done
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Installation Complete!           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""
echo "Installed to: $INSTALL_DIR"
echo "Settings:     $SETTINGS_FILE"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Restart Claude Code"
echo "2. Try: \"Generate an image of a sunset over mountains\""
echo ""

if [ "$API_KEY" = "xai-your-api-key-here" ]; then
    echo -e "${YELLOW}Remember to add your API key to ~/.claude/settings.json${NC}"
    echo ""
fi

# Gravity-Package Quick Start

## Current Status: ✅ FIXED (v1.0.21)

The WebSocket connection issue has been resolved. The native host now runs a WebSocket server on port 9224.

## Setup (One-Time)

```bash
# 1. Build the project
npm run build

# 2. Setup native host
npx gravity-core setup-native-host

# 3. Load extension in Chrome
# - Go to chrome://extensions
# - Enable "Developer mode"
# - Click "Load unpacked"
# - Select the extension/ folder
```

## Usage

```bash
# Start MCP server (via IDE or manually)
npx gravity-core

# Or add to your IDE's MCP config:
{
  "mcpServers": {
    "gravity": {
      "command": "npx",
      "args": ["gravity-core"],
      "disabled": false
    }
  }
}
```

## Testing

```bash
# Test connection
npx gravity-core test-connection

# Should show:
# ✅ Registry key exists
# ✅ Manifest file exists
# ✅ Native host executable found
# ✅ WebSocket connection
```

## Architecture

```
MCP Server → WebSocket (9224) → Native Host → Native Messaging → Extension → CDP → Browser
```

The native host bridges WebSocket (MCP) and Native Messaging (Extension).

## Troubleshooting

**"Connection closed" errors:**
- ✅ Fixed in v1.0.21 - Native host now runs WebSocket server

**Registry key missing:**
- Run: `npx gravity-core setup-native-host`

**Extension not connecting:**
- Reload extension in chrome://extensions
- Click "Connect to Tab" in extension popup

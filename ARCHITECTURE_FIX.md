# Gravity Architecture Fix - WebSocket Bridge

## Problem

The MCP server was trying to connect to a WebSocket server at `ws://localhost:9224`, but nothing was listening on that port. This caused continuous connection failures with the error:

```
❌ Gravity connection closed
```

## Root Cause

Chrome extensions with Manifest V3 **cannot create WebSocket servers** or TCP servers directly. The original architecture in `FLOW.md` showed:

```
MCP Server → WebSocket (9224) → Extension → Browser
```

This is impossible because the extension cannot run a WebSocket server.

## Solution

Introduced a **Native Host Bridge Process** that acts as a WebSocket-to-NativeMessaging bridge:

```
MCP Server ← WebSocket (9224) → Native Host ← Native Messaging → Extension ← CDP → Browser
```

### Components

1. **MCP Server** (`src/mcp-server.ts`)
   - Runs when IDE starts Gravity
   - Uses `BrowserConnection` to connect via WebSocket to port 9224
   - Sends CDP commands and receives responses

2. **Native Host Bridge** (`src/native-host.ts`) **[NEW]**
   - Runs a WebSocket server on port 9224
   - Connects to Chrome extension via Native Messaging (stdio)
   - Forwards messages bidirectionally:
     - MCP Server → WebSocket → Native Host → Native Messaging → Extension
     - Extension → Native Messaging → Native Host → WebSocket → MCP Server

3. **Chrome Extension** (`extension/background.js`)
   - Connects to Native Host via `chrome.runtime.connectNative('com.gravity')`
   - Receives CDP requests from Native Host
   - Executes CDP commands on attached browser tab
   - Sends responses back to Native Host

4. **Browser Tab**
   - Receives CDP commands from extension
   - Returns layout data, DOM info, etc.

## Changes Made

### New Files

- `src/native-host.ts` - WebSocket-to-NativeMessaging bridge process

### Modified Files

- `native-host/gravity-host.bat` - Now runs `native-host.js` instead of `cli.js`
- `native-host/manifest.json` - Changed name from `com.gravity.bridge` to `com.gravity`
- `extension/background.js` - Added auto-reconnect logic for native host
- `src/cli.ts` - Updated registry key name to `com.gravity`
- `package.json` - Bumped version to 1.0.21
- `extension/manifest.json` - Bumped version to 1.0.21

## How It Works

### Setup Flow

1. User runs `npx gravity-core setup-native-host`
2. CLI detects extension ID (via auto-registration)
3. CLI creates native host manifest with extension ID
4. CLI registers native host in Windows registry at:
   ```
   HKCU\Software\Google\Chrome\NativeMessagingHosts\com.gravity
   ```

### Runtime Flow

1. **Extension loads** → Connects to native host via `chrome.runtime.connectNative('com.gravity')`
2. **Native host starts** → Runs WebSocket server on port 9224
3. **User attaches debugger** → Extension connects to browser tab via CDP
4. **IDE starts MCP server** → `npx gravity-core` runs
5. **MCP server connects** → WebSocket connection to `ws://localhost:9224`
6. **User asks AI to diagnose** → MCP server sends CDP request
7. **Request flows through bridge**:
   ```
   MCP Server → WebSocket → Native Host → Native Messaging → Extension → CDP → Browser
   ```
8. **Response flows back**:
   ```
   Browser → CDP → Extension → Native Messaging → Native Host → WebSocket → MCP Server
   ```

## Benefits

- ✅ Works with Manifest V3 extensions (no deprecated APIs)
- ✅ MCP server can connect via standard WebSocket
- ✅ Extension uses standard Native Messaging
- ✅ Clean separation of concerns
- ✅ Auto-reconnect on disconnection
- ✅ Proper error handling at each layer

## Testing

To test the fix:

1. Rebuild the extension:
   ```bash
   npm run build
   ```

2. Reload the extension in Chrome:
   - Go to `chrome://extensions`
   - Click reload on Gravity extension

3. Run setup (if not already done):
   ```bash
   npx gravity-core setup-native-host
   ```

4. Connect extension to a tab:
   - Click Gravity icon
   - Click "Connect to Tab"

5. Start MCP server (via IDE or manually):
   ```bash
   npx gravity-core
   ```

6. Check logs:
   - Should see "✅ Connected to browser extension" (no more connection errors)
   - Native host should show "MCP server connected"

## Troubleshooting

If connection still fails:

1. **Check native host is registered**:
   ```bash
   reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.gravity"
   ```

2. **Check extension is connected**:
   - Open extension popup
   - Should show 🟢 GREEN status

3. **Check native host logs**:
   - Native host logs to stderr
   - Look for "WebSocket server listening on port 9224"

4. **Check port 9224 is not in use**:
   ```bash
   netstat -ano | findstr :9224
   ```

5. **Restart everything**:
   - Close Chrome completely
   - Restart Chrome
   - Reload extension
   - Connect to tab
   - Start MCP server

## Version History

- **1.0.20** - Previous version with broken WebSocket connection
- **1.0.21** - Fixed with Native Host bridge architecture

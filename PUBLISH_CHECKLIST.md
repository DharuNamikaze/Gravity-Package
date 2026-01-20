# Publish Checklist - v1.0.21

## ✅ Pre-Publish Verification

- [x] Build successful (`npm run build`)
- [x] All TypeScript files compiled
- [x] Native host bridge implemented (`src/native-host.ts`)
- [x] Extension files added to git
- [x] Version bumped to 1.0.21 in:
  - [x] package.json
  - [x] extension/manifest.json
  - [x] src/mcp-server.ts
- [x] Git commit created
- [x] Package contents verified (`npm pack --dry-run`)

## 📦 Package Contents (51 files, 225.4 kB)

### Core Files
- ✅ dist/ (all compiled TypeScript)
- ✅ extension/ (Chrome extension)
- ✅ native-host/ (bridge configuration)
- ✅ README.md, LICENSE, SETUP.md, MCP_CONFIGURATION.md

### Key New Files in v1.0.21
- ✅ dist/native-host.js (WebSocket bridge)
- ✅ extension/background.js (extension logic)
- ✅ extension/content.js (content script)
- ✅ extension/popup.js (popup UI)

## 🚀 Ready to Publish

```bash
# Publish to npm
npm publish

# Or test locally first
npm pack
npm install -g ./gravity-core-1.0.21.tgz
```

## 🔍 Post-Publish Testing

1. Install from npm: `npm install -g gravity-core`
2. Run setup: `npx gravity-core setup-native-host`
3. Load extension in Chrome
4. Connect to tab
5. Test MCP connection: `npx gravity-core test-connection`
6. Verify no "connection closed" errors

## 📝 Release Notes

**v1.0.21 - WebSocket Bridge Fix**

Fixed the "❌ Gravity connection closed" error by implementing a Native Host bridge that runs a WebSocket server on port 9224.

**Architecture:**
```
MCP Server → WebSocket (9224) → Native Host → Native Messaging → Extension → CDP → Browser
```

**Changes:**
- Created Native Host WebSocket bridge
- Updated native host configuration
- Added extension source files
- Fixed registry key naming
- Added auto-reconnect logic

**Migration:**
Users upgrading from 1.0.20 should:
1. Run `npx gravity-core setup-native-host` again
2. Reload the extension in Chrome
3. The connection should now work without errors

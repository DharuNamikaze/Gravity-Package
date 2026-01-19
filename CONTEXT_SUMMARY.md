# Gravity Package - Context Summary

## Current Status
- **Version**: 1.0.9
- **Last Updated**: January 17, 2026
- **Main Issue**: Extension detection not finding "Gravity" extension in Chrome/Brave profiles

## Recent Changes

### Version Updates
- 1.0.3 → 1.0.9 (multiple patch bumps)
- Updated in: `package.json` and `src/mcp-server.ts`

### Critical Fixes Applied

1. **ES Module Compatibility** (src/cli.ts)
   - Fixed `require.resolve()` → `join(__dirname, 'mcp-server.js')`
   - Added `readdirSync` and `statSync` imports to cli-utils.ts

2. **Extension Manifest** (extension/manifest.json)
   - Added `nativeMessaging` permission to fix `chrome.runtime.connectNative is not a function` error
   - Manifest version: 3

3. **Multi-Profile Support** (src/cli-utils.ts)
   - Added `getChromeProfileDirs()` - scans Default, Profile 1, Profile 2, etc.
   - Added `getBraveProfileDirs()` - scans Default, Profile 1, Profile 2, etc.
   - Replaced single-profile detection with multi-profile scanning

4. **Comprehensive Debugging** (src/cli-utils.ts)
   - Added detailed console.error logs in `scanExtensionsDir()` function
   - Shows: extension IDs, versions, manifest paths, name values, type checks
   - Helps diagnose why extension isn't being detected

## Known Issues

### Extension Detection Problem
- **Symptom**: `npx gravity-core setup-native-host` fails with "Could not find Gravity extension"
- **Debug Output Shows**:
  - Chrome Profile 1: Found 3 extensions with names like `__MSG_extName__`, `__MSG_APP_NAME__`
  - Brave Default: Found 5 extensions (ColorZilla, Lighthouse, etc.)
  - None match "Gravity"
- **Root Cause**: Extension loaded in Chrome but manifest.name not reading as "Gravity"
  - Possibly i18n placeholder issue (`__MSG_extName__`)
  - Or extension not properly loaded with correct manifest

### Native Host Connection Error
- **Error**: "Access to the specified native messaging host is forbidden"
- **Status**: Registry key and manifest setup incomplete (depends on extension detection)

## File Structure

```
src/
├── cli.ts              - Main CLI entry point, routes commands
├── cli-utils.ts        - Utility functions for setup/detection (UPDATED with debugging)
├── mcp-server.ts       - MCP server with strict JSON-RPC protocol
├── index.ts            - Main Gravity class
├── bridge.ts           - Browser connection bridge
├── browser-connection.ts
├── diagnostics.ts
└── types.ts

extension/
├── manifest.json       - UPDATED: added nativeMessaging permission
├── background.js       - Service worker
├── content.js
├── popup.html
├── popup.js
└── icons/

native-host/
├── manifest.json       - Native messaging manifest
└── gravity-host.bat    - Windows batch file for native host
```

## Setup Workflow

1. `npx gravity-core setup-extension` - Extracts extension to `~/.gravity-extension`
2. `npx gravity-core setup-native-host` - Detects extension ID, sets up native host
3. `npx gravity-core test-connection` - Validates all components
4. Load extension in Chrome: `chrome://extensions` → Load unpacked → `~/.gravity-extension`

## Next Steps for Debugging

1. Run `npx gravity-core setup-native-host` with new debugging output
2. Check what manifest names are actually being read
3. Verify extension is properly loaded in Chrome with correct manifest
4. May need to check if i18n is interfering with manifest.name reading
5. Consider adding fallback detection by extension ID pattern or other manifest fields

## Key Functions

- `detectGravityExtensionId()` - Main detection function (now with multi-profile support)
- `scanExtensionsDir()` - Scans single directory (now with detailed debugging)
- `getChromeProfileDirs()` - Gets all Chrome profiles
- `getBraveProfileDirs()` - Gets all Brave profiles
- `patchManifest()` - Patches manifest with extension ID
- `writeRegistryKey()` - Writes Windows registry for native messaging

## Environment

- **OS**: Windows (win32)
- **Node**: v20.19.6
- **npm**: 11.3.0
- **Chrome**: Profile 1 (not Default)
- **Brave**: Multiple profiles (Default + Profile 2-5)

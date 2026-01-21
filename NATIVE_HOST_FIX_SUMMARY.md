# Native Host Connection Fix - Summary

## Problem
The native host was exiting immediately after the Chrome extension connected, causing repeated "Native host has exited" errors.

## Root Cause
The batch file (`gravity-host.bat`) was using a relative path to find `native-host.js`:
```batch
node "%SCRIPT_DIR%..\dist\native-host.js"
```

This path was incorrect because:
1. The batch file is copied to `~/.gravity-host/`
2. The package is installed globally to `%APPDATA%\Roaming\npm\node_modules\gravity-core\`
3. The relative path `..\..\dist\` from `~/.gravity-host/` doesn't point to the global installation

## Solution
Updated the `patchManifest()` function in `src/cli-utils.ts` to:
1. Find the global npm installation directory using `npm root -g`
2. Generate an absolute path to `native-host.js`
3. Rewrite the batch file with the absolute path

New batch file content:
```batch
@echo off
REM Gravity Native Host
REM This script bridges WebSocket (MCP server) and Native Messaging (Chrome extension)

REM Start the native host bridge with absolute path
node "C:\Users\<username>\AppData\Roaming\npm\node_modules\gravity-core\dist\native-host.js"
```

## Additional Improvements

### 1. Comprehensive Logging
Added a log file at `~/.gravity-host/native-host.log` that captures:
- Startup information (Node version, paths, arguments)
- WebSocket server status
- Native Messaging pipeline setup
- Message forwarding (Extension ↔ MCP)
- Errors and exceptions
- Process exit codes

### 2. Better Error Handling
- Added error handlers for all streams (input, output, transform)
- Added uncaught exception and unhandled rejection handlers
- Added process exit logging
- Added keep-alive interval to prevent premature exit

### 3. Testing Documentation
Created `TESTING_NATIVE_HOST.md` with:
- Step-by-step testing instructions
- Expected log output
- Troubleshooting guide
- Manual testing procedures

## Files Modified
1. `src/cli-utils.ts` - Fixed batch file path generation
2. `src/native-host.ts` - Added comprehensive logging and error handling
3. `package.json` - Bumped version to 1.0.26
4. `extension/manifest.json` - Bumped version to 1.0.26

## Testing Steps
1. Run `npx gravity-core setup-native-host` to regenerate the native host with correct paths
2. Reload the Gravity extension in Chrome
3. Check the log file: `type %USERPROFILE%\.gravity-host\native-host.log`
4. Connect to a tab using the extension
5. Start the MCP server: `npx gravity-core`
6. Verify the connection works without "Native host has exited" errors

## Next Steps for User
1. Login to npm: `npm login`
2. Publish: `npm publish`
3. Test the connection following `TESTING_NATIVE_HOST.md`
4. Share the log file if issues persist

## Architecture Reminder
```
MCP Server (stdio) ← IDE
    ↓ (spawns)
MCP Server Process
    ↓ (WebSocket client → ws://localhost:9224)
Native Host Bridge (WebSocket server on 9224)
    ↓ (Native Messaging stdio)
Chrome Extension
    ↓ (CDP)
Browser Tab
```

The native host is the critical bridge that:
- Runs a WebSocket server on port 9224
- Connects to Chrome extension via Native Messaging (stdin/stdout)
- Forwards messages bidirectionally between MCP server and extension

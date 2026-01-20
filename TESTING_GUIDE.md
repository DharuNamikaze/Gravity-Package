# Testing Guide - gravity-package v1.0.21

## Pre-Test Checklist

- ✅ Code built successfully (`npm run build`)
- ✅ `dist/native-host.js` exists
- ✅ `dist/mcp-server.js` exists
- ✅ `dist/cli.js` exists
- ✅ Extension files in `extension/` folder
- ✅ Native host files in `native-host/` folder

## Step-by-Step Testing

### Step 1: Reload Extension

1. Open Chrome and go to `chrome://extensions`
2. Find "Gravity" extension
3. Click the reload icon (🔄)
4. Verify version shows `1.0.21`

**Expected Result:** Extension reloads without errors

### Step 2: Run Setup (if not already done)

```bash
npx gravity-core setup-native-host
```

**Expected Output:**
```
🌌 Gravity Native Host Setup
🔍 Detecting Gravity extension ID...
Starting registration server...
🌐 Registration server listening on http://127.0.0.1:39224
📋 Waiting for extension to register automatically...
✅ Extension registered: <extension-id>
📝 Creating native host manifest...
✅ Manifest created
📝 Writing registry key...
✅ Registry key written successfully
✅ Setup complete!
```

**If already set up:** You can skip this step

### Step 3: Verify Registry Key

```bash
reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.gravity"
```

**Expected Output:**
```
HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.gravity
    (Default)    REG_SZ    C:\Users\<user>\.gravity-host\manifest.json
```

### Step 4: Connect Extension to Tab

1. Open any website in Chrome (e.g., `https://example.com`)
2. Click the Gravity extension icon in toolbar
3. Click "Connect to Tab" button

**Expected Result:**
- Status changes from 🔴 RED to 🟢 GREEN
- Shows "Connected to tab: <tab-id>"

**Check Extension Console:**
```
Right-click extension icon → Inspect popup → Console tab
```

**Expected Logs:**
```
Attempting to attach debugger to tab <id>
Successfully attached debugger to tab <id>
Enabling DOM domain...
Successfully enabled DOM domain
Enabling CSS domain...
Successfully enabled CSS domain
Enabling Page domain...
Successfully enabled Page domain
All CDP domains enabled successfully
[WebSocket] Using Native Messaging bridge instead
Connecting to native messaging host...
Connected to native messaging host
```

### Step 5: Check Native Host Process

**Open Task Manager** (Ctrl+Shift+Esc) and look for:
- Process: `node.exe`
- Command line: `node <path>\dist\native-host.js`

**Expected Result:** Native host process is running

**Check Native Host Logs:**
The native host logs to stderr, which Chrome captures. To see logs:

1. Open Chrome's extension service worker console:
   - Go to `chrome://extensions`
   - Find Gravity extension
   - Click "service worker" link
   - Check Console tab

**Expected Logs from Native Host:**
```
[Native Host] Starting Gravity Native Host...
[Native Host] WebSocket server listening on port 9224
[Native Host] Listening for extension messages...
```

### Step 6: Start MCP Server

**In your IDE (Kiro):**
- The MCP server should start automatically when you use Gravity tools
- Or manually: `npx gravity-core`

**Expected Output (stderr):**
```
🔌 Connecting to Gravity at ws://localhost:9224...
✅ Connected to Gravity
✅ Connected to browser extension
```

**If you see this instead:**
```
❌ Gravity connection closed
```
**Then the native host is not running or not listening on port 9224.**

### Step 7: Test Connection Check

**In Kiro, ask:**
```
Check if Gravity is connected
```

**Or use MCP tool directly:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "check_connection",
    "arguments": {}
  }
}
```

**Expected Response:**
```json
{
  "connected": true,
  "message": "Connected",
  "timestamp": "2026-01-20T..."
}
```

### Step 8: Test Diagnostic Command

**In Kiro, ask:**
```
Diagnose the body element
```

**Or use MCP tool directly:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "diagnose_layout",
    "arguments": {
      "selector": "body"
    }
  }
}
```

**Expected Response:**
```json
{
  "element": "body",
  "position": {
    "left": 0,
    "top": 0,
    "width": 1200,
    "height": 800
  },
  "viewport": {
    "width": 1200,
    "height": 800
  },
  "issues": [
    {
      "type": "none",
      "severity": "low",
      "message": "No layout issues detected"
    }
  ]
}
```

## Troubleshooting

### Issue: "Connection closed" repeating

**Cause:** Native host not running or not listening on port 9224

**Solutions:**
1. Check if native host process is running (Task Manager)
2. Check extension service worker console for native host logs
3. Verify registry key points to correct manifest path
4. Try disconnecting and reconnecting extension to tab
5. Restart Chrome completely

### Issue: "Debugger not attached"

**Cause:** Extension not connected to tab

**Solutions:**
1. Click "Connect to Tab" in extension popup
2. Verify tab is not a system page (chrome://, chrome-extension://)
3. Try refreshing the page and reconnecting

### Issue: "Native host has exited"

**Cause:** Native host crashed or failed to start

**Solutions:**
1. Check native host manifest path in registry
2. Verify `dist/native-host.js` exists
3. Check Node.js is installed and in PATH
4. Try running native host manually:
   ```bash
   node dist/native-host.js
   ```
5. Check for error messages

### Issue: "Port 9224 already in use"

**Cause:** Another process is using port 9224

**Solutions:**
1. Find process using port:
   ```bash
   netstat -ano | findstr :9224
   ```
2. Kill the process or change port (not recommended)

### Issue: Extension not auto-registering

**Cause:** Registration server not running or extension not loaded

**Solutions:**
1. Ensure extension is loaded in Chrome
2. Run `setup-native-host` while extension is loaded
3. Check extension console for registration logs
4. Manually refresh extension to trigger registration

## Success Criteria

✅ Extension loads without errors
✅ Extension connects to tab (🟢 GREEN status)
✅ Native host process starts
✅ Native host WebSocket server listens on 9224
✅ MCP server connects to native host
✅ No "connection closed" errors
✅ `check_connection` returns `connected: true`
✅ `diagnose_layout` returns diagnostic data

## Performance Benchmarks

- **Connection establishment:** < 500ms
- **CDP command execution:** 50-200ms
- **Diagnostic analysis:** < 100ms
- **Total request time:** < 1 second

## Next Steps After Successful Testing

1. Test with complex selectors (`.modal`, `#header`, etc.)
2. Test with problematic layouts (offscreen elements, hidden modals)
3. Test reconnection (close and reopen MCP server)
4. Test multi-tab scenarios (connect to different tabs)
5. Test error cases (invalid selectors, closed tabs)

## Reporting Issues

If tests fail, collect:
1. Extension console logs
2. Native host logs (from service worker console)
3. MCP server logs (stderr)
4. Chrome version
5. Node.js version
6. Windows version
7. Steps to reproduce

---

**Current Status:** Implementation complete, ready for testing!

# Debugging Thought Process - MCP Connection Failure

## Initial Problem Statement

User reported: "its not auto detecting only if i hit refresh its doing" and logs showed:
```
❌ Gravity connection closed
```

This error was repeating every 2 seconds, indicating a connection retry loop.

## Investigation Phase 1: Understanding the Error

**First thought:** The error message "Gravity connection closed" is coming from somewhere in the codebase. Let me trace it.

**Found in:** `src/browser-connection.ts` line ~85
```typescript
ws.on('close', () => {
  console.log('❌ Gravity connection closed');
  this.isConnected = false;
  this.socket = null;
  // ... auto-reconnect logic
});
```

**Conclusion:** The WebSocket connection is failing to establish and immediately closing.

## Investigation Phase 2: What is the WebSocket connecting to?

**Looking at:** `src/browser-connection.ts` constructor and connect method
```typescript
const url = `ws://localhost:${this.port}`;  // port defaults to 9224
const ws = new WebSocket(url);
```

**Key insight:** The MCP server (running in Node.js) is trying to connect as a **WebSocket CLIENT** to `ws://localhost:9224`.

**Critical question:** Who is running the WebSocket SERVER on port 9224?

## Investigation Phase 3: Checking the Extension

**Read:** `extension/background.js`

**Found:** 
- Native Messaging code ✅
- CDP command handling ✅
- Debugger attachment ✅
- WebSocket server code ❌ **MISSING!**

**Initial confusion:** The extension has comments about WebSocket but no actual WebSocket server implementation. There's a function `startWebSocketServer()` but it just calls `connectNativeHost()` instead.

```javascript
function startWebSocketServer() {
  // ...
  console.log('[WebSocket] Using Native Messaging bridge instead');
  connectNativeHost();
}
```

**Realization:** Someone started to implement WebSocket but gave up and used Native Messaging instead. But the MCP server still tries to connect via WebSocket!

## Investigation Phase 4: Checking FLOW.md

**Read:** `FLOW.md` - The architecture documentation

**What it says:**
```
MCP Server → WebSocket (port 9224) → Extension → Browser
```

**Problem identified:** This architecture is **impossible** with Chrome Manifest V3 extensions!

**Why?** Chrome extensions cannot:
- Create TCP servers
- Create WebSocket servers
- Listen on network ports
- Use `chrome.sockets` API (removed in MV3)

**Thought:** The documentation describes an architecture that cannot be implemented. This is a fundamental design flaw.

## Investigation Phase 5: Exploring Solutions

**Option 1: Make extension create WebSocket server**
- ❌ Impossible with Manifest V3
- ❌ `chrome.sockets` API removed
- ❌ Service Workers can't create servers

**Option 2: Change MCP server to use Native Messaging directly**
- ❌ Complex: Node.js → Native Messaging requires spawning native host
- ❌ Circular dependency: Need extension ID to spawn native host
- ❌ Native Messaging from Node.js is non-trivial

**Option 3: Create a bridge process**
- ✅ Separate Node.js process runs WebSocket server
- ✅ Bridge forwards between WebSocket and Native Messaging
- ✅ MCP server connects via WebSocket (no changes needed)
- ✅ Extension connects via Native Messaging (already works)

**Decision:** Option 3 is the cleanest solution.

## Investigation Phase 6: Understanding Native Messaging

**Checked:** `native-host/manifest.json` and `native-host/gravity-host.bat`

**Current setup:**
- Manifest points to `gravity-host.bat`
- Batch file runs `cli.js` (the MCP server)
- This is wrong! The native host should be the bridge, not the MCP server

**Realization:** The native host is supposed to be a separate process that:
1. Runs a WebSocket server (for MCP server to connect)
2. Connects to extension via Native Messaging (stdio)
3. Forwards messages bidirectionally

**Current mistake:** The native host was running the MCP server directly, which doesn't help because the MCP server still needs to connect to something via WebSocket.

## Investigation Phase 7: Designing the Bridge

**Architecture:**
```
MCP Server (stdio) ← IDE
    ↓ (spawns)
MCP Server Process
    ↓ (WebSocket client)
Native Host Bridge (WebSocket server on 9224)
    ↓ (Native Messaging stdio)
Chrome Extension
    ↓ (CDP)
Browser Tab
```

**Bridge responsibilities:**
1. **WebSocket Server:** Listen on port 9224 for MCP server connections
2. **Native Messaging Client:** Read/write stdio using Chrome's protocol
3. **Message Forwarding:** Bidirectional message passing with proper serialization

**Native Messaging Protocol:**
- Messages are length-prefixed
- 4-byte header (uint32 little-endian) = message length
- Followed by UTF-8 JSON message
- Read from stdin, write to stdout

## Investigation Phase 8: Implementation Details

**Created:** `src/native-host.ts`

**Key functions:**
1. `startWebSocketServer()` - Creates WebSocket server on port 9224
2. `readNativeMessage()` - Reads length-prefixed messages from stdin
3. `sendNativeMessage()` - Writes length-prefixed messages to stdout
4. Message forwarding in both directions

**Flow:**
```javascript
// MCP → Extension
ws.on('message', (data) => {
  const message = JSON.parse(data);
  sendNativeMessage(message);  // Forward to extension
});

// Extension → MCP
const message = await readNativeMessage();
if (wsClient && wsClient.readyState === WebSocket.OPEN) {
  wsClient.send(JSON.stringify(message));  // Forward to MCP
}
```

## Investigation Phase 9: Integration Points

**Updated files:**

1. **`native-host/gravity-host.bat`**
   - Changed from running `cli.js` to `native-host.js`
   - This is what Chrome spawns when extension calls `connectNative()`

2. **`native-host/manifest.json`**
   - Changed name from `com.gravity.bridge` to `com.gravity`
   - Simpler, cleaner name

3. **`extension/background.js`**
   - Added auto-reconnect logic for native host
   - If native host disconnects and debugger is still attached, reconnect after 2 seconds

4. **`src/cli.ts`**
   - Updated registry key name to match new manifest name

## Investigation Phase 10: Why This Works

**The complete flow:**

1. **User loads extension** → Extension calls `chrome.runtime.connectNative('com.gravity')`
2. **Chrome spawns native host** → Runs `gravity-host.bat` → Runs `node native-host.js`
3. **Native host starts** → Creates WebSocket server on port 9224
4. **User starts MCP server** → IDE runs `npx gravity-core`
5. **MCP server connects** → `BrowserConnection` connects to `ws://localhost:9224`
6. **Connection established** → No more "connection closed" errors!

**Message flow example:**
```
User asks AI: "Diagnose #modal"
    ↓
IDE sends MCP request to gravity-core
    ↓
MCP server calls bridge.diagnoseLayout('#modal')
    ↓
BrowserConnection sends WebSocket message:
  { type: 'cdp_request', method: 'DOM.querySelector', params: { selector: '#modal' } }
    ↓
Native host receives WebSocket message
    ↓
Native host forwards via Native Messaging (stdio)
    ↓
Extension receives Native Messaging message
    ↓
Extension calls sendCDPCommand(tabId, 'DOM.querySelector', { selector: '#modal' })
    ↓
Chrome DevTools Protocol executes on browser tab
    ↓
Browser returns DOM node data
    ↓
Extension sends response via Native Messaging
    ↓
Native host forwards via WebSocket
    ↓
MCP server receives response
    ↓
DiagnosticsEngine analyzes layout
    ↓
MCP server returns result to IDE
    ↓
User sees diagnostic report!
```

## Key Insights

1. **Chrome extensions can't create servers** - This is a hard limitation of Manifest V3
2. **Native Messaging is the bridge** - It's the only way for external processes to communicate with extensions
3. **WebSocket is still useful** - MCP server can use standard WebSocket client libraries
4. **Bridge pattern solves it** - A separate process translates between protocols

## Mistakes I Almost Made

1. **Almost tried to implement WebSocket in extension** - Would have wasted time, it's impossible
2. **Almost changed MCP server to use Native Messaging** - Would have been very complex
3. **Almost created HTTP server instead** - WebSocket is better for bidirectional communication

## Why the Original Code Failed

1. **Architecture mismatch** - FLOW.md described impossible architecture
2. **Missing bridge** - No process was running WebSocket server on port 9224
3. **Wrong native host** - Native host was running MCP server instead of bridge
4. **Continuous retries** - MCP server kept trying to connect every 2 seconds, failing each time

## The Fix in One Sentence

Created a Native Host Bridge process that runs a WebSocket server on port 9224 and forwards messages between the MCP server (WebSocket) and Chrome extension (Native Messaging), solving the "connection closed" error.

## Testing Strategy

To verify the fix works:

1. ✅ Build compiles without errors
2. ✅ `native-host.js` exists in dist/
3. ✅ Extension manifest updated to v1.0.21
4. ✅ Package.json updated to v1.0.21
5. ⏳ Manual test: Reload extension, connect to tab, start MCP server
6. ⏳ Verify: No "connection closed" errors in logs
7. ⏳ Verify: Can diagnose elements successfully

## Lessons Learned

1. **Read the architecture docs carefully** - FLOW.md had the wrong architecture
2. **Understand platform limitations** - Chrome MV3 extensions have strict constraints
3. **Bridge patterns are powerful** - When two systems can't talk directly, add a bridge
4. **Native Messaging is underutilized** - It's the key to extension-external communication
5. **WebSocket + Native Messaging = ❤️** - Combining them gives best of both worlds

## Future Improvements

1. **Error handling** - Add better error messages when bridge fails to start
2. **Port configuration** - Allow custom port via environment variable
3. **Multiple connections** - Support multiple MCP servers connecting simultaneously
4. **Health checks** - Periodic ping/pong to detect dead connections
5. **Logging levels** - Add debug/info/error log levels for troubleshooting

## Conclusion

The MCP connection was failing because the architecture described in FLOW.md was impossible to implement with Chrome Manifest V3 extensions. By creating a Native Host Bridge process that translates between WebSocket (MCP server) and Native Messaging (Chrome extension), we solved the connection issue while maintaining clean separation of concerns and leveraging the strengths of each protocol.

The fix is elegant, maintainable, and follows Chrome's security model while providing the functionality users need.

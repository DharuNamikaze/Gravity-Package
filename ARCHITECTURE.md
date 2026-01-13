# Gravity - Architecture

## System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR IDE                                │
│  (VSCode, Cursor, Kiro, Warp, etc.)                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ MCP Protocol (stdio)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         gravity-core (MCP Server)                              │
│                                                                 │
│  - Exposes diagnostic tools                                    │
│  - Connects to extension via WebSocket                         │
│  - Analyzes layout data                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ WebSocket (port 9224)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         Chrome Extension (Native Bridge)                        │
│                                                                 │
│  - Runs WebSocket server                                       │
│  - Executes Chrome DevTools Protocol commands                  │
│  - Bridges to browser tab                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Chrome DevTools Protocol
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BROWSER TAB                                  │
│                                                                 │
│  - DOM tree                                                    │
│  - CSS computed styles                                         │
│  - Layout metrics                                              │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Asks AI to Diagnose

```
User: "Diagnose the #modal element"
  ↓
IDE sends to MCP Server
```

### 2. MCP Server Connects to Extension

```
MCP Server connects to Extension via WebSocket (port 9224)
  ↓
Extension receives connection
```

### 3. MCP Server Sends CDP Commands

```
MCP Server sends:
{
  "type": "cdp_request",
  "id": 1,
  "method": "DOM.querySelector",
  "params": { "selector": "#modal" }
}
  ↓
Extension receives via WebSocket
```

### 4. Extension Executes in Browser

```
Extension executes via Chrome DevTools Protocol:
chrome.debugger.sendCommand(tabId, 'DOM.querySelector', {...})
  ↓
Browser returns DOM data
```

### 5. Results Flow Back

```
Extension sends response via WebSocket:
{
  "type": "cdp_response",
  "id": 1,
  "result": { "nodeId": 42 }
}
  ↓
MCP Server receives and analyzes
  ↓
MCP Server returns diagnostic result to IDE
  ↓
IDE shows results to user
```

## Components

### 1. MCP Server (gravity-core)

**Responsibilities:**
- Exposes MCP tools (diagnose_layout, highlight_element, etc.)
- Validates CSS selectors
- Connects to extension via WebSocket
- Analyzes layout data
- Returns diagnostic reports

**Key Classes:**
- `Gravity` - Main API
- `BrowserConnection` - WebSocket client
- `DiagnosticsEngine` - Layout analysis

### 2. Chrome Extension

**Responsibilities:**
- Runs WebSocket server (port 9224)
- Attaches Chrome Debugger API to tab
- Executes CDP commands
- Bridges MCP server ↔ Browser

**Key Files:**
- `background.js` - Service worker, WebSocket server
- `popup.html/js` - UI for connecting to tab
- `manifest.json` - Extension configuration

### 3. Browser Tab

**Provides:**
- DOM tree via CDP
- Computed styles via CDP
- Layout metrics via CDP
- Box model data via CDP

## Connection Lifecycle

### 1. Extension Loads

```
User loads extension in chrome://extensions
  ↓
Extension background.js runs
  ↓
WebSocket server starts on port 9224
  ↓
Extension ready to accept connections
```

### 2. User Connects Tab

```
User clicks extension icon
  ↓
User clicks "Connect to Tab"
  ↓
Extension attaches Chrome Debugger API to current tab
  ↓
Extension enables CDP domains (DOM, CSS, Page)
  ↓
Status turns green
  ↓
Extension ready to receive CDP commands
```

### 3. IDE Configures MCP Server

```
User adds MCP config to IDE:
{
  "mcpServers": {
    "gravity": {
      "command": "npx",
      "args": ["gravity-core"]
    }
  }
}
  ↓
IDE starts MCP server process
  ↓
MCP server starts and listens on stdio
```

### 4. User Asks AI to Diagnose

```
User: "Diagnose the #modal element"
  ↓
IDE sends to MCP server via stdio
  ↓
MCP server connects to extension via WebSocket
  ↓
MCP server sends CDP commands
  ↓
Extension executes in browser
  ↓
Results flow back
  ↓
IDE shows results to user
```

## Key Design Decisions

### 1. Extension Runs Native Bridge

**Why:** No manual startup needed. Users just load extension and it's ready.

**How:** Extension's `background.js` starts WebSocket server on port 9224.

### 2. MCP Server Connects to Extension

**Why:** Allows multiple IDEs to share same browser connection.

**How:** MCP server connects as WebSocket client to extension's server.

### 3. WebSocket for Communication

**Why:** Persistent connection, bidirectional, low latency.

**How:** Extension runs server, MCP server connects as client.

### 4. No Local Native Host Process

**Why:** Simpler setup, no terminal needed, no port conflicts.

**How:** Extension handles all native messaging internally.

## Supported IDEs

Any IDE that supports MCP can use Gravity:

- ✅ VSCode
- ✅ Cursor
- ✅ Kiro
- ✅ Warp
- ✅ Any IDE with MCP support

## Detected Issues

Gravity detects:

- **Offscreen elements** - Left, right, top, bottom
- **Hidden elements** - display: none, visibility: hidden, opacity: 0
- **Z-index issues** - Missing or low z-index
- **Overflow issues** - overflow: hidden clipping content
- **Dimension issues** - Zero width/height
- **Positioning issues** - Uncentered modals

## Security

- ✅ Extension only connects to localhost
- ✅ WebSocket server only accepts local connections
- ✅ No external API calls
- ✅ All data stays local
- ✅ No user data collection

## Performance

- ⚡ WebSocket for low-latency communication
- ⚡ Caching of DOM queries
- ⚡ Timeout handling (10s default)
- ⚡ Auto-reconnect on disconnect

## Future Improvements

- [ ] Multiple tab support
- [ ] Element highlighting in browser
- [ ] Screenshot capture
- [ ] Flexbox/Grid diagnostics
- [ ] Animation state detection
- [ ] Accessibility checks
- [ ] Performance metrics

# Gravity - Complete Setup Guide

**Gravity** enables AI assistants (Kiro, Cursor, VSCode, etc.) to diagnose CSS layout issues in real browser tabs.

## 🎯 What It Does

When you ask an AI "why is my modal not showing?", Gravity:
1. Connects to your browser via extension
2. Inspects the actual DOM element
3. Analyzes its position, styles, and visibility
4. Returns specific issues and fixes

## 📋 Prerequisites

- **Node.js 16+** - [Download](https://nodejs.org)
- **Chrome or Edge browser** - Already have it? Great!
- **Any IDE** - VSCode, Cursor, Kiro, Warp, or any tool with MCP support

## 🚀 Installation (3 Steps)

### Step 1: Install npm Package

```bash
npm install gravity-core
```

### Step 2: Load Chrome Extension

1. Clone or download the extension folder from the repo
2. Open Chrome → `chrome://extensions`
3. Enable **"Developer mode"** (top right)
4. Click **"Load unpacked"**
5. Select the `extension/` folder
6. ✅ Extension loaded!

### Step 3: Connect Extension to Tab

1. Open any website in Chrome/Edge
2. Click the **Gravity** extension icon (top right)
3. Click **"Connect to Tab"**
4. Status turns **🟢 Green** = Connected!

**The extension now runs a WebSocket server on port 9224** - the MCP server connects to it automatically!

---

## 💻 Configure Your IDE

### VSCode

1. Open `.vscode/settings.json` (or create it)
2. Add MCP server config:

```json
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

3. Restart VSCode
4. Open any HTML/CSS file
5. Ask the AI: "Diagnose the #modal element"

### Cursor

Same as VSCode - add to `.cursor/settings.json`:

```json
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

### Kiro

Add to `.kiro/settings/mcp.json`:

```json
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

Restart Kiro. Now ask the AI:
- "Check if browser is connected"
- "Diagnose the #modal element"
- "Highlight the .button element"

### Warp

Add to `.warp/config.json`:

```json
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

### Any IDE with MCP Support

Add this to your IDE's MCP configuration:

```json
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

---

## 🔄 How It Works

```
Your IDE (VSCode, Cursor, Kiro, etc.)
    ↓
MCP Server (gravity-core)
    ↓
WebSocket Connection (port 9224)
    ↓
Chrome Extension (running WebSocket server)
    ↓
Chrome Debugger API
    ↓
Browser Tab (DOM, CSS, Layout data)
```

**Flow:**
1. You ask AI to diagnose an element
2. IDE sends request to MCP server
3. MCP server connects to extension via WebSocket on port 9224
4. Extension uses Chrome Debugger API to query browser
5. Results flow back to your IDE
6. AI shows you the issues and fixes

---

## 📊 Example Output

```json
{
  "element": "#modal",
  "found": true,
  "issues": [
    {
      "type": "offscreen-right",
      "severity": "high",
      "message": "Element extends 50px beyond right edge of viewport",
      "suggestion": "Add max-width: 100% or use overflow: hidden on parent"
    }
  ],
  "position": {
    "left": 100,
    "top": 50,
    "width": 500,
    "height": 300
  },
  "viewport": {
    "width": 1920,
    "height": 1080
  }
}
```

---

## 🎯 Common Workflows

### Workflow 1: Fix Offscreen Element (VSCode)

1. **Browser**: Open page with broken layout
2. **Extension**: Click icon → "Connect to Tab" (🟢 Green)
3. **VSCode**: Open CSS file
4. **VSCode**: Ask AI: "Diagnose the .modal element"
5. **AI**: Shows "Element extends 50px beyond right edge"
6. **You**: Add `max-width: 100%` to CSS
7. **Browser**: Refreshes automatically
8. **AI**: Diagnose again → ✅ Fixed!

### Workflow 2: Debug Hidden Element (Kiro)

1. **Browser**: Open page with hidden element
2. **Extension**: Click icon → "Connect to Tab" (🟢 Green)
3. **Kiro**: Ask AI: "Why is the #button not showing?"
4. **AI**: "The element has display: none"
5. **You**: Change CSS to `display: block`
6. **AI**: Diagnose again → ✅ Visible!

### Workflow 3: Check Multiple Elements (Cursor)

1. **Browser**: Open page
2. **Extension**: Connect to tab
3. **Cursor**: Ask AI: "Check these elements: #modal, .button, .header"
4. **AI**: Shows issues for all three
5. **You**: Fix them one by one

---

## 🔧 Configuration

### Custom Port

If port 9224 is in use, you can configure a different port:

1. Edit the extension's `background.js`:
```javascript
const WEBSOCKET_PORT = 9225; // Change from 9224
```

2. Update your IDE config with environment variable:
```json
{
  "mcpServers": {
    "gravity": {
      "command": "npx",
      "args": ["gravity-core"],
      "env": {
        "GRAVITY_PORT": "9225"
      },
      "disabled": false
    }
  }
}
```

### Timeout

In your IDE config:

```json
{
  "mcpServers": {
    "gravity": {
      "command": "npx",
      "args": ["gravity-core"],
      "env": {
        "GRAVITY_TIMEOUT": "20000"
      },
      "disabled": false
    }
  }
}
```

---

## 🐛 Troubleshooting

### "Not connected to browser"

**Problem**: Error says "Not connected"

**Solution**:
1. Make sure Chrome/Edge is open
2. Click extension icon → "Connect to Tab"
3. Status should turn green
4. Try again in your IDE

### "Extension not loaded"

**Problem**: Extension icon doesn't appear

**Solution**:
1. Go to `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension/` folder
5. Refresh the page

### "Port 9224 already in use"

**Problem**: Error "Port 9224 already in use"

**Solution**:
1. Edit extension's `background.js`
2. Change `WEBSOCKET_PORT` to 9225
3. Update IDE config with `DEVTOOLS_BRIDGE_PORT: 9225`
4. Reload extension

### "Element not found"

**Problem**: Error "Element not found: #modal"

**Solution**:
1. Check selector is correct
2. Make sure element exists in page
3. Try simpler selector: `div` instead of `#modal`
4. Check browser console for errors

### "Connection timeout"

**Problem**: Error "Connection timeout"

**Solution**:
1. Make sure extension is connected (green status)
2. Check firewall isn't blocking port 9224
3. Restart browser
4. Reload extension

---

## 📚 API Reference

### Gravity

```typescript
import { Gravity } from 'gravity-core';

const bridge = new Gravity(options);
```

#### Options

```typescript
{
  port?: number;           // Default: 9224
  timeout?: number;        // Default: 10000 (ms)
  autoReconnect?: boolean; // Default: true
}
```

#### Methods

##### `connectBrowser(port?: number): Promise<void>`

Connect to browser.

```javascript
await bridge.connectBrowser();
```

##### `disconnectBrowser(): Promise<void>`

Disconnect from browser.

```javascript
await bridge.disconnectBrowser();
```

##### `isConnected(): boolean`

Check if connected.

```javascript
if (bridge.isConnected()) {
  console.log('Connected!');
}
```

##### `diagnoseLayout(selector: string): Promise<DiagnosticResult>`

Diagnose layout issues.

```javascript
const result = await bridge.diagnoseLayout('#modal');
console.log(result.issues);
```

#### Events

```javascript
bridge.on('connected', () => {
  console.log('Connected to browser!');
});

bridge.on('disconnected', () => {
  console.log('Disconnected from browser');
});

bridge.on('error', (error) => {
  console.error('Error:', error);
});
```

---

## 🎓 Detected Issues

Gravity detects:

| Issue | Severity | What It Means |
|-------|----------|--------------|
| `offscreen-right` | 🔴 High | Element extends beyond right edge |
| `offscreen-left` | 🔴 High | Element extends beyond left edge |
| `offscreen-top` | 🔴 High | Element extends beyond top edge |
| `offscreen-bottom` | 🟡 Medium | Element extends beyond bottom edge |
| `hidden-display` | 🔴 High | `display: none` |
| `hidden-visibility` | 🔴 High | `visibility: hidden` |
| `hidden-opacity` | 🔴 High | `opacity: 0` |
| `low-opacity` | 🟡 Medium | `opacity < 0.1` |
| `modal-no-zindex` | 🟡 Medium | Positioned element without z-index |
| `modal-low-zindex` | 🟢 Low | `z-index < 100` |
| `overflow-hidden` | 🟢 Low | May clip content |

---

## 🚀 Next Steps

1. **Install package**: `npm install gravity-core`
2. **Load extension**: `chrome://extensions` → Load unpacked → select `extension/` folder
3. **Connect browser**: Click extension → "Connect to Tab"
4. **Configure IDE**: Add MCP server config (see above)
5. **Start diagnosing**: Ask your AI to diagnose elements!

---

## 📞 Support

- **GitHub Issues**: [Report bugs](https://github.com/gravity/core/issues)
- **Documentation**: [Full docs](https://gravity.dev)
- **Examples**: Check `examples/` folder in repo

---

## 🎉 You're Ready!

You now have everything to diagnose layouts in real-time. Start with:

```bash
npm install gravity-core
```

Then:
1. Load extension in Chrome
2. Connect to tab
3. Add MCP config to your IDE
4. Ask your AI to diagnose elements!

Happy debugging! 🚀

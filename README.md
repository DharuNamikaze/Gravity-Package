# gravity-core

**Gravity** - AI-powered CSS layout diagnostics for any IDE.

Connect your browser to get real-time layout issue detection. Works with VSCode, Cursor, Kiro, Warp, and any IDE with MCP support.

## 🎯 What It Does

Ask your AI assistant: *"Why is my modal not showing?"*

Gravity will:
1. Connect to your browser
2. Inspect the actual DOM element
3. Analyze its position, styles, and visibility
4. Return specific issues and fixes

## 🚀 Quick Start (2 minutes)

### 1. Install Package

```bash
npm install gravity-core
```

### 2. Load Chrome Extension

1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder from the repo
5. ✅ Done!

### 3. Connect to Tab

1. Click the Gravity extension icon
2. Click "Connect to Tab"
3. Status turns 🟢 Green

### 4. Configure Your IDE

**VSCode:**
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

**Cursor:**
Same as VSCode

**Kiro:**
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

**Warp or any IDE with MCP:**
Add the same config to your IDE's MCP settings.

### 5. Start Diagnosing

Ask your AI:
- "Diagnose the #modal element"
- "Why is the .button not showing?"
- "Check if the browser is connected"

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

## 🔌 How It Works

```
Your IDE (VSCode, Cursor, Kiro, etc.)
    ↓
MCP Server (gravity-core)
    ↓
WebSocket Connection (port 9224)
    ↓
Chrome Extension (running native bridge)
    ↓
Browser Tab (DOM, CSS, Layout data)
```

**No manual setup needed!** The extension automatically runs the native bridge when you connect to a tab.

## 📚 Detected Issues

- 🔴 **Offscreen elements** - Left, right, top, bottom
- 🔴 **Hidden elements** - display: none, visibility: hidden, opacity: 0
- 🟡 **Z-index issues** - Missing or low z-index
- 🟡 **Dimension issues** - Zero width/height
- 🟢 **Overflow issues** - overflow: hidden clipping content
- 🟢 **Positioning issues** - Uncentered modals

## 🎯 Common Workflows

### Fix Offscreen Modal

1. Browser: Open page with broken layout
2. Extension: Click icon → "Connect to Tab" (🟢 Green)
3. IDE: Ask AI: "Diagnose the .modal element"
4. AI: Shows "Element extends 50px beyond right edge"
5. You: Add `max-width: 100%` to CSS
6. Browser: Refreshes automatically
7. AI: Diagnose again → ✅ Fixed!

### Debug Hidden Element

1. Browser: Open page with hidden element
2. Extension: Connect to tab
3. IDE: Ask AI: "Why is the #button not showing?"
4. AI: "The element has display: none"
5. You: Change CSS to `display: block`
6. AI: Diagnose again → ✅ Visible!

## 🔧 API Reference

### Gravity

```typescript
import { Gravity } from 'gravity-core';

const bridge = new Gravity(options);
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

## 🐛 Troubleshooting

**"Not connected to browser"**
- Make sure Chrome/Edge is open
- Click extension icon → "Connect to Tab"
- Status should turn green

**"Extension not loaded"**
- Go to `chrome://extensions`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `extension/` folder

**"Port 9224 already in use"**
- Edit extension's `background.js`
- Change `WEBSOCKET_PORT` to 9225
- Update IDE config with `GRAVITY_PORT: 9225`

**"Element not found"**
- Check selector is correct
- Make sure element exists in page
- Try simpler selector: `div` instead of `#modal`

## 📖 Documentation

- [Setup Guide](./SETUP.md) - Complete setup instructions
- [Architecture](./ARCHITECTURE.md) - How it works under the hood

## 🚀 Supported IDEs

- ✅ VSCode
- ✅ Cursor
- ✅ Kiro
- ✅ Warp
- ✅ Any IDE with MCP support

## 🔒 Security

- ✅ Extension only connects to localhost
- ✅ WebSocket server only accepts local connections
- ✅ No external API calls
- ✅ All data stays local
- ✅ No user data collection

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## 📞 Support

- [GitHub Issues](https://github.com/gravity/core/issues)
- [Documentation](https://gravity.dev)

---

**Ready to diagnose layouts in real-time?**

```bash
npm install gravity-core
```

Then load the extension and configure your IDE. Happy debugging! 🎉

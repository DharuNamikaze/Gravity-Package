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

## 🚀 Quick Start (5 minutes)

### 1. Install Package

```bash
npm install gravity-core
```

### 2. Setup Extension

```bash
gravity setup-extension
```

This extracts the Chrome extension to `~/.gravity-extension`.

### 3. Setup Native Host

```bash
gravity setup-native-host
```

This:
- Auto-detects your Gravity extension ID
- Asks for confirmation before modifying registry
- Sets up native messaging for Chrome
- Optionally restarts Chrome

### 4. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `~/.gravity-extension` folder
5. ✅ Done!

### 5. Test Connection

```bash
gravity test-connection
```

This verifies:
- ✅ Registry key exists
- ✅ Manifest is valid
- ✅ Extension ID is configured
- ✅ Native host is executable
- ✅ WebSocket connection works

### 6. Configure Your IDE

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

### 7. Start Diagnosing

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
Native Messaging Host (Windows Registry)
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

1. Terminal: Run `gravity setup-extension` and `gravity setup-native-host`
2. Chrome: Load extension from `~/.gravity-extension`
3. Browser: Open page with broken layout
4. Extension: Click icon → "Connect to Tab" (🟢 Green)
5. IDE: Ask AI: "Diagnose the .modal element"
6. AI: Shows "Element extends 50px beyond right edge"
7. You: Add `max-width: 100%` to CSS
8. Browser: Refreshes automatically
9. AI: Diagnose again → ✅ Fixed!

### Debug Hidden Element

1. Browser: Open page with hidden element
2. Extension: Connect to tab
3. IDE: Ask AI: "Why is the #button not showing?"
4. AI: "The element has display: none"
5. You: Change CSS to `display: block`
6. AI: Diagnose again → ✅ Visible!

## 🔧 CLI Commands

### Setup Extension

Extract the Chrome extension to your home directory:

```bash
gravity setup-extension
```

Creates `~/.gravity-extension/` ready to load in Chrome.

### Setup Native Host

Configure native messaging for Chrome:

```bash
gravity setup-native-host
```

This command:
- Auto-detects your Gravity extension ID
- Asks for confirmation before modifying registry
- Copies native host to `~/.gravity-host/`
- Patches manifest with extension ID
- Writes Windows registry entry
- Optionally restarts Chrome

### Test Connection

Verify everything is working:

```bash
gravity test-connection
```

Checks:
- Registry key exists
- Manifest file is valid
- Extension ID is configured
- Native host is executable
- WebSocket connection works
- Browser handshake succeeds

### Start MCP Server

Run the MCP server (used by your IDE):

```bash
gravity
```

### Show Help

```bash
gravity --help
```

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

### "Could not find Gravity extension"

**Solution:**
1. Run `gravity setup-extension`
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `~/.gravity-extension`
6. Run `gravity setup-native-host`

### "Registry key not found"

**Solution:**
- Run `gravity setup-native-host` again
- You may need to run as Administrator
- Check that Chrome is installed in the default location

### "WebSocket connection failed"

**Solution:**
- Make sure the MCP server is running: `gravity`
- Check that port 9224 is not blocked by firewall
- Try a different port: `GRAVITY_PORT=9225 gravity`

### "Element not found"

**Solution:**
- Check selector is correct
- Make sure element exists in page
- Try simpler selector: `div` instead of `#modal`

### "Chrome is running" warning

**Solution:**
- The setup will ask if you want to restart Chrome
- Restart Chrome manually if you prefer
- Changes take effect after restart

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
- ✅ Registry changes require explicit user confirmation
- ✅ No silent installations or modifications

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## 📞 Support

- [GitHub Issues](https://github.com/DharuNamikaze/Gravity-Package/issues)
- [Documentation](https://gravity.dev)

---

**Ready to diagnose layouts in real-time?**

```bash
npm install gravity-core
gravity setup-extension
gravity setup-native-host
gravity test-connection
```

Then configure your IDE and start debugging! 🎉

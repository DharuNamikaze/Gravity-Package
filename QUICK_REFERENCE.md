# Gravity CLI Quick Reference

## Installation

```bash
npm install gravity-core
```

## Setup (One-Time)

```bash
# 1. Extract extension
gravity setup-extension

# 2. Setup native host (auto-detects extension ID)
gravity setup-native-host

# 3. Load extension in Chrome
# - Go to chrome://extensions
# - Enable "Developer mode"
# - Click "Load unpacked"
# - Select ~/.gravity-extension

# 4. Test connection
gravity test-connection
```

## Daily Usage

```bash
# Start MCP server (in terminal)
gravity

# In your IDE, ask your AI:
# "Diagnose the #modal element"
# "Why is the .button not showing?"
# "Check if the browser is connected"
```

## Commands

| Command | Purpose |
|---------|---------|
| `gravity` | Start MCP server |
| `gravity setup-extension` | Extract Chrome extension |
| `gravity setup-native-host` | Setup native messaging |
| `gravity test-connection` | Verify everything works |
| `gravity --help` | Show help |

## File Locations

| Path | Purpose |
|------|---------|
| `~/.gravity-extension/` | Chrome extension files |
| `~/.gravity-host/` | Native messaging host |
| `~/.gravity-host/manifest.json` | Native host config |

## Environment Variables

```bash
# Change WebSocket port (default: 9224)
GRAVITY_PORT=9225 gravity

# Change connection timeout (default: 10000ms)
GRAVITY_TIMEOUT=20000 gravity
```

## IDE Configuration

### VSCode / Cursor

Add to `settings.json`:

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

Add to MCP settings:

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

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Extension not found | Run `gravity setup-extension` |
| Registry key missing | Run `gravity setup-native-host` as Admin |
| WebSocket connection failed | Run `gravity` to start server |
| Element not found | Check CSS selector is correct |
| Chrome needs restart | Close and reopen Chrome |

## Uninstall

```bash
# Remove package
npm uninstall gravity-core

# Remove extension from Chrome
# - Go to chrome://extensions
# - Find Gravity and click "Remove"

# Delete local files (optional)
rm -r ~/.gravity-extension
rm -r ~/.gravity-host

# Remove registry entry (Windows, optional)
reg delete "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.devtools.bridge" /f
```

## Common Workflows

### Fix Offscreen Modal

1. Open page with broken layout
2. Click Gravity extension → "Connect to Tab"
3. Ask AI: "Diagnose the .modal element"
4. AI shows: "Element extends 50px beyond right edge"
5. Add CSS: `max-width: 100%`
6. Ask AI again: "Diagnose the .modal element"
7. AI shows: ✅ Fixed!

### Debug Hidden Element

1. Open page with hidden element
2. Connect extension to tab
3. Ask AI: "Why is the #button not showing?"
4. AI shows: "Element has display: none"
5. Change CSS: `display: block`
6. Ask AI again to verify

### Check Connection Status

```bash
# Test if everything is working
gravity test-connection

# Output:
# ✅ Registry key exists
# ✅ Manifest file exists
# ✅ Manifest valid
# ✅ Extension ID configured
# ✅ Native host executable found
# ✅ WebSocket connection successful
# 🎉 Gravity is ready!
```

## Getting Help

- **Setup Issues**: See [SETUP.md](./SETUP.md)
- **Technical Details**: See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **Full Documentation**: See [README.md](./README.md)
- **Report Bugs**: [GitHub Issues](https://github.com/DharuNamikaze/Gravity-Package/issues)

## Tips & Tricks

### Use Different Port

```bash
# If port 9224 is in use
GRAVITY_PORT=9225 gravity
```

### Increase Timeout

```bash
# If connection is slow
GRAVITY_TIMEOUT=30000 gravity
```

### Reinstall Extension

```bash
# Remove and reinstall
rm -r ~/.gravity-extension
gravity setup-extension
```

### Check Registry Entry

```bash
# Windows: View registry key
reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.devtools.bridge"
```

### View Extension ID

```bash
# Chrome: Go to chrome://extensions
# Look for "DevTools Bridge" or "Gravity"
# ID is shown below the name
```

---

**Need more help?** Check the full [README.md](./README.md) or [SETUP.md](./SETUP.md)

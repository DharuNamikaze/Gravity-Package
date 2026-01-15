# Gravity Setup Guide

Complete step-by-step guide to set up Gravity for your IDE.

## Prerequisites

- Node.js 16+ installed
- Chrome or Edge browser
- Administrator access (for Windows registry modification)

## Installation Steps

### Step 1: Install the Package

```bash
npm install gravity-core
```

Or globally:

```bash
npm install -g gravity-core
```

### Step 2: Extract Chrome Extension

```bash
gravity setup-extension
```

This creates `~/.gravity-extension/` with all extension files.

**What it does:**
- Copies extension files from the package
- Creates the directory in your home folder
- Prints the path for the next step

### Step 3: Setup Native Host (Windows Only)

```bash
gravity setup-native-host
```

This command:

1. **Auto-detects extension ID**
   - Scans Chrome's extension directory
   - Finds the Gravity extension by name
   - No manual ID lookup needed

2. **Asks for confirmation**
   ```
   ⚠️  Gravity needs to add a native-messaging registry entry. Proceed? (y/n)
   ```
   - Type `y` to proceed
   - Type `n` to cancel

3. **Copies native host files**
   - Creates `~/.gravity-host/` directory
   - Copies native messaging host files

4. **Patches manifest**
   - Inserts your extension ID
   - Updates path to native host executable

5. **Writes registry key**
   - Adds entry to Windows registry
   - Location: `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.devtools.bridge`

6. **Optionally restarts Chrome**
   ```
   ⚠️  Chrome is currently running. Restart Chrome for changes to take effect? (y/n)
   ```
   - Type `y` to restart Chrome
   - Type `n` to restart manually later

### Step 4: Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (toggle in top right corner)
3. Click "Load unpacked"
4. Select the `~/.gravity-extension` folder
5. The Gravity extension should now appear in your extensions list

### Step 5: Test Connection

```bash
gravity test-connection
```

This verifies everything is working:

```
✅ Registry key exists
✅ Manifest file exists
✅ Manifest valid
✅ Extension ID configured: chrome-extension://xxxxx/
✅ Native host executable found
✅ WebSocket connection successful

🎉 Gravity is ready! All checks passed.
```

If any checks fail, see the Troubleshooting section below.

### Step 6: Configure Your IDE

#### VSCode

1. Open settings: `Ctrl+Shift+P` → "Preferences: Open User Settings (JSON)"
2. Add to your settings:

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

#### Cursor

Same as VSCode - add to your MCP settings.

#### Kiro

1. Open Kiro settings
2. Add to MCP configuration:

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

#### Other IDEs with MCP Support

Add the same configuration to your IDE's MCP settings file.

### Step 7: Start Using Gravity

1. Open a web page in Chrome
2. Click the Gravity extension icon in your toolbar
3. Click "Connect to Tab"
4. Status should turn green
5. In your IDE, ask your AI assistant:
   - "Diagnose the #modal element"
   - "Why is the .button not showing?"
   - "Check if the browser is connected"

## File Locations

Gravity stores files in your home directory:

- `~/.gravity-extension/` - Chrome extension files
- `~/.gravity-host/` - Native messaging host files
- `~/.gravity-host/manifest.json` - Native host configuration

## Environment Variables

You can customize Gravity's behavior with environment variables:

```bash
# Change WebSocket port (default: 9224)
GRAVITY_PORT=9225 gravity

# Change connection timeout (default: 10000ms)
GRAVITY_TIMEOUT=20000 gravity
```

## Troubleshooting

### "Could not find Gravity extension"

**Problem:** `gravity setup-native-host` can't find your extension.

**Solutions:**
1. Make sure you ran `gravity setup-extension` first
2. Load the extension in Chrome (`chrome://extensions` → "Load unpacked")
3. Try running `gravity setup-native-host` again

### "Failed to write registry key"

**Problem:** Registry modification failed.

**Solutions:**
1. Run Command Prompt as Administrator
2. Run `gravity setup-native-host` again
3. Check that Chrome is installed in the default location
4. Verify you have permission to modify `HKCU\Software\Google\Chrome`

### "Registry key not found" (test-connection)

**Problem:** Registry key doesn't exist after setup.

**Solutions:**
1. Run `gravity setup-native-host` again
2. Make sure you confirmed the registry modification
3. Check registry manually:
   ```
   reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.devtools.bridge"
   ```

### "WebSocket connection failed" (test-connection)

**Problem:** Can't connect to the MCP server.

**Solutions:**
1. Start the MCP server: `gravity`
2. Check port 9224 is not blocked by firewall
3. Try a different port: `GRAVITY_PORT=9225 gravity`
4. Check that the extension is loaded and connected

### "Extension not loaded" in Chrome

**Problem:** Extension doesn't appear in `chrome://extensions`.

**Solutions:**
1. Make sure you ran `gravity setup-extension`
2. Go to `chrome://extensions`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select `~/.gravity-extension` folder
6. Refresh the page

### "Element not found" in diagnostics

**Problem:** Gravity can't find the element you're asking about.

**Solutions:**
1. Check the CSS selector is correct
2. Make sure the element exists on the page
3. Try a simpler selector (e.g., `div` instead of `#modal`)
4. Make sure the extension is connected (green status)

### Chrome keeps asking to restart

**Problem:** Chrome needs to restart for changes to take effect.

**Solutions:**
1. Close Chrome completely
2. Restart Chrome manually
3. Or answer `y` when prompted during setup

### "Port 9224 already in use"

**Problem:** Another application is using port 9224.

**Solutions:**
1. Use a different port: `GRAVITY_PORT=9225 gravity`
2. Update your IDE config to use the new port
3. Or stop the other application using port 9224

## Uninstalling

To remove Gravity:

1. Remove the npm package:
   ```bash
   npm uninstall gravity-core
   ```

2. Remove the extension from Chrome:
   - Go to `chrome://extensions`
   - Find Gravity and click "Remove"

3. Delete the local files (optional):
   ```bash
   rm -r ~/.gravity-extension
   rm -r ~/.gravity-host
   ```

4. Remove registry entry (optional, Windows):
   ```
   reg delete "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.devtools.bridge" /f
   ```

## Getting Help

- Check the [README](./README.md) for quick start
- Review [Architecture](./ARCHITECTURE.md) for technical details
- Open an issue on [GitHub](https://github.com/DharuNamikaze/Gravity-Package/issues)

## Next Steps

Once Gravity is set up:

1. **Configure your IDE** - Add MCP server configuration
2. **Load the extension** - Go to `chrome://extensions` and load unpacked
3. **Connect to a tab** - Click extension icon and "Connect to Tab"
4. **Start diagnosing** - Ask your AI about layout issues

Happy debugging! 🎉

# Gravity MCP Server Configuration

After installing Gravity and setting up the extension, you need to configure your IDE to connect to the Gravity MCP server.

## Prerequisites

1. Install Gravity: `npm install -g gravity-core`
2. Run setup: `npx gravity-core setup-extension` and `npx gravity-core setup-native-host`
3. Load the extension in Chrome (see SETUP.md)

## Configuration by IDE

### VSCode (with GitHub Copilot)

VSCode supports MCP servers through GitHub Copilot. Create a `.vscode/mcp.json` file in your workspace:

```json
{
  "servers": {
    "gravity": {
      "type": "stdio",
      "command": "npx",
      "args": ["gravity-core"],
      "env": {
        "GRAVITY_PORT": "9224",
        "GRAVITY_TIMEOUT": "10000"
      }
    }
  }
}
```

**For global configuration** (all workspaces), use the command palette:
1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
2. Run `MCP: Open User Configuration`
3. Add the same server configuration

**Alternative locations:**
- Windows: `%APPDATA%\Code\User\globalStorage\modelcontextprotocol.mcp\mcp.json`
- macOS: `~/Library/Application Support/Code/User/globalStorage/modelcontextprotocol.mcp/mcp.json`
- Linux: `~/.config/Code/User/globalStorage/modelcontextprotocol.mcp/mcp.json`

[Official VSCode MCP Documentation](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)

### Cursor

Cursor uses a workspace-level configuration file. Create `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "gravity": {
      "command": "npx",
      "args": ["gravity-core"],
      "env": {
        "GRAVITY_PORT": "9224",
        "GRAVITY_TIMEOUT": "10000"
      }
    }
  }
}
```

[Official Cursor MCP Documentation](https://docs.cursor.com/en/context/mcp)

### Cline (VSCode Extension)

Cline uses its own configuration file. Create `.cline/mcp.json` in your workspace:

```json
{
  "mcpServers": {
    "gravity": {
      "command": "npx",
      "args": ["gravity-core"],
      "env": {
        "GRAVITY_PORT": "9224",
        "GRAVITY_TIMEOUT": "10000"
      }
    }
  }
}
```

### Zed Editor

Zed uses `context_servers` in its settings. Open Zed settings (`Cmd+,` on macOS or `Ctrl+,` on Windows/Linux) and add:

```json
{
  "context_servers": {
    "gravity": {
      "command": "npx",
      "args": ["gravity-core"],
      "env": {
        "GRAVITY_PORT": "9224",
        "GRAVITY_TIMEOUT": "10000"
      }
    }
  }
}
```

**Settings file location:**
- macOS: `~/.config/zed/settings.json`
- Linux: `~/.config/zed/settings.json`
- Windows: `%APPDATA%\Zed\settings.json`

**Alternative method:** Use the Agent Panel in Zed:
1. Open Agent Panel settings
2. Click "Add Custom Server"
3. Fill in the server details

[Official Zed MCP Documentation](https://zed.dev/docs/ai/mcp)

### Claude Desktop

Claude Desktop has native MCP support. Edit the configuration file:

**Configuration file location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gravity": {
      "command": "npx",
      "args": ["gravity-core"],
      "env": {
        "GRAVITY_PORT": "9224",
        "GRAVITY_TIMEOUT": "10000"
      }
    }
  }
}
```

**To access the config file:**
1. Open Claude Desktop
2. Go to Settings > Developer
3. Click "Edit Config"

[Official Claude Desktop MCP Documentation](https://modelcontextprotocol.io/quickstart/user)

### Continue.dev

Continue.dev supports MCP through its configuration. The configuration format uses YAML by default, but also supports JSON.

**Using YAML** (recommended for Continue.dev):

Edit `~/.continue/config.yaml`:

```yaml
mcpServers:
  gravity:
    command: npx
    args:
      - gravity-core
    env:
      GRAVITY_PORT: "9224"
      GRAVITY_TIMEOUT: "10000"
```

**Using JSON** (alternative):

Edit `~/.continue/config.json`:

```json
{
  "mcpServers": {
    "gravity": {
      "command": "npx",
      "args": ["gravity-core"],
      "env": {
        "GRAVITY_PORT": "9224",
        "GRAVITY_TIMEOUT": "10000"
      }
    }
  }
}
```

[Official Continue.dev MCP Documentation](https://docs.continue.dev/customize/deep-dives/mcp)

## Environment Variables

Gravity supports the following environment variables for customization:

| Variable | Description | Default |
|----------|-------------|---------|
| `GRAVITY_PORT` | WebSocket port for browser connection | `9224` |
| `GRAVITY_TIMEOUT` | Connection timeout in milliseconds | `10000` |

## Verifying the Connection

After configuring your IDE:

1. **Start the MCP server** - Your IDE should automatically start Gravity when you open a chat/agent
2. **Open Chrome** with the Gravity extension loaded
3. **Navigate to a webpage** you want to inspect
4. **Click the Gravity extension icon** and select "Connect to Tab"
5. **In your IDE**, try using Gravity tools:
   - `diagnose_layout` - Diagnose CSS layout issues for a specific element
   - `check_connection` - Verify browser connection status
   - `highlight_element` - Highlight elements in the browser

**Example prompts to try:**
- "Check if the browser is connected"
- "Diagnose the #modal element"
- "Why is the .button not showing?"
- "Highlight the nav element"

## Troubleshooting

### "MCP server not found" or "Command not found"

**Solution:**
- Ensure `gravity-core` is installed: `npm install -g gravity-core`
- Or use `npx gravity-core` to run without global installation
- Verify Node.js is installed: `node --version` (requires Node.js 16+)
- Check that the command path is correct in your configuration

### "Connection failed" or "WebSocket connection failed"

**Solution:**
- Ensure Chrome is running with the Gravity extension loaded
- Click "Connect to Tab" in the extension popup (icon should turn green)
- Check that port 9224 is not blocked by your firewall
- Try a different port by setting `GRAVITY_PORT` environment variable
- Verify the MCP server is running (check IDE logs)

### "Native messaging host forbidden" or "Access denied"

**Solution:**
- Run `npx gravity-core setup-native-host` again
- Ensure you entered the correct extension ID during setup
- Restart Chrome completely after setup
- On Windows, verify the registry key exists at `HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.gravity.bridge`
- Check that the manifest file exists in `~/.gravity-host/`

### "Element not found" when diagnosing

**Solution:**
- Verify the CSS selector is correct (e.g., `#id`, `.class`, `div`)
- Ensure the element exists in the current page
- Try a simpler selector first (e.g., `body` or `div`)
- Check that you're connected to the correct browser tab

### MCP server not starting in VSCode

**Solution:**
- Ensure GitHub Copilot is installed and enabled
- Check the MCP output logs: Run `MCP: List Servers` → Select Gravity → Show Output
- Verify the configuration file syntax is correct (valid JSON)
- Try restarting the MCP server: `MCP: List Servers` → Select Gravity → Restart

### Configuration not taking effect

**Solution:**
- Restart your IDE after changing configuration
- For VSCode: Run `MCP: Reset Cached Tools` to clear the tool cache
- Verify the configuration file is in the correct location
- Check for syntax errors in the JSON configuration

## Advanced Configuration

### Custom Port

If port 9224 is already in use, configure a custom port:

**VSCode (.vscode/mcp.json):**
```json
{
  "servers": {
    "gravity": {
      "type": "stdio",
      "command": "npx",
      "args": ["gravity-core"],
      "env": {
        "GRAVITY_PORT": "9225"
      }
    }
  }
}
```

**Other IDEs (adjust format accordingly):**
```json
{
  "mcpServers": {
    "gravity": {
      "command": "npx",
      "args": ["gravity-core"],
      "env": {
        "GRAVITY_PORT": "9225"
      }
    }
  }
}
```

### Multiple Browser Profiles

Run separate Gravity instances for different browser profiles:

```json
{
  "mcpServers": {
    "gravity-chrome": {
      "command": "npx",
      "args": ["gravity-core"],
      "env": {
        "GRAVITY_PORT": "9224"
      }
    },
    "gravity-brave": {
      "command": "npx",
      "args": ["gravity-core"],
      "env": {
        "GRAVITY_PORT": "9225"
      }
    }
  }
}
```

Then connect each browser to its respective port.

### Using Global Installation

If you installed Gravity globally, you can simplify the configuration:

```json
{
  "mcpServers": {
    "gravity": {
      "command": "gravity-core"
    }
  }
}
```

Note: Using `npx` is recommended as it ensures you're always using the latest version.

### Dev Container Configuration

To use Gravity in a Dev Container, add to your `devcontainer.json`:

```json
{
  "customizations": {
    "vscode": {
      "mcp": {
        "servers": {
          "gravity": {
            "command": "npx",
            "args": ["gravity-core"],
            "env": {
              "GRAVITY_PORT": "9224"
            }
          }
        }
      }
    }
  }
}
```

## IDE-Specific Tips

### VSCode
- Use `Ctrl+Shift+P` → `MCP: Browse Servers` to see all available MCP servers
- Enable auto-start: Set `chat.mcp.autostart` to `true` in settings
- View server logs: `MCP: List Servers` → Select Gravity → Show Output

### Cursor
- MCP servers are automatically discovered from `.cursor/mcp.json`
- Restart Cursor after configuration changes
- Check the Cursor output panel for MCP-related logs

### Zed
- Access Agent Panel settings via the top-right menu
- Use "View Server Extensions" to see available MCP servers
- Custom servers can be added via "Add Custom Server" button

### Claude Desktop
- Access config via Settings > Developer > Edit Config
- Restart Claude Desktop after configuration changes
- Check the developer console for connection errors

## Next Steps

Once configured, you can use Gravity in your IDE to:
- **Diagnose CSS layout issues** in real-time with AI-powered analysis
- **Inspect DOM elements** directly from your code editor
- **Get specific suggestions** for fixing layout problems (offscreen elements, z-index issues, etc.)
- **Highlight elements** in the browser to visualize what you're debugging
- **Check connection status** to ensure browser communication is working

**Recommended workflow:**
1. Open a webpage in Chrome with layout issues
2. Connect Gravity extension to the tab
3. In your IDE, ask: "Diagnose the [selector] element"
4. Review the AI's analysis and suggestions
5. Apply fixes and verify in real-time

For more information:
- [README.md](README.md) - Complete feature overview
- [SETUP.md](SETUP.md) - Detailed setup instructions
- [GitHub Issues](https://github.com/DharuNamikaze/Gravity-Package/issues) - Report problems or request features

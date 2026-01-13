# Getting Started with Gravity

## 🚀 Start Here (5 Minutes)

### Step 1: Install the Package

```bash
npm install gravity-core
```

### Step 2: Load the Extension

1. Open Chrome or Edge
2. Go to `chrome://extensions`
3. Enable **"Developer mode"** (toggle in top right)
4. Click **"Load unpacked"**
5. Select the `extension/` folder from this repository
6. ✅ You should see the Gravity icon in your toolbar

### Step 3: Connect to a Tab

1. Open any website (e.g., google.com)
2. Click the **Gravity** extension icon
3. Click **"Connect to Tab"**
4. Wait for the status to turn **🟢 Green**
5. ✅ Connected!

### Step 4: Configure Your IDE

Choose your IDE below and add the configuration:

#### VSCode
1. Open `.vscode/settings.json` (create if it doesn't exist)
2. Add this:
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
1. Open `.cursor/settings.json`
2. Add the same configuration as VSCode
3. Restart Cursor

#### Kiro
1. Open `.kiro/settings/mcp.json`
2. Add the same configuration
3. Restart Kiro

#### Other IDEs
Add the same configuration to your IDE's MCP settings.

### Step 5: Start Using It!

Now you can ask your AI:
- "Diagnose the #modal element"
- "Why is the .button not showing?"
- "Check if the browser is connected"

Your AI will show you layout issues and how to fix them!

---

## 📋 Verification

After setup, verify everything works:

1. **Extension loaded?**
   - Check `chrome://extensions`
   - You should see Gravity

2. **Extension connected?**
   - Click the extension icon
   - Status should be 🟢 Green

3. **IDE configured?**
   - Check your IDE's MCP settings
   - Configuration should be present

4. **AI responding?**
   - Ask your AI to diagnose an element
   - It should return layout information

---

## 🎯 Example Workflow

### Scenario: Modal Not Showing

1. **Browser**: Open a website with a broken modal
2. **Extension**: Click icon → "Connect to Tab" (🟢 Green)
3. **IDE**: Ask AI: "Diagnose the #modal element"
4. **AI Response**:
   ```
   The #modal element has these issues:
   
   🔴 HIGH: Element extends 50px beyond right edge
   → Add max-width: 100% to CSS
   
   🟡 MEDIUM: No z-index on positioned element
   → Add z-index: 1000
   ```
5. **You**: Update CSS with the suggestions
6. **Browser**: Refresh page
7. **IDE**: Ask AI: "Diagnose the #modal element again"
8. **AI**: "✅ All issues fixed!"

---

## 🐛 Troubleshooting

### Extension Icon Not Showing
- Go to `chrome://extensions`
- Make sure "Developer mode" is enabled
- Try reloading the extension

### Status Not Turning Green
- Make sure you're on a regular website (not chrome://)
- Try a different tab
- Reload the extension

### AI Says "Not Connected"
- Check extension status is 🟢 Green
- Make sure port 9224 isn't blocked
- Restart your IDE

### Element Not Found
- Check the CSS selector is correct
- Make sure the element exists on the page
- Try a simpler selector (e.g., `div` instead of `#modal`)

### Still Having Issues?
- See `SETUP.md` for detailed troubleshooting
- Check browser console (F12) for errors
- Verify extension is loaded in `chrome://extensions`

---

## 📚 Learn More

- **Quick Start**: See `QUICK_START.md`
- **Full Setup**: See `SETUP.md`
- **API Reference**: See `README.md`
- **Technical Details**: See `ARCHITECTURE.md`

---

## ✅ You're Ready!

You now have everything to diagnose layouts in real-time. 

**Next step:** Open a website with a layout issue and ask your AI to diagnose it!

Happy debugging! 🎉

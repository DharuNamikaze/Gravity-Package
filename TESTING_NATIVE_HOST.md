# Testing Native Host Connection

## Quick Test Steps

1. **Reload the extension in Chrome:**
   - Go to `chrome://extensions`
   - Find "Gravity" extension
   - Click the reload icon

2. **Check the native host log file:**
   ```
   type %USERPROFILE%\.gravity-host\native-host.log
   ```

3. **Start the MCP server:**
   ```
   npx gravity-core
   ```

4. **In Chrome, click the Gravity extension icon and click "Connect to Tab"**

5. **Check the logs again:**
   ```
   type %USERPROFILE%\.gravity-host\native-host.log
   ```

## Expected Log Output

When working correctly, you should see:
```
[timestamp] [Native Host] Starting Gravity Native Host...
[timestamp] [Native Host] Node version: v20.x.x
[timestamp] [Native Host] WebSocket server listening on port 9224
[timestamp] [Native Host] Setting up Native Messaging pipeline...
[timestamp] [Native Host] Ready and waiting for messages...
[timestamp] [Native Host] stdin is readable
[timestamp] [Native Host] Extension → MCP: <message type>
```

## Troubleshooting

### If the log file doesn't exist:
- The native host is not being started by Chrome
- Check registry: `reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.gravity"`
- Re-run setup: `npx gravity-core setup-native-host`

### If the log shows "Process exiting with code: 1":
- Check for error messages above the exit line
- Look for "FATAL" or "error" messages

### If the extension shows "Native host has exited":
- Check the log file for the exit reason
- The native host might be crashing due to an error
- Try running the native host manually to see errors:
  ```
  node %USERPROFILE%\.gravity-host\gravity-host.bat
  ```

### If WebSocket connection fails:
- Check if port 9224 is already in use
- Try: `netstat -ano | findstr :9224`
- Kill any process using the port

## Manual Testing

You can test the native host manually:

```powershell
# Start the native host
node %USERPROFILE%\.gravity-host\gravity-host.bat

# In another terminal, test WebSocket connection
node test-connection.js
```

## Chrome Native Messaging Logs

Chrome logs native messaging errors. To enable:

1. Close Chrome completely
2. Start Chrome with logging:
   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --enable-logging --v=1
   ```
3. Check logs at: `%LOCALAPPDATA%\Google\Chrome\User Data\chrome_debug.log`

/**
 * CLI Utilities for Gravity setup and diagnostics
 */

import { existsSync, readFileSync, writeFileSync, cpSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, resolve, win32 } from 'path';
import { homedir, platform } from 'os';
import { execSync, spawnSync } from 'child_process';
import * as readline from 'readline';

/**
 * Prompt user for yes/no confirmation
 */
export async function promptConfirm(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
    });

    rl.question(`${question} (y/n) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Get the Gravity extension directory in user home
 */
export function getGravityExtensionDir(): string {
  return join(homedir(), '.gravity-extension');
}

/**
 * Get the Gravity native host directory in user home
 */
export function getGravityHostDir(): string {
  return join(homedir(), '.gravity-host');
}

/**
 * Get all Chrome profile directories
 */
export function getChromeProfileDirs(): string[] {
  if (platform() !== 'win32') {
    throw new Error('Chrome extension detection only supported on Windows');
  }

  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) {
    throw new Error('LOCALAPPDATA environment variable not found');
  }

  const chromeUserDataDir = join(localAppData, 'Google', 'Chrome', 'User Data');
  const profileDirs: string[] = [];

  // Scan for all profile directories (Default, Profile 1, Profile 2, etc.)
  if (existsSync(chromeUserDataDir)) {
    const items = readdirSync(chromeUserDataDir);
    for (const item of items) {
      const itemPath = join(chromeUserDataDir, item);
      try {
        const stats = statSync(itemPath);
        if (stats.isDirectory() && (item === 'Default' || item.match(/^Profile \d+$/))) {
          profileDirs.push(itemPath);
        }
      } catch (e) {
        // Skip unreadable directories
      }
    }
  }

  return profileDirs;
}

/**
 * Get all Brave profile directories
 */
export function getBraveProfileDirs(): string[] {
  if (platform() !== 'win32') {
    throw new Error('Brave extension detection only supported on Windows');
  }

  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) {
    throw new Error('LOCALAPPDATA environment variable not found');
  }

  const braveUserDataDir = join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data');
  const profileDirs: string[] = [];

  // Scan for all profile directories (Default, Profile 1, Profile 2, etc.)
  if (existsSync(braveUserDataDir)) {
    const items = readdirSync(braveUserDataDir);
    for (const item of items) {
      const itemPath = join(braveUserDataDir, item);
      try {
        const stats = statSync(itemPath);
        if (stats.isDirectory() && (item === 'Default' || item.match(/^Profile \d+$/))) {
          profileDirs.push(itemPath);
        }
      } catch (e) {
        // Skip unreadable directories
      }
    }
  }

  return profileDirs;
}

/**
 * Get Chrome extensions directory (deprecated - use getChromeProfileDirs instead)
 */
export function getChromeExtensionsDir(): string {
  if (platform() !== 'win32') {
    throw new Error('Chrome extension detection only supported on Windows');
  }

  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) {
    throw new Error('LOCALAPPDATA environment variable not found');
  }

  return join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Extensions');
}

/**
 * Get all Chrome profile directories
 */
export function getAllChromeProfileDirs(): string[] {
  if (platform() !== 'win32') {
    return [];
  }

  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) {
    return [];
  }

  const chromeUserDataDir = join(localAppData, 'Google', 'Chrome', 'User Data');
  const profiles: string[] = [];

  if (!existsSync(chromeUserDataDir)) {
    return profiles;
  }

  try {
    const folders = readdirSync(chromeUserDataDir);
    
    for (const folder of folders) {
      // Chrome uses "Default", "Profile 1", "Profile 2", etc.
      if (folder === 'Default' || folder.match(/^Profile \d+$/)) {
        const extensionsDir = join(chromeUserDataDir, folder, 'Extensions');
        if (existsSync(extensionsDir)) {
          profiles.push(extensionsDir);
        }
      }
    }
  } catch (e) {
    // Ignore errors
  }

  return profiles;
}

/**
 * Get all Brave profile directories
 */
export function getAllBraveProfileDirs(): string[] {
  if (platform() !== 'win32') {
    return [];
  }

  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) {
    return [];
  }

  const braveUserDataDir = join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data');
  const profiles: string[] = [];

  if (!existsSync(braveUserDataDir)) {
    return profiles;
  }

  try {
    const folders = readdirSync(braveUserDataDir);
    
    for (const folder of folders) {
      // Brave uses "Default", "Profile 1", "Profile 2", etc.
      if (folder === 'Default' || folder.match(/^Profile \d+$/)) {
        const extensionsDir = join(braveUserDataDir, folder, 'Extensions');
        if (existsSync(extensionsDir)) {
          profiles.push(extensionsDir);
        }
      }
    }
  } catch (e) {
    // Ignore errors
  }

  return profiles;
}

/**
 * Detect Gravity extension ID by scanning Chrome and Brave extensions directories
 * Scans all profiles to find the extension
 */
export function detectGravityExtensionId(): string | null {
  try {
    // Try Chrome first
    console.error(`🔍 Scanning Chrome profiles for Gravity extension...`);
    const chromeProfileDirs = getChromeProfileDirs();
    console.error(`   Found ${chromeProfileDirs.length} Chrome profile(s)`);

    for (const profileDir of chromeProfileDirs) {
      const extensionsDir = join(profileDir, 'Extensions');
      console.error(`   📁 Checking: ${profileDir}`);

      if (!existsSync(extensionsDir)) {
        console.error(`      ⏭️  Extensions directory not found`);
        continue;
      }

      const result = scanExtensionsDir(extensionsDir);
      if (result) {
        console.error(`   ✅ Found in Chrome profile!`);
        return result;
      }
    }

    // Try Brave
    console.error(`🔍 Scanning Brave profiles for Gravity extension...`);
    const braveProfileDirs = getBraveProfileDirs();
    console.error(`   Found ${braveProfileDirs.length} Brave profile(s)`);

    for (const profileDir of braveProfileDirs) {
      const extensionsDir = join(profileDir, 'Extensions');
      console.error(`   � Checking: ${profileDir}`);

      if (!existsSync(extensionsDir)) {
        console.error(`      ⏭️  Extensions directory not found`);
        continue;
      }

      const result = scanExtensionsDir(extensionsDir);
      if (result) {
        console.error(`   ✅ Found in Brave profile!`);
        return result;
      }
    }

    console.error(`❌ Gravity extension not found in any Chrome or Brave profile`);
    return null;
  } catch (error: any) {
    console.error(`❌ Error scanning extensions: ${error.message}`);
    return null;
  }
}

/**
 * Scan a single extensions directory for Gravity extension
 */
function scanExtensionsDir(extensionsDir: string): string | null {
  try {
    const extensionFolders = readdirSync(extensionsDir);
    console.error(`      📦 Found ${extensionFolders.length} extension(s)`);
    console.error(`      [DEBUG] Extension IDs: ${extensionFolders.join(', ')}`);

    for (const folder of extensionFolders) {
      const folderPath = join(extensionsDir, folder);
      console.error(`         [DEBUG] Checking ID: ${folder}`);

      try {
        const stats = statSync(folderPath);
        if (!stats.isDirectory()) {
          console.error(`         [DEBUG] Not a directory`);
          continue;
        }

        // Look for manifest.json in the latest version folder
        const versionFolders = readdirSync(folderPath);
        console.error(`         [DEBUG] Versions: ${versionFolders.join(', ')}`);

        if (versionFolders.length === 0) {
          console.error(`         [DEBUG] No versions found`);
          continue;
        }

        // Sort version folders to get the latest one
        const sortedVersions = versionFolders.sort().reverse();
        const latestVersion = sortedVersions[0];
        console.error(`         [DEBUG] Latest: ${latestVersion}`);

        const manifestPath = join(folderPath, latestVersion, 'manifest.json');
        console.error(`         [DEBUG] Manifest: ${manifestPath}`);

        if (existsSync(manifestPath)) {
          try {
            const manifestContent = readFileSync(manifestPath, 'utf-8');
            const manifest = JSON.parse(manifestContent);
            const name = manifest.name || '(no name)';
            console.error(`         - ${name}`);
            console.error(`         [DEBUG] name="${manifest.name}" type=${typeof manifest.name}`);

            // Check for exact match
            if (manifest.name === 'Gravity') {
              console.error(`         ✅ FOUND! ID: ${folder}`);
              return folder;
            }

            // Fallback: check if description or other fields indicate Gravity
            if (manifest.description && manifest.description.includes('Gravity')) {
              console.error(`         ✅ FOUND by description! ID: ${folder}`);
              return folder;
            }

            // Fallback: check for background.js (Gravity-specific)
            if (manifest.background && manifest.background.service_worker === 'background.js') {
              console.error(`         [DEBUG] Has background.js service worker - could be Gravity`);
              // Check if it has debugger permission (Gravity-specific)
              if (manifest.permissions && manifest.permissions.includes('debugger')) {
                console.error(`         ✅ FOUND by debugger permission! ID: ${folder}`);
                return folder;
              }
            }
          } catch (e: any) {
            console.error(`         [DEBUG] Parse error: ${e.message}`);
            continue;
          }
        } else {
          console.error(`         [DEBUG] Manifest not found`);
        }
      } catch (e: any) {
        console.error(`         [DEBUG] Folder error: ${e.message}`);
        continue;
      }
    }

    return null;
  } catch (error: any) {
    console.error(`      [DEBUG] Scan error: ${error.message}`);
    return null;
  }
}

/**
 * Patch manifest.json with extension ID and path
 * Also patches the batch file with the correct path to native-host.js
 */
export function patchManifest(manifestPath: string, extensionId: string, hostPath: string): void {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

  manifest.allowed_origins = [`chrome-extension://${extensionId}/`];
  manifest.path = hostPath;

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // Patch the batch file with the correct path to native-host.js
  // The native-host.js is in the globally installed package
  const batPath = hostPath;
  if (existsSync(batPath) && batPath.endsWith('.bat')) {
    try {
      // Find the globally installed gravity-core package
      const npmRoot = execSync('npm root -g', { encoding: 'utf-8' }).trim();
      const nativeHostPath = join(npmRoot, 'gravity-core', 'dist', 'native-host.js');
      
      // Create the batch file content with absolute path
      const batContent = `@echo off
REM Gravity Native Host
REM This script bridges WebSocket (MCP server) and Native Messaging (Chrome extension)

REM Start the native host bridge with absolute path
node "${nativeHostPath}"
`;
      
      writeFileSync(batPath, batContent);
    } catch (error: any) {
      console.error('⚠️  Warning: Could not patch batch file:', error.message);
    }
  }
}

/**
 * Write Windows registry key for native messaging host
 */
export function writeRegistryKey(hostName: string, manifestPath: string): void {
  if (platform() !== 'win32') {
    throw new Error('Registry operations only supported on Windows');
  }

  const regPath = `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${hostName}`;
  const escapedPath = manifestPath.replace(/\\/g, '\\\\');

  try {
    execSync(`reg add "${regPath}" /ve /d "${escapedPath}" /f`, {
      stdio: 'pipe',
    });
  } catch (error: any) {
    throw new Error(`Failed to write registry key: ${error.message}`);
  }
}

/**
 * Check if registry key exists
 */
export function registryKeyExists(hostName: string): boolean {
  if (platform() !== 'win32') {
    return false;
  }

  const regPath = `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${hostName}`;

  try {
    execSync(`reg query "${regPath}"`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get registry key value
 */
export function getRegistryKeyValue(hostName: string): string | null {
  if (platform() !== 'win32') {
    return null;
  }

  const regPath = `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${hostName}`;

  try {
    const output = execSync(`reg query "${regPath}" /ve`, { encoding: 'utf-8' });
    const match = output.match(/REG_SZ\s+(.+)/);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

/**
 * Check if Chrome is running
 */
export function isChromeRunning(): boolean {
  if (platform() !== 'win32') {
    return false;
  }

  try {
    execSync('tasklist | find /i "chrome.exe"', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Prompt user to restart Chrome
 */
export async function promptRestartChrome(): Promise<void> {
  if (!isChromeRunning()) {
    return;
  }

  const shouldRestart = await promptConfirm(
    '\n⚠️  Chrome is currently running. Restart Chrome for changes to take effect?'
  );

  if (shouldRestart) {
    try {
      execSync('taskkill /IM chrome.exe /F', { stdio: 'pipe' });
      console.error('✅ Chrome closed. Please restart it manually.');
    } catch {
      console.error('⚠️  Could not close Chrome automatically. Please restart it manually.');
    }
  }
}

/**
 * Validate manifest file
 */
export function validateManifest(manifestPath: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!existsSync(manifestPath)) {
    return { valid: false, errors: ['Manifest file not found'] };
  }

  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

    if (!manifest.name) {
      errors.push('Missing "name" field');
    }

    if (!manifest.path) {
      errors.push('Missing "path" field');
    }

    if (!manifest.allowed_origins || !Array.isArray(manifest.allowed_origins)) {
      errors.push('Missing or invalid "allowed_origins" field');
    }

    return { valid: errors.length === 0, errors };
  } catch (error: any) {
    return { valid: false, errors: [`Invalid JSON: ${error.message}`] };
  }
}

/**
 * Check if native host executable exists
 */
export function nativeHostExists(hostPath: string): boolean {
  return existsSync(hostPath);
}

/**
 * Test WebSocket connection to extension
 */
export async function testWebSocketConnection(port: number = 9224): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(false);
    }, 3000);

    try {
      // Dynamic import for ws module
      import('ws').then((wsModule) => {
        const WebSocket = wsModule.default;
        const socket = new WebSocket(`ws://localhost:${port}`);

        socket.on('open', () => {
          clearTimeout(timeout);
          socket.close();
          resolve(true);
        });

        socket.on('error', () => {
          clearTimeout(timeout);
          resolve(false);
        });
      }).catch(() => {
        clearTimeout(timeout);
        resolve(false);
      });
    } catch {
      clearTimeout(timeout);
      resolve(false);
    }
  });
}

/**
 * Prompt user for extension ID (for unpacked extensions)
 */
export async function promptForExtensionId(): Promise<string | null> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
    });

    rl.question(`\nEnter the extension ID from chrome://extensions: `, (answer) => {
      rl.close();
      const id = answer.trim();
      if (id.length === 32) {
        resolve(id);
      } else {
        console.error(`❌ Invalid extension ID. Must be 32 characters.`);
        resolve(null);
      }
    });
  });
}

/**
 * Query extension for its ID using chrome.runtime.sendMessage
 * This is the most reliable way to get the extension ID for unpacked extensions
 */
export async function queryExtensionForId(port: number = 9224): Promise<string | null> {
  try {
    console.error(`\n[DEBUG STEP 1] Attempting to query extension for its ID via DevTools...`);
    console.error(`[DEBUG STEP 1.1] Target port: ${port}`);
    console.error(`[DEBUG STEP 1.2] WebSocket URL: ws://localhost:${port}`);
    
    // Try to connect to the DevTools Protocol on the default port
    const { WebSocket } = await import('ws');
    console.error(`[DEBUG STEP 1.3] WebSocket module imported successfully`);
    
    return new Promise((resolve) => {
      console.error(`[DEBUG STEP 2] Creating promise for DevTools connection...`);
      
      const timeout = setTimeout(() => {
        console.error(`[DEBUG STEP 5] TIMEOUT: DevTools connection did not respond within 5 seconds`);
        console.error(`[DEBUG STEP 5.1] This means the MCP server is not running on port ${port}`);
        console.error(`[DEBUG STEP 5.2] Falling back to filesystem scan...`);
        resolve(null);
      }, 5000);

      try {
        console.error(`[DEBUG STEP 3] Creating WebSocket connection...`);
        const ws = new WebSocket(`ws://localhost:${port}`);
        console.error(`[DEBUG STEP 3.1] WebSocket object created`);

        ws.on('open', () => {
          console.error(`[DEBUG STEP 4] SUCCESS: Connected to DevTools Protocol on port ${port}`);
          console.error(`[DEBUG STEP 4.1] Sending extension ID query message...`);
          
          // Send a message to query the extension ID
          // This uses the Runtime.evaluate command to execute JavaScript in the extension context
          const message = {
            id: 1,
            method: 'Runtime.evaluate',
            params: {
              expression: `chrome.runtime.sendMessage(chrome.runtime.id, {action: 'GET_EXTENSION_ID'}, (response) => { console.log('EXT_ID:' + response.extensionId); })`
            }
          };

          console.error(`[DEBUG STEP 4.2] Message to send:`, JSON.stringify(message));
          ws.send(JSON.stringify(message));
          console.error(`[DEBUG STEP 4.3] Message sent successfully`);
        });

        ws.on('message', (data: string) => {
          console.error(`[DEBUG STEP 6] Received message from DevTools:`, data.substring(0, 100));
          try {
            const response = JSON.parse(data);
            console.error(`[DEBUG STEP 6.1] Parsed response:`, JSON.stringify(response).substring(0, 200));
            
            // Look for the extension ID in the response
            if (response.result && response.result.value) {
              const value = response.result.value;
              console.error(`[DEBUG STEP 6.2] Found result.value:`, value);
              
              if (typeof value === 'string' && value.includes('EXT_ID:')) {
                const extId = value.split('EXT_ID:')[1];
                console.error(`[DEBUG STEP 6.3] Extracted extension ID:`, extId);
                
                if (extId && extId.length === 32) {
                  console.error(`[DEBUG STEP 6.4] Extension ID is valid (32 chars)`);
                  clearTimeout(timeout);
                  ws.close();
                  console.error(`[DEBUG STEP 7] SUCCESS: Got extension ID from DevTools: ${extId}`);
                  resolve(extId);
                  return;
                } else {
                  console.error(`[DEBUG STEP 6.4] Extension ID invalid length: ${extId?.length}`);
                }
              } else {
                console.error(`[DEBUG STEP 6.2] Value does not contain EXT_ID marker`);
              }
            } else {
              console.error(`[DEBUG STEP 6.1] No result.value in response`);
            }
          } catch (e: any) {
            console.error(`[DEBUG STEP 6] Failed to parse message:`, e.message);
          }
        });

        ws.on('error', (error: any) => {
          console.error(`[DEBUG STEP 5] ERROR: DevTools connection failed`);
          console.error(`[DEBUG STEP 5.1] Error type:`, error.code || error.message);
          console.error(`[DEBUG STEP 5.2] This typically means:`);
          console.error(`[DEBUG STEP 5.2.1] - MCP server is not running (npx gravity-core)`);
          console.error(`[DEBUG STEP 5.2.2] - Port ${port} is blocked or in use`);
          console.error(`[DEBUG STEP 5.2.3] - Extension is not loaded in Chrome`);
          clearTimeout(timeout);
          resolve(null);
        });

        ws.on('close', () => {
          console.error(`[DEBUG STEP 8] WebSocket connection closed`);
          clearTimeout(timeout);
          resolve(null);
        });
      } catch (error: any) {
        console.error(`[DEBUG STEP 3] EXCEPTION: Failed to create WebSocket`);
        console.error(`[DEBUG STEP 3.1] Error:`, error.message);
        clearTimeout(timeout);
        resolve(null);
      }
    });
  } catch (error: any) {
    console.error(`[DEBUG STEP 1] EXCEPTION: Error in queryExtensionForId`);
    console.error(`[DEBUG STEP 1.1] Error:`, error.message);
    return null;
  }
}

/**
 * Start HTTP registration server to receive extension ID from the extension
 * Returns a promise that resolves with the extension ID when received
 */
export async function startRegistrationServer(timeoutMs: number = 60000): Promise<{ extensionId: string; browser: string } | null> {
  const http = await import('http');
  
  // Try multiple ports in case one is in use
  const ports = [39224, 39225, 39226, 39227, 39228];
  let server: any = null;
  let selectedPort: number = 0;
  
  return new Promise((resolve) => {
    let resolved = false;
    let timeoutHandle: NodeJS.Timeout;
    let wakeupInterval: NodeJS.Timeout;
    
    const cleanup = () => {
      if (server) {
        server.close();
        server = null;
      }
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      if (wakeupInterval) {
        clearInterval(wakeupInterval);
      }
    };
    
    const resolveOnce = (value: { extensionId: string; browser: string } | null) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(value);
      }
    };
    
    // Set timeout
    timeoutHandle = setTimeout(() => {
      console.error('⏱️  Registration timeout - no extension registered within', timeoutMs / 1000, 'seconds');
      resolveOnce(null);
    }, timeoutMs);
    
    // Try to start server on available port
    const tryPort = (portIndex: number) => {
      if (portIndex >= ports.length) {
        console.error('❌ Could not start registration server on any port');
        resolveOnce(null);
        return;
      }
      
      const port = ports[portIndex];
      
      server = http.createServer((req, res) => {
        // Enable CORS for localhost
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // Handle preflight
        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }
        
        // Handle ping requests (to wake up service worker)
        if (req.method === 'GET' && req.url === '/ping') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ready', message: 'Registration server is ready' }));
          return;
        }
        
        // Only accept POST to /register
        if (req.method === 'POST' && req.url === '/register') {
          let body = '';
          
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              
              if (!data.extensionId || !data.browser) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Missing extensionId or browser' }));
                return;
              }
              
              console.error('✅ Extension registered:', data.extensionId, `(${data.browser})`);
              
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Registration successful' }));
              
              // Resolve with the extension ID
              resolveOnce({ extensionId: data.extensionId, browser: data.browser });
              
            } catch (error: any) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
            }
          });
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      });
      
      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`Port ${port} in use, trying next port...`);
          tryPort(portIndex + 1);
        } else {
          console.error('Server error:', err);
          resolveOnce(null);
        }
      });
      
      server.listen(port, '127.0.0.1', () => {
        selectedPort = port;
        console.error(`\n🌐 Registration server listening on http://127.0.0.1:${port}`);
        console.error('📋 Waiting for extension to register automatically...');
        console.error('');
        console.error('   The extension will register itself within 60 seconds.');
        console.error('   If the extension is already loaded, it should register immediately.');
        console.error('   If not loaded yet, load it now and it will auto-register.');
        console.error('');
        
        // Periodically ping the server to wake up any sleeping service workers
        // This helps trigger the immediate registration in background.js
        wakeupInterval = setInterval(() => {
          // The ping endpoint is just to keep the server active
          // The extension will detect the server via its own fetch attempts
        }, 5000);
      });
    };
    
    tryPort(0);
  });
}

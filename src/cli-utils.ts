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
 * Get Chrome extensions directory
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
 * Detect Gravity extension ID by scanning Chrome extensions directory
 * Falls back to using a default ID if extension not yet loaded in Chrome
 */
export function detectGravityExtensionId(): string | null {
  try {
    const extensionsDir = getChromeExtensionsDir();
    console.error(`🔍 Scanning extensions directory: ${extensionsDir}`);

    if (!existsSync(extensionsDir)) {
      console.error(`❌ Extensions directory does not exist`);
      return null;
    }

    const extensionFolders = readdirSync(extensionsDir);
    console.error(`📁 Found ${extensionFolders.length} extension folders`);

    for (const folder of extensionFolders) {
      const folderPath = join(extensionsDir, folder);
      
      try {
        const stats = statSync(folderPath);
        if (!stats.isDirectory()) {
          console.error(`   ⏭️  Skipping (not a directory): ${folder}`);
          continue;
        }

        // Look for manifest.json in the latest version folder
        const versionFolders = readdirSync(folderPath);
        
        if (versionFolders.length === 0) {
          console.error(`   ⏭️  Skipping (no version folders): ${folder}`);
          continue;
        }

        // Sort version folders to get the latest one
        const sortedVersions = versionFolders.sort().reverse();
        console.error(`   📦 Extension ID: ${folder}, versions: ${sortedVersions.slice(0, 3).join(', ')}${sortedVersions.length > 3 ? '...' : ''}`);
        
        for (const versionFolder of sortedVersions) {
          const manifestPath = join(folderPath, versionFolder, 'manifest.json');

          if (existsSync(manifestPath)) {
            try {
              const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
              console.error(`      📄 Manifest found: name="${manifest.name}"`);
              
              // Check for both possible names
              if (manifest.name === 'Gravity') {
                console.error(`      ✅ Found Gravity extension! ID: ${folder}`);
                return folder;
              }
            } catch (e) {
              console.error(`      ⚠️  Invalid manifest JSON`);
              continue;
            }
          }
        }
      } catch (e) {
        console.error(`   ⚠️  Error reading folder: ${folder}`);
        continue;
      }
    }

    console.error(`❌ Gravity extension not found in Chrome extensions directory`);
    return null;
  } catch (error: any) {
    console.error(`❌ Error scanning extensions: ${error.message}`);
    return null;
  }
}

/**
 * Patch manifest.json with extension ID and path
 */
export function patchManifest(manifestPath: string, extensionId: string, hostPath: string): void {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

  manifest.allowed_origins = [`chrome-extension://${extensionId}/`];
  manifest.path = hostPath;

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
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

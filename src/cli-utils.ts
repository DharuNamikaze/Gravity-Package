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

    for (const folder of extensionFolders) {
      const folderPath = join(extensionsDir, folder);

      try {
        const stats = statSync(folderPath);
        if (!stats.isDirectory()) {
          continue;
        }

        // Look for manifest.json in the latest version folder
        const versionFolders = readdirSync(folderPath);

        if (versionFolders.length === 0) {
          continue;
        }

        // Sort version folders to get the latest one
        const sortedVersions = versionFolders.sort().reverse();

        for (const versionFolder of sortedVersions) {
          const manifestPath = join(folderPath, versionFolder, 'manifest.json');

          if (existsSync(manifestPath)) {
            try {
              const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
              console.error(`         - ${manifest.name || '(no name)'}`);

              if (manifest.name === 'Gravity') {
                console.error(`         ✅ Found Gravity! ID: ${folder}`);
                return folder;
              }
            } catch (e) {
              // Skip invalid manifests
              continue;
            }
          }
        }
      } catch (e) {
        // Skip folders that can't be read
        continue;
      }
    }

    return null;
  } catch (error) {
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

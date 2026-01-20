#!/usr/bin/env node

/**
 * Gravity CLI
 * 
 * Commands:
 * - npx gravity-core setup-extension    Extract and setup Chrome extension
 * - npx gravity-core setup-native-host  Setup native messaging host
 * - npx gravity-core test-connection    Test connection to extension
 * - npx gravity-core                    Start MCP server
 * - npx gravity-core --help             Show help
 */

import { Gravity } from './index.js';
import {
  getGravityExtensionDir,
  getGravityHostDir,
  detectGravityExtensionId,
  queryExtensionForId,
  promptForExtensionId,
  patchManifest,
  writeRegistryKey,
  registryKeyExists,
  getRegistryKeyValue,
  promptConfirm,
  promptRestartChrome,
  validateManifest,
  nativeHostExists,
  testWebSocketConnection,
  startRegistrationServer,
} from './cli-utils.js';
import { existsSync, cpSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { platform } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Route to appropriate handler
if (command === 'setup-extension') {
  handleSetupExtension();
} else if (command === 'setup-native-host') {
  handleSetupNativeHost();
} else if (command === 'test-connection') {
  handleTestConnection();
} else if (command === '--help' || command === '-h' || command === 'help') {
  showHelp();
} else if (!command) {
  runMCPServer();
} else {
  console.error(`❌ Unknown command: ${command}`);
  console.error('Run "npx gravity-core --help" for usage information');
  process.exit(1);
}

/**
 * Show help message
 */
function showHelp() {
  console.error(`
🌌 Gravity - AI-powered CSS layout diagnostics

Usage:
  npx gravity-core                      Start the MCP server
  npx gravity-core setup-extension      Extract Chrome extension to ~/.gravity-extension
  npx gravity-core setup-native-host    Setup native messaging host for Chrome
  npx gravity-core test-connection      Test connection to extension
  npx gravity-core --help               Show this help message

Setup Instructions:
  1. Run: npx gravity-core setup-extension
  2. Run: npx gravity-core setup-native-host
  3. Open Chrome and go to: chrome://extensions
  4. Enable "Developer mode" (toggle in top right)
  5. Click "Load unpacked"
  6. Select the ~/.gravity-extension folder
  7. Run: npx gravity-core test-connection
  8. Configure your IDE with the MCP server

Environment Variables:
  GRAVITY_PORT     WebSocket port (default: 9224)
  GRAVITY_TIMEOUT  Connection timeout in ms (default: 10000)

For more information, visit: https://github.com/DharuNamikaze/Gravity-Package
`);
  process.exit(0);
}

/**
 * Handle setup-extension command
 */
async function handleSetupExtension() {
  console.error('🌌 Gravity Extension Setup\n');

  // Find the extension folder in the package
  const packageExtensionPath = join(__dirname, '..', 'extension');

  if (!existsSync(packageExtensionPath)) {
    console.error('❌ Extension files not found in package.');
    console.error('   This might be a development issue. Please report at:');
    console.error('   https://github.com/DharuNamikaze/Gravity-Package/issues');
    process.exit(1);
  }

  // Target directory in user's home
  const targetDir = getGravityExtensionDir();

  if (existsSync(targetDir)) {
    console.error(`📁 Extension folder already exists at: ${targetDir}`);
    const overwrite = await promptConfirm('   Overwrite existing extension?');

    if (!overwrite) {
      console.error('   Skipped.');
      process.exit(0);
    }

    // Remove existing folder
    const { rmSync } = await import('fs');
    rmSync(targetDir, { recursive: true, force: true });
  }

  try {
    // Copy extension folder
    cpSync(packageExtensionPath, targetDir, { recursive: true });
    console.error(`✅ Extension extracted to: ${targetDir}\n`);
  } catch (error: any) {
    console.error('❌ Failed to extract extension:', error.message);
    process.exit(1);
  }

  // Show next steps
  console.error('📋 Next Steps:');
  console.error('');
  console.error('   1. Run: npx gravity-core setup-native-host');
  console.error('   2. Open Chrome and go to: chrome://extensions');
  console.error('   3. Enable "Developer mode" (toggle in top right)');
  console.error('   4. Click "Load unpacked"');
  console.error(`   5. Select this folder: ${targetDir}`);
  console.error('   6. Run: npx gravity-core test-connection');
  console.error('');
  console.error('🎉 Then configure your IDE with the MCP server!');
}

/**
 * Handle setup-native-host command
 */
async function handleSetupNativeHost() {
  console.error('🌌 Gravity Native Host Setup\n');

  if (platform() !== 'win32') {
    console.error('❌ Native host setup is currently only supported on Windows.');
    console.error('   macOS and Linux support coming soon.');
    process.exit(1);
  }

  // Step 1: Try to auto-detect extension ID via registration server
  console.error('🔍 Detecting Gravity extension ID...\n');
  
  console.error('   Starting registration server...');
  console.error('   The extension will automatically register when loaded.\n');
  
  const registrationResult = await startRegistrationServer(60000);
  
  let extensionId: string | null = null;
  let browser: string = 'chrome';
  
  if (registrationResult) {
    extensionId = registrationResult.extensionId;
    browser = registrationResult.browser;
    console.error(`\n✅ Extension registered successfully!`);
    console.error(`   Extension ID: ${extensionId}`);
    console.error(`   Browser: ${browser}\n`);
  } else {
    console.error('\n⏭️  Auto-registration timed out, trying filesystem scan...');
    
    // Fallback: scan installed extensions
    extensionId = detectGravityExtensionId();
    
    if (extensionId) {
      console.error(`   ✅ Found extension ID via filesystem: ${extensionId}\n`);
    } else {
      console.error('\n⚠️  Could not auto-detect extension ID.');
      console.error('This is normal for unpacked (dev mode) extensions.\n');
      
      const useManual = await promptConfirm('Do you want to enter the extension ID manually?');
      
      if (useManual) {
        console.error('\n📋 To find your extension ID:');
        console.error('   1. Open Chrome and go to: chrome://extensions');
        console.error('   2. Find "Gravity" in the list');
        console.error('   3. Copy the ID shown below the extension name');
        console.error('   4. Paste it below\n');
        
        extensionId = await promptForExtensionId();
        
        if (!extensionId) {
          console.error('❌ Invalid extension ID provided.');
          process.exit(1);
        }
        
        console.error(`✅ Using extension ID: ${extensionId}\n`);
      } else {
        console.error('❌ Extension ID required to continue.');
        console.error('');
        console.error('Make sure you have:');
        console.error('1. Run: npx gravity-core setup-extension');
        console.error('2. Opened Chrome and gone to: chrome://extensions');
        console.error('3. Enabled "Developer mode" (toggle in top right)');
        console.error('4. Clicked "Load unpacked"');
        console.error('5. Selected the ~/.gravity-extension folder');
        console.error('');
        console.error('The extension will automatically register when loaded.');
        console.error('Then run this command again.');
        process.exit(1);
      }
    }
  }

  // Step 2: Confirm registry modification
  const confirmed = await promptConfirm(
    '⚠️  Gravity needs to add a native-messaging registry entry. Proceed?'
  );

  if (!confirmed) {
    console.error('   Cancelled.');
    process.exit(0);
  }

  console.error('');

  // Step 3: Copy native host files
  console.error('📋 Setting up native host...');
  const packageHostPath = join(__dirname, '..', 'native-host');
  const targetHostDir = getGravityHostDir();

  if (!existsSync(packageHostPath)) {
    console.error('❌ Native host files not found in package.');
    process.exit(1);
  }

  if (existsSync(targetHostDir)) {
    const { rmSync } = await import('fs');
    rmSync(targetHostDir, { recursive: true, force: true });
  }

  try {
    cpSync(packageHostPath, targetHostDir, { recursive: true });
    console.error(`✅ Native host copied to: ${targetHostDir}`);
  } catch (error: any) {
    console.error('❌ Failed to copy native host:', error.message);
    process.exit(1);
  }

  // Step 4: Patch manifest with extension ID and path
  const manifestPath = join(targetHostDir, 'manifest.json');
  const hostBatPath = join(targetHostDir, 'gravity-host.bat');

  try {
    patchManifest(manifestPath, extensionId, hostBatPath);
    console.error('✅ Manifest patched with extension ID and path');
  } catch (error: any) {
    console.error('❌ Failed to patch manifest:', error.message);
    process.exit(1);
  }

  // Step 5: Write registry key
  console.error('📝 Writing registry key...');
  try {
    writeRegistryKey('com.gravity', manifestPath);
    console.error('✅ Registry key written successfully');
  } catch (error: any) {
    console.error('❌ Failed to write registry key:', error.message);
    console.error('   You may need to run as Administrator.');
    process.exit(1);
  }

  console.error('');
  console.error('✅ Native host setup complete!\n');

  // Step 6: Prompt to restart Chrome
  await promptRestartChrome();

  console.error('');
  console.error('📋 Next Steps:');
  console.error('   1. Open Chrome and go to: chrome://extensions');
  console.error('   2. Enable "Developer mode" (toggle in top right)');
  console.error('   3. Click "Load unpacked"');
  console.error(`   4. Select this folder: ${getGravityExtensionDir()}`);
  console.error('   5. Run: npx gravity-core test-connection');
}

/**
 * Handle test-connection command
 */
async function handleTestConnection() {
  console.error('🌌 Gravity Connection Test\n');

  const checks: { name: string; passed: boolean; error?: string }[] = [];

  // Check 1: Registry key exists
  console.error('🔍 Checking registry key...');
  const regKeyExists = registryKeyExists('com.gravity');
  checks.push({ name: 'Registry key exists', passed: regKeyExists });

  if (regKeyExists) {
    console.error('   ✅ Registry key found');
  } else {
    console.error('   ❌ Registry key not found');
    console.error('      Run: npx gravity-core setup-native-host');
  }

  // Check 2: Manifest file exists
  console.error('🔍 Checking manifest file...');
  const manifestPath = join(getGravityHostDir(), 'manifest.json');
  const manifestExists = existsSync(manifestPath);
  checks.push({ name: 'Manifest file exists', passed: manifestExists });

  if (manifestExists) {
    console.error('   ✅ Manifest file found');
  } else {
    console.error('   ❌ Manifest file not found');
  }

  // Check 3: Validate manifest
  if (manifestExists) {
    console.error('🔍 Validating manifest...');
    const validation = validateManifest(manifestPath);
    checks.push({ name: 'Manifest valid', passed: validation.valid });

    if (validation.valid) {
      console.error('   ✅ Manifest is valid');

      // Check extension ID in manifest
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      if (manifest.allowed_origins && manifest.allowed_origins.length > 0) {
        console.error(`   ✅ Extension ID configured: ${manifest.allowed_origins[0]}`);
      }
    } else {
      console.error('   ❌ Manifest validation failed:');
      validation.errors.forEach((err) => console.error(`      - ${err}`));
    }
  }

  // Check 4: Native host executable exists
  console.error('🔍 Checking native host executable...');
  const hostPath = join(getGravityHostDir(), 'gravity-host.bat');
  const hostExists = nativeHostExists(hostPath);
  checks.push({ name: 'Native host executable found', passed: hostExists });

  if (hostExists) {
    console.error('   ✅ Native host executable found');
  } else {
    console.error('   ❌ Native host executable not found');
  }

  // Check 5: WebSocket connection (optional - only works if MCP server is running)
  console.error('🔍 Testing WebSocket connection...');
  console.error('   (This test requires the MCP server to be running)');
  const wsConnected = await testWebSocketConnection(9224);
  
  // Don't fail the overall test if WebSocket fails - it's expected if MCP server isn't running
  if (wsConnected) {
    console.error('   ✅ WebSocket connection successful');
    checks.push({ name: 'WebSocket connection', passed: true });
  } else {
    console.error('   ⚠️  WebSocket connection not available');
    console.error('      This is normal if the MCP server is not running.');
    console.error('      The MCP server starts automatically when you use Gravity in your IDE.');
    // Don't add to checks array - this is optional
  }

  // Summary
  console.error('\n📊 Connection Status:\n');
  checks.forEach((check) => {
    const icon = check.passed ? '✅' : '❌';
    console.error(`   ${icon} ${check.name}`);
  });

  const allPassed = checks.every((c) => c.passed);

  console.error('');
  if (allPassed) {
    console.error('🎉 Gravity is ready! All checks passed.\n');
    console.error('   Next steps:');
    console.error('   1. Configure your IDE (see MCP_CONFIGURATION.md)');
    console.error('   2. Open Chrome and click the Gravity extension icon');
    console.error('   3. Click "Connect to Tab" on the page you want to debug');
    console.error('   4. In your IDE, use Gravity tools to diagnose layout issues');
    process.exit(0);
  } else {
    console.error('⚠️  Some checks failed. Please review the errors above.\n');
    process.exit(1);
  }
}

/**
 * Run the MCP server
 * Delegates to mcp-server.ts for strict JSON-RPC protocol compliance
 */
async function runMCPServer() {
  // Import the dedicated MCP server module
  const { spawn } = await import('child_process');

  // Run mcp-server.js directly as a subprocess
  // This ensures strict JSON-RPC protocol compliance with no CLI output
  const mcpServerPath = join(__dirname, 'mcp-server.js');
  const mcpServer = spawn('node', [mcpServerPath], {
    stdio: ['inherit', 'inherit', 'inherit'],
    env: process.env,
  });

  mcpServer.on('exit', (code: number | null) => {
    process.exit(code || 0);
  });

  mcpServer.on('error', (error: Error) => {
    console.error('Failed to start MCP server:', error.message);
    process.exit(1);
  });
}

#!/usr/bin/env node

/**
 * Gravity CLI
 * 
 * Commands:
 * - gravity setup-extension    Extract and setup Chrome extension
 * - gravity setup-native-host  Setup native messaging host
 * - gravity test-connection    Test connection to extension
 * - gravity                    Start MCP server
 * - gravity --help             Show help
 */

import { Gravity } from './index.js';
import {
  getGravityExtensionDir,
  getGravityHostDir,
  detectGravityExtensionId,
  patchManifest,
  writeRegistryKey,
  registryKeyExists,
  getRegistryKeyValue,
  promptConfirm,
  promptRestartChrome,
  validateManifest,
  nativeHostExists,
  testWebSocketConnection,
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
  console.error('Run "gravity --help" for usage information');
  process.exit(1);
}

/**
 * Show help message
 */
function showHelp() {
  console.error(`
🌌 Gravity - AI-powered CSS layout diagnostics

Usage:
  gravity                      Start the MCP server
  gravity setup-extension      Extract Chrome extension to ~/.gravity-extension
  gravity setup-native-host    Setup native messaging host for Chrome
  gravity test-connection      Test connection to extension
  gravity --help               Show this help message

Setup Instructions:
  1. Run: gravity setup-extension
  2. Run: gravity setup-native-host
  3. Open Chrome and go to: chrome://extensions
  4. Enable "Developer mode" (toggle in top right)
  5. Click "Load unpacked"
  6. Select the ~/.gravity-extension folder
  7. Run: gravity test-connection
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
    require('fs').rmSync(targetDir, { recursive: true, force: true });
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
  console.error('   1. Run: gravity setup-native-host');
  console.error('   2. Open Chrome and go to: chrome://extensions');
  console.error('   3. Enable "Developer mode" (toggle in top right)');
  console.error('   4. Click "Load unpacked"');
  console.error(`   5. Select this folder: ${targetDir}`);
  console.error('   6. Run: gravity test-connection');
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

  // Step 1: Detect extension ID
  console.error('🔍 Detecting Gravity extension ID...');
  const extensionId = detectGravityExtensionId();

  if (!extensionId) {
    console.error('❌ Could not find Gravity extension.');
    console.error('   Please run: gravity setup-extension');
    console.error('   Then load the extension in Chrome first.');
    process.exit(1);
  }

  console.error(`✅ Found extension ID: ${extensionId}\n`);

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
    require('fs').rmSync(targetHostDir, { recursive: true, force: true });
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
  const hostBatPath = join(targetHostDir, 'devtools-bridge-host.bat');

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
    writeRegistryKey('com.devtools.bridge', manifestPath);
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
  console.error('   5. Run: gravity test-connection');
}

/**
 * Handle test-connection command
 */
async function handleTestConnection() {
  console.error('🌌 Gravity Connection Test\n');

  const checks: { name: string; passed: boolean; error?: string }[] = [];

  // Check 1: Registry key exists
  console.error('🔍 Checking registry key...');
  const regKeyExists = registryKeyExists('com.devtools.bridge');
  checks.push({ name: 'Registry key exists', passed: regKeyExists });

  if (regKeyExists) {
    console.error('   ✅ Registry key found');
  } else {
    console.error('   ❌ Registry key not found');
    console.error('      Run: gravity setup-native-host');
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
  const hostPath = join(getGravityHostDir(), 'devtools-bridge-host.bat');
  const hostExists = nativeHostExists(hostPath);
  checks.push({ name: 'Native host executable found', passed: hostExists });

  if (hostExists) {
    console.error('   ✅ Native host executable found');
  } else {
    console.error('   ❌ Native host executable not found');
  }

  // Check 5: WebSocket connection
  console.error('🔍 Testing WebSocket connection...');
  const wsConnected = await testWebSocketConnection(9224);
  checks.push({ name: 'WebSocket connection', passed: wsConnected });

  if (wsConnected) {
    console.error('   ✅ WebSocket connection successful');
  } else {
    console.error('   ❌ WebSocket connection failed');
    console.error('      Make sure the MCP server is running: gravity');
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
    console.error('   You can now use Gravity in your IDE.');
    process.exit(0);
  } else {
    console.error('⚠️  Some checks failed. Please review the errors above.\n');
    process.exit(1);
  }
}

/**
 * Run the MCP server (original functionality)
 */
async function runMCPServer() {
  // Get port from environment or use default
  const port = parseInt(process.env.GRAVITY_PORT || '9224', 10);
  const timeout = parseInt(process.env.GRAVITY_TIMEOUT || '10000', 10);

  // Initialize bridge
  const bridge = new Gravity({ port, timeout });

  // MCP Server implementation
  interface MCPRequest {
    jsonrpc: string;
    id: string | number;
    method: string;
    params?: any;
  }

  interface MCPResponse {
    jsonrpc: string;
    id: string | number;
    result?: any;
    error?: {
      code: number;
      message: string;
      data?: any;
    };
  }

  // Tool definitions for MCP
  const tools = [
    {
      name: 'diagnose_layout',
      description: 'Diagnose CSS layout issues for a DOM element',
      inputSchema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector for the element to diagnose (e.g., "#modal", ".button")',
          },
        },
        required: ['selector'],
      },
    },
    {
      name: 'check_connection',
      description: 'Check if browser is connected',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'highlight_element',
      description: 'Highlight an element in the browser',
      inputSchema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector for the element to highlight',
          },
          color: {
            type: 'string',
            description: 'Color for the highlight (default: red)',
          },
          duration: {
            type: 'number',
            description: 'Duration in milliseconds (default: 3000)',
          },
        },
        required: ['selector'],
      },
    },
  ];

  /**
   * Handle MCP tool calls
   */
  async function handleToolCall(toolName: string, params: any): Promise<any> {
    switch (toolName) {
      case 'diagnose_layout': {
        if (!bridge.isConnected()) {
          throw new Error(
            'Not connected to browser. Make sure the Gravity extension is loaded and you clicked "Connect to Tab".'
          );
        }

        const result = await bridge.diagnoseLayout(params.selector);
        return result;
      }

      case 'check_connection': {
        const status = bridge.getStatus();
        return {
          connected: status.connected,
          message: status.message,
          timestamp: status.timestamp,
        };
      }

      case 'highlight_element': {
        if (!bridge.isConnected()) {
          throw new Error('Not connected to browser');
        }

        return {
          success: true,
          message: `Highlight request sent for ${params.selector}`,
        };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Process MCP request
   */
  async function processRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      if (request.method === 'initialize') {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'gravity',
              version: '1.0.2',
            },
          },
        };
      }

      if (request.method === 'tools/list') {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools,
          },
        };
      }

      if (request.method === 'tools/call') {
        const { name, arguments: args } = request.params;
        const result = await handleToolCall(name, args);

        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        };
      }

      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'Method not found',
        },
      };
    } catch (error: any) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: error.message || 'Internal error',
          data: {
            type: error.constructor.name,
          },
        },
      };
    }
  }

  console.error('🚀 Gravity MCP Server starting...');
  console.error(`📡 Connecting to extension on port ${port}...`);

  // Connect to browser
  try {
    await bridge.connectBrowser(port);
    console.error('✅ Connected to Gravity extension');
  } catch (error: any) {
    console.error('❌ Failed to connect to extension:', error.message);
    console.error('');
    console.error('Make sure:');
    console.error('1. Chrome/Edge is open');
    console.error('2. Gravity extension is loaded (chrome://extensions)');
    console.error('3. You clicked "Connect to Tab" in the extension popup');
    console.error('4. Port 9224 is not blocked by firewall');
    console.error('');
    console.error('Need to install the extension? Run:');
    console.error('  gravity setup-extension');
    process.exit(1);
  }

  // Listen for stdin (MCP protocol)
  process.stdin.setEncoding('utf-8');

  let buffer = '';

  process.stdin.on('data', async (chunk: string) => {
    buffer += chunk;

    // Process complete JSON objects
    const lines = buffer.split('\n');
    buffer = lines[lines.length - 1]; // Keep incomplete line in buffer

    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const request = JSON.parse(line) as MCPRequest;
        const response = await processRequest(request);
        console.log(JSON.stringify(response));
      } catch (error: any) {
        console.error('Error processing request:', error.message);
      }
    }
  });

  process.stdin.on('end', async () => {
    console.error('Shutting down...');
    await bridge.disconnectBrowser();
    process.exit(0);
  });

  // Handle errors
  process.on('error', (error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.error('\nShutting down gracefully...');
    await bridge.disconnectBrowser();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('\nShutting down gracefully...');
    await bridge.disconnectBrowser();
    process.exit(0);
  });
}

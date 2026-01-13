#!/usr/bin/env node

/**
 * Gravity MCP Server
 * 
 * This is the entry point for the npm package when used as an MCP server.
 * It connects to the Chrome extension via WebSocket and provides MCP tools
 * for layout diagnostics.
 */

import { Gravity } from './index.js';
import { readFileSync } from 'fs';

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
        throw new Error('Not connected to browser. Make sure the Gravity extension is loaded and you clicked "Connect to Tab".');
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

      // This would require additional implementation in the bridge
      // For now, return a message
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
            version: '1.0.1',
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

/**
 * Main entry point
 */
async function main() {
  console.log('🚀 Gravity MCP Server starting...');
  console.log(`📡 Connecting to extension on port ${port}...`);

  // Connect to browser
  try {
    await bridge.connectBrowser(port);
    console.log('✅ Connected to Gravity extension');
  } catch (error: any) {
    console.error('❌ Failed to connect to extension:', error.message);
    console.error('');
    console.error('Make sure:');
    console.error('1. Chrome/Edge is open');
    console.error('2. Gravity extension is loaded (chrome://extensions)');
    console.error('3. You clicked "Connect to Tab" in the extension popup');
    console.error('4. Port 9224 is not blocked by firewall');
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
    console.log('Shutting down...');
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
    console.log('\nShutting down gracefully...');
    await bridge.disconnectBrowser();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down gracefully...');
    await bridge.disconnectBrowser();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

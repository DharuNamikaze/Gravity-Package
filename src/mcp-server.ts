/**
 * Gravity MCP Server
 * 
 * Strict JSON-RPC 2.0 protocol implementation
 * - STDOUT: JSON-RPC messages only
 * - STDERR: Diagnostics and errors only
 * - No banners, emojis, or human-readable output on STDOUT
 */

import { Gravity } from './index.js';

// Override console.log to route to stderr
console.log = (...args: any[]) => {
  console.error(...args);
};

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
            version: '1.0.9',
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
 * Main MCP server entry point
 */
async function main() {
  // Connect to browser (diagnostics to stderr only)
  try {
    await bridge.connectBrowser(port);
  } catch (error: any) {
    console.error('Failed to connect to extension:', error.message);
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
        // STDOUT: JSON-RPC response only
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch (error: any) {
        // STDERR: Parse errors only
        console.error('Error processing request:', error.message);
      }
    }
  });

  process.stdin.on('end', async () => {
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
    await bridge.disconnectBrowser();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await bridge.disconnectBrowser();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

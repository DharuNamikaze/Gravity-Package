#!/usr/bin/env node
/**
 * Gravity Native Host
 * 
 * This process bridges communication between:
 * - MCP Server (via WebSocket on port 9224)
 * - Chrome Extension (via Native Messaging stdio)
 * 
 * Architecture:
 * MCP Server ← WebSocket → Native Host ← Native Messaging → Extension ← CDP → Browser
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// @ts-ignore - no types available
const nativeMessage = require('chrome-native-messaging');

const WS_PORT = 9224;
let wsServer: WebSocketServer | null = null;
let wsClient: WebSocket | null = null;

/**
 * Start WebSocket server for MCP connections
 */
function startWebSocketServer() {
  wsServer = new WebSocketServer({ port: WS_PORT });

  console.error('[Native Host] WebSocket server listening on port', WS_PORT);

  wsServer.on('connection', (ws: WebSocket) => {
    console.error('[Native Host] MCP server connected');
    wsClient = ws;

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        console.error('[Native Host] MCP → Extension:', message.type || message.method);

        // Forward to extension via native messaging (stdout)
        output.write(message);
      } catch (error: any) {
        console.error('[Native Host] Error processing WebSocket message:', error.message);
      }
    });

    ws.on('close', () => {
      console.error('[Native Host] MCP server disconnected');
      wsClient = null;
    });

    ws.on('error', (error: Error) => {
      console.error('[Native Host] WebSocket error:', error.message);
    });
  });

  wsServer.on('error', (error: Error) => {
    console.error('[Native Host] WebSocket server error:', error.message);
    process.exit(1);
  });
}

/**
 * Setup Native Messaging streams
 */
const input = new nativeMessage.Input();
const output = new nativeMessage.Output();
const transform = new nativeMessage.Transform((msg: any, push: (msg: any) => void, done: () => void) => {
  console.error('[Native Host] Extension → MCP:', msg.type);

  // Forward to MCP server via WebSocket
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    wsClient.send(JSON.stringify(msg));
  } else {
    console.error('[Native Host] No MCP client connected, message dropped');
  }

  done();
});

/**
 * Main entry point
 */
function main() {
  console.error('[Native Host] Starting Gravity Native Host...');

  // Start WebSocket server
  startWebSocketServer();

  // Setup Native Messaging pipeline
  process.stdin
    .pipe(input)
    .pipe(transform)
    .pipe(output)
    .pipe(process.stdout);

  console.error('[Native Host] Ready and waiting for messages...');

  // Handle stdin close
  process.stdin.on('end', () => {
    console.error('[Native Host] Extension disconnected (stdin closed)');
    if (wsServer) {
      wsServer.close();
    }
    process.exit(0);
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('[Native Host] Shutting down...');
  if (wsServer) {
    wsServer.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('[Native Host] Shutting down...');
  if (wsServer) {
    wsServer.close();
  }
  process.exit(0);
});

main();

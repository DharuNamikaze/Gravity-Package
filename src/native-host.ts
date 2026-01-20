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

const WS_PORT = 9224;
let wsServer: WebSocketServer | null = null;
let wsClient: WebSocket | null = null;

/**
 * Read native messaging message from stdin
 */
function readNativeMessage(): Promise<any> {
  return new Promise((resolve, reject) => {
    const headerBuffer = Buffer.alloc(4);
    let headerBytesRead = 0;

    const readHeader = () => {
      const chunk = process.stdin.read(4 - headerBytesRead);
      if (chunk === null) {
        // No data available yet, wait for readable event
        process.stdin.once('readable', readHeader);
        return;
      }
      
      if (chunk.length === 0) {
        // EOF
        reject(new Error('EOF: stdin closed'));
        return;
      }

      chunk.copy(headerBuffer, headerBytesRead);
      headerBytesRead += chunk.length;

      if (headerBytesRead === 4) {
        const messageLength = headerBuffer.readUInt32LE(0);
        if (messageLength === 0 || messageLength > 1024 * 1024) {
          reject(new Error(`Invalid message length: ${messageLength}`));
          return;
        }
        readMessage(messageLength);
      } else {
        process.stdin.once('readable', readHeader);
      }
    };

    const readMessage = (length: number) => {
      const messageBuffer = Buffer.alloc(length);
      let messageBytesRead = 0;

      const readChunk = () => {
        const chunk = process.stdin.read(length - messageBytesRead);
        if (chunk === null) {
          // No data available yet, wait for readable event
          process.stdin.once('readable', readChunk);
          return;
        }
        
        if (chunk.length === 0) {
          // EOF
          reject(new Error('EOF: stdin closed during message read'));
          return;
        }

        chunk.copy(messageBuffer, messageBytesRead);
        messageBytesRead += chunk.length;

        if (messageBytesRead === length) {
          try {
            const message = JSON.parse(messageBuffer.toString('utf-8'));
            resolve(message);
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error}`));
          }
        } else {
          process.stdin.once('readable', readChunk);
        }
      };

      readChunk();
    };

    readHeader();
  });
}

/**
 * Send native messaging message to stdout
 */
function sendNativeMessage(message: any) {
  const messageStr = JSON.stringify(message);
  const messageBuffer = Buffer.from(messageStr, 'utf-8');
  const headerBuffer = Buffer.alloc(4);
  headerBuffer.writeUInt32LE(messageBuffer.length, 0);

  process.stdout.write(headerBuffer);
  process.stdout.write(messageBuffer);
}

/**
 * Start WebSocket server for MCP connections
 */
function startWebSocketServer() {
  wsServer = new WebSocketServer({ port: WS_PORT });

  console.error(`[Native Host] WebSocket server listening on port ${WS_PORT}`);

  wsServer.on('connection', (ws: WebSocket) => {
    console.error('[Native Host] MCP server connected');
    wsClient = ws;

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        console.error('[Native Host] MCP → Extension:', message.type || message.method);

        // Forward to extension via native messaging
        sendNativeMessage(message);
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
 * Listen for messages from extension
 */
async function listenToExtension() {
  console.error('[Native Host] Listening for extension messages...');

  // Resume stdin to start reading
  process.stdin.resume();

  while (true) {
    try {
      const message = await readNativeMessage();
      console.error('[Native Host] Extension → MCP:', message.type);

      // Forward to MCP server via WebSocket
      if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(JSON.stringify(message));
      } else {
        console.error('[Native Host] No MCP client connected, message dropped');
      }
    } catch (error: any) {
      if (error.message.includes('EOF') || error.message.includes('end')) {
        console.error('[Native Host] Extension disconnected (stdin closed)');
        break;
      }
      console.error('[Native Host] Error reading from extension:', error.message);
      break;
    }
  }

  // Cleanup on exit
  console.error('[Native Host] Shutting down...');
  if (wsServer) {
    wsServer.close();
  }
  process.exit(0);
}

/**
 * Main entry point
 */
async function main() {
  console.error('[Native Host] Starting Gravity Native Host...');

  // Set stdin to binary mode for Native Messaging
  process.stdin.setEncoding('binary');
  process.stdin.pause();

  // Start WebSocket server
  startWebSocketServer();

  // Listen for extension messages
  listenToExtension().catch((error) => {
    console.error('[Native Host] Fatal error in message loop:', error);
    process.exit(1);
  });

  // Keep process alive
  console.error('[Native Host] Ready and waiting for messages...');
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

main().catch((error) => {
  console.error('[Native Host] Fatal error:', error);
  process.exit(1);
});

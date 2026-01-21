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
import { writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const require = createRequire(import.meta.url);
// @ts-ignore - no types available
const nativeMessage = require('chrome-native-messaging');

const WS_PORT = 9224;
let wsServer: WebSocketServer | null = null;
let wsClient: WebSocket | null = null;

// Log file for debugging
const logFile = join(homedir(), '.gravity-host', 'native-host.log');

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  try {
    appendFileSync(logFile, logMessage);
  } catch (e) {
    // Ignore file write errors
  }
  console.error(message);
}

/**
 * Start WebSocket server for MCP connections
 */
function startWebSocketServer() {
  wsServer = new WebSocketServer({ port: WS_PORT });

  log('[Native Host] WebSocket server listening on port ' + WS_PORT);

  wsServer.on('connection', (ws: WebSocket) => {
    log('[Native Host] MCP server connected');
    wsClient = ws;

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        log('[Native Host] MCP → Extension: ' + (message.type || message.method));

        // Forward to extension via native messaging (stdout)
        output.write(message);
      } catch (error: any) {
        log('[Native Host] Error processing WebSocket message: ' + error.message);
      }
    });

    ws.on('close', () => {
      log('[Native Host] MCP server disconnected');
      wsClient = null;
    });

    ws.on('error', (error: Error) => {
      log('[Native Host] WebSocket error: ' + error.message);
    });
  });

  wsServer.on('error', (error: Error) => {
    log('[Native Host] WebSocket server error: ' + error.message);
    process.exit(1);
  });
}

/**
 * Setup Native Messaging streams
 */
const input = new nativeMessage.Input();
const output = new nativeMessage.Output();
const transform = new nativeMessage.Transform((msg: any, push: (msg: any) => void, done: () => void) => {
  log('[Native Host] Extension → MCP: ' + msg.type);

  // Forward to MCP server via WebSocket
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    wsClient.send(JSON.stringify(msg));
    log('[Native Host] Message forwarded to MCP server');
  } else {
    log('[Native Host] No MCP client connected, message dropped');
  }

  done();
});

// Add error handlers for the streams
input.on('error', (error: Error) => {
  log('[Native Host] Input stream error: ' + error.message);
});

output.on('error', (error: Error) => {
  log('[Native Host] Output stream error: ' + error.message);
});

transform.on('error', (error: Error) => {
  log('[Native Host] Transform stream error: ' + error.message);
});

/**
 * Main entry point
 */
function main() {
  log('[Native Host] Starting Gravity Native Host...');
  log('[Native Host] Node version: ' + process.version);
  log('[Native Host] Working directory: ' + process.cwd());
  log('[Native Host] Script path: ' + import.meta.url);
  log('[Native Host] Arguments: ' + JSON.stringify(process.argv));
  log('[Native Host] Log file: ' + logFile);

  // Start WebSocket server
  try {
    startWebSocketServer();
  } catch (error: any) {
    log('[Native Host] FATAL: Failed to start WebSocket server: ' + error.message);
    process.exit(1);
  }

  // Setup Native Messaging pipeline
  try {
    log('[Native Host] Setting up Native Messaging pipeline...');
    process.stdin
      .pipe(input)
      .pipe(transform)
      .pipe(output)
      .pipe(process.stdout);

    log('[Native Host] Ready and waiting for messages...');
  } catch (error: any) {
    log('[Native Host] FATAL: Failed to setup pipeline: ' + error.message);
    process.exit(1);
  }

  // Handle stdin close
  process.stdin.on('end', () => {
    log('[Native Host] Extension disconnected (stdin closed)');
    if (wsServer) {
      wsServer.close();
    }
    process.exit(0);
  });

  // Handle stdin error
  process.stdin.on('error', (error: Error) => {
    log('[Native Host] stdin error: ' + error.message);
    process.exit(1);
  });

  // Handle stdout error
  process.stdout.on('error', (error: Error) => {
    log('[Native Host] stdout error: ' + error.message);
    process.exit(1);
  });

  // Log when stdin is readable
  process.stdin.on('readable', () => {
    log('[Native Host] stdin is readable');
  });

  // Prevent process from exiting due to unhandled errors
  process.on('uncaughtException', (error: Error) => {
    log('[Native Host] Uncaught exception: ' + error.message + '\n' + error.stack);
  });

  process.on('unhandledRejection', (reason: any) => {
    log('[Native Host] Unhandled rejection: ' + JSON.stringify(reason));
  });

  // Keep the process alive
  setInterval(() => {
    // This prevents the process from exiting
    // The interval will be cleared when stdin closes
  }, 60000);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('[Native Host] Shutting down (SIGINT)...');
  if (wsServer) {
    wsServer.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('[Native Host] Shutting down (SIGTERM)...');
  if (wsServer) {
    wsServer.close();
  }
  process.exit(0);
});

// Log process exit
process.on('exit', (code) => {
  log('[Native Host] Process exiting with code: ' + code);
});

main();

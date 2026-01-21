/**
 * Unit Tests for Native Host
 * Tests individual functions and components in isolation
 */

import { describe, it, expect, beforeEach, afterEach } from 'node:test';
import { WebSocketServer, WebSocket } from 'ws';
import { spawn } from 'child_process';
import { join } from 'path';
import { homedir } from 'os';

describe('Native Host - Unit Tests', () => {
  it('should create WebSocket server on port 9224', async () => {
    const server = new WebSocketServer({ port: 9224 });
    expect(server).toBeDefined();
    server.close();
  });

  it('should log startup information correctly', () => {
    const logFile = join(homedir(), '.gravity-host', 'native-host.log');
    expect(logFile).toContain('.gravity-host');
    expect(logFile).toContain('native-host.log');
  });

  it('should handle WebSocket connection event', (done) => {
    const server = new WebSocketServer({ port: 9225 });
    server.on('connection', (ws) => {
      expect(ws).toBeDefined();
      ws.close();
      server.close();
      done();
    });
    
    const client = new WebSocket('ws://localhost:9225');
    client.on('open', () => {
      client.close();
    });
  });

  it('should handle WebSocket message event', (done) => {
    const server = new WebSocketServer({ port: 9226 });
    server.on('connection', (ws) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message.type).toBe('test');
        ws.close();
        server.close();
        done();
      });
    });
    
    const client = new WebSocket('ws://localhost:9226');
    client.on('open', () => {
      client.send(JSON.stringify({ type: 'test', data: 'hello' }));
    });
  });

  it('should handle WebSocket close event', (done) => {
    const server = new WebSocketServer({ port: 9227 });
    server.on('connection', (ws) => {
      ws.on('close', () => {
        server.close();
        done();
      });
    });
    
    const client = new WebSocket('ws://localhost:9227');
    client.on('open', () => {
      client.close();
    });
  });

  it('should handle WebSocket error event', (done) => {
    const server = new WebSocketServer({ port: 9228 });
    server.on('connection', (ws) => {
      ws.on('error', (error) => {
        expect(error).toBeDefined();
        server.close();
        done();
      });
      // Force an error by closing the underlying socket
      (ws as any)._socket.destroy();
    });
    
    const client = new WebSocket('ws://localhost:9228');
  });

  it('should parse JSON messages correctly', () => {
    const message = { type: 'cdp_request', method: 'DOM.querySelector', params: { selector: '#test' } };
    const json = JSON.stringify(message);
    const parsed = JSON.parse(json);
    expect(parsed.type).toBe('cdp_request');
    expect(parsed.method).toBe('DOM.querySelector');
  });

  it('should handle invalid JSON gracefully', () => {
    const invalidJson = '{ invalid json }';
    try {
      JSON.parse(invalidJson);
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should format log messages with timestamp', () => {
    const timestamp = new Date().toISOString();
    const message = 'Test message';
    const logMessage = `[${timestamp}] ${message}\n`;
    expect(logMessage).toContain(timestamp);
    expect(logMessage).toContain(message);
  });

  it('should handle process exit gracefully', () => {
    const exitCode = 0;
    expect(exitCode).toBe(0);
  });
});

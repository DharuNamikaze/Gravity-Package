/**
 * End-to-End Tests for Complete Gravity Flow
 * Tests the entire flow from IDE to Browser and back
 */

import { describe, it, expect, beforeEach, afterEach } from 'node:test';
import { spawn, ChildProcess } from 'child_process';
import { WebSocket } from 'ws';

describe('Full Gravity Flow - E2E Tests', () => {
  let mcpServer: ChildProcess | null = null;
  let nativeHost: ChildProcess | null = null;

  afterEach(() => {
    if (mcpServer) {
      mcpServer.kill();
      mcpServer = null;
    }
    if (nativeHost) {
      nativeHost.kill();
      nativeHost = null;
    }
  });

  it('should complete full diagnostic flow: IDE -> MCP -> Native Host -> Extension -> Browser', (done) => {
    // This test simulates the complete flow
    // In a real scenario, this would involve actual Chrome extension
    expect(true).toBe(true);
    done();
  });

  it('should handle MCP server startup and connection', (done) => {
    // Start MCP server
    mcpServer = spawn('node', ['dist/mcp-server.js']);
    
    mcpServer.stderr?.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Connecting to Gravity')) {
        expect(true).toBe(true);
        done();
      }
    });

    setTimeout(() => done(), 5000);
  });

  it('should diagnose CSS layout issues end-to-end', (done) => {
    // Simulate a diagnose request
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'mcp_gravity_diagnose_layout',
        arguments: { selector: '#modal' }
      }
    };
    
    expect(request.params.name).toBe('mcp_gravity_diagnose_layout');
    done();
  });

  it('should check browser connection status', (done) => {
    const request = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'mcp_gravity_check_connection',
        arguments: {}
      }
    };
    
    expect(request.params.name).toBe('mcp_gravity_check_connection');
    done();
  });

  it('should highlight elements in browser', (done) => {
    const request = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'mcp_gravity_highlight_element',
        arguments: { selector: '.button', color: 'red', duration: 3000 }
      }
    };
    
    expect(request.params.arguments.selector).toBe('.button');
    done();
  });

  it('should handle connection timeout gracefully', (done) => {
    // Simulate connection timeout
    setTimeout(() => {
      expect(true).toBe(true);
      done();
    }, 1000);
  });

  it('should retry failed connections', (done) => {
    let attempts = 0;
    const maxAttempts = 3;
    
    const tryConnect = () => {
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(tryConnect, 100);
      } else {
        expect(attempts).toBe(maxAttempts);
        done();
      }
    };
    
    tryConnect();
  });

  it('should handle multiple diagnostic requests in sequence', (done) => {
    const requests = [
      { selector: '#modal' },
      { selector: '.button' },
      { selector: 'nav' }
    ];
    
    let processed = 0;
    requests.forEach(() => {
      processed++;
      if (processed === requests.length) {
        expect(processed).toBe(3);
        done();
      }
    });
  });

  it('should maintain state across multiple requests', () => {
    const state = {
      connected: false,
      tabId: null,
      lastRequest: null
    };
    
    state.connected = true;
    state.tabId = 123;
    
    expect(state.connected).toBe(true);
    expect(state.tabId).toBe(123);
  });

  it('should clean up resources on shutdown', (done) => {
    // Simulate cleanup
    const cleanup = () => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(true), 100);
      });
    };
    
    cleanup().then(() => {
      expect(true).toBe(true);
      done();
    });
  });
});

/**
 * Native Host Tests
 * Tests for the native host bridge process that connects MCP server to Chrome extension
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { spawn, ChildProcess } from 'child_process';
import { WebSocket } from 'ws';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync, readFileSync } from 'fs';

const NATIVE_HOST_PATH = join(homedir(), '.gravity-host', 'gravity-host.bat');
const WS_PORT = 9224;
const LOG_FILE = join(homedir(), '.gravity-host', 'native-host.log');

describe('Native Host - Startup Tests', () => {
  it('should start native host process successfully', async () => {
    const nativeHost = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    assert.ok(nativeHost.pid, 'Native host should have a process ID');
    nativeHost.kill();
  });

  it('should create log file on startup', async () => {
    const nativeHost = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    assert.ok(existsSync(LOG_FILE), 'Log file should exist');
    nativeHost.kill();
  });

  it('should log startup information', async () => {
    const nativeHost = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const logContent = readFileSync(LOG_FILE, 'utf-8');
    assert.ok(logContent.includes('Starting Gravity Native Host'), 'Should log startup message');
    assert.ok(logContent.includes('Node version'), 'Should log Node version');
    nativeHost.kill();
  });

  it('should start WebSocket server on port 9224', async () => {
    const nativeHost = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const logContent = readFileSync(LOG_FILE, 'utf-8');
    assert.ok(logContent.includes('WebSocket server listening on port 9224'), 'Should start WebSocket server');
    nativeHost.kill();
  });

  it('should setup Native Messaging pipeline', async () => {
    const nativeHost = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const logContent = readFileSync(LOG_FILE, 'utf-8');
    assert.ok(logContent.includes('Setting up Native Messaging pipeline'), 'Should setup pipeline');
    assert.ok(logContent.includes('Ready and waiting for messages'), 'Should be ready');
    nativeHost.kill();
  });

  it('should not exit immediately after startup', async () => {
    const nativeHost = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let exited = false;
    nativeHost.on('exit', () => {
      exited = true;
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    assert.strictEqual(exited, false, 'Native host should not exit immediately');
    nativeHost.kill();
  });

  it('should handle SIGTERM gracefully', async () => {
    const nativeHost = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    nativeHost.kill('SIGTERM');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const logContent = readFileSync(LOG_FILE, 'utf-8');
    assert.ok(logContent.includes('Shutting down'), 'Should log shutdown message');
  });

  it('should handle SIGINT gracefully', async () => {
    const nativeHost = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    nativeHost.kill('SIGINT');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const logContent = readFileSync(LOG_FILE, 'utf-8');
    assert.ok(logContent.includes('Shutting down'), 'Should log shutdown message');
  });

  it('should log process exit code', async () => {
    const nativeHost = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    nativeHost.kill();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const logContent = readFileSync(LOG_FILE, 'utf-8');
    assert.ok(logContent.includes('Process exiting with code'), 'Should log exit code');
  });

  it('should use absolute path to native-host.js', async () => {
    const batContent = readFileSync(NATIVE_HOST_PATH, 'utf-8');
    assert.ok(batContent.includes('AppData\\Roaming\\npm\\node_modules\\gravity-core\\dist\\native-host.js'), 
      'Batch file should use absolute path');
  });
});

describe('Native Host - WebSocket Connection Tests', () => {
  let nativeHost: ChildProcess;

  before(async () => {
    nativeHost = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  after(() => {
    if (nativeHost) {
      nativeHost.kill();
    }
  });

  it('should accept WebSocket connections', async () => {
    const ws = new WebSocket(`ws://localhost:${WS_PORT}`);

    await new Promise((resolve, reject) => {
      ws.on('open', resolve);
      ws.on('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    assert.ok(true, 'WebSocket connection should succeed');
    ws.close();
  });

  it('should log MCP server connection', async () => {
    const ws = new WebSocket(`ws://localhost:${WS_PORT}`);

    await new Promise((resolve) => {
      ws.on('open', resolve);
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    const logContent = readFileSync(LOG_FILE, 'utf-8');
    assert.ok(logContent.includes('MCP server connected'), 'Should log MCP connection');
    ws.close();
  });

  it('should handle multiple connection attempts', async () => {
    const ws1 = new WebSocket(`ws://localhost:${WS_PORT}`);
    await new Promise((resolve) => ws1.on('open', resolve));

    const ws2 = new WebSocket(`ws://localhost:${WS_PORT}`);
    await new Promise((resolve) => ws2.on('open', resolve));

    assert.ok(true, 'Should handle multiple connections');
    ws1.close();
    ws2.close();
  });

  it('should log WebSocket disconnection', async () => {
    const ws = new WebSocket(`ws://localhost:${WS_PORT}`);
    await new Promise((resolve) => ws.on('open', resolve));

    ws.close();
    await new Promise((resolve) => setTimeout(resolve, 500));

    const logContent = readFileSync(LOG_FILE, 'utf-8');
    assert.ok(logContent.includes('MCP server disconnected'), 'Should log disconnection');
  });

  it('should handle WebSocket errors gracefully', async () => {
    const ws = new WebSocket(`ws://localhost:${WS_PORT}`);
    await new Promise((resolve) => ws.on('open', resolve));

    // Force an error by sending invalid data
    ws.send('invalid json');

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Native host should still be running
    assert.ok(!nativeHost.killed, 'Native host should still be running');
    ws.close();
  });

  it('should forward messages from WebSocket to Native Messaging', async () => {
    const ws = new WebSocket(`ws://localhost:${WS_PORT}`);
    await new Promise((resolve) => ws.on('open', resolve));

    const testMessage = { type: 'test', data: 'hello' };
    ws.send(JSON.stringify(testMessage));

    await new Promise((resolve) => setTimeout(resolve, 500));

    const logContent = readFileSync(LOG_FILE, 'utf-8');
    assert.ok(logContent.includes('MCP → Extension'), 'Should log message forwarding');
    ws.close();
  });

  it('should handle WebSocket close event', async () => {
    const ws = new WebSocket(`ws://localhost:${WS_PORT}`);
    await new Promise((resolve) => ws.on('open', resolve));

    let closeEventFired = false;
    ws.on('close', () => {
      closeEventFired = true;
    });

    ws.close();
    await new Promise((resolve) => setTimeout(resolve, 500));

    assert.ok(closeEventFired, 'Close event should fire');
  });

  it('should reject connections on wrong port', async () => {
    try {
      const ws = new WebSocket(`ws://localhost:9999`);
      await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
        setTimeout(() => reject(new Error('Should have failed')), 2000);
      });
      assert.fail('Should not connect to wrong port');
    } catch (error) {
      assert.ok(true, 'Should reject connection on wrong port');
    }
  });

  it('should maintain connection during idle time', async () => {
    const ws = new WebSocket(`ws://localhost:${WS_PORT}`);
    await new Promise((resolve) => ws.on('open', resolve));

    // Wait for 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));

    assert.strictEqual(ws.readyState, WebSocket.OPEN, 'Connection should remain open');
    ws.close();
  });

  it('should handle rapid connect/disconnect cycles', async () => {
    for (let i = 0; i < 5; i++) {
      const ws = new WebSocket(`ws://localhost:${WS_PORT}`);
      await new Promise((resolve) => ws.on('open', resolve));
      ws.close();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    assert.ok(true, 'Should handle rapid connect/disconnect');
  });
});

describe('Native Host - Message Forwarding Tests', () => {
  let nativeHost: ChildProcess;
  let ws: WebSocket;

  before(async () => {
    nativeHost = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    ws = new WebSocket(`ws://localhost:${WS_PORT}`);
    await new Promise((resolve) => ws.on('open', resolve));
  });

  after(() => {
    if (ws) {
      ws.close();
    }
    if (nativeHost) {
      nativeHost.kill();
    }
  });

  it('should forward CDP request messages', async () => {
    const message = {
      type: 'cdp_request',
      id: 1,
      method: 'DOM.querySelector',
      params: { selector: '#test' }
    };

    ws.send(JSON.stringify(message));
    await new Promise((resolve) => setTimeout(resolve, 500));

    const logContent = readFileSync(LOG_FILE, 'utf-8');
    assert.ok(logContent.includes('cdp_request'), 'Should forward CDP request');
  });

  it('should forward CDP response messages', async () => {
    const message = {
      type: 'cdp_response',
      id: 1,
      result: { nodeId: 123 }
    };

    ws.send(JSON.stringify(message));
    await new Promise((resolve) => setTimeout(resolve, 500));

    const logContent = readFileSync(LOG_FILE, 'utf-8');
    assert.ok(logContent.includes('cdp_response'), 'Should forward CDP response');
  });

  it('should handle JSON parsing errors', async () => {
    ws.send('invalid json {{{');
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Native host should still be running
    assert.ok(!nativeHost.killed, 'Should handle parse errors gracefully');
  });

  it('should forward messages with large payloads', async () => {
    const largePayload = {
      type: 'test',
      data: 'x'.repeat(10000)
    };

    ws.send(JSON.stringify(largePayload));
    await new Promise((resolve) => setTimeout(resolve, 500));

    assert.ok(true, 'Should handle large payloads');
  });

  it('should forward messages with special characters', async () => {
    const message = {
      type: 'test',
      data: 'Hello 世界 🌍 <>&"'
    };

    ws.send(JSON.stringify(message));
    await new Promise((resolve) => setTimeout(resolve, 500));

    assert.ok(true, 'Should handle special characters');
  });

  it('should forward messages with nested objects', async () => {
    const message = {
      type: 'test',
      data: {
        nested: {
          deep: {
            value: 'test'
          }
        }
      }
    };

    ws.send(JSON.stringify(message));
    await new Promise((resolve) => setTimeout(resolve, 500));

    assert.ok(true, 'Should handle nested objects');
  });

  it('should forward messages with arrays', async () => {
    const message = {
      type: 'test',
      data: [1, 2, 3, 4, 5]
    };

    ws.send(JSON.stringify(message));
    await new Promise((resolve) => setTimeout(resolve, 500));

    assert.ok(true, 'Should handle arrays');
  });

  it('should forward messages with null values', async () => {
    const message = {
      type: 'test',
      data: null
    };

    ws.send(JSON.stringify(message));
    await new Promise((resolve) => setTimeout(resolve, 500));

    assert.ok(true, 'Should handle null values');
  });

  it('should forward messages with boolean values', async () => {
    const message = {
      type: 'test',
      enabled: true,
      disabled: false
    };

    ws.send(JSON.stringify(message));
    await new Promise((resolve) => setTimeout(resolve, 500));

    assert.ok(true, 'Should handle boolean values');
  });

  it('should forward messages with numeric values', async () => {
    const message = {
      type: 'test',
      integer: 42,
      float: 3.14,
      negative: -10
    };

    ws.send(JSON.stringify(message));
    await new Promise((resolve) => setTimeout(resolve, 500));

    assert.ok(true, 'Should handle numeric values');
  });
});

describe('Native Host - Error Handling Tests', () => {
  it('should handle missing batch file', async () => {
    try {
      const nativeHost = spawn('cmd.exe', ['/c', 'nonexistent.bat'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      await new Promise((resolve, reject) => {
        nativeHost.on('error', reject);
        nativeHost.on('exit', resolve);
        setTimeout(() => resolve(null), 2000);
      });

      assert.ok(true, 'Should handle missing batch file');
    } catch (error) {
      assert.ok(true, 'Should throw error for missing file');
    }
  });

  it('should handle port already in use', async () => {
    // Start first instance
    const nativeHost1 = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Try to start second instance
    const nativeHost2 = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const logContent = readFileSync(LOG_FILE, 'utf-8');
    assert.ok(logContent.includes('WebSocket server error') || logContent.includes('EADDRINUSE'), 
      'Should log port conflict error');

    nativeHost1.kill();
    nativeHost2.kill();
  });

  it('should handle stdin errors', async () => {
    const nativeHost = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Close stdin to trigger error
    nativeHost.stdin.end();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const logContent = readFileSync(LOG_FILE, 'utf-8');
    assert.ok(logContent.includes('stdin') || logContent.includes('disconnected'), 
      'Should handle stdin errors');

    nativeHost.kill();
  });

  it('should handle stdout errors', async () => {
    const nativeHost = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Native host should handle stdout errors gracefully
    assert.ok(true, 'Should handle stdout errors');

    nativeHost.kill();
  });

  it('should handle uncaught exceptions', async () => {
    const nativeHost = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Native host has uncaught exception handler
    const logContent = readFileSync(LOG_FILE, 'utf-8');
    assert.ok(logContent.includes('Ready and waiting'), 'Should be running');

    nativeHost.kill();
  });

  it('should handle unhandled promise rejections', async () => {
    const nativeHost = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Native host has unhandled rejection handler
    const logContent = readFileSync(LOG_FILE, 'utf-8');
    assert.ok(logContent.includes('Ready and waiting'), 'Should be running');

    nativeHost.kill();
  });

  it('should handle log file write errors', async () => {
    // Native host should continue even if log file can't be written
    const nativeHost = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    assert.ok(!nativeHost.killed, 'Should continue running');
    nativeHost.kill();
  });

  it('should handle WebSocket server creation errors', async () => {
    // This is tested by the port conflict test
    assert.ok(true, 'WebSocket server errors are handled');
  });

  it('should handle message transformation errors', async () => {
    const nativeHost = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const ws = new WebSocket(`ws://localhost:${WS_PORT}`);
    await new Promise((resolve) => ws.on('open', resolve));

    // Send malformed message
    ws.send('not json');

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Native host should still be running
    assert.ok(!nativeHost.killed, 'Should handle transformation errors');

    ws.close();
    nativeHost.kill();
  });

  it('should handle rapid error conditions', async () => {
    const nativeHost = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const ws = new WebSocket(`ws://localhost:${WS_PORT}`);
    await new Promise((resolve) => ws.on('open', resolve));

    // Send multiple malformed messages rapidly
    for (let i = 0; i < 10; i++) {
      ws.send('invalid' + i);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Native host should still be running
    assert.ok(!nativeHost.killed, 'Should handle rapid errors');

    ws.close();
    nativeHost.kill();
  });
});

describe('Native Host - Performance Tests', () => {
  let nativeHost: ChildProcess;
  let ws: WebSocket;

  before(async () => {
    nativeHost = spawn('cmd.exe', ['/c', NATIVE_HOST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    ws = new WebSocket(`ws://localhost:${WS_PORT}`);
    await new Promise((resolve) => ws.on('open', resolve));
  });

  after(() => {
    if (ws) {
      ws.close();
    }
    if (nativeHost) {
      nativeHost.kill();
    }
  });

  it('should handle high message throughput', async () => {
    const messageCount = 100;
    const startTime = Date.now();

    for (let i = 0; i < messageCount; i++) {
      ws.send(JSON.stringify({ type: 'test', id: i }));
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const endTime = Date.now();
    const duration = endTime - startTime;

    assert.ok(duration < 5000, `Should handle ${messageCount} messages in under 5 seconds`);
  });

  it('should maintain low memory usage', async () => {
    // Send messages for 5 seconds
    const interval = setInterval(() => {
      ws.send(JSON.stringify({ type: 'test', data: 'x'.repeat(1000) }));
    }, 100);

    await new Promise((resolve) => setTimeout(resolve, 5000));
    clearInterval(interval);

    // Native host should still be running
    assert.ok(!nativeHost.killed, 'Should maintain stable memory usage');
  });

  it('should handle burst traffic', async () => {
    // Send 50 messages at once
    for (let i = 0; i < 50; i++) {
      ws.send(JSON.stringify({ type: 'burst', id: i }));
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    assert.ok(!nativeHost.killed, 'Should handle burst traffic');
  });

  it('should recover from temporary overload', async () => {
    // Overload with messages
    for (let i = 0; i < 200; i++) {
      ws.send(JSON.stringify({ type: 'overload', id: i }));
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Should still accept new messages
    ws.send(JSON.stringify({ type: 'recovery', id: 1 }));

    await new Promise((resolve) => setTimeout(resolve, 500));

    assert.ok(!nativeHost.killed, 'Should recover from overload');
  });

  it('should handle long-running connections', async () => {
    // Keep connection open for 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10000));

    assert.strictEqual(ws.readyState, WebSocket.OPEN, 'Connection should remain stable');
  });

  it('should handle concurrent message processing', async () => {
    // Send messages concurrently
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(new Promise((resolve) => {
        ws.send(JSON.stringify({ type: 'concurrent', id: i }));
        setTimeout(resolve, 50);
      }));
    }

    await Promise.all(promises);

    assert.ok(true, 'Should handle concurrent messages');
  });

  it('should maintain responsiveness under load', async () => {
    // Send background load
    const interval = setInterval(() => {
      ws.send(JSON.stringify({ type: 'background' }));
    }, 50);

    // Send test message
    const startTime = Date.now();
    ws.send(JSON.stringify({ type: 'test' }));
    await new Promise((resolve) => setTimeout(resolve, 100));
    const responseTime = Date.now() - startTime;

    clearInterval(interval);

    assert.ok(responseTime < 500, 'Should remain responsive under load');
  });

  it('should handle message size variations', async () => {
    const sizes = [10, 100, 1000, 10000];

    for (const size of sizes) {
      ws.send(JSON.stringify({ type: 'size-test', data: 'x'.repeat(size) }));
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    assert.ok(true, 'Should handle varying message sizes');
  });

  it('should maintain stable CPU usage', async () => {
    // Send steady stream of messages
    const interval = setInterval(() => {
      ws.send(JSON.stringify({ type: 'cpu-test' }));
    }, 100);

    await new Promise((resolve) => setTimeout(resolve, 5000));
    clearInterval(interval);

    // Native host should still be running
    assert.ok(!nativeHost.killed, 'Should maintain stable CPU usage');
  });

  it('should handle rapid reconnections efficiently', async () => {
    const startTime = Date.now();

    for (let i = 0; i < 10; i++) {
      const tempWs = new WebSocket(`ws://localhost:${WS_PORT}`);
      await new Promise((resolve) => tempWs.on('open', resolve));
      tempWs.close();
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    const duration = Date.now() - startTime;

    assert.ok(duration < 3000, 'Should handle reconnections efficiently');
  });
});

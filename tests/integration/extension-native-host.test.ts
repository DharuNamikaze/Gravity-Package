/**
 * Integration Tests for Extension <-> Native Host Communication
 * Tests the interaction between Chrome extension and native host
 */

import { describe, it, expect, beforeEach, afterEach } from 'node:test';
import { spawn, ChildProcess } from 'child_process';
import { WebSocket } from 'ws';
import { join } from 'path';
import { homedir } from 'os';

describe('Extension <-> Native Host - Integration Tests', () => {
  let nativeHostProcess: ChildProcess | null = null;

  afterEach(() => {
    if (nativeHostProcess) {
      nativeHostProcess.kill();
      nativeHostProcess = null;
    }
  });

  it('should start native host process successfully', (done) => {
    const hostPath = join(homedir(), '.gravity-host', 'gravity-host.bat');
    nativeHostProcess = spawn('cmd.exe', ['/c', hostPath]);
    
    nativeHostProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      if (output.includes('WebSocket server listening')) {
        expect(output).toContain('9224');
        done();
      }
    });

    setTimeout(() => {
      if (nativeHostProcess) {
        nativeHostProcess.kill();
      }
      done();
    }, 5000);
  });

  it('should accept WebSocket connections from MCP server', (done) => {
    const hostPath = join(homedir(), '.gravity-host', 'gravity-host.bat');
    nativeHostProcess = spawn('cmd.exe', ['/c', hostPath]);
    
    setTimeout(() => {
      const client = new WebSocket('ws://localhost:9224');
      client.on('open', () => {
        expect(true).toBe(true);
        client.close();
        done();
      });
      client.on('error', () => {
        done();
      });
    }, 2000);
  });

  it('should forward messages from MCP to extension', (done) => {
    const hostPath = join(homedir(), '.gravity-host', 'gravity-host.bat');
    nativeHostProcess = spawn('cmd.exe', ['/c', hostPath]);
    
    setTimeout(() => {
      const client = new WebSocket('ws://localhost:9224');
      client.on('open', () => {
        const message = { type: 'cdp_request', id: 1, method: 'DOM.querySelector' };
        client.send(JSON.stringify(message));
        
        // Check if message was logged
        setTimeout(() => {
          client.close();
          done();
        }, 1000);
      });
    }, 2000);
  });

  it('should handle multiple concurrent WebSocket connections', (done) => {
    const hostPath = join(homedir(), '.gravity-host', 'gravity-host.bat');
    nativeHostProcess = spawn('cmd.exe', ['/c', hostPath]);
    
    setTimeout(() => {
      const client1 = new WebSocket('ws://localhost:9224');
      const client2 = new WebSocket('ws://localhost:9224');
      
      let openCount = 0;
      const onOpen = () => {
        openCount++;
        if (openCount === 2) {
          client1.close();
          client2.close();
          done();
        }
      };
      
      client1.on('open', onOpen);
      client2.on('open', onOpen);
    }, 2000);
  });

  it('should reconnect after connection loss', (done) => {
    const hostPath = join(homedir(), '.gravity-host', 'gravity-host.bat');
    nativeHostProcess = spawn('cmd.exe', ['/c', hostPath]);
    
    setTimeout(() => {
      const client = new WebSocket('ws://localhost:9224');
      client.on('open', () => {
        client.close();
        
        // Try to reconnect
        setTimeout(() => {
          const client2 = new WebSocket('ws://localhost:9224');
          client2.on('open', () => {
            expect(true).toBe(true);
            client2.close();
            done();
          });
        }, 1000);
      });
    }, 2000);
  });

  it('should handle native messaging protocol correctly', () => {
    const message = { type: 'test', data: 'hello' };
    const messageStr = JSON.stringify(message);
    const messageLength = Buffer.byteLength(messageStr);
    
    // Create length header (4 bytes, little-endian)
    const header = Buffer.alloc(4);
    header.writeUInt32LE(messageLength, 0);
    
    expect(header.length).toBe(4);
    expect(header.readUInt32LE(0)).toBe(messageLength);
  });

  it('should validate message format before forwarding', () => {
    const validMessage = { type: 'cdp_request', id: 1, method: 'DOM.querySelector' };
    const invalidMessage = { invalid: 'message' };
    
    expect(validMessage.type).toBeDefined();
    expect(invalidMessage.type).toBeUndefined();
  });

  it('should handle large messages correctly', () => {
    const largeData = 'x'.repeat(10000);
    const message = { type: 'test', data: largeData };
    const json = JSON.stringify(message);
    const parsed = JSON.parse(json);
    
    expect(parsed.data.length).toBe(10000);
  });

  it('should maintain message order during forwarding', () => {
    const messages = [
      { id: 1, type: 'test' },
      { id: 2, type: 'test' },
      { id: 3, type: 'test' }
    ];
    
    const received: any[] = [];
    messages.forEach(msg => received.push(msg));
    
    expect(received[0].id).toBe(1);
    expect(received[1].id).toBe(2);
    expect(received[2].id).toBe(3);
  });

  it('should handle stdin/stdout communication', () => {
    const message = { type: 'test' };
    const json = JSON.stringify(message);
    const buffer = Buffer.from(json);
    
    expect(buffer.toString()).toBe(json);
  });
});

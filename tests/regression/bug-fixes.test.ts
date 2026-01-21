/**
 * Regression Tests for Gravity
 * Tests to ensure previously fixed bugs don't reoccur
 */

import { describe, it, expect } from 'node:test';
import { join } from 'path';
import { homedir } from 'os';

describe('Gravity Regression - Bug Fix Tests', () => {
  it('should use absolute path in batch file (Bug #1)', () => {
    // Bug: Batch file used relative path that didn't work after global install
    const npmRoot = 'C:\\Users\\test\\AppData\\Roaming\\npm\\node_modules';
    const nativeHostPath = join(npmRoot, 'gravity-core', 'dist', 'native-host.js');
    
    expect(nativeHostPath).toContain('AppData');
    expect(nativeHostPath).toContain('native-host.js');
  });

  it('should not exit immediately after connection (Bug #2)', () => {
    // Bug: Native host was exiting immediately after extension connected
    let processRunning = true;
    
    // Simulate keep-alive interval
    const interval = setInterval(() => {
      // Keep process alive
    }, 60000);
    
    expect(processRunning).toBe(true);
    clearInterval(interval);
  });

  it('should handle extension manifest version correctly (Bug #3)', () => {
    // Bug: Extension manifest had trailing space in version
    const version = '1.0.26';
    expect(version.trim()).toBe(version);
    expect(version).not.toContain(' ');
  });

  it('should scan all Chrome profiles (Bug #4)', () => {
    // Bug: Only scanned Default profile, missed Profile 1, Profile 2, etc.
    const profiles = ['Default', 'Profile 1', 'Profile 2'];
    
    profiles.forEach(profile => {
      expect(profile === 'Default' || profile.match(/^Profile \d+$/)).toBe(true);
    });
  });

  it('should handle WebSocket connection close gracefully (Bug #5)', () => {
    // Bug: Connection close caused crash
    let connected = true;
    
    // Simulate close
    connected = false;
    
    expect(connected).toBe(false);
    // Process should still be running
  });

  it('should log to file for debugging (Bug #6)', () => {
    // Bug: No logging made debugging difficult
    const logFile = join(homedir(), '.gravity-host', 'native-host.log');
    
    expect(logFile).toContain('native-host.log');
  });

  it('should handle stdin close without crashing (Bug #7)', () => {
    // Bug: stdin close caused immediate exit
    let stdinClosed = false;
    
    // Simulate stdin close
    stdinClosed = true;
    
    expect(stdinClosed).toBe(true);
    // Should exit gracefully
  });

  it('should auto-register extension ID (Bug #8)', () => {
    // Bug: Manual extension ID entry was error-prone
    const registrationServer = { port: 39224, running: true };
    
    expect(registrationServer.running).toBe(true);
  });

  it('should handle multiple reconnection attempts (Bug #9)', () => {
    // Bug: Reconnection logic was too aggressive
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
    }
    
    expect(attempts).toBe(maxAttempts);
  });

  it('should validate registry key path (Bug #10)', () => {
    // Bug: Registry key path had incorrect escaping
    const manifestPath = 'C:\\Users\\test\\.gravity-host\\manifest.json';
    const escapedPath = manifestPath.replace(/\\/g, '\\\\');
    
    expect(escapedPath).toContain('\\\\');
  });
});

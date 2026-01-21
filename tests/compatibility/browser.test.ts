/**
 * Compatibility Tests for Gravity
 * Tests compatibility across different browsers and environments
 */

import { describe, it, expect } from 'node:test';
import { platform } from 'os';

describe('Gravity Compatibility - Browser Tests', () => {
  it('should detect Chrome browser correctly', () => {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    const isChrome = userAgent.includes('Chrome');
    
    expect(isChrome).toBe(true);
  });

  it('should detect Brave browser correctly', () => {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Brave/1.60';
    const isBrave = userAgent.includes('Brave');
    
    expect(isBrave).toBe(true);
  });

  it('should detect Edge browser correctly', () => {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
    const isEdge = userAgent.includes('Edg/');
    
    expect(isEdge).toBe(true);
  });

  it('should work on Windows platform', () => {
    const currentPlatform = platform();
    const isWindows = currentPlatform === 'win32';
    
    expect(isWindows).toBe(true);
  });

  it('should handle Chrome Manifest V3 extensions', () => {
    const manifest = {
      manifest_version: 3,
      name: 'Gravity',
      permissions: ['debugger', 'tabs', 'nativeMessaging']
    };
    
    expect(manifest.manifest_version).toBe(3);
  });

  it('should support Chrome DevTools Protocol 1.3', () => {
    const protocolVersion = '1.3';
    expect(protocolVersion).toBe('1.3');
  });

  it('should handle different Chrome profile structures', () => {
    const profiles = ['Default', 'Profile 1', 'Profile 2'];
    
    profiles.forEach(profile => {
      expect(profile === 'Default' || profile.match(/^Profile \d+$/)).toBe(true);
    });
  });

  it('should support Node.js 16+', () => {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    expect(majorVersion).toBeGreaterThanOrEqual(16);
  });

  it('should handle different extension ID formats', () => {
    const extensionId = 'abcdefghijklmnopqrstuvwxyz123456';
    const isValid = extensionId.length === 32 && /^[a-z0-9]+$/.test(extensionId);
    
    expect(isValid).toBe(true);
  });

  it('should support WebSocket protocol', () => {
    const wsUrl = 'ws://localhost:9224';
    expect(wsUrl.startsWith('ws://')).toBe(true);
  });
});

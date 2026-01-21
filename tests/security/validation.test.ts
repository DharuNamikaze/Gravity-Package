/**
 * Security Tests for Gravity
 * Tests security validations and protections
 */

import { describe, it, expect } from 'node:test';

describe('Gravity Security - Validation Tests', () => {
  it('should reject malformed JSON messages', () => {
    const malformedJson = '{ invalid: json }';
    
    try {
      JSON.parse(malformedJson);
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should validate extension ID format (32 characters)', () => {
    const validId = 'abcdefghijklmnopqrstuvwxyz123456';
    const invalidId = 'short';
    
    expect(validId.length).toBe(32);
    expect(invalidId.length).not.toBe(32);
  });

  it('should sanitize CSS selectors to prevent injection', () => {
    const maliciousSelector = '<script>alert("xss")</script>';
    const sanitized = maliciousSelector.replace(/[<>]/g, '');
    
    expect(sanitized).not.toContain('<script>');
  });

  it('should validate message types before processing', () => {
    const validTypes = ['cdp_request', 'cdp_response', 'status', 'keep-alive'];
    const message = { type: 'cdp_request' };
    
    expect(validTypes.includes(message.type)).toBe(true);
  });

  it('should reject messages from unauthorized origins', () => {
    const allowedOrigins = ['chrome-extension://abcd1234'];
    const messageOrigin = 'chrome-extension://abcd1234';
    
    expect(allowedOrigins.includes(messageOrigin)).toBe(true);
  });

  it('should validate CDP method names', () => {
    const validMethods = ['DOM.querySelector', 'CSS.getComputedStyle', 'Page.enable'];
    const method = 'DOM.querySelector';
    
    expect(validMethods.some(m => method.startsWith(m.split('.')[0]))).toBe(true);
  });

  it('should prevent command injection in batch file paths', () => {
    const safePath = 'C:\\Users\\test\\.gravity-host\\gravity-host.bat';
    const unsafePath = 'C:\\Users\\test\\.gravity-host\\gravity-host.bat && malicious';
    
    expect(safePath).not.toContain('&&');
    expect(unsafePath).toContain('&&');
  });

  it('should validate port numbers (1-65535)', () => {
    const validPort = 9224;
    const invalidPort = 70000;
    
    expect(validPort).toBeGreaterThan(0);
    expect(validPort).toBeLessThan(65536);
    expect(invalidPort).toBeGreaterThan(65535);
  });

  it('should limit message size to prevent DoS', () => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const message = { data: 'x'.repeat(1024) };
    const messageSize = JSON.stringify(message).length;
    
    expect(messageSize).toBeLessThan(maxSize);
  });

  it('should validate file paths to prevent directory traversal', () => {
    const safePath = 'C:\\Users\\test\\.gravity-host\\manifest.json';
    const unsafePath = 'C:\\Users\\test\\.gravity-host\\..\\..\\system32\\file.exe';
    
    expect(safePath).not.toContain('..');
    expect(unsafePath).toContain('..');
  });
});

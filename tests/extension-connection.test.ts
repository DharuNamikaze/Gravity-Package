/**
 * Extension Connection Tests
 * Tests for Chrome extension connection to native host and debugger attachment
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { spawn, ChildProcess } from 'child_process';
import { WebSocket } from 'ws';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync, readFileSync } from 'fs';

const EXTENSION_DIR = join(homedir(), '.gravity-extension');
const MANIFEST_PATH = join(EXTENSION_DIR, 'manifest.json');
const BACKGROUND_JS_PATH = join(EXTENSION_DIR, 'background.js');

describe('Extension - Manifest Tests', () => {
  it('should have valid manifest.json', () => {
    assert.ok(existsSync(MANIFEST_PATH), 'Manifest file should exist');

    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
    assert.ok(manifest, 'Manifest should be valid JSON');
  });

  it('should have manifest_version 3', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
    assert.strictEqual(manifest.manifest_version, 3, 'Should use Manifest V3');
  });

  it('should have correct extension name', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
    assert.strictEqual(manifest.name, 'Gravity', 'Extension name should be Gravity');
  });

  it('should have required permissions', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
    const requiredPermissions = ['debugger', 'tabs', 'nativeMessaging', 'alarms', 'storage'];

    for (const permission of requiredPermissions) {
      assert.ok(manifest.permissions.includes(permission), 
        `Should have ${permission} permission`);
    }
  });

  it('should have host_permissions for all URLs', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
    assert.ok(manifest.host_permissions.includes('<all_urls>'), 
      'Should have all_urls host permission');
  });

  it('should have background service worker', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
    assert.ok(manifest.background, 'Should have background configuration');
    assert.strictEqual(manifest.background.service_worker, 'background.js', 
      'Should use background.js as service worker');
  });

  it('should have content scripts', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
    assert.ok(manifest.content_scripts, 'Should have content scripts');
    assert.ok(manifest.content_scripts.length > 0, 'Should have at least one content script');
  });

  it('should have action with popup', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
    assert.ok(manifest.action, 'Should have action');
    assert.strictEqual(manifest.action.default_popup, 'popup.html', 
      'Should have popup.html');
  });

  it('should have icons', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
    assert.ok(manifest.icons, 'Should have icons');
    assert.ok(manifest.icons['16'], 'Should have 16x16 icon');
    assert.ok(manifest.icons['48'], 'Should have 48x48 icon');
    assert.ok(manifest.icons['128'], 'Should have 128x128 icon');
  });

  it('should have valid version format', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
    const versionRegex = /^\d+\.\d+\.\d+$/;
    assert.ok(versionRegex.test(manifest.version), 
      'Version should be in format X.Y.Z');
  });
});

describe('Extension - Background Script Tests', () => {
  it('should have background.js file', () => {
    assert.ok(existsSync(BACKGROUND_JS_PATH), 'background.js should exist');
  });

  it('should define debugger state', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('debuggerState'), 'Should define debuggerState');
  });

  it('should define native messaging functions', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('connectNativeHost'), 'Should have connectNativeHost function');
    assert.ok(content.includes('sendToNativeHost'), 'Should have sendToNativeHost function');
  });

  it('should define debugger attachment functions', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('attachDebugger'), 'Should have attachDebugger function');
    assert.ok(content.includes('detachDebugger'), 'Should have detachDebugger function');
  });

  it('should define CDP command function', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('sendCDPCommand'), 'Should have sendCDPCommand function');
  });

  it('should define message handlers', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('chrome.runtime.onMessage.addListener'), 
      'Should have message listener');
  });

  it('should define registration functions', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('registerExtensionWithCLI'), 
      'Should have registration function');
  });

  it('should define keep-alive mechanism', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('startKeepAlive'), 'Should have keep-alive function');
  });

  it('should handle native host disconnection', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('nativePort.onDisconnect'), 
      'Should handle disconnection');
  });

  it('should use correct native host name', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('com.gravity'), 
      'Should use com.gravity as native host name');
  });
});

describe('Extension - Registration Tests', () => {
  it('should define registration ports', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('REGISTRATION_PORTS'), 'Should define registration ports');
    assert.ok(content.includes('39224'), 'Should include port 39224');
  });

  it('should define registration alarm', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('REGISTRATION_ALARM'), 'Should define registration alarm');
  });

  it('should define registration flag', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('REGISTRATION_FLAG'), 'Should define registration flag');
  });

  it('should check registration completion', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('isRegistrationComplete'), 
      'Should check registration status');
  });

  it('should mark registration complete', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('markRegistrationComplete'), 
      'Should mark registration complete');
  });

  it('should detect browser type', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('detectBrowser'), 'Should detect browser type');
  });

  it('should start registration retries', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('startRegistrationRetries'), 
      'Should start registration retries');
  });

  it('should handle registration on install', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('chrome.runtime.onInstalled'), 
      'Should handle install event');
  });

  it('should handle registration on startup', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('chrome.runtime.onStartup'), 
      'Should handle startup event');
  });

  it('should attempt immediate registration', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('immediateRegistration'), 
      'Should attempt immediate registration');
  });
});

describe('Extension - Debugger Management Tests', () => {
  it('should validate tab before attaching', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('chrome.tabs.get'), 'Should validate tab');
  });

  it('should check for system pages', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('chrome://'), 'Should check for chrome:// URLs');
    assert.ok(content.includes('chrome-extension://'), 
      'Should check for chrome-extension:// URLs');
  });

  it('should enable CDP domains', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('enableCDPDomains'), 'Should enable CDP domains');
    assert.ok(content.includes('DOM.enable'), 'Should enable DOM domain');
    assert.ok(content.includes('CSS.enable'), 'Should enable CSS domain');
  });

  it('should handle debugger detach', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('chrome.debugger.onDetach'), 
      'Should handle debugger detach');
  });

  it('should handle tab updates', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('chrome.tabs.onUpdated'), 
      'Should handle tab updates');
  });

  it('should handle tab removal', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('chrome.tabs.onRemoved'), 
      'Should handle tab removal');
  });

  it('should use CDP protocol version 1.3', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('1.3'), 'Should use CDP protocol version 1.3');
  });

  it('should implement timeout for CDP commands', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('setTimeout'), 'Should implement timeout');
    assert.ok(content.includes('12000'), 'Should use 12 second timeout');
  });

  it('should track debugger state', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('debuggerState.attached'), 
      'Should track attached state');
    assert.ok(content.includes('debuggerState.tabId'), 
      'Should track tab ID');
  });

  it('should provide debugger status', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('getDebuggerStatus'), 
      'Should provide status function');
  });
});

describe('Extension - Message Handling Tests', () => {
  it('should handle attach action', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes("request.action === 'attach'"), 
      'Should handle attach action');
  });

  it('should handle detach action', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes("request.action === 'detach'"), 
      'Should handle detach action');
  });

  it('should handle status action', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes("request.action === 'status'"), 
      'Should handle status action');
  });

  it('should handle CDP action', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes("request.action === 'cdp'"), 
      'Should handle CDP action');
  });

  it('should handle diagnose action', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes("request.action === 'diagnose'"), 
      'Should handle diagnose action');
  });

  it('should handle external messages', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('chrome.runtime.onMessageExternal'), 
      'Should handle external messages');
  });

  it('should handle GET_EXTENSION_ID request', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('GET_EXTENSION_ID'), 
      'Should handle extension ID request');
  });

  it('should validate CDP requests', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('debuggerState.attached'), 
      'Should validate debugger state');
    assert.ok(content.includes('domainsEnabled'), 
      'Should validate domains enabled');
  });

  it('should send responses with sendResponse', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('sendResponse'), 
      'Should use sendResponse');
  });

  it('should return true for async handlers', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('return true'), 
      'Should return true for async handlers');
  });
});

describe('Extension - Native Messaging Tests', () => {
  it('should connect to native host', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('chrome.runtime.connectNative'), 
      'Should connect to native host');
  });

  it('should handle native host messages', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('nativePort.onMessage.addListener'), 
      'Should listen for messages');
  });

  it('should handle native host disconnection', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('nativePort.onDisconnect.addListener'), 
      'Should handle disconnection');
  });

  it('should auto-reconnect to native host', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('setTimeout') && content.includes('connectNativeHost'), 
      'Should auto-reconnect');
  });

  it('should send keep-alive messages', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('keep-alive'), 
      'Should send keep-alive messages');
  });

  it('should handle CDP requests from native host', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('cdp_request'), 
      'Should handle CDP requests');
  });

  it('should send CDP responses to native host', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('cdp_response'), 
      'Should send CDP responses');
  });

  it('should handle status messages', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes("message.type === 'status'"), 
      'Should handle status messages');
  });

  it('should post messages to native host', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('nativePort.postMessage'), 
      'Should post messages');
  });

  it('should disconnect from native host', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('nativePort.disconnect'), 
      'Should disconnect');
  });
});

describe('Extension - Error Handling Tests', () => {
  it('should handle chrome.runtime.lastError', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('chrome.runtime.lastError'), 
      'Should check for runtime errors');
  });

  it('should handle debugger attachment errors', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('Failed to attach debugger'), 
      'Should handle attachment errors');
  });

  it('should handle CDP command errors', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('CDP Error'), 
      'Should handle CDP errors');
  });

  it('should handle CDP timeout', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('timed out'), 
      'Should handle timeout');
  });

  it('should handle native host connection errors', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('Failed to connect to native host'), 
      'Should handle connection errors');
  });

  it('should handle message send errors', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('Failed to send'), 
      'Should handle send errors');
  });

  it('should handle tab not found errors', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('Tab not found'), 
      'Should handle tab errors');
  });

  it('should handle invalid tab errors', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('Invalid tab'), 
      'Should handle invalid tab');
  });

  it('should handle system page errors', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('Cannot attach debugger to system page'), 
      'Should handle system pages');
  });

  it('should catch and log errors', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('catch') && content.includes('console.error'), 
      'Should catch and log errors');
  });
});

describe('Extension - State Management Tests', () => {
  it('should initialize debugger state', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('debuggerState = {'), 
      'Should initialize state');
  });

  it('should track attached status', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('attached: false'), 
      'Should track attached status');
  });

  it('should track tab ID', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('tabId: null'), 
      'Should track tab ID');
  });

  it('should track domains enabled', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('domainsEnabled: false'), 
      'Should track domains');
  });

  it('should track last error', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('lastError: null'), 
      'Should track errors');
  });

  it('should track attachment time', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('attachmentTime'), 
      'Should track time');
  });

  it('should reset state on detach', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('debuggerState.attached = false'), 
      'Should reset state');
  });

  it('should update state on attach', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('debuggerState.attached = true'), 
      'Should update state');
  });

  it('should track native host connection', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('nativeHostConnected'), 
      'Should track connection');
  });

  it('should provide comprehensive status', () => {
    const content = readFileSync(BACKGROUND_JS_PATH, 'utf-8');
    assert.ok(content.includes('getDebuggerStatus'), 
      'Should provide status');
  });
});

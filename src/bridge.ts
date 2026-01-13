/**
 * Main Gravity class
 * Provides unified API for browser diagnostics
 */

import { BrowserConnection } from './browser-connection.js';
import { DiagnosticsEngine } from './diagnostics.js';
import { DiagnosticResult, ConnectionStatus, BridgeOptions } from './types.js';

export class Gravity {
  private connection: BrowserConnection;
  private diagnostics: DiagnosticsEngine;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(options: BridgeOptions = {}) {
    this.connection = new BrowserConnection(options);
    this.diagnostics = new DiagnosticsEngine(this.connection);
  }

  /**
   * Connect to browser
   */
  async connectBrowser(port?: number): Promise<void> {
    if (port) {
      this.connection = new BrowserConnection({ port });
      this.diagnostics = new DiagnosticsEngine(this.connection);
    }

    try {
      await this.connection.connect();
      this.emit('connected');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Disconnect from browser
   */
  async disconnectBrowser(): Promise<void> {
    await this.connection.disconnect();
    this.emit('disconnected');
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection.getStatus().connected;
  }

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatus {
    return this.connection.getStatus();
  }

  /**
   * Diagnose layout issues
   */
  async diagnoseLayout(selector: string): Promise<DiagnosticResult> {
    if (!this.isConnected()) {
      throw new Error('Not connected to browser. Call connectBrowser() first.');
    }

    return this.diagnostics.diagnose(selector);
  }

  /**
   * Event emitter
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, ...args: any[]): void {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)!) {
        callback(...args);
      }
    }
  }
}

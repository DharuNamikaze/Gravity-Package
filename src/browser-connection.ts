/**
 * Browser connection management
 * Handles WebSocket connection to native host
 */

import { WebSocket } from 'ws';
import { ConnectionStatus, BridgeOptions } from './types.js';

export class BrowserConnection {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private port: number;
  private timeout: number;
  private autoReconnect: boolean;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = Infinity;
  private reconnectInterval = 2000;
  private messageIdCounter = 1;
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();

  constructor(options: BridgeOptions = {}) {
    this.port = options.port || 9224;
    this.timeout = options.timeout || 10000;
    this.autoReconnect = options.autoReconnect !== false;
  }

  /**
   * Connect to browser via native host
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.attemptConnect(resolve, reject);
    });
  }

  /**
   * Attempt to connect to native host
   */
  private attemptConnect(resolve: () => void, reject: (error: Error) => void): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      resolve();
      return;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
      this.socket = null;
    }

    const url = `ws://localhost:${this.port}`;
    this.reconnectAttempts++;

    if (this.reconnectAttempts === 1) {
      console.log(`🔌 Connecting to Gravity at ${url}...`);
    }

    const ws = new WebSocket(url);
    this.socket = ws;

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error(`Connection timeout after ${this.timeout}ms`));
    }, this.timeout);

    ws.on('open', () => {
      clearTimeout(timeout);
      console.log('✅ Connected to Gravity');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      resolve();
    });

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    });

    ws.on('close', () => {
      clearTimeout(timeout);
      console.log('❌ Gravity connection closed');
      this.isConnected = false;
      this.socket = null;

      // Reject all pending requests
      for (const [id, pending] of this.pendingRequests) {
        clearTimeout(pending.timeout);
        pending.reject(new Error('Connection closed'));
        this.pendingRequests.delete(id);
      }

      // Auto-reconnect if enabled
      if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    });

    ws.on('error', (error: any) => {
      clearTimeout(timeout);
      if (error.code !== 'ECONNREFUSED') {
        console.error('Connection error:', error.message);
      }
      reject(error);
    });
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.attemptConnect(() => {}, () => {});
    }, this.reconnectInterval);
  }

  /**
   * Disconnect from browser
   */
  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
      this.socket = null;
    }

    this.isConnected = false;

    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Disconnected'));
      this.pendingRequests.delete(id);
    }
  }

  /**
   * Check if connected
   */
  getStatus(): ConnectionStatus {
    return {
      connected: this.isConnected,
      message: this.isConnected ? 'Connected' : 'Disconnected',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Send CDP command
   */
  async sendCommand(method: string, params: any = {}): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Not connected to Gravity');
    }

    const id = this.messageIdCounter++;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Command ${method} timed out after ${this.timeout}ms`));
      }, this.timeout);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      const message = {
        type: 'cdp_request',
        id,
        method,
        params,
      };

      try {
        this.socket!.send(JSON.stringify(message));
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: any): void {
    if (message.type === 'cdp_response') {
      const pending = this.pendingRequests.get(message.id);

      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.id);

        if (message.error) {
          pending.reject(new Error(message.error.message || 'Command failed'));
        } else {
          pending.resolve(message.result);
        }
      }
    }
  }
}

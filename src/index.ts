/**
 * gravity-core
 * 
 * Universal Gravity - Connect any IDE or AI assistant to browser DevTools
 * for real-time layout diagnostics and element inspection.
 * 
 * No manual setup needed! Just:
 * 1. npm install gravity-core
 * 2. Load extension in Chrome (chrome://extensions)
 * 3. Add MCP config to your IDE
 * 4. Ask your AI to diagnose elements!
 * 
 * Usage:
 * ```typescript
 * import { Gravity } from 'gravity-core';
 * 
 * const bridge = new Gravity();
 * await bridge.connectBrowser();
 * const result = await bridge.diagnoseLayout('#modal');
 * console.log(result);
 * ```
 */

export { Gravity } from './bridge.js';
export { BrowserConnection } from './browser-connection.js';
export { DiagnosticsEngine } from './diagnostics.js';
export * from './types.js';

// ============================================================================
// Gravity - Background Script
// Handles debugger attachment and WebSocket server for MCP communication
// ============================================================================

// Debugger state
let debuggerTabId = null;
let debuggerState = {
  attached: false,
  tabId: null,
  domainsEnabled: false,
  lastError: null,
  attachmentTime: null
};

// WebSocket server state
const WS_PORT = 9224;
let wsServer = null;
let wsConnections = new Set();

// Native messaging state (legacy - keeping for compatibility)
let nativePort = null;
let nativeHostConnected = false;
let keepAliveInterval = null;

// ============================================================================
// WebSocket Server (Extension <-> MCP Server)
// ============================================================================

/**
 * Start WebSocket server for MCP communication
 * This allows the MCP server to connect and send CDP commands
 */
async function startWebSocketServer() {
  if (wsServer) {
    console.log('[WebSocket] Server already running on port', WS_PORT);
    return;
  }

  try {
    console.log('[WebSocket] Starting server on port', WS_PORT);
    
    // Create WebSocket server using chrome.sockets API
    // Note: Chrome extensions can't directly create WebSocket servers
    // We need to use a different approach - HTTP server with upgrade
    
    // For now, we'll use a simpler approach: Native Messaging as the bridge
    // The MCP server will connect via Native Messaging instead of WebSocket
    
    console.log('[WebSocket] Using Native Messaging bridge instead');
    connectNativeHost();
    
  } catch (error) {
    console.error('[WebSocket] Failed to start server:', error);
  }
}

/**
 * Stop WebSocket server
 */
function stopWebSocketServer() {
  if (wsServer) {
    console.log('[WebSocket] Stopping server');
    
    // Close all connections
    for (const ws of wsConnections) {
      try {
        ws.close();
      } catch (e) {
        // Ignore
      }
    }
    wsConnections.clear();
    
    wsServer = null;
  }
  
  // Also disconnect native host
  disconnectNativeHost();
}

/**
 * Broadcast message to all WebSocket clients
 */
function broadcastToWebSocket(message) {
  // For now, send via native messaging
  sendToNativeHost(message);
}

// ============================================================================
// Native Messaging (Extension <-> Native Host)
// ============================================================================

/**
 * Connect to native messaging host
 */
function connectNativeHost() {
  if (nativePort) {
    console.log('Native host already connected');
    return;
  }
  
  try {
    console.log('Connecting to native messaging host...');
    nativePort = chrome.runtime.connectNative('com.gravity');
    
    nativePort.onMessage.addListener((message) => {
      console.log('Received from native host:', message);
      handleNativeMessage(message);
    });
    
    nativePort.onDisconnect.addListener(() => {
      const error = chrome.runtime.lastError;
      console.log('Native host disconnected:', error?.message || 'unknown reason');
      nativePort = null;
      nativeHostConnected = false;
      stopKeepAlive();
      
      // Auto-reconnect after 2 seconds if debugger is attached
      if (debuggerState.attached) {
        setTimeout(() => {
          console.log('Attempting to reconnect to native host...');
          connectNativeHost();
        }, 2000);
      }
    });
    
    nativeHostConnected = true;
    console.log('Connected to native messaging host');
    
    // Start keep-alive to prevent service worker termination
    startKeepAlive();
    
  } catch (error) {
    console.error('Failed to connect to native host:', error);
    nativePort = null;
    nativeHostConnected = false;
  }
}

/**
 * Keep-alive mechanism to prevent service worker termination
 */
function startKeepAlive() {
  if (keepAliveInterval) return;
  
  keepAliveInterval = setInterval(() => {
    if (nativePort) {
      // Send a no-op message to keep the connection alive
      try {
        nativePort.postMessage({ type: 'keep-alive' });
      } catch (e) {
        // Connection may be dead
        stopKeepAlive();
      }
    }
  }, 20000); // Every 20 seconds
}

/**
 * Stop keep-alive mechanism
 */
function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

/**
 * Disconnect from native messaging host
 */
function disconnectNativeHost() {
  stopKeepAlive();
  
  if (nativePort) {
    nativePort.disconnect();
    nativePort = null;
    nativeHostConnected = false;
    console.log('Disconnected from native host');
  }
}

/**
 * Send message to native host
 */
function sendToNativeHost(message) {
  // Auto-reconnect if not connected
  if (!nativePort || !nativeHostConnected) {
    connectNativeHost();
  }
  
  if (!nativePort) {
    console.error('Cannot send to native host - not connected');
    return false;
  }
  
  try {
    nativePort.postMessage(message);
    console.log('Sent to native host:', message);
    return true;
  } catch (error) {
    console.error('Failed to send to native host:', error);
    return false;
  }
}

/**
 * Handle messages from native host (CDP requests from MCP server)
 */
function handleNativeMessage(message) {
  // Handle status messages from native host
  if (message.type === 'status') {
    console.log('Native host status:', message);
    return;
  }
  
  // Handle CDP requests from MCP server
  if (message.type === 'cdp_request') {
    const { id, method, params } = message;
    
    if (!debuggerState.attached) {
      sendToNativeHost({
        type: 'cdp_response',
        id,
        error: { message: 'Debugger not attached' }
      });
      return;
    }
    
    // Execute CDP command with error handling
    sendCDPCommand(debuggerState.tabId, method, params || {})
      .then(result => {
        try {
          sendToNativeHost({
            type: 'cdp_response',
            id,
            result
          });
        } catch (error) {
          console.error('Failed to send CDP response:', error);
        }
      })
      .catch(error => {
        try {
          sendToNativeHost({
            type: 'cdp_response',
            id,
            error: { message: error.message }
          });
        } catch (sendError) {
          console.error('Failed to send CDP error response:', sendError);
        }
      });
  }
}

// ============================================================================
// Debugger Management
// ============================================================================

/**
 * Attach debugger to current tab with enhanced error handling
 */
function attachDebugger(tabId) {
  debuggerState.lastError = null;
  
  // Check if tab exists and is valid
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) {
      const error = chrome.runtime.lastError?.message || 'Tab not found or inaccessible';
      debuggerState.lastError = error;
      debuggerState.attached = false;
      debuggerState.tabId = null;
      debuggerState.domainsEnabled = false;
      console.error('Failed to get tab:', error);
      return;
    }
    
    // Check if tab URL is debuggable
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://')) {
      const error = `Cannot attach debugger to system page: ${tab.url}`;
      debuggerState.lastError = error;
      console.error(error);
      return;
    }
    
    // Detach from previous tab if attached
    if (debuggerState.attached && debuggerState.tabId && debuggerState.tabId !== tabId) {
      detachDebugger(debuggerState.tabId);
    }
    
    console.log(`Attempting to attach debugger to tab ${tabId} (${tab.url})`);
    
    // Attach debugger
    chrome.debugger.attach({ tabId }, '1.3', () => {
      if (chrome.runtime.lastError) {
        const error = chrome.runtime.lastError.message;
        console.error('Failed to attach debugger:', error);
        debuggerState.lastError = error;
        debuggerState.attached = false;
        debuggerState.tabId = null;
        debuggerState.domainsEnabled = false;
        return;
      }
      
      debuggerTabId = tabId;
      debuggerState.attached = true;
      debuggerState.tabId = tabId;
      debuggerState.domainsEnabled = false;
      debuggerState.attachmentTime = Date.now();
      
      console.log(`Successfully attached debugger to tab ${tabId}`);
      
      // Enable required CDP domains
      enableCDPDomains(tabId);
      
      // Start WebSocket server (or connect to native host)
      startWebSocketServer();
    });
  });
}

/**
 * Enable required CDP domains
 */
/**
 * Enable required CDP domains
 */
function enableCDPDomains(tabId) {
  const domains = ['DOM', 'CSS', 'Page', 'Overlay'];
  let enabledCount = 0;
  
  function enableNextDomain() {
    if (enabledCount >= domains.length) {
      debuggerState.domainsEnabled = true;
      console.log('All CDP domains enabled successfully');
      return;
    }
    
    const domain = domains[enabledCount];
    console.log(`Enabling ${domain} domain...`);
    
    chrome.debugger.sendCommand({ tabId }, `${domain}.enable`, {}, () => {
      if (chrome.runtime.lastError) {
        console.warn(`Failed to enable ${domain}:`, chrome.runtime.lastError.message);
        debuggerState.domainsEnabled = false;
        return;
      }
      
      console.log(`Successfully enabled ${domain} domain`);
      enabledCount++;
      enableNextDomain();
    });
  }
  
  enableNextDomain();
}

/**
 * Detach debugger with proper cleanup
 */
function detachDebugger(tabId = null) {
  const targetTabId = tabId || debuggerState.tabId || debuggerTabId;
  
  // Stop WebSocket server and disconnect native host
  stopWebSocketServer();
  
  if (!targetTabId) {
    console.log('No debugger to detach');
    return;
  }
  
  console.log(`Detaching debugger from tab ${targetTabId}`);
  chrome.debugger.detach({ tabId: targetTabId }, () => {
    if (chrome.runtime.lastError) {
      console.error('Failed to detach debugger:', chrome.runtime.lastError.message);
    }
    
    // Reset state
    debuggerTabId = null;
    debuggerState.attached = false;
    debuggerState.tabId = null;
    debuggerState.domainsEnabled = false;
    debuggerState.lastError = null;
    debuggerState.attachmentTime = null;
    
    console.log('Debugger detached successfully');
  });
}

/**
 * Send CDP command with timeout
 */
async function sendCDPCommand(tabId, method, params = {}) {
  return new Promise((resolve, reject) => {
    if (!debuggerState.attached || debuggerState.tabId !== tabId) {
      const error = `Debugger not attached to tab ${tabId}`;
      console.error('CDP Error:', error, 'State:', debuggerState);
      reject(new Error(error));
      return;
    }
    
    let responded = false;
    
    // Use 12 second timeout (longer than MCP server's 10 second timeout)
    // This ensures the MCP server times out first, preventing state corruption
    const timeout = setTimeout(() => {
      responded = true;
      const errorMsg = `CDP command ${method} timed out after 12 seconds`;
      console.error('CDP Timeout:', errorMsg);
      reject(new Error(errorMsg));
    }, 12000);
    
    console.log(`Sending CDP command: ${method} to tab ${tabId}`);
    
    chrome.debugger.sendCommand({ tabId }, method, params, (result) => {
      clearTimeout(timeout);
      
      // Ignore response if we already timed out
      if (responded) {
        console.warn(`Ignoring late response for ${method} (already timed out)`);
        return;
      }
      
      responded = true;
      
      if (chrome.runtime.lastError) {
        const errorMsg = `CDP command ${method} failed: ${chrome.runtime.lastError.message}`;
        console.error('CDP Error:', errorMsg);
        reject(new Error(errorMsg));
      } else {
        console.log(`CDP command ${method} succeeded`);
        resolve(result);
      }
    });
  });
}

/**
 * Get comprehensive debugger status
 */
function getDebuggerStatus() {
  return {
    connected: debuggerState.attached,
    tabId: debuggerState.tabId,
    domainsEnabled: debuggerState.domainsEnabled,
    lastError: debuggerState.lastError,
    attachmentTime: debuggerState.attachmentTime,
    uptime: debuggerState.attachmentTime ? Date.now() - debuggerState.attachmentTime : null,
    nativeHostConnected: nativeHostConnected
  };
}


// ============================================================================
// Message Handlers (Popup <-> Background)
// ============================================================================

/**
 * Handle external messages (from CLI or other external sources)
 * This allows the CLI to query the extension ID without scanning the filesystem
 */
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_EXTENSION_ID') {
    console.log('External request for extension ID from:', sender);
    sendResponse({ 
      extensionId: chrome.runtime.id,
      success: true 
    });
    return true;
  }
  
  // Ignore other external messages
  sendResponse({ success: false, error: 'Unknown external request' });
  return true;
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'attach') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }
      
      const tab = tabs[0];
      if (!tab.id) {
        sendResponse({ success: false, error: 'Invalid tab ID' });
        return;
      }
      
      attachDebugger(tab.id);
      // Send response after a short delay to allow attachment to complete
      setTimeout(() => {
        sendResponse({ 
          success: debuggerState.attached, 
          tabId: debuggerState.tabId,
          error: debuggerState.lastError
        });
      }, 100);
    });
    return true;
  }
  
  if (request.action === 'detach') {
    detachDebugger();
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'status') {
    const status = getDebuggerStatus();
    sendResponse(status);
    return true;
  }
  
  // Forward CDP commands with validation
  if (request.action === 'cdp') {
    if (!debuggerState.attached || !debuggerState.domainsEnabled) {
      sendResponse({ 
        success: false, 
        error: 'Debugger not properly attached or domains not enabled' 
      });
      return true;
    }
    
    sendCDPCommand(debuggerState.tabId, request.method, request.params)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Handle diagnosis requests
  if (request.action === 'diagnose') {
    if (!debuggerState.attached) {
      sendResponse({ 
        success: false, 
        error: 'Debugger not attached. Please connect to a tab first.' 
      });
      return true;
    }
    
    chrome.tabs.sendMessage(debuggerState.tabId, { 
      action: 'diagnose', 
      selector: request.selector 
    }, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ 
          success: false, 
          error: `Content script communication failed: ${chrome.runtime.lastError.message}` 
        });
      } else {
        sendResponse({ success: true, result: response });
      }
    });
    return true;
  }
});

// ============================================================================
// Event Handlers
// ============================================================================

// Handle debugger detach
chrome.debugger.onDetach.addListener((source, reason) => {
  console.error(`🔴 DEBUGGER DETACHED from tab ${source.tabId}: ${reason}`);
  console.error('Debugger state at detach:', debuggerState);
  
  if (source.tabId === debuggerState.tabId) {
    debuggerState.attached = false;
    debuggerState.tabId = null;
    debuggerState.domainsEnabled = false;
    debuggerState.lastError = reason === 'target_closed' ? 'Tab was closed' : `Detached: ${reason}`;
    debuggerTabId = null;
    
    // Disconnect native host when debugger detaches
    disconnectNativeHost();
  }
  
  // Notify popup if it's open
  chrome.runtime.sendMessage({ 
    action: 'debugger_detached', 
    tabId: source.tabId, 
    reason 
  }).catch(() => {
    // Popup might not be open, ignore error
  });
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === debuggerState.tabId && changeInfo.status === 'loading') {
    console.log(`Attached tab ${tabId} is reloading`);
    debuggerState.domainsEnabled = false;
  }
});

// Handle tab removal
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (tabId === debuggerState.tabId) {
    console.log(`Attached tab ${tabId} was closed`);
    debuggerState.attached = false;
    debuggerState.tabId = null;
    debuggerState.domainsEnabled = false;
    debuggerState.lastError = 'Tab was closed';
    debuggerTabId = null;
    
    stopWebSocketServer();
  }
});

// ============================================================================
// Extension Self-Registration
// Automatically reports extension ID to CLI during setup
// ============================================================================

const REGISTRATION_ALARM = 'gravity-register';
const REGISTRATION_FLAG = 'gravity_registration_done';
const REGISTRATION_PORTS = [39224, 39225, 39226, 39227, 39228];
const REGISTRATION_RETRY_INTERVAL = 1; // minutes (for ongoing retries)
const REGISTRATION_INITIAL_INTERVAL = 0.1; // minutes (6 seconds - for immediate setup)

/**
 * Check if registration has already been completed
 */
async function isRegistrationComplete() {
  return new Promise((resolve) => {
    chrome.storage.local.get([REGISTRATION_FLAG], (result) => {
      resolve(result[REGISTRATION_FLAG] === true);
    });
  });
}

/**
 * Mark registration as complete and stop all retries
 */
async function markRegistrationComplete() {
  console.log('[Registration] ✅ Marking registration as complete');
  
  // Persist flag
  await new Promise((resolve) => {
    chrome.storage.local.set({ [REGISTRATION_FLAG]: true }, resolve);
  });
  
  // Clear alarm to stop retries
  chrome.alarms.clear(REGISTRATION_ALARM, (wasCleared) => {
    if (wasCleared) {
      console.log('[Registration] ⏹️  Stopped retry alarm');
    }
  });
}

/**
 * Register extension ID with local CLI setup server
 * This eliminates the need for manual extension ID entry
 */
async function registerExtensionWithCLI() {
  const extensionId = chrome.runtime.id;
  
  console.log('[Registration] Attempting registration with extension ID:', extensionId);
  
  for (const port of REGISTRATION_PORTS) {
    try {
      const url = `http://127.0.0.1:${port}/register`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extensionId: extensionId,
          browser: detectBrowser(),
          timestamp: Date.now()
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('[Registration] ✅ Successfully registered with CLI:', result);
        
        // Mark as complete and stop retries
        await markRegistrationComplete();
        
        return true;
      } else {
        console.log(`[Registration] Port ${port} responded with status ${response.status}`);
      }
    } catch (error) {
      // Port not available, continue to next
      continue;
    }
  }
  
  console.log('[Registration] ⚠️ No CLI setup server found (will retry via alarm)');
  return false;
}

/**
 * Detect browser type
 */
function detectBrowser() {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('edg/')) return 'edge';
  if (userAgent.includes('brave')) return 'brave';
  if (userAgent.includes('chrome')) return 'chrome';
  return 'chromium';
}

/**
 * Start periodic registration attempts using chrome.alarms
 * Stops automatically after successful registration
 */
async function startRegistrationRetries() {
  // Check if already registered
  const isComplete = await isRegistrationComplete();
  if (isComplete) {
    console.log('[Registration] Already registered, skipping retries');
    return;
  }
  
  console.log('[Registration] Starting periodic registration attempts');
  
  // Create alarm for periodic retries with short initial interval
  // This helps catch the setup-native-host command if it's running
  chrome.alarms.create(REGISTRATION_ALARM, {
    delayInMinutes: REGISTRATION_INITIAL_INTERVAL,
    periodInMinutes: REGISTRATION_INITIAL_INTERVAL
  });
  
  // After 2 minutes, switch to longer interval to reduce background activity
  setTimeout(() => {
    chrome.alarms.get(REGISTRATION_ALARM, (alarm) => {
      if (alarm) {
        console.log('[Registration] Switching to longer retry interval');
        chrome.alarms.create(REGISTRATION_ALARM, {
          delayInMinutes: REGISTRATION_RETRY_INTERVAL,
          periodInMinutes: REGISTRATION_RETRY_INTERVAL
        });
      }
    });
  }, 2 * 60 * 1000); // 2 minutes
}

/**
 * Handle alarm events for registration retries
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === REGISTRATION_ALARM) {
    console.log('[Registration] Alarm triggered, attempting registration...');
    
    // Check if already complete (in case flag was set elsewhere)
    const isComplete = await isRegistrationComplete();
    if (isComplete) {
      console.log('[Registration] Already complete, clearing alarm');
      chrome.alarms.clear(REGISTRATION_ALARM);
      return;
    }
    
    // Attempt registration
    await registerExtensionWithCLI();
  }
});

/**
 * Attempt registration on extension install
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Lifecycle] Extension installed/updated:', details.reason);
  
  if (details.reason === 'install' || details.reason === 'update') {
    // Check if already registered
    const isComplete = await isRegistrationComplete();
    if (isComplete) {
      console.log('[Registration] Already registered, skipping');
      return;
    }
    
    // Try immediate registration
    console.log('[Registration] Attempting immediate registration...');
    const success = await registerExtensionWithCLI();
    
    // If failed, start periodic retries
    if (!success) {
      console.log('[Registration] Immediate registration failed, starting retries');
      await startRegistrationRetries();
    }
  }
});

/**
 * Attempt registration on browser startup
 */
chrome.runtime.onStartup.addListener(async () => {
  console.log('[Lifecycle] Browser started');
  
  // Check if already registered
  const isComplete = await isRegistrationComplete();
  if (isComplete) {
    console.log('[Registration] Already registered, skipping');
    return;
  }
  
  // Try immediate registration
  console.log('[Registration] Attempting registration on startup...');
  const success = await registerExtensionWithCLI();
  
  // If failed, start periodic retries
  if (!success) {
    console.log('[Registration] Startup registration failed, starting retries');
    await startRegistrationRetries();
  }
});

// ============================================================================
// Immediate Registration on Script Load
// This handles the case where the extension is already running when setup starts
// ============================================================================

(async function immediateRegistration() {
  console.log('[Lifecycle] Background script loaded');
  
  // Check if already registered
  const isComplete = await isRegistrationComplete();
  if (isComplete) {
    console.log('[Registration] Already registered, skipping immediate attempt');
    return;
  }
  
  // Try immediate registration (in case setup is running right now)
  console.log('[Registration] Attempting immediate registration...');
  const success = await registerExtensionWithCLI();
  
  // If failed, start periodic retries
  if (!success) {
    console.log('[Registration] Immediate registration failed, starting retries');
    await startRegistrationRetries();
  }
})();

console.log('Gravity extension loaded');

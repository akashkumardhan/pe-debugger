// Bridge script - runs in ISOLATED world to relay messages to background
// Listens to window.postMessage from MAIN world content script

interface DevDebugMessage {
  source: 'devdebug-ai';
  type: 'CONSOLE_ERROR' | 'PE_DETECTION' | 'PE_CONFIG' | 'PE_SUBSCRIBER_DETAILS' | 'PAGE_SESSION_START' | 'PE_LOG' | 'PE_DEBUG_STATUS' | 'SERVICE_WORKER_INFO';
  error?: unknown;
  log?: unknown;
  hasPushEngage?: boolean;
  debugActive?: boolean;
  url?: string;
  config?: unknown;
  available?: boolean;
  data?: unknown;
  sessionId?: number;
}

// Listen for messages from the MAIN world content script
window.addEventListener('message', (event) => {
  // Only accept messages from our content script
  if (event.source !== window) return;
  
  const data = event.data as DevDebugMessage;
  if (data?.source !== 'devdebug-ai') return;

  // Forward to background service worker
  try {
    chrome.runtime.sendMessage({
      type: data.type,
      error: data.error,
      log: data.log,
      hasPushEngage: data.hasPushEngage,
      debugActive: data.debugActive,
      url: data.url,
      config: data.config,
      available: data.available,
      subscriberDetails: data.data,
      serviceWorkerInfo: data.data, // Used for SERVICE_WORKER_INFO type
      sessionId: data.sessionId
    }).catch(() => {
      // Extension context may be invalidated, ignore
    });
  } catch {
    // Extension might be reloading, ignore
  }
});

// Handle requests from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'ok' });
  }
  return true;
});


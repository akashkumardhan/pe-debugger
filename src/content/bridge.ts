// Bridge script - runs in ISOLATED world to relay messages to background
// Listens to window.postMessage from MAIN world content script

interface DevDebugMessage {
  source: 'devdebug-ai';
  type: 'CONSOLE_ERROR' | 'PE_DETECTION' | 'PE_CONFIG';
  error?: unknown;
  hasPushEngage?: boolean;
  url?: string;
  config?: unknown;
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
      hasPushEngage: data.hasPushEngage,
      url: data.url,
      config: data.config
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


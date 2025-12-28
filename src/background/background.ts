// DevDebug AI - Background Service Worker
import type { ConsoleError, PEAppConfig } from '../types';

interface StorageData {
  errors: ConsoleError[];
  peConfig: PEAppConfig | null;
  peAvailable: boolean;
  peTabUrls: Record<number, boolean>;
}

const MAX_ERRORS = 50;

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    errors: [],
    peConfig: null,
    peAvailable: false,
    peTabUrls: {}
  });
  console.log('DevDebug AI installed');
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  switch (message.type) {
    case 'CONSOLE_ERROR':
      handleConsoleError(message.error);
      break;

    case 'PE_DETECTION':
      handlePEDetection(message.hasPushEngage, message.url, tabId);
      break;

    case 'PE_CONFIG':
      handlePEConfig(message.config, tabId);
      break;

    case 'GET_ERRORS':
      getErrors().then(sendResponse);
      return true;

    case 'CLEAR_ERRORS':
      clearErrors().then(() => sendResponse({ success: true }));
      return true;

    case 'GET_PE_CONFIG':
      getPEConfig().then(sendResponse);
      return true;

    case 'GET_PE_STATUS':
      getPEStatus(tabId).then(sendResponse);
      return true;

    case 'CLEAR_PE_CONFIG':
      clearPEConfig().then(() => sendResponse({ success: true }));
      return true;
  }

  return true;
});

// Handle console errors
async function handleConsoleError(error: ConsoleError): Promise<void> {
  if (!error) return;

  try {
    const { errors = [] } = await chrome.storage.local.get('errors') as { errors: ConsoleError[] };

    // Check for duplicate (same message and URL within last 5 seconds)
    const isDuplicate = errors.some(e => 
      e.message === error.message && 
      e.url === error.url &&
      Math.abs(e.timestamp - error.timestamp) < 5000
    );

    if (!isDuplicate) {
      // Add new error and maintain max limit (FIFO)
      const updatedErrors = [...errors, error].slice(-MAX_ERRORS);
      await chrome.storage.local.set({ errors: updatedErrors });

      // Update badge
      updateBadge(updatedErrors.length);
    }
  } catch (err) {
    console.error('DevDebug: Failed to store error:', err);
  }
}

// Handle PushEngage detection
async function handlePEDetection(
  hasPushEngage: boolean,
  url: string,
  tabId?: number
): Promise<void> {
  try {
    const { peTabUrls = {} } = await chrome.storage.local.get('peTabUrls') as { peTabUrls: Record<number, boolean> };

    if (tabId) {
      peTabUrls[tabId] = hasPushEngage;
    }

    await chrome.storage.local.set({
      peAvailable: hasPushEngage,
      peTabUrls
    });
  } catch (err) {
    console.error('DevDebug: Failed to store PE detection:', err);
  }
}

// Handle PushEngage config
async function handlePEConfig(config: PEAppConfig, tabId?: number): Promise<void> {
  if (!config) return;

  try {
    await chrome.storage.local.set({ peConfig: config });
  } catch (err) {
    console.error('DevDebug: Failed to store PE config:', err);
  }
}

// Get all stored errors
async function getErrors(): Promise<ConsoleError[]> {
  try {
    const { errors = [] } = await chrome.storage.local.get('errors') as { errors: ConsoleError[] };
    return errors;
  } catch {
    return [];
  }
}

// Clear all errors
async function clearErrors(): Promise<void> {
  try {
    await chrome.storage.local.set({ errors: [] });
    updateBadge(0);
  } catch (err) {
    console.error('DevDebug: Failed to clear errors:', err);
  }
}

// Get PushEngage config
async function getPEConfig(): Promise<PEAppConfig | null> {
  try {
    const { peConfig = null } = await chrome.storage.local.get('peConfig') as { peConfig: PEAppConfig | null };
    return peConfig;
  } catch {
    return null;
  }
}

// Get PE status for current tab
async function getPEStatus(tabId?: number): Promise<{ available: boolean; config: PEAppConfig | null }> {
  try {
    const { peAvailable = false, peConfig = null } = await chrome.storage.local.get(['peAvailable', 'peConfig']) as {
      peAvailable: boolean;
      peConfig: PEAppConfig | null;
    };
    return { available: peAvailable, config: peConfig };
  } catch {
    return { available: false, config: null };
  }
}

// Clear PE config
async function clearPEConfig(): Promise<void> {
  try {
    await chrome.storage.local.set({ peConfig: null, peAvailable: false });
  } catch (err) {
    console.error('DevDebug: Failed to clear PE config:', err);
  }
}

// Update extension badge
function updateBadge(count: number): void {
  const text = count > 0 ? count.toString() : '';
  const color = count > 0 ? '#EF4444' : '#3B82F6';

  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  try {
    const { peTabUrls = {} } = await chrome.storage.local.get('peTabUrls') as { peTabUrls: Record<number, boolean> };
    delete peTabUrls[tabId];
    await chrome.storage.local.set({ peTabUrls });
  } catch {
    // Ignore cleanup errors
  }
});

console.log('DevDebug AI background service worker started');


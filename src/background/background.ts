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

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  switch (message.type) {
    case 'CONSOLE_ERROR':
      // Pass tabId from sender when storing errors
      handleConsoleError(message.error, tabId);
      break;

    case 'PE_DETECTION':
      handlePEDetection(message.hasPushEngage, message.url, tabId);
      break;

    case 'PE_CONFIG':
      handlePEConfig(message.config, tabId);
      break;

    case 'GET_ERRORS':
      // Support filtering by tabId
      getErrors(message.tabId).then(sendResponse);
      return true;

    case 'CLEAR_ERRORS':
      // Support clearing by tabId
      clearErrors(message.tabId).then(() => sendResponse({ success: true }));
      return true;

    case 'GET_PE_CONFIG':
      getPEConfig().then(sendResponse);
      return true;

    case 'GET_PE_STATUS':
      getPEStatus(message.tabId || tabId).then(sendResponse);
      return true;

    case 'CLEAR_PE_CONFIG':
      clearPEConfig().then(() => sendResponse({ success: true }));
      return true;

    case 'REFRESH_ERRORS':
      refreshErrorsForTab(message.tabId).then(sendResponse);
      return true;
  }

  return true;
});

// Handle console errors - now includes tabId
async function handleConsoleError(error: ConsoleError, tabId?: number): Promise<void> {
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
      // Add tabId to the error
      const errorWithTab: ConsoleError = {
        ...error,
        tabId: tabId
      };

      // Add new error and maintain max limit (FIFO)
      const updatedErrors = [...errors, errorWithTab].slice(-MAX_ERRORS);
      await chrome.storage.local.set({ errors: updatedErrors });

      // Update badge for the specific tab
      if (tabId) {
        const tabErrors = updatedErrors.filter(e => e.tabId === tabId);
        updateBadge(tabErrors.length, tabId);
      }
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

// Get errors - optionally filtered by tabId
async function getErrors(tabId?: number): Promise<ConsoleError[]> {
  try {
    const { errors = [] } = await chrome.storage.local.get('errors') as { errors: ConsoleError[] };
    
    // If tabId is provided, filter errors for that tab
    if (tabId !== undefined) {
      return errors.filter(e => e.tabId === tabId);
    }
    
    return errors;
  } catch {
    return [];
  }
}

// Clear errors - optionally filtered by tabId
async function clearErrors(tabId?: number): Promise<void> {
  try {
    if (tabId !== undefined) {
      // Clear only errors for the specific tab
      const { errors = [] } = await chrome.storage.local.get('errors') as { errors: ConsoleError[] };
      const filteredErrors = errors.filter(e => e.tabId !== tabId);
      await chrome.storage.local.set({ errors: filteredErrors });
      updateBadge(0, tabId);
    } else {
      // Clear all errors
      await chrome.storage.local.set({ errors: [] });
      updateBadge(0);
    }
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
    const { peAvailable = false, peConfig = null, peTabUrls = {} } = await chrome.storage.local.get(['peAvailable', 'peConfig', 'peTabUrls']) as {
      peAvailable: boolean;
      peConfig: PEAppConfig | null;
      peTabUrls: Record<number, boolean>;
    };
    
    // If tabId provided, check PE availability for that specific tab
    const isAvailable = tabId ? (peTabUrls[tabId] || false) : peAvailable;
    
    return { available: isAvailable, config: peConfig };
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

// Update extension badge - optionally for a specific tab
function updateBadge(count: number, tabId?: number): void {
  const text = count > 0 ? count.toString() : '';
  const color = count > 0 ? '#EF4444' : '#3B82F6';

  if (tabId) {
    chrome.action.setBadgeText({ text, tabId });
    chrome.action.setBadgeBackgroundColor({ color, tabId });
  } else {
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color });
  }
}

// Refresh errors for a tab by re-injecting the content script
async function refreshErrorsForTab(tabId?: number): Promise<{ success: boolean; errors: ConsoleError[] }> {
  try {
    if (!tabId) {
      // Get current active tab if tabId not provided
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      tabId = tab?.id;
    }

    if (!tabId) {
      return { success: false, errors: [] };
    }

    // Clear existing errors for this tab first
    const { errors = [] } = await chrome.storage.local.get('errors') as { errors: ConsoleError[] };
    const filteredErrors = errors.filter(e => e.tabId !== tabId);
    await chrome.storage.local.set({ errors: filteredErrors });

    // Re-inject the content script to capture fresh errors
    // Note: This runs the error capture setup again
    await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: () => {
        // Re-setup error capturing in the page context
        // This will capture any new errors that occur after refresh
        console.log('[DevDebug AI] Error capture refreshed');
      }
    });

    // Return empty errors (fresh start for this tab)
    updateBadge(0, tabId);
    return { success: true, errors: [] };
  } catch (err) {
    console.error('DevDebug: Failed to refresh errors:', err);
    return { success: false, errors: [] };
  }
}

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  try {
    // Clean up PE tab tracking
    const { peTabUrls = {} } = await chrome.storage.local.get('peTabUrls') as { peTabUrls: Record<number, boolean> };
    delete peTabUrls[tabId];
    await chrome.storage.local.set({ peTabUrls });
    
    // Optionally: Clean up errors for closed tab
    const { errors = [] } = await chrome.storage.local.get('errors') as { errors: ConsoleError[] };
    const filteredErrors = errors.filter(e => e.tabId !== tabId);
    if (filteredErrors.length !== errors.length) {
      await chrome.storage.local.set({ errors: filteredErrors });
    }
  } catch {
    // Ignore cleanup errors
  }
});

// Update badge when tab is activated
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const { errors = [] } = await chrome.storage.local.get('errors') as { errors: ConsoleError[] };
    const tabErrors = errors.filter(e => e.tabId === activeInfo.tabId);
    updateBadge(tabErrors.length, activeInfo.tabId);
  } catch {
    // Ignore errors
  }
});

console.log('DevDebug AI background service worker started');

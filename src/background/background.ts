// DevDebug AI - Background Service Worker
import type { ConsoleError, PEAppConfig, PELog } from '../types';

// Import subscriber details type
import type { SubscriberDetails } from '../tools/types';

// Storage data interface for reference (used implicitly via chrome.storage)
export type StorageData = {
  errors: ConsoleError[];
  peLogs: PELog[];
  peConfig: PEAppConfig | null;
  peAvailable: boolean;
  peTabUrls: Record<number, boolean>;
  peDebugTabs: Record<number, boolean>; // tabId -> debug mode active
  peSubscriberDetails: SubscriberDetails | null;
  peSubscriberAvailable: boolean;
  tabSessions: Record<number, number>; // tabId -> sessionId mapping
};

const MAX_ERRORS = 50;
const MAX_PE_LOGS = 200;

// Track active sessions per tab (in-memory for quick access)
const tabSessions: Map<number, number> = new Map();

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    errors: [],
    peLogs: [],
    peConfig: null,
    peAvailable: false,
    peTabUrls: {},
    peDebugTabs: {},
    peSubscriberDetails: null,
    peSubscriberAvailable: false,
    tabSessions: {}
  });
  console.log('DevDebug AI installed');
});

// ===== WEB NAVIGATION LISTENER =====
// Clear errors when page navigates or refreshes (backup to content script session)
chrome.webNavigation.onCommitted.addListener(async (details) => {
  // Only handle main frame navigation (not iframes)
  if (details.frameId !== 0) return;
  
  const tabId = details.tabId;
  
  // Clear errors for this tab on navigation/refresh
  // This ensures a fresh start for each page load
  console.log(`DevDebug: Navigation detected for tab ${tabId}, clearing errors`);
  await clearErrors(tabId);
  
  // Clear the session for this tab (will be set by content script)
  tabSessions.delete(tabId);
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  switch (message.type) {
    case 'PAGE_SESSION_START':
      // New page session started - clear old errors for this tab
      handlePageSessionStart(message.sessionId, message.url, tabId);
      break;

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

    case 'PE_SUBSCRIBER_DETAILS':
      handlePESubscriberDetails(message.subscriberDetails, message.available, tabId);
      break;

    case 'PE_LOG':
      handlePELog(message.log, tabId);
      break;

    case 'PE_DEBUG_STATUS':
      handlePEDebugStatus(message.debugActive, tabId);
      break;

    case 'GET_PE_LOGS':
      getPELogs(message.tabId || tabId).then(sendResponse);
      return true;

    case 'CLEAR_PE_LOGS':
      clearPELogs(message.tabId).then(() => sendResponse({ success: true }));
      return true;

    case 'GET_PE_DEBUG_STATUS':
      getPEDebugStatus(message.tabId || tabId).then(sendResponse);
      return true;

    case 'GET_PE_SUBSCRIBER':
      getPESubscriberDetails(message.tabId || tabId).then(sendResponse);
      return true;

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

// ===== SESSION MANAGEMENT =====
// Handle new page session (page load/refresh/navigation)
async function handlePageSessionStart(sessionId: number, url: string, tabId?: number): Promise<void> {
  if (!tabId) return;

  console.log(`DevDebug: New session ${sessionId} started for tab ${tabId} at ${url}`);

  // Store the new session ID for this tab
  tabSessions.set(tabId, sessionId);

  // Clear all errors for this tab (fresh start)
  await clearErrors(tabId);

  // Clear all PE logs for this tab (fresh start)
  await clearPELogs(tabId);

  // Update badge to 0
  updateBadge(0, tabId);
}

// Handle console errors - now includes tabId and sessionId
async function handleConsoleError(error: ConsoleError, tabId?: number): Promise<void> {
  if (!error) return;

  try {
    // Verify the error belongs to the current session (if sessionId tracking is active)
    if (tabId && error.sessionId) {
      const currentSession = tabSessions.get(tabId);
      if (currentSession && error.sessionId !== currentSession) {
        // Error is from a previous session, ignore it
        console.log(`DevDebug: Ignoring error from old session ${error.sessionId} (current: ${currentSession})`);
        return;
      }
    }

    const { errors = [] } = await chrome.storage.local.get('errors') as { errors: ConsoleError[] };

    // Check for duplicate (same message and URL within last 5 seconds)
    const isDuplicate = errors.some(e => 
      e.message === error.message && 
      e.url === error.url &&
      e.tabId === tabId &&
      Math.abs(e.timestamp - error.timestamp) < 5000
    );

    if (!isDuplicate) {
      // Add tabId to the error (sessionId should already be present)
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
  _url: string,
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
async function handlePEConfig(config: PEAppConfig, _tabId?: number): Promise<void> {
  if (!config) return;

  try {
    await chrome.storage.local.set({ peConfig: config });
  } catch (err) {
    console.error('DevDebug: Failed to store PE config:', err);
  }
}

// Handle PushEngage subscriber details from localStorage
async function handlePESubscriberDetails(
  subscriberDetails: SubscriberDetails | null,
  available: boolean,
  _tabId?: number
): Promise<void> {
  try {
    await chrome.storage.local.set({
      peSubscriberDetails: subscriberDetails,
      peSubscriberAvailable: available
    });
  } catch (err) {
    console.error('DevDebug: Failed to store PE subscriber details:', err);
  }
}

// ===== PUSHENGAGE DEBUG LOGS =====

// Handle PE debug log capture
async function handlePELog(log: PELog, tabId?: number): Promise<void> {
  if (!log) return;

  try {
    // Verify the log belongs to the current session
    if (tabId && log.sessionId) {
      const currentSession = tabSessions.get(tabId);
      if (currentSession && log.sessionId !== currentSession) {
        // Log is from a previous session, ignore it
        console.log(`DevDebug: Ignoring PE log from old session ${log.sessionId} (current: ${currentSession})`);
        return;
      }
    }

    const { peLogs = [] } = await chrome.storage.local.get('peLogs') as { peLogs: PELog[] };

    // Check for duplicate (same message within last 1 second)
    const isDuplicate = peLogs.some(l =>
      l.message === log.message &&
      l.tabId === tabId &&
      Math.abs(l.timestamp - log.timestamp) < 1000
    );

    if (!isDuplicate) {
      // Add tabId to the log
      const logWithTab: PELog = {
        ...log,
        tabId: tabId
      };

      // Add new log and maintain max limit (FIFO)
      const updatedLogs = [...peLogs, logWithTab].slice(-MAX_PE_LOGS);
      await chrome.storage.local.set({ peLogs: updatedLogs });
    }
  } catch (err) {
    console.error('DevDebug: Failed to store PE log:', err);
  }
}

// Handle PE debug status change
async function handlePEDebugStatus(debugActive: boolean, tabId?: number): Promise<void> {
  try {
    const { peDebugTabs = {} } = await chrome.storage.local.get('peDebugTabs') as { peDebugTabs: Record<number, boolean> };

    if (tabId) {
      peDebugTabs[tabId] = debugActive;
    }

    await chrome.storage.local.set({ peDebugTabs });
  } catch (err) {
    console.error('DevDebug: Failed to store PE debug status:', err);
  }
}

// Get PE logs - optionally filtered by tabId
async function getPELogs(tabId?: number): Promise<PELog[]> {
  try {
    const { peLogs = [] } = await chrome.storage.local.get('peLogs') as { peLogs: PELog[] };

    // If tabId is provided, filter logs for that tab
    if (tabId !== undefined) {
      return peLogs.filter(l => l.tabId === tabId);
    }

    return peLogs;
  } catch {
    return [];
  }
}

// Clear PE logs - optionally filtered by tabId
async function clearPELogs(tabId?: number): Promise<void> {
  try {
    if (tabId !== undefined) {
      // Clear only logs for the specific tab
      const { peLogs = [] } = await chrome.storage.local.get('peLogs') as { peLogs: PELog[] };
      const filteredLogs = peLogs.filter(l => l.tabId !== tabId);
      await chrome.storage.local.set({ peLogs: filteredLogs });
    } else {
      // Clear all logs
      await chrome.storage.local.set({ peLogs: [] });
    }
  } catch (err) {
    console.error('DevDebug: Failed to clear PE logs:', err);
  }
}

// Get PE debug status for a tab
async function getPEDebugStatus(tabId?: number): Promise<{ active: boolean }> {
  try {
    const { peDebugTabs = {} } = await chrome.storage.local.get('peDebugTabs') as { peDebugTabs: Record<number, boolean> };
    
    if (tabId !== undefined) {
      return { active: peDebugTabs[tabId] || false };
    }
    
    return { active: false };
  } catch {
    return { active: false };
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

// Get PE subscriber details from localStorage
async function getPESubscriberDetails(_tabId?: number): Promise<{ available: boolean; data: SubscriberDetails | null }> {
  try {
    const { peSubscriberDetails = null, peSubscriberAvailable = false } = await chrome.storage.local.get(['peSubscriberDetails', 'peSubscriberAvailable']) as {
      peSubscriberDetails: SubscriberDetails | null;
      peSubscriberAvailable: boolean;
    };
    
    return { available: peSubscriberAvailable, data: peSubscriberDetails };
  } catch {
    return { available: false, data: null };
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

    // Get existing errors for this tab (don't clear them)
    const { errors = [] } = await chrome.storage.local.get('errors') as { errors: ConsoleError[] };
    const tabErrors = errors.filter(e => e.tabId === tabId);

    // Re-inject the FULL content script to setup error capturing
    // This ensures error listeners are active and working
    await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: () => {
        // Re-setup error capturing in the page context
        interface CapturedError {
          id: number;
          type: 'error' | 'warning';
          message: string;
          stack: string;
          filename: string;
          lineno: number;
          timestamp: number;
          url: string;
        }

        const seenErrors = new Map<string, number>();

        // Override console.error if not already done
        const originalError = (window as any).__devdebug_original_error || console.error;
        const originalWarn = (window as any).__devdebug_original_warn || console.warn;
        
        // Store originals to avoid multiple overrides
        (window as any).__devdebug_original_error = originalError;
        (window as any).__devdebug_original_warn = originalWarn;

        function captureError(
          type: 'error' | 'warning',
          args: unknown[],
          filename?: string,
          lineno?: number,
          stack?: string
        ): void {
          const message = args.map(arg => {
            if (arg instanceof Error) return arg.message;
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg);
              } catch {
                return String(arg);
              }
            }
            return String(arg);
          }).join(' ');

          if (!message.trim()) return;
          if (message.includes('DevDebug') || message.includes('PE_')) return;
          if (message.includes('PushEngage is not defined')) return;

          const errorKey = `${type}-${message}`;
          const now = Date.now();

          if (seenErrors.has(errorKey)) {
            const lastSeen = seenErrors.get(errorKey)!;
            if (now - lastSeen < 5000) return;
          }
          seenErrors.set(errorKey, now);

          const actualStack = stack || new Error().stack || '';
          
          function extractFileFromStack(s: string): string {
            if (!s) return 'unknown';
            const lines = s.split('\n');
            for (const line of lines) {
              const match = line.match(/(https?:\/\/[^\s:]+|file:\/\/[^\s:]+)/);
              if (match) return match[1].replace(/:\d+:\d+$/, '');
            }
            return 'unknown';
          }

          function extractLineFromStack(s: string): number {
            if (!s) return 0;
            const match = s.match(/:(\d+):\d+/);
            return match ? parseInt(match[1], 10) : 0;
          }
          
          const error: CapturedError = {
            id: Date.now() + Math.random(),
            type,
            message,
            stack: actualStack,
            filename: filename || extractFileFromStack(actualStack),
            lineno: lineno || extractLineFromStack(actualStack),
            timestamp: now,
            url: window.location.href
          };

          window.postMessage({
            source: 'devdebug-ai',
            type: 'CONSOLE_ERROR',
            error
          }, '*');
        }

        // Override console methods
        console.error = function(...args: unknown[]) {
          captureError('error', args);
          originalError.apply(console, args);
        };

        console.warn = function(...args: unknown[]) {
          captureError('warning', args);
          originalWarn.apply(console, args);
        };

        // Remove and re-add event listeners to ensure they're active
        const errorHandler = (e: ErrorEvent) => {
          captureError('error', [e.message], e.filename, e.lineno, (e.error as Error)?.stack);
        };

        const rejectionHandler = (e: PromiseRejectionEvent) => {
          const reason = e.reason instanceof Error ? e.reason.message : String(e.reason);
          const stack = e.reason instanceof Error ? e.reason.stack : '';
          captureError('error', [`Unhandled Promise Rejection: ${reason}`], undefined, undefined, stack);
        };

        // Store handlers to avoid duplicates
        if ((window as any).__devdebug_error_handler) {
          window.removeEventListener('error', (window as any).__devdebug_error_handler);
        }
        if ((window as any).__devdebug_rejection_handler) {
          window.removeEventListener('unhandledrejection', (window as any).__devdebug_rejection_handler);
        }
        
        (window as any).__devdebug_error_handler = errorHandler;
        (window as any).__devdebug_rejection_handler = rejectionHandler;
        
        window.addEventListener('error', errorHandler);
        window.addEventListener('unhandledrejection', rejectionHandler);

        console.log('%c🔧 DevDebug AI - Error capture refreshed', 'color: #3B82F6; font-weight: bold;');
      }
    });

    // Also re-inject the bridge script in ISOLATED world
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Ensure bridge is listening
        if (!(window as any).__devdebug_bridge_active) {
          (window as any).__devdebug_bridge_active = true;
          
          window.addEventListener('message', (event) => {
            if (event.source !== window) return;
            
            const data = event.data;
            if (data?.source !== 'devdebug-ai') return;

            try {
              chrome.runtime.sendMessage({
                type: data.type,
                error: data.error,
                hasPushEngage: data.hasPushEngage,
                url: data.url,
                config: data.config
              }).catch(() => {});
            } catch {}
          });
        }
      }
    });

    // Return existing errors for this tab (not clearing them)
    updateBadge(tabErrors.length, tabId);
    return { success: true, errors: tabErrors };
  } catch (err) {
    console.error('DevDebug: Failed to refresh errors:', err);
    // On error, still try to return existing errors
    try {
      const { errors = [] } = await chrome.storage.local.get('errors') as { errors: ConsoleError[] };
      const tabErrors = errors.filter(e => e.tabId === tabId);
      return { success: false, errors: tabErrors };
    } catch {
      return { success: false, errors: [] };
    }
  }
}

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  try {
    // Clean up session tracking
    tabSessions.delete(tabId);

    // Clean up PE tab tracking
    const { peTabUrls = {}, peDebugTabs = {} } = await chrome.storage.local.get(['peTabUrls', 'peDebugTabs']) as { 
      peTabUrls: Record<number, boolean>;
      peDebugTabs: Record<number, boolean>;
    };
    delete peTabUrls[tabId];
    delete peDebugTabs[tabId];
    await chrome.storage.local.set({ peTabUrls, peDebugTabs });
    
    // Clean up errors for closed tab
    const { errors = [] } = await chrome.storage.local.get('errors') as { errors: ConsoleError[] };
    const filteredErrors = errors.filter(e => e.tabId !== tabId);
    if (filteredErrors.length !== errors.length) {
      await chrome.storage.local.set({ errors: filteredErrors });
    }

    // Clean up PE logs for closed tab
    const { peLogs = [] } = await chrome.storage.local.get('peLogs') as { peLogs: PELog[] };
    const filteredLogs = peLogs.filter(l => l.tabId !== tabId);
    if (filteredLogs.length !== peLogs.length) {
      await chrome.storage.local.set({ peLogs: filteredLogs });
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

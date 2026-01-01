// DevDebug AI - Content Script
// Runs in MAIN world to access page's window object for error capture and PushEngage detection

interface CapturedError {
  id: number;
  type: 'error' | 'warning';
  message: string;
  stack: string;
  filename: string;
  lineno: number;
  timestamp: number;
  url: string;
  sessionId: number; // Session ID to track page load sessions
}

interface CapturedPELog {
  id: number;
  type: 'log' | 'debug';
  message: string;
  timestamp: number;
  url: string;
  sessionId: number;
}

interface PEConfig {
  browseAbandonments?: unknown[];
  cartAbandonments?: unknown[];
  priceDropAlerts?: unknown[];
  backInStockAlerts?: unknown[];
  customTriggerCampaigns?: unknown[];
  site?: unknown;
  siteSettings?: unknown;
  segments?: unknown[];
  chatWidgets?: unknown[];
  subscriberAttributes?: unknown[];
}

interface PESubscriberDetails {
  isSubDomain?: boolean;
  appId?: string;
  id?: string;
  isSubscribed?: boolean;
  endpoint?: string;
  subscriber?: {
    expiresAt?: number;
    data?: unknown;
  };
}

interface ServiceWorkerInfo {
  available: boolean;
  scriptUrl: string | null;
  scriptPath: string | null;
  scope: string | null;
  state: 'installing' | 'installed' | 'activating' | 'activated' | 'redundant' | 'unknown' | null;
}

(function() {
  'use strict';

  // ===== SESSION MANAGEMENT =====
  // Generate a unique session ID for this page load
  // This ensures errors from previous page loads are cleared
  const SESSION_ID = Date.now();

  // Send session start message FIRST to clear old errors
  window.postMessage({
    source: 'devdebug-ai',
    type: 'PAGE_SESSION_START',
    sessionId: SESSION_ID,
    url: window.location.href
  }, '*');

  // ===== ERROR CAPTURE =====
  const originalError = console.error;
  const originalWarn = console.warn;
  const seenErrors = new Map<string, number>();

  // Override console.error
  console.error = function(...args: unknown[]) {
    captureError('error', args);
    originalError.apply(console, args);
  };

  // Override console.warn
  console.warn = function(...args: unknown[]) {
    captureError('warning', args);
    originalWarn.apply(console, args);
  };

  // Listen for uncaught errors
  window.addEventListener('error', (e: ErrorEvent) => {
    captureError('error', [e.message], e.filename, e.lineno, e.error?.stack);
  });

  // Listen for unhandled promise rejections
  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const reason = e.reason instanceof Error ? e.reason.message : String(e.reason);
    const stack = e.reason instanceof Error ? e.reason.stack : '';
    captureError('error', [`Unhandled Promise Rejection: ${reason}`], undefined, undefined, stack);
  });

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

    // Skip empty messages
    if (!message.trim()) return;

    // Skip DevDebug's own messages
    if (message.includes('DevDebug') || message.includes('PE_')) return;

    // Skip PushEngage reference errors (common when PE is not installed)
    if (message.includes('PushEngage is not defined')) return;

    const errorKey = `${type}-${message}`;
    const now = Date.now();

    // Deduplicate within 5 seconds
    if (seenErrors.has(errorKey)) {
      const lastSeen = seenErrors.get(errorKey)!;
      if (now - lastSeen < 5000) return;
    }
    seenErrors.set(errorKey, now);

    // Clean up old entries
    if (seenErrors.size > 100) {
      const entries = Array.from(seenErrors.entries());
      entries
        .filter(([, time]) => now - time > 60000)
        .forEach(([key]) => seenErrors.delete(key));
    }

    const actualStack = stack || new Error().stack || '';
    
    const error: CapturedError = {
      id: Date.now() + Math.random(),
      type,
      message,
      stack: actualStack,
      filename: filename || extractFileFromStack(actualStack),
      lineno: lineno || extractLineFromStack(actualStack),
      timestamp: now,
      url: window.location.href,
      sessionId: SESSION_ID // Include session ID to associate with current page load
    };

    // Send to extension via custom event (since we're in MAIN world)
    window.postMessage({
      source: 'devdebug-ai',
      type: 'CONSOLE_ERROR',
      error
    }, '*');
  }

  function extractFileFromStack(stack: string): string {
    if (!stack) return 'unknown';
    const lines = stack.split('\n');
    for (const line of lines) {
      const match = line.match(/(https?:\/\/[^\s:]+|file:\/\/[^\s:]+)/);
      if (match) {
        // Remove line and column numbers
        return match[1].replace(/:\d+:\d+$/, '');
      }
    }
    return 'unknown';
  }

  function extractLineFromStack(stack: string): number {
    if (!stack) return 0;
    const match = stack.match(/:(\d+):\d+/);
    return match ? parseInt(match[1], 10) : 0;
  }

  // ===== PUSHENGAGE DEBUG LOG CAPTURE =====
  const originalLog = console.log;
  const originalDebug = console.debug;
  const seenPELogs = new Map<string, number>();
  let peDebugActive = false;

  // Check if PushEngage debug mode is active
  function checkPEDebugMode(): boolean {
    try {
      const debugFlag = sessionStorage.getItem('PushEngageSDKDebug');
      // Check for both boolean true and string "true"
      return debugFlag === 'true' || debugFlag === '1';
    } catch {
      return false;
    }
  }

  // Update debug mode status and notify extension
  function updatePEDebugStatus(): void {
    const wasActive = peDebugActive;
    peDebugActive = checkPEDebugMode();
    
    // Only send status update if changed
    if (wasActive !== peDebugActive) {
      window.postMessage({
        source: 'devdebug-ai',
        type: 'PE_DEBUG_STATUS',
        debugActive: peDebugActive,
        url: window.location.href
      }, '*');
    }
  }

  // Capture PushEngage debug logs
  function capturePELog(type: 'log' | 'debug', args: unknown[]): void {
    // Only capture if debug mode is active
    if (!peDebugActive) return;

    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    // Only capture logs that contain "PushEngage" (case-insensitive check for flexibility)
    if (!message.includes('PushEngage')) return;

    // Skip DevDebug's own messages
    if (message.includes('DevDebug')) return;

    const logKey = `${type}-${message}`;
    const now = Date.now();

    // Deduplicate within 1 second (logs can be frequent)
    if (seenPELogs.has(logKey)) {
      const lastSeen = seenPELogs.get(logKey)!;
      if (now - lastSeen < 1000) return;
    }
    seenPELogs.set(logKey, now);

    // Clean up old entries
    if (seenPELogs.size > 200) {
      const entries = Array.from(seenPELogs.entries());
      entries
        .filter(([, time]) => now - time > 30000)
        .forEach(([key]) => seenPELogs.delete(key));
    }

    const log: CapturedPELog = {
      id: Date.now() + Math.random(),
      type,
      message,
      timestamp: now,
      url: window.location.href,
      sessionId: SESSION_ID
    };

    // Send to extension
    window.postMessage({
      source: 'devdebug-ai',
      type: 'PE_LOG',
      log
    }, '*');
  }

  // Override console.log
  console.log = function(...args: unknown[]) {
    capturePELog('log', args);
    originalLog.apply(console, args);
  };

  // Override console.debug
  console.debug = function(...args: unknown[]) {
    capturePELog('debug', args);
    originalDebug.apply(console, args);
  };

  // Initial debug mode check
  updatePEDebugStatus();

  // Periodic debug mode check (every 2 seconds)
  setInterval(updatePEDebugStatus, 2000);

  // ===== PUSHENGAGE DETECTION =====
  let debugModeEnabled = false; // Track if we've already enabled debug mode

  function detectPushEngage(): void {
    const hasPushEngage = typeof (window as unknown as { PushEngage?: unknown }).PushEngage !== 'undefined';

    // Send detection status
    window.postMessage({
      source: 'devdebug-ai',
      type: 'PE_DETECTION',
      hasPushEngage,
      url: window.location.href
    }, '*');

    // Always try to read subscriber details from localStorage (may exist even if SDK not loaded)
    readSubscriberDetails();

    if (hasPushEngage) {
      // Auto-enable debug mode if not already enabled
      if (!debugModeEnabled && !checkPEDebugMode()) {
        try {
          const pe = (window as unknown as { PushEngage: { debug: () => void } }).PushEngage;
          if (typeof pe.debug === 'function') {
            pe.debug();
            debugModeEnabled = true;
            // Update debug status after enabling
            setTimeout(() => {
              updatePEDebugStatus();
            }, 100);
            console.log('%c🔧 DevDebug AI: PushEngage debug mode auto-enabled', 'color: #4642E5; font-weight: bold;');
          }
        } catch (err) {
          console.warn('DevDebug: Failed to auto-enable PE debug mode:', err);
        }
      }

      try {
        const pe = (window as unknown as { PushEngage: { getAppConfig: () => unknown } }).PushEngage;
        const peConfig = pe.getAppConfig();

        // Check if it's a promise or direct value
        if (peConfig && typeof (peConfig as Promise<unknown>).then === 'function') {
          (peConfig as Promise<PEConfig>).then((config: PEConfig) => {
            sendPEConfig(config);
          }).catch((err: Error) => {
            console.warn('DevDebug: Failed to fetch PE config:', err);
          });
        } else if (peConfig) {
          sendPEConfig(peConfig as PEConfig);
        }
      } catch (err) {
        console.warn('DevDebug: Error accessing PushEngage:', err);
      }
    }
  }

  function sendPEConfig(config: PEConfig): void {
    window.postMessage({
      source: 'devdebug-ai',
      type: 'PE_CONFIG',
      config
    }, '*');
  }

  // ===== SUBSCRIBER DETAILS FROM LOCALSTORAGE =====
  function readSubscriberDetails(): void {
    try {
      const rawData = localStorage.getItem('PushEngageSDK');
      
      if (!rawData) {
        // No subscriber data in localStorage
        window.postMessage({
          source: 'devdebug-ai',
          type: 'PE_SUBSCRIBER_DETAILS',
          available: false,
          data: null
        }, '*');
        return;
      }

      const subscriberDetails = JSON.parse(rawData) as PESubscriberDetails;
      
      // Send subscriber details to extension
      window.postMessage({
        source: 'devdebug-ai',
        type: 'PE_SUBSCRIBER_DETAILS',
        available: true,
        data: subscriberDetails
      }, '*');
    } catch (err) {
      // JSON parsing failed or other error
      console.warn('DevDebug: Failed to read PushEngageSDK from localStorage:', err);
      window.postMessage({
        source: 'devdebug-ai',
        type: 'PE_SUBSCRIBER_DETAILS',
        available: false,
        data: null
      }, '*');
    }
  }

  // Initial detection after a short delay (to allow PE SDK to load)
  setTimeout(detectPushEngage, 1000);

  // Periodic detection (every 5 seconds)
  setInterval(detectPushEngage, 5000);

  // ===== SERVICE WORKER DETECTION =====
  /**
   * Get information about the currently active service worker
   */
  async function getServiceWorkerInfo(): Promise<ServiceWorkerInfo> {
    const noSW: ServiceWorkerInfo = {
      available: false,
      scriptUrl: null,
      scriptPath: null,
      scope: null,
      state: null,
    };

    // Check if Service Worker API is available
    if (!('serviceWorker' in navigator)) {
      return noSW;
    }

    try {
      // Method 1: Check for controlling service worker (most reliable for active SW)
      if (navigator.serviceWorker.controller) {
        const controller = navigator.serviceWorker.controller;
        const scriptUrl = controller.scriptURL;
        const scriptPath = new URL(scriptUrl).pathname;
        
        return {
          available: true,
          scriptUrl,
          scriptPath,
          scope: null, // Controller doesn't expose scope directly
          state: controller.state as ServiceWorkerInfo['state'] || 'unknown',
        };
      }

      // Method 2: Get registration to find scope and waiting/active SW
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration) {
        // Prefer active, then waiting, then installing
        const sw = registration.active || registration.waiting || registration.installing;
        
        if (sw) {
          const scriptUrl = sw.scriptURL;
          const scriptPath = new URL(scriptUrl).pathname;
          
          return {
            available: true,
            scriptUrl,
            scriptPath,
            scope: registration.scope,
            state: sw.state as ServiceWorkerInfo['state'] || 'unknown',
          };
        }
        
        // Registration exists but no SW (shouldn't happen, but handle it)
        return {
          available: false,
          scriptUrl: null,
          scriptPath: null,
          scope: registration.scope,
          state: null,
        };
      }

      return noSW;
    } catch (err) {
      console.warn('DevDebug: Error getting service worker info:', err);
      return noSW;
    }
  }

  /**
   * Detect and send service worker info to extension
   */
  async function detectServiceWorker(): Promise<void> {
    const swInfo = await getServiceWorkerInfo();
    
    window.postMessage({
      source: 'devdebug-ai',
      type: 'SERVICE_WORKER_INFO',
      data: swInfo
    }, '*');
  }

  // Initial SW detection (slightly delayed to ensure SW is registered)
  setTimeout(detectServiceWorker, 1500);

  // Periodic SW detection (every 10 seconds - SW changes are rare)
  setInterval(detectServiceWorker, 10000);

  // Log initialization
  console.log('%c🔧 DevDebug AI initialized', 'color: #3B82F6; font-weight: bold;');
})();


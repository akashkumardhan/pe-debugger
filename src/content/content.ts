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

  // ===== PUSHENGAGE DETECTION =====
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

  // Log initialization
  console.log('%c🔧 DevDebug AI initialized', 'color: #3B82F6; font-weight: bold;');
})();


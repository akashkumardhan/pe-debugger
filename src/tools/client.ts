/**
 * Client-Side Tool Implementations
 * 
 * These are the .client() implementations for each tool definition.
 * All tools execute in the browser context (no server required).
 * 
 * @see https://tanstack.com/ai
 */

import {
  getSubscriptionDetailsDef,
  scrapeWebsiteDef,
  updateUIDef,
  saveToStorageDef,
  analyzeErrorDef,
  type GetSubscriptionDetailsInput,
  type GetSubscriptionDetailsOutput,
  type ScrapeWebsiteInput,
  type ScrapeWebsiteOutput,
  type UpdateUIInput,
  type UpdateUIOutput,
  type SaveToStorageInput,
  type SaveToStorageOutput,
  type AnalyzeErrorInput,
  type AnalyzeErrorOutput,
} from './definitions';
import { getPEStatus, getErrors } from '../utils/storage';
import { pushEngageService } from '../services/pushEngage';

// ============================================================
// GET SUBSCRIPTION DETAILS - Client Implementation
// ============================================================

/**
 * Get PushEngage subscription details from stored config.
 * The content script fetches this via PushEngage.getAppConfig()
 */
export const getSubscriptionDetailsClient = getSubscriptionDetailsDef.client(
  async (input: GetSubscriptionDetailsInput): Promise<GetSubscriptionDetailsOutput> => {
    try {
      const { available, config } = await getPEStatus();

      // console.log('available in the getSubscriptionDetailsClient function: ', available);
      // console.log('config in the getSubscriptionDetailsClient function: ', config);

      if (!available || !config) {
        return {
          success: true,
          available: false,
          data: undefined,
          error: 'PushEngage SDK not detected on current page',
        };
      }

      // const summary = pushEngageService.parseCampaignSummary(config);
      // const settings = pushEngageService.extractKeySettings(config);

      const result: GetSubscriptionDetailsOutput = {
        success: true,
        available: true,
        data: config,
        // data: {
        //   siteName: settings.siteName,
        //   siteId: settings.siteId,
        //   siteUrl: settings.siteUrl,
        // },
      };

      // if (input.includeCampaigns && result.data) {
      //   result.data.campaigns = {
      //     browseAbandonments: summary.browseAbandonments,
      //     cartAbandonments: summary.cartAbandonments,
      //     customTriggers: summary.customTriggers,
      //     activeCampaigns: summary.activeCampaigns,
      //   };
      // }

      // if (input.includeSettings && result.data) {
      //   result.data.settings = {
      //     geoLocationEnabled: settings.geoLocation,
      //     analyticsEnabled: settings.analytics,
      //     chickletPosition: settings.chickletPosition,
      //     chickletLabel: settings.chickletLabel,
      //   };
      //   result.data.segments = settings.segmentsCount;
      //   result.data.subscriberAttributes = settings.attributesCount;
      // }

      return result;
    } catch (error) {
      return {
        success: false,
        available: false,
        error: error instanceof Error ? error.message : 'Failed to get subscription details',
      };
    }
  }
);

// ============================================================
// SCRAPE WEBSITE - Client Implementation
// ============================================================

/**
 * Scrape content from a website URL.
 * Uses fetch API to retrieve page content.
 */
export const scrapeWebsiteClient = scrapeWebsiteDef.client(
  async (input: ScrapeWebsiteInput): Promise<ScrapeWebsiteOutput> => {
    try {
      // Fetch the webpage
      const response = await fetch(input.url, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          url: input.url,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const html = await response.text();
      
      // Parse HTML using DOMParser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Get title
      const title = doc.querySelector('title')?.textContent || undefined;

      // Apply selector if provided
      const targetElement = input.selector 
        ? doc.querySelector(input.selector) 
        : doc.body;

      if (!targetElement) {
        return {
          success: false,
          url: input.url,
          title,
          error: `Selector "${input.selector}" not found`,
        };
      }

      const content: ScrapeWebsiteOutput['content'] = {};

      // Extract based on type
      if (input.extractType === 'text' || input.extractType === 'all') {
        // Get text content, clean up whitespace
        content.text = targetElement.textContent
          ?.replace(/\s+/g, ' ')
          .trim()
          .slice(0, 10000) || ''; // Limit to 10k chars
      }

      if (input.extractType === 'headings' || input.extractType === 'all') {
        const headingElements = targetElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
        content.headings = Array.from(headingElements).map(h => ({
          level: parseInt(h.tagName[1], 10),
          text: h.textContent?.trim() || '',
        })).slice(0, 50); // Limit to 50 headings
      }

      if (input.extractType === 'links' || input.extractType === 'all') {
        const linkElements = targetElement.querySelectorAll('a[href]');
        content.links = Array.from(linkElements)
          .map(a => ({
            text: a.textContent?.trim() || '',
            href: (a as HTMLAnchorElement).href,
          }))
          .filter(l => l.text && l.href)
          .slice(0, 100); // Limit to 100 links
      }

      return {
        success: true,
        url: input.url,
        title,
        content,
      };
    } catch (error) {
      return {
        success: false,
        url: input.url,
        error: error instanceof Error ? error.message : 'Failed to scrape website',
      };
    }
  }
);

// ============================================================
// UPDATE UI - Client Implementation
// ============================================================

// Store for UI update callbacks (set by React components)
let uiUpdateCallback: ((message: string, type: string, duration: number) => void) | null = null;

/**
 * Register a callback for UI updates from React
 */
export function registerUIUpdateCallback(
  callback: (message: string, type: string, duration: number) => void
): void {
  uiUpdateCallback = callback;
}

/**
 * Unregister the UI update callback
 */
export function unregisterUIUpdateCallback(): void {
  uiUpdateCallback = null;
}

/**
 * Update the extension popup UI with a notification
 */
export const updateUIClient = updateUIDef.client(
  async (input: UpdateUIInput): Promise<UpdateUIOutput> => {
    try {
      if (uiUpdateCallback) {
        uiUpdateCallback(input.message, input.type, input.duration || 3000);
        return { success: true, displayed: true };
      }
      
      // Fallback: log to console if no callback registered
      console.log(`[DevDebug AI] ${input.type.toUpperCase()}: ${input.message}`);
      return { success: true, displayed: false };
    } catch (error) {
      return { success: false, displayed: false };
    }
  }
);

// ============================================================
// SAVE TO STORAGE - Client Implementation
// ============================================================

/**
 * Save data to Chrome storage
 */
export const saveToStorageClient = saveToStorageDef.client(
  async (input: SaveToStorageInput): Promise<SaveToStorageOutput> => {
    try {
      const storage = input.storageType === 'sync' 
        ? chrome.storage.sync 
        : chrome.storage.local;

      await storage.set({ [input.key]: input.value });

      return {
        success: true,
        key: input.key,
      };
    } catch (error) {
      return {
        success: false,
        key: input.key,
        error: error instanceof Error ? error.message : 'Failed to save to storage',
      };
    }
  }
);

// ============================================================
// ANALYZE ERROR - Client Implementation
// ============================================================

/**
 * Analyze a captured console error
 */
export const analyzeErrorClient = analyzeErrorDef.client(
  async (input: AnalyzeErrorInput): Promise<AnalyzeErrorOutput> => {
    try {
      const errors = await getErrors();
      const error = errors.find(e => e.id === input.errorId);

      if (!error) {
        return {
          success: true,
          notFound: true,
        };
      }

      return {
        success: true,
        error: {
          message: error.message,
          type: error.type,
          filename: error.filename,
          lineno: error.lineno,
          stack: error.stack,
        },
        analysis: `Error "${error.message}" occurred at ${error.filename}:${error.lineno}`,
      };
    } catch (error) {
      return {
        success: false,
        notFound: false,
      };
    }
  }
);

// ============================================================
// EXPORT ALL CLIENT TOOLS
// ============================================================

/**
 * All client-side tool implementations ready for use with chat()
 */
export const clientTools = [
  getSubscriptionDetailsClient,
  scrapeWebsiteClient,
  updateUIClient,
  saveToStorageClient,
  analyzeErrorClient,
];

export {
  getSubscriptionDetailsClient as getSubscriptionDetails,
  scrapeWebsiteClient as scrapeWebsite,
  updateUIClient as updateUI,
  saveToStorageClient as saveToStorage,
  analyzeErrorClient as analyzeError,
};


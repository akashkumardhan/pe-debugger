/**
 * Client-Side Tool Implementations
 * 
 * These are the .client() implementations for each tool definition.
 * All tools execute in the browser context (no server required).
 * 
 * Note: We use explicit type assertions because @tanstack/ai v0.2.0
 * has issues with generic type inference in the .client() method.
 * 
 * @see https://tanstack.com/ai
 */

import {
  getAppConfigDef,
  scrapeWebsiteDef,
  updateUIDef,
  saveToStorageDef,
  analyzeErrorDef,
  fetchPushEngageDocsDef,
  type GetAppConfigInput,
  type GetAppConfigOutput,
  type ScrapeWebsiteInput,
  type ScrapeWebsiteOutput,
  type UpdateUIInput,
  type UpdateUIOutput,
  type SaveToStorageInput,
  type SaveToStorageOutput,
  type AnalyzeErrorInput,
  type AnalyzeErrorOutput,
  type FetchPushEngageDocsInput,
  type FetchPushEngageDocsOutput,
} from './definitions';
import { getPEStatus, getErrors } from '../utils/storage';
import { 
  searchDocumentation, 
  formatSectionsForAI, 
  formatAllDocsForAI,
  getAllSections,
  parseMdxDocumentation,
} from './pushengage-docs-data/mdxParser';

// ============================================================
// GET SUBSCRIPTION DETAILS - Client Implementation
// ============================================================

/**
 * Get PushEngage app config details from stored config.
 * The content script fetches this via PushEngage.getAppConfig()
 */
async function getAppConfigHandler(_input: GetAppConfigInput): Promise<GetAppConfigOutput> {
  try {
    const { available, config } = await getPEStatus();

    if (!available || !config) {
      return {
        success: true,
        available: false,
        data: undefined,
        error: 'PushEngage SDK not detected on current page',
      };
    }

    const result: GetAppConfigOutput = {
      success: true,
      available: true,
      // Cast config to any to handle type mismatch between PEAppConfig and schema
      data: config as any,
    };

    return result;
  } catch (error) {
    return {
      success: false,
      available: false,
      error: error instanceof Error ? error.message : 'Failed to get subscription details',
    };
  }
}

export const getAppConfigClient = getAppConfigDef.client(getAppConfigHandler as any);

// ============================================================
// SCRAPE WEBSITE - Client Implementation
// ============================================================

/**
 * Scrape content from a website URL.
 * Uses fetch API to retrieve page content.
 */
async function scrapeWebsiteHandler(input: ScrapeWebsiteInput): Promise<ScrapeWebsiteOutput> {
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

    const content: {
      text?: string;
      headings?: Array<{ level: number; text: string }>;
      links?: Array<{ text: string; href: string }>;
    } = {};

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
      content.headings = Array.from(headingElements).map((h: Element) => ({
        level: parseInt(h.tagName[1], 10),
        text: h.textContent?.trim() || '',
      })).slice(0, 50); // Limit to 50 headings
    }

    if (input.extractType === 'links' || input.extractType === 'all') {
      const linkElements = targetElement.querySelectorAll('a[href]');
      content.links = Array.from(linkElements)
        .map((a: Element) => ({
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

export const scrapeWebsiteClient = scrapeWebsiteDef.client(scrapeWebsiteHandler as any);

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
async function updateUIHandler(input: UpdateUIInput): Promise<UpdateUIOutput> {
  try {
    if (uiUpdateCallback) {
      uiUpdateCallback(input.message, input.type, input.duration || 3000);
      return { success: true, displayed: true };
    }
    
    // Fallback: log to console if no callback registered
    console.log(`[DevDebug AI] ${input.type.toUpperCase()}: ${input.message}`);
    return { success: true, displayed: false };
  } catch (_error) {
    return { success: false, displayed: false };
  }
}

export const updateUIClient = updateUIDef.client(updateUIHandler as any);

// ============================================================
// SAVE TO STORAGE - Client Implementation
// ============================================================

/**
 * Save data to Chrome storage
 */
async function saveToStorageHandler(input: SaveToStorageInput): Promise<SaveToStorageOutput> {
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

export const saveToStorageClient = saveToStorageDef.client(saveToStorageHandler as any);

// ============================================================
// ANALYZE ERROR - Client Implementation
// ============================================================

/**
 * Analyze a captured console error
 */
async function analyzeErrorHandler(input: AnalyzeErrorInput): Promise<AnalyzeErrorOutput> {
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
  } catch (_error) {
    return {
      success: false,
      notFound: false,
    };
  }
}

export const analyzeErrorClient = analyzeErrorDef.client(analyzeErrorHandler as any);

// ============================================================
// FETCH PUSHENGAGE DOCS - Client Implementation
// ============================================================

/**
 * Fetch PushEngage Web SDK documentation.
 * Uses embedded MDX documentation parsed at runtime.
 * The PushEngage docs site (https://pushengage.com/api/web-sdk/) is an SPA
 * that cannot be scraped with simple fetch.
 */
async function fetchPushEngageDocsHandler(input: FetchPushEngageDocsInput): Promise<FetchPushEngageDocsOutput> {
    try {
      const now = Date.now();
      const baseUrl = 'https://pushengage.com/api/web-sdk/';
      const allSections = getAllSections();

      // If a query is provided, search for relevant sections
      if (input.query) {
        const relevantSections = searchDocumentation(input.query);
        const formattedContent = formatSectionsForAI(relevantSections);

        // Transform results into the expected output format
        const relevantPages = relevantSections.length > 0 ? [{
          title: 'PushEngage Web SDK API Reference',
          url: baseUrl,
          sections: relevantSections.map(section => ({
            heading: section.title,
            level: section.level,
            content: section.description,
            codeExamples: section.codeExamples.length > 0 
              ? section.codeExamples.map(ex => ({
                  language: ex.language,
                  code: ex.code,
                  description: ex.title || `Example for ${section.title}`,
                }))
              : undefined,
            parameters: section.parameters?.map(p => ({
              name: p.name,
              type: p.type,
              required: p.required,
              description: p.description,
            })) || section.tableData?.map(p => ({
              name: p.name,
              type: p.type,
              required: p.required,
              description: p.description,
            })),
          })),
          relevanceScore: 1,
        }] : [];

        return {
          success: true,
          cached: true, // Always "cached" since we use embedded docs
          lastUpdated: now,
          expiresAt: now + 86400000, // 24 hours
          totalPages: allSections.length,
          query: input.query,
          documentation: {
            baseUrl,
            pages: relevantPages,
            formattedContent: relevantSections.length > 0 
              ? formattedContent 
              : `No specific documentation found for "${input.query}". Here are the available sections:\n\n${allSections.map(s => `- **${s.title}**`).join('\n')}`,
          },
        };
      }

      // Return full documentation
      const formattedContent = formatAllDocsForAI();
      
      return {
        success: true,
        cached: true,
        lastUpdated: now,
        expiresAt: now + 86400000, // 24 hours
        totalPages: allSections.length,
        documentation: {
          baseUrl,
          pages: [{
            title: parseMdxDocumentation().title,
            url: baseUrl,
            sections: allSections.map(section => ({
              heading: section.title,
              level: section.level,
              content: section.description,
              codeExamples: section.codeExamples.length > 0 
                ? section.codeExamples.map(ex => ({
                    language: ex.language,
                    code: ex.code,
                    description: ex.title || `Example for ${section.title}`,
                  }))
                : undefined,
              parameters: section.parameters || section.tableData,
            })),
          }],
          formattedContent,
        },
      };
    } catch (error) {
      return {
        success: false,
        cached: false,
        error: error instanceof Error ? error.message : 'Failed to fetch PushEngage documentation',
      };
    }
  }

export const fetchPushEngageDocsClient = fetchPushEngageDocsDef.client(fetchPushEngageDocsHandler as any);

// ============================================================
// EXPORT ALL CLIENT TOOLS
// ============================================================

/**
 * All client-side tool implementations ready for use with chat()
 */
export const clientTools = [
  getAppConfigClient,
  scrapeWebsiteClient,
  updateUIClient,
  saveToStorageClient,
  analyzeErrorClient,
  fetchPushEngageDocsClient,
];

export {
  getAppConfigClient as getAppConfig,
  scrapeWebsiteClient as scrapeWebsite,
  updateUIClient as updateUI,
  saveToStorageClient as saveToStorage,
  analyzeErrorClient as analyzeError,
  fetchPushEngageDocsClient as fetchPushEngageDocs,
};


/**
 * Tool Definitions
 * 
 * Shared tool definitions using @tanstack/ai and Zod v4 schemas.
 * These definitions are used by both the AI adapter and client implementations.
 * 
 * @see https://tanstack.com/ai
 */

import { toolDefinition } from '@tanstack/ai';
import * as z from 'zod';

// Import schemas from types
import {
  CampaignSchema,
  SegmentSchema,
  SiteSchema,
  SiteSettingsSchema,
} from './types';

// ============================================================
// GET SUBSCRIPTION DETAILS TOOL
// ============================================================

const getAppConfigInputSchema = z.object({
  includeSettings: z.boolean()
    .optional()
    .default(true)
    .describe('Whether to include site settings in the response'),
  includeCampaigns: z.boolean()
    .optional()
    .default(true)
    .describe('Whether to include campaign details in the response'),
});

const getAppConfigOutputSchema = z.object({
  success: z.boolean(),
  available: z.boolean().describe('Whether PushEngage SDK is available on the page'),
  data: z.object({
    backInStockAlerts: z
      .array(CampaignSchema)
      .describe('Back-in-stock notification campaigns'),

    browseAbandonments: z
      .array(CampaignSchema)
      .describe('Browse abandonment campaigns'),

    cartAbandonments: z
      .array(CampaignSchema)
      .describe('Cart abandonment campaigns'),

    chatWidgets: z
      .array(z.any())
      .describe('Chat widget configurations'),

    customTriggerCampaigns: z
      .array(CampaignSchema)
      .describe('Custom trigger based campaigns'),

    priceDropAlerts: z
      .array(CampaignSchema)
      .describe('Price drop alert campaigns'),

    segments: z
      .array(SegmentSchema)
      .describe('Audience segmentation rules'),

    site: SiteSchema.describe('Site metadata'),

    siteSettings: SiteSettingsSchema.describe(
      'Complete site configuration and UI settings'
    ),

    subscriberAttributes: z
      .array(z.any())
      .describe('Custom subscriber attributes'),
  })
  .optional()
  .describe('subscription and site related details and configuration data'),

  error: z.string().optional(),
});

/**
 * Get PushEngage app config details from the current page.
 * Uses PushEngage.getAppConfig() to retrieve configuration.
 */
export const getAppConfigDef = toolDefinition({
  name: 'get_subscription_app_config',
  description: 'Get PushEngage subscription app config details from the current webpage. Returns campaign info, site settings, segments, and more.',
  inputSchema: getAppConfigInputSchema,
  outputSchema: getAppConfigOutputSchema,
});

export type GetAppConfigInput = z.infer<typeof getAppConfigInputSchema>;
export type GetAppConfigOutput = z.infer<typeof getAppConfigOutputSchema>;

// ============================================================
// UPDATE UI TOOL
// ============================================================

const updateUIInputSchema = z.object({
  message: z.string().describe('Message to display to the user'),
  type: z.enum(['success', 'error', 'info', 'warning'])
    .describe('Type of message (affects styling)'),
  duration: z.number()
    .optional()
    .default(3000)
    .describe('How long to show the message in milliseconds'),
});

const updateUIOutputSchema = z.object({
  success: z.boolean(),
  displayed: z.boolean(),
});

/**
 * Update the extension popup UI with a message.
 */
export const updateUIDef = toolDefinition({
  name: 'update_ui',
  description: 'Display a notification or message in the extension popup UI',
  inputSchema: updateUIInputSchema,
  outputSchema: updateUIOutputSchema,
});

export type UpdateUIInput = z.infer<typeof updateUIInputSchema>;
export type UpdateUIOutput = z.infer<typeof updateUIOutputSchema>;

// ============================================================
// SAVE TO STORAGE TOOL
// ============================================================

const saveToStorageInputSchema = z.object({
  key: z.string().describe('Storage key'),
  value: z.string().describe('Value to store (will be JSON stringified if object)'),
  storageType: z.enum(['local', 'sync'])
    .optional()
    .default('local')
    .describe('Chrome storage type - local or sync'),
});

const saveToStorageOutputSchema = z.object({
  success: z.boolean(),
  key: z.string(),
  error: z.string().optional(),
});

/**
 * Save data to Chrome extension storage.
 */
export const saveToStorageDef = toolDefinition({
  name: 'save_to_storage',
  description: 'Save data to browser storage for persistence',
  inputSchema: saveToStorageInputSchema,
  outputSchema: saveToStorageOutputSchema,
});

export type SaveToStorageInput = z.infer<typeof saveToStorageInputSchema>;
export type SaveToStorageOutput = z.infer<typeof saveToStorageOutputSchema>;

// ============================================================
// ANALYZE ERROR TOOL
// ============================================================

const analyzeErrorInputSchema = z.object({
  errorId: z.number().describe('ID of the captured error to analyze'),
});

const analyzeErrorOutputSchema = z.object({
  success: z.boolean(),
  error: z.object({
    message: z.string(),
    type: z.string(),
    filename: z.string(),
    lineno: z.number(),
    stack: z.string(),
  }).optional(),
  analysis: z.string().optional(),
  notFound: z.boolean().optional(),
});

/**
 * Analyze a captured console error and provide debugging insights.
 */
export const analyzeErrorDef = toolDefinition({
  name: 'analyze_error',
  description: 'Analyze a console error and provide debugging suggestions',
  inputSchema: analyzeErrorInputSchema,
  outputSchema: analyzeErrorOutputSchema,
});

export type AnalyzeErrorInput = z.infer<typeof analyzeErrorInputSchema>;
export type AnalyzeErrorOutput = z.infer<typeof analyzeErrorOutputSchema>;

// ============================================================
// FETCH PUSHENGAGE DOCS TOOL
// ============================================================

const fetchPushEngageDocsInputSchema = z.object({
  query: z.string()
    .optional()
    .describe('Search query to find relevant documentation sections. If provided, returns only matching sections. If omitted, returns full documentation.'),
  forceRefresh: z.boolean()
    .optional()
    .default(false)
    .describe('Force re-fetch documentation from the web, ignoring cache'),
  maxPages: z.number()
    .optional()
    .default(50)
    .describe('Maximum number of documentation pages to scrape (default: 50)'),
  maxDepth: z.number()
    .optional()
    .default(3)
    .describe('Maximum link depth for recursive scraping (default: 3)'),
});

const fetchPushEngageDocsOutputSchema = z.object({
  success: z.boolean()
    .describe('Whether the operation was successful'),
  cached: z.boolean()
    .describe('Whether the result came from cache'),
  lastUpdated: z.number()
    .optional()
    .describe('Timestamp when documentation was last fetched'),
  expiresAt: z.number()
    .optional()
    .describe('Timestamp when cache expires'),
  totalPages: z.number()
    .optional()
    .describe('Total number of pages scraped'),
  query: z.string()
    .optional()
    .describe('The search query used (if any)'),
  documentation: z.object({
    baseUrl: z.string()
      .describe('Base URL of the documentation'),
    pages: z.array(z.object({
      title: z.string()
        .describe('Page title'),
      url: z.string()
        .describe('Page URL'),
      sections: z.array(z.object({
        heading: z.string()
          .describe('Section heading'),
        level: z.number()
          .describe('Heading level (1-6)'),
        content: z.string()
          .describe('Section text content'),
        codeExamples: z.array(z.object({
          language: z.string()
            .describe('Code language'),
          code: z.string()
            .describe('Code content'),
          description: z.string()
            .optional()
            .describe('Code description'),
        }))
          .optional()
          .describe('Code examples in this section'),
        parameters: z.array(z.object({
          name: z.string()
            .describe('Parameter name'),
          type: z.string()
            .describe('Parameter type'),
          required: z.boolean()
            .describe('Whether required'),
          description: z.string()
            .describe('Parameter description'),
        }))
          .optional()
          .describe('API parameters in this section'),
      }))
        .describe('Content sections'),
      relevanceScore: z.number()
        .optional()
        .describe('Relevance score for search results'),
    }))
      .describe('Documentation pages (or relevant sections if query provided)'),
    formattedContent: z.string()
      .optional()
      .describe('Pre-formatted documentation content for AI consumption'),
  })
    .optional()
    .describe('Extracted documentation content'),
  error: z.string()
    .optional()
    .describe('Error message if operation failed'),
});

/**
 * Fetch and analyze PushEngage Web SDK documentation.
 * Parses embedded MDX documentation with table data.
 * AI responses must be grounded ONLY in the extracted documentation.
 */
export const fetchPushEngageDocsDef = toolDefinition({
  name: 'fetch_pushengage_docs',
  description: `Search PushEngage Web SDK documentation for API methods, parameters, code examples, and usage guides.
Use this tool to answer questions about PushEngage JavaScript SDK methods like addSegment, removeSegment, 
addAttributes, subscribe, unsubscribe, showNativePermissionPrompt, and more.

CRITICAL RULES:
1. ONLY use information returned by this tool - do NOT use external knowledge or assumptions
2. When returning code examples, copy the EXACT JavaScript code from the documentation - DO NOT modify, rewrite, or improve it
3. Do NOT add your own code, comments, or explanations to the code examples
4. Do NOT combine or merge code examples - return them exactly as they appear in the docs
5. If the docs don't have a specific code example, say "No code example found in documentation" instead of writing your own`,
  inputSchema: fetchPushEngageDocsInputSchema,
  outputSchema: fetchPushEngageDocsOutputSchema,
});

export type FetchPushEngageDocsInput = z.infer<typeof fetchPushEngageDocsInputSchema>;
export type FetchPushEngageDocsOutput = z.infer<typeof fetchPushEngageDocsOutputSchema>;

// ============================================================
// EXPORT ALL DEFINITIONS
// ============================================================

export const allToolDefinitions = [
  getAppConfigDef,
  updateUIDef,
  saveToStorageDef,
  analyzeErrorDef,
  fetchPushEngageDocsDef,
];

// Note: All Input/Output types are exported inline with their schema definitions above

// Re-export schemas from types for convenience
export {
  CampaignSchema,
  SegmentSchema,
  SiteSchema,
  SiteSettingsSchema,
} from './types';

// Re-export documentation schemas
export {
  DocSectionSchema,
  DocCodeExampleSchema,
  DocParameterSchema,
  DocPageSchema,
  DocCacheSchema,
} from './types';

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

/**
 * Get PushEngage subscription details from the current page.
 * Uses PushEngage.getAppConfig() to retrieve configuration.
 */
export const getSubscriptionDetailsDef = toolDefinition({
  name: 'get_subscription_details',
  description: 'Get PushEngage subscription and configuration details from the current webpage. Returns campaign info, site settings, segments, and more.',
  inputSchema: z.object({
    includeSettings: z.boolean()
      .optional()
      .default(true)
      .describe('Whether to include site settings in the response'),
    includeCampaigns: z.boolean()
      .optional()
      .default(true)
      .describe('Whether to include campaign details in the response'),
  }),
  outputSchema: z.object({
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
  }),
});

// ============================================================
// SCRAPE WEBSITE TOOL
// ============================================================

/**
 * Scrape content from a website URL.
 * Useful for fetching documentation or external resources.
 */
export const scrapeWebsiteDef = toolDefinition({
  name: 'scrape_website',
  description: 'Scrape and extract content from a website URL. Can extract text content, links, headings, and structured data.',
  inputSchema: z.object({
    url: z.url().describe('The URL to scrape'),
    extractType: z.enum(['text', 'links', 'headings', 'all'])
      .optional()
      .default('all')
      .describe('What type of content to extract'),
    selector: z.string()
      .optional()
      .describe('Optional CSS selector to target specific content'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    url: z.string(),
    title: z.string().optional(),
    content: z.object({
      text: z.string().optional(),
      headings: z.array(z.object({
        level: z.number(),
        text: z.string(),
      })).optional(),
      links: z.array(z.object({
        text: z.string(),
        href: z.string(),
      })).optional(),
    }).optional(),
    error: z.string().optional(),
  }),
});

// ============================================================
// UPDATE UI TOOL
// ============================================================

/**
 * Update the extension popup UI with a message.
 */
export const updateUIDef = toolDefinition({
  name: 'update_ui',
  description: 'Display a notification or message in the extension popup UI',
  inputSchema: z.object({
    message: z.string().describe('Message to display to the user'),
    type: z.enum(['success', 'error', 'info', 'warning'])
      .describe('Type of message (affects styling)'),
    duration: z.number()
      .optional()
      .default(3000)
      .describe('How long to show the message in milliseconds'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    displayed: z.boolean(),
  }),
});

// ============================================================
// SAVE TO STORAGE TOOL
// ============================================================

/**
 * Save data to Chrome extension storage.
 */
export const saveToStorageDef = toolDefinition({
  name: 'save_to_storage',
  description: 'Save data to browser storage for persistence',
  inputSchema: z.object({
    key: z.string().describe('Storage key'),
    value: z.string().describe('Value to store (will be JSON stringified if object)'),
    storageType: z.enum(['local', 'sync'])
      .optional()
      .default('local')
      .describe('Chrome storage type - local or sync'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    key: z.string(),
    error: z.string().optional(),
  }),
});

// ============================================================
// ANALYZE ERROR TOOL
// ============================================================

/**
 * Analyze a captured console error and provide debugging insights.
 */
export const analyzeErrorDef = toolDefinition({
  name: 'analyze_error',
  description: 'Analyze a console error and provide debugging suggestions',
  inputSchema: z.object({
    errorId: z.number().describe('ID of the captured error to analyze'),
  }),
  outputSchema: z.object({
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
  }),
});

// ============================================================
// EXPORT ALL DEFINITIONS
// ============================================================

export const allToolDefinitions = [
  getSubscriptionDetailsDef,
  scrapeWebsiteDef,
  updateUIDef,
  saveToStorageDef,
  analyzeErrorDef,
];

// Type exports for client implementations
export type GetSubscriptionDetailsInput = z.infer<typeof getSubscriptionDetailsDef.inputSchema>;
export type GetSubscriptionDetailsOutput = z.infer<typeof getSubscriptionDetailsDef.outputSchema>;

export type ScrapeWebsiteInput = z.infer<typeof scrapeWebsiteDef.inputSchema>;
export type ScrapeWebsiteOutput = z.infer<typeof scrapeWebsiteDef.outputSchema>;

export type UpdateUIInput = z.infer<typeof updateUIDef.inputSchema>;
export type UpdateUIOutput = z.infer<typeof updateUIDef.outputSchema>;

export type SaveToStorageInput = z.infer<typeof saveToStorageDef.inputSchema>;
export type SaveToStorageOutput = z.infer<typeof saveToStorageDef.outputSchema>;

export type AnalyzeErrorInput = z.infer<typeof analyzeErrorDef.inputSchema>;
export type AnalyzeErrorOutput = z.infer<typeof analyzeErrorDef.outputSchema>;

// Re-export schemas from types for convenience
export {
  CampaignSchema,
  SegmentSchema,
  SiteSchema,
  SiteSettingsSchema,
} from './types';

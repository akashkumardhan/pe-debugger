/**
 * Zod Schema Types
 * 
 * Shared Zod schemas used across tool definitions.
 * These schemas define the structure of PushEngage configuration data.
 */

import * as z from 'zod';

// ============================================================
// CAMPAIGN & SEGMENT SCHEMAS
// ============================================================

export const CampaignSchema = z.object({
  campaign_name: z
    .string()
    .describe('Name of the campaign'),

  start_event: z
    .string()
    .describe('Event that triggers the campaign'),

  status: z
    .string()
    .describe('Current status of the campaign'),

  stop_event: z
    .string()
    .describe('Event that stops the campaign'),
});

export const SegmentCriteriaSchema = z
  .object({
    include: z
      .object({
        start: z
          .array(z.string())
          .describe('Events that include subscribers in the segment'),
      })
      .describe('Inclusion rules for the segment'),
  })
  .nullable()
  .describe('Rules defining how subscribers qualify for the segment');

export const SegmentSchema = z.object({
  add_segment_on_page_load: z
    .boolean()
    .describe('Whether segment is added automatically on page load'),

  segment_criteria: SegmentCriteriaSchema,

  segment_id: z
    .number()
    .describe('Unique Id of the segment'),

  segment_name: z
    .string()
    .describe('Name of the segment'),
});

// ============================================================
// SITE SCHEMA
// ============================================================

export const SiteSchema = z.object({
  is_eu: z
    .boolean()
    .describe('Whether the site is subject to EU regulations'),

  is_whitelabel: z
    .boolean()
    .describe('Whether the site uses a white-label setup'),

  shopify_domain: z
    .string()
    .nullable()
    .describe('Associated Shopify domain, if any'),

  site_id: z
    .number()
    .describe('Unique site identifier'),

  site_image: z
    .string()
    .describe('URL of the site logo/image'),

  site_key: z
    .string()
    .describe('Public site API key'),

  site_name: z
    .string()
    .describe('Name of the site'),

  site_subdomain: z
    .string()
    .describe('Subdomain assigned to the site'),

  site_url: z
    .string()
    .describe('Site URL  iof the site'),
});

// ============================================================
// RULES SCHEMAS
// ============================================================

export const RulesIncludeSchema = z.object({
  start: z.array(z.string()).describe('URL patterns that should start with'),
  exact: z.array(z.string()).describe('Exact URL matches'),
  contains: z.array(z.string()).describe('URL substrings to include'),
}).describe('Include rules for URLs');

export const TriggerRulesSchema = z.object({
  enabled: z.boolean().describe('Whether trigger rules are enabled'),
  exclude_countries: z.array(z.string()).describe('Countries to exclude'),
  exclude_devices: z.array(z.string()).describe('Devices to exclude'),
  exclude: z.record(z.string(), z.any()).describe('Custom exclusion rules'),
  include_countries: z.array(z.string()).describe('Countries to include'),
  include_devices: z.array(z.string()).describe('Devices to include'),
  include: RulesIncludeSchema,
}).describe('Trigger button visibility rules');

// ============================================================
// OPT-IN SCHEMAS
// ============================================================

export const OptinBaseSchema = z.object({
  cookie_duration: z.number().describe('Cookie duration in days'),
  optin_category: z.string().describe('Opt-in category type'),
  optin_delay: z.number().describe('Delay before opt-in appears'),
  optin_scroll: z.number().describe('Scroll percentage to trigger opt-in'),
  popup_disabled: z.number().describe('Whether popup is disabled'),
  optin_type: z.number().describe('Opt-in type identifier'),
  optin_name: z.string().describe('Opt-in display name'),
  optin_segments: z.array(z.any()).describe('Segments associated with opt-in'),
  optin_sw_support: z.number().optional().describe('Service worker support flag'),
}).describe('Base opt-in configuration');

export const OptinBellSchema = z.object({
  optin_title: z.string().describe('Opt-in title text'),
  bg: z.string().describe('Background color'),
  allowBtnBg: z.string().describe('Allow button background color'),
  placement: z.string().describe('Bell placement on screen'),
}).describe('Bell style configuration');

export const OptinFullSchema = OptinBaseSchema.extend({
  optin_allow_btn_txt: z.string().describe('Allow button text'),
  optin_title: z.string().describe('Opt-in title'),
  bg: z.string().describe('Background color'),
  allowBtnBg: z.string().describe('Allow button background color'),
  placement: z.string().describe('Opt-in placement'),
  checkbox_bg: z.string().describe('Checkbox background color'),
  checkbox_tick_color: z.string().describe('Checkbox tick color'),
  default_segment_selection: z.boolean().describe('Default segment selection'),
}).describe('Full opt-in or popup modal configuration');

export const OptinsSchema = z.record(
  z.string().describe('Opt-in type key'),
  z.object({
    desktop: z.object({
      http: OptinFullSchema.optional(),
      https: OptinFullSchema
        .or(
          OptinBaseSchema.extend({
            bell: OptinBellSchema,
          })
        )
        .optional(),
    }).describe('Desktop opt-in or popup modal settings'),

    mobile: z.object({
      http: OptinFullSchema.optional(),
      https: OptinFullSchema
        .or(
          OptinBaseSchema.extend({
            bell: OptinBellSchema,
          })
        )
        .optional(),
    }).describe('Mobile opt-in or popup modal settings'),
  })
).describe('All opt-in or popup modal configurations');

// ============================================================
// SITE SETTINGS SCHEMA
// ============================================================

export const SiteSettingsSchema = z.object({
  // Subscriber Recovery Widgets
  chicklet_settings: z.object({
    settings: z.object({
      delay: z.number().describe('Delay in seconds before recovery button widget appears'),
    }).describe('General recovery button widget behavior settings'),

    bell: z.object({
      bg: z.string().describe('Bell widget background color'),
      color: z.string().describe('Bell widget icon color'),
      position: z.string().describe('Bell widget position on screen'),
      label: z.string().describe('Bell widget label text'),
    }).describe('A bell widget that can be repositioned and customized to provide a second chance to subscribe for push notification permission'),
  }).describe('Subscriber Recovery Widgets, Give your visitors another chance to subscribe to your push notifications even if they block your popup modal'),

  // GCM settings
  gcm_options: z.object({
    project_id: z.string().describe('Firebase / GCM project ID'),
  }).describe('Google Cloud Messaging configuration'),

  // Targeting Rule
  optin_management_settings: z.object({
    include: z
    .array(
      z.object({
        id: z
          .number()
          .describe('Unique identifier for the targeting rule'),

        rule: z
          .enum(['start', 'contains', 'exact'])
          .describe('Rule type for URL matching'),

        value: z
          .string()
          .describe('Value used for URL matching'),
      })
    )
    .describe(
      'URL-based include rules that determine where the opt-in should be shown'
    ),
    include_countries: z
      .array(z.string())
      .describe('Countries where opt-in is enabled'),
  }).describe('Targeting Rule, By default, the subscription opt-in will be shown across all pages. Setup the global targeting rule for your opt-ins here. The global targeting rules will have a higher preference over the individual opt-in subscription rule'),


  // Opt-in settings
  optin_settings: z.object({
    intermediate: z.object({
      bg: z.string().describe('Intermediate screen background color'),
      page_heading: z.string().describe('Intermediate screen heading'),
      page_tagline: z.string().describe('Intermediate screen tagline'),
      allow_btn_txt: z.string().describe('Allow button text'),
      allow_btn_bg: z.string().describe('Allow button background color'),
    }).describe('Intermediate opt-in UI'),

    activeOptin: z.object({
      http: z.object({
        types: z.array(z.number()).describe('HTTP opt-in types'),
      }).describe('HTTP active opt-ins'),

      https: z.object({
        types: z.array(z.number()).describe('HTTPS opt-in types'),
      }).describe('HTTPS active opt-ins'),
    }).describe('List of all active opt-in configuration'),

    optins: OptinsSchema,
  }).describe('All opt-in or popup modal related configuration'),

  privacy_settings: z.object({
    geoLocationEnabled: z
      .boolean()
      .describe('Whether geo-location tracking is enabled'),
  }).describe('Privacy settings'),


  // Service worker configuration
  service_worker: z.object({
    scope: z.boolean().describe('Enable addition of service worker in another sub-folder if its value is true otherwise it will be in the root folder'),
    workerStatus: z.boolean().describe('Enable the service worker registration from PushEngage'),
    worker: z.string().describe('Path for service worker file'),
    keepMultipleSubscriptions: z
      .boolean()
      .describe('Allow multiple subscriptions per user'),
  }).describe('Service worker configuration, The service worker is a key file in sending and collecting subscriptions.'),

  // Opt-in Analytics
  sub_analytics: z.object({
    enabled: z.boolean().describe('Whether Opt-in analytics is enabled'),
  }).describe('Opt-in Analytics settings'),


  // Unsubscribe Button Widget
  sub_management_settings: z.object({
    button: z.object({
      position: z.string().describe('Button position on screen'),
      bg: z.string().describe('Button background color'),
      color: z.string().describe('Button text color'),
      unsubMsg: z.string().describe('Unsubscribe message'),
      thankMsg: z.string().describe('Thank you message'),
      confirmMsg: z.string().describe('Confirmation message'),
      ConfirmActionYes: z.string().describe('Confirm yes button text'),
      ConfirmActionNo: z.string().describe('Confirm no button text'),
    }).describe('Unsubscribe Button Widget button'),

    settings: z.object({
      rules: z.record(z.string(), z.any()).describe('Unsubscribe Button Widget rules'),
    }).describe('Unsubscribe Button Widget rules'),
  }).describe('Unsubscribe Button Widget Settings, Give your subscribers an easy way to unsubscribe from your push notifications. '),


  // Subscription Management Widget
  subscription_management_widget: z.object({
    enabled: z.boolean().describe('Widget enabled status'),
    title: z.string().describe('Widget title'),
    modal_background_color: z.string().describe('Modal background color'),
    modal_text_color: z.string().describe('Modal text color'),
    allow_text: z.string().describe('Allow notifications label'),
    on_switch_color: z.string().describe('Switch ON color'),
    off_switch_color: z.string().describe('Switch OFF color'),

    trigger_button: z.object({
      enabled: z.boolean().describe('Trigger button enabled'),
      size: z.string().describe('Trigger button size'),
      position_x: z.string().describe('Horizontal position'),
      position_y: z.string().describe('Vertical position'),
      offset_top: z.number().describe('Top offset'),
      offset_bottom: z.number().describe('Bottom offset'),
      icon_background_color: z.string().describe('Icon background color'),
      icon_color: z.string().describe('Icon color'),
      icon_type: z.string().describe('Icon type'),
      z_index: z.number().describe('Z-index value'),
      rules: TriggerRulesSchema,
    }).describe('Trigger button configuration, The widget is displayed when the user clicks on the trigger button.'),

    segment_preference: z.object({
      enabled: z.boolean().describe('Segment preference enabled'),
      subscribed_title: z.string().describe('Subscribed segments title'),
      exclude_subscribed_segments: z
        .array(z.any())
        .describe('Segments to exclude'),
      show_all_subscribed_segment: z
        .boolean()
        .describe('Show all subscribed segments'),
      title: z.string().describe('Segment section title'),
      segments: z.array(z.any()).describe('Available segments'),
      checkbox_background_color: z
        .string()
        .describe('Checkbox background color'),
      checkbox_tick_color: z
        .string()
        .describe('Checkbox tick color'),
      default_segment_selection: z
        .boolean()
        .describe('Default segment selection'),
    }).describe('Segment preference settings, Give users the option to manage the segments they are subscribed to before or after subscription'),

    unsubscribe_options: z.object({
      enabled: z.boolean().describe('Unsubscribe dialog enabled'),
      confirm_message: z
        .string()
        .describe('Unsubscribe confirmation message'),
      ok_text: z.string().describe('OK button text'),
      cancel_text: z.string().describe('Cancel button text'),
      ok_button_background_color: z
        .string()
        .describe('OK button background color'),
      ok_button_text_color: z
        .string()
        .describe('OK button text color'),
      cancel_button_background_color: z
        .string()
        .describe('Cancel button background color'),
      cancel_button_text_color: z
        .string()
        .describe('Cancel button text color'),
    }).describe('Unsubscribe confirmation options, This setting allows the user to unsubscribe from notifications.'),

    personal_notification_options: z.object({
      enabled: z
        .boolean()
        .describe('Personal notification options enabled'),
      label: z.string().describe('Personal notification label'),
    }).describe('Personalized Notification settings, This setting allows users to disable or re-enable triggered campaign notifications.'),
  }).describe('Subscription Management Widget,This widget provides an easy option for your users to manage push permissions. They can also opt in and opt out of the segments'),

  // Web Push VAPID keys
  vapid_key: z.object({
    public_key: z.string().describe('VAPID public key'),
  }).describe('Web Push VAPID keys'),

  reset_notification_permission_popup: z.object({
    message: z.string().describe('Popup main message'),
    background_color: z.string().describe('Popup background color'),
    retry_button_background_color: z
      .string()
      .describe('Retry button background color'),
    retry_button_label: z.string().describe('Retry button label'),
    close_button_background_color: z
      .string()
      .describe('Close button background color'),
    close_button_label: z.string().describe('Close button label'),
    variants: z.array(
      z.object({
        url: z.string().describe('Instruction image URL'),
        platform: z.string().describe('Platform identifier'),
        message: z.string().describe('Platform-specific message'),
      })
    ).describe('Platform-specific reset instructions'),
  }).describe('Reset notification permission popup'),

  shopify_options: z.object({
    money_format: z.string().describe('Currency symbol or format'),

    alert_campaign: z.object({
      bell_color: z.string().describe('Alert bell color'),
      bell_background: z.string().describe('Alert bell background'),
      text_color: z.string().describe('Alert text color'),

      message: z.object({
        price_drop: z.object({
          before_subscription: z
            .string()
            .describe('Before subscription price drop text'),
          after_subscription: z
            .string()
            .describe('After subscription price drop text'),
          allow_btn_txt: z
            .string()
            .describe('Allow button text for price drop'),
        }).describe('Price drop messages'),

        inventory: z.object({
          before_subscription: z
            .string()
            .describe('Before subscription inventory text'),
          after_subscription: z
            .string()
            .describe('After subscription inventory text'),
          allow_btn_txt: z
            .string()
            .describe('Allow button text for inventory'),
        }).describe('Inventory messages'),
      }).describe('Shopify alert messages'),
    }).describe('Shopify alert campaign'),
  }).describe('Shopify configuration'),

  shopify_wa_cart_abandonment: z
    .any()
    .describe('Shopify WhatsApp cart abandonment settings'),
});

// ============================================================
// TYPE EXPORTS
// ============================================================

export type Campaign = z.infer<typeof CampaignSchema>;
export type SegmentCriteria = z.infer<typeof SegmentCriteriaSchema>;
export type Segment = z.infer<typeof SegmentSchema>;
export type Site = z.infer<typeof SiteSchema>;
export type RulesInclude = z.infer<typeof RulesIncludeSchema>;
export type TriggerRules = z.infer<typeof TriggerRulesSchema>;
export type OptinBase = z.infer<typeof OptinBaseSchema>;
export type OptinBell = z.infer<typeof OptinBellSchema>;
export type OptinFull = z.infer<typeof OptinFullSchema>;
export type Optins = z.infer<typeof OptinsSchema>;
export type SiteSettings = z.infer<typeof SiteSettingsSchema>;

// ============================================================
// PUSHENGAGE DOCUMENTATION SCHEMAS
// ============================================================

/**
 * Schema for a code example extracted from documentation
 */
export const DocCodeExampleSchema = z.object({
  language: z
    .string()
    .describe('Programming language of the code (e.g., javascript, html)'),
  code: z
    .string()
    .describe('The actual code content'),
  description: z
    .string()
    .optional()
    .describe('Description or context for the code example'),
});

/**
 * Schema for an API parameter extracted from documentation
 */
export const DocParameterSchema = z.object({
  name: z
    .string()
    .describe('Parameter name'),
  type: z
    .string()
    .describe('Parameter type (e.g., string, number, object)'),
  required: z
    .boolean()
    .describe('Whether the parameter is required'),
  description: z
    .string()
    .describe('Parameter description'),
  defaultValue: z
    .string()
    .optional()
    .describe('Default value if any'),
});

/**
 * Schema for an API method extracted from documentation
 */
export const DocApiMethodSchema = z.object({
  name: z
    .string()
    .describe('Method name (e.g., PushEngage.subscribe)'),
  signature: z
    .string()
    .optional()
    .describe('Full method signature'),
  description: z
    .string()
    .describe('Method description'),
  parameters: z
    .array(DocParameterSchema)
    .optional()
    .describe('Method parameters'),
  returnType: z
    .string()
    .optional()
    .describe('Return type of the method'),
  returnDescription: z
    .string()
    .optional()
    .describe('Description of what the method returns'),
  examples: z
    .array(DocCodeExampleSchema)
    .optional()
    .describe('Code examples for this method'),
});

/**
 * Schema for a documentation section
 */
export const DocSectionSchema: z.ZodType<DocSection> = z.lazy(() => z.object({
  heading: z
    .string()
    .describe('Section heading text'),
  level: z
    .number()
    .min(1)
    .max(6)
    .describe('Heading level (1-6)'),
  content: z
    .string()
    .describe('Text content of the section'),
  codeExamples: z
    .array(DocCodeExampleSchema)
    .optional()
    .describe('Code examples in this section'),
  parameters: z
    .array(DocParameterSchema)
    .optional()
    .describe('Parameters documented in this section'),
  apiMethods: z
    .array(DocApiMethodSchema)
    .optional()
    .describe('API methods documented in this section'),
  subSections: z
    .array(DocSectionSchema)
    .optional()
    .describe('Nested sub-sections'),
}));

/**
 * Interface for DocSection (needed for recursive type)
 */
export interface DocSection {
  heading: string;
  level: number;
  content: string;
  codeExamples?: DocCodeExample[];
  parameters?: DocParameter[];
  apiMethods?: DocApiMethod[];
  subSections?: DocSection[];
}

/**
 * Schema for a single documentation page
 */
export const DocPageSchema = z.object({
  title: z
    .string()
    .describe('Page title'),
  url: z
    .string()
    .describe('URL of the documentation page'),
  description: z
    .string()
    .optional()
    .describe('Page meta description or summary'),
  sections: z
    .array(DocSectionSchema)
    .describe('Content sections of the page'),
  lastScraped: z
    .number()
    .describe('Timestamp when the page was last scraped'),
});

/**
 * Schema for the complete documentation cache
 */
export const DocCacheSchema = z.object({
  version: z
    .number()
    .describe('Cache schema version for migration'),
  lastUpdated: z
    .number()
    .describe('Timestamp of last full update'),
  expiresAt: z
    .number()
    .describe('Timestamp when cache expires'),
  baseUrl: z
    .string()
    .describe('Base URL of the documentation'),
  pages: z
    .array(DocPageSchema)
    .describe('All scraped documentation pages'),
  totalPages: z
    .number()
    .describe('Total number of pages scraped'),
});

// Type exports for documentation schemas
export type DocCodeExample = z.infer<typeof DocCodeExampleSchema>;
export type DocParameter = z.infer<typeof DocParameterSchema>;
export type DocApiMethod = z.infer<typeof DocApiMethodSchema>;
export type DocPage = z.infer<typeof DocPageSchema>;
export type DocCache = z.infer<typeof DocCacheSchema>;

// ============================================================
// SUBSCRIBER DETAILS SCHEMA
// ============================================================

/**
 * Schema for subscriber metadata from localStorage.PushEngageSDK
 */
export const SubscriberDataSchema = z.object({
  city: z
    .string()
    .describe('City of the subscriber'),

  country: z
    .string()
    .describe('Country of the subscriber'),

  device: z
    .string()
    .describe('Device category such as desktop or mobile'),

  device_type: z
    .string()
    .describe('Browser or device type used during subscription'),

  has_unsubscribed: z
    .number()
    .describe('Unsubscribe flag (0 = subscribed, 1 = unsubscribed)'),

  host: z
    .string()
    .describe('Host domain on which the subscription occurred'),

  language: z
    .string()
    .describe('Browser language preference'),

  notification_disabled: z
    .number()
    .describe('Notification disabled flag (0 = enabled, 1 = disabled)'),

  state: z
    .string()
    .describe('State or region of the subscriber'),

  subscription_url: z
    .string()
    .describe('URL where the subscription was created'),

  timezone: z
    .string()
    .describe('Timezone of the subscriber'),

  ts_created: z
    .string()
    .describe('ISO timestamp when the subscription was created'),

  user_agent: z
    .string()
    .describe('Full browser user agent string'),

  vapid_public_key: z
    .string()
    .describe('VAPID public key used for push subscription'),

  attributes: z
    .record(z.string(), z.any())
    .describe('Custom key-value attributes associated with the subscriber'),

  segments: z
    .array(z.any())
    .describe('List of segment identifiers the subscriber belongs to'),

  trigger_status: z
    .number()
    .describe('Triggered campaign status flag (1 = enabled, 0 = disabled)'),
}).describe('Detailed subscriber metadata');

/**
 * Schema for the subscriber container object
 */
export const SubscriberContainerSchema = z.object({
  expiresAt: z
    .number()
    .describe('Timestamp (in milliseconds) when the current subscription details will be refreshed or updated by PushEngage'),

  data: SubscriberDataSchema,
}).describe('Subscriber container object');

/**
 * Complete PushEngage subscriber details schema from localStorage.PushEngageSDK
 */
export const SubscriberDetailsSchema = z.object({
  isSubDomain: z
    .boolean()
    .describe('Indicates whether the subscription belongs to a subdomain'),

  appId: z
    .string()
    .describe('Unique PushEngage site key or app id'),

  id: z
    .string()
    .describe('Unique PushEngage subscriber id or PushEngage hashed subscriber identifier'),

  isSubscribed: z
    .boolean()
    .describe('Indicates whether the current user is currently subscribed or not'),

  endpoint: z
    .string()
    .describe('FCM endpoint to send notification to the current subscriber'),

  subscriber: SubscriberContainerSchema,
}).describe('Complete PushEngage subscriber details object containing all the subscriber information');

// Type exports for subscriber details
export type SubscriberData = z.infer<typeof SubscriberDataSchema>;
export type SubscriberContainer = z.infer<typeof SubscriberContainerSchema>;
export type SubscriberDetails = z.infer<typeof SubscriberDetailsSchema>;


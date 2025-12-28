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
          .describe('Events that include users in the segment'),
      })
      .describe('Inclusion rules for the segment'),
  })
  .nullable()
  .describe('Rules defining how users qualify for the segment');

export const SegmentSchema = z.object({
  add_segment_on_page_load: z
    .boolean()
    .describe('Whether segment is added automatically on page load'),

  segment_criteria: SegmentCriteriaSchema,

  segment_id: z
    .number()
    .describe('Unique identifier of the segment'),

  segment_name: z
    .string()
    .describe('Human-readable name of the segment'),
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
    .describe('Primary URL of the site'),
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
}).describe('Full opt-in configuration');

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
    }).describe('Desktop opt-in settings'),

    mobile: z.object({
      http: OptinFullSchema.optional(),
      https: OptinFullSchema
        .or(
          OptinBaseSchema.extend({
            bell: OptinBellSchema,
          })
        )
        .optional(),
    }).describe('Mobile opt-in settings'),
  })
).describe('All opt-in configurations');

// ============================================================
// SITE SETTINGS SCHEMA
// ============================================================

export const SiteSettingsSchema = z.object({
  chicklet_settings: z.object({
    settings: z.object({
      delay: z.number().describe('Delay in seconds before chicklet appears'),
    }).describe('General chicklet behavior settings'),

    bell: z.object({
      bg: z.string().describe('Bell background color'),
      color: z.string().describe('Bell icon color'),
      position: z.string().describe('Bell position on screen'),
      label: z.string().describe('Bell label text'),
    }).describe('Bell UI configuration'),
  }).describe('Chicklet UI settings'),

  gcm_options: z.object({
    project_id: z.string().describe('Firebase / GCM project ID'),
  }).describe('Google Cloud Messaging configuration'),

  optin_management_settings: z.object({
    include_countries: z
      .array(z.string())
      .describe('Countries where opt-in is enabled'),
  }).describe('Opt-in geo management settings'),

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
    }).describe('Active opt-in configuration'),

    optins: OptinsSchema,
  }).describe('All opt-in related configuration'),

  privacy_settings: z.object({
    geoLocationEnabled: z
      .boolean()
      .describe('Whether geo-location tracking is enabled'),
  }).describe('Privacy settings'),

  service_worker: z.object({
    scope: z.boolean().describe('Service worker scope enabled'),
    workerStatus: z.boolean().describe('Service worker active status'),
    worker: z.string().describe('Service worker script URL'),
    keepMultipleSubscriptions: z
      .boolean()
      .describe('Allow multiple subscriptions per user'),
  }).describe('Service worker configuration'),

  sub_analytics: z.object({
    enabled: z.boolean().describe('Whether subscription analytics is enabled'),
  }).describe('Subscription analytics settings'),

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
    }).describe('Subscription management button'),

    settings: z.object({
      rules: z.record(z.string(), z.any()).describe('Subscription management rules'),
    }).describe('Subscription management rules'),
  }).describe('Subscription management settings'),

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
    }).describe('Trigger button configuration'),

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
    }).describe('Segment preference settings'),

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
    }).describe('Unsubscribe confirmation options'),

    personal_notification_options: z.object({
      enabled: z
        .boolean()
        .describe('Personal notification options enabled'),
      label: z.string().describe('Personal notification label'),
    }).describe('Personal notification settings'),
  }).describe('Subscription management widget'),

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


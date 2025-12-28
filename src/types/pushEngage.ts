/**
 * PushEngage Type Definitions
 * 
 * These types match the response from PushEngage.getAppConfig()
 * Sample data structure based on actual PE SDK response.
 */

// Campaign Interface
export interface PECampaign {
  status: 'active' | 'inactive' | string;
  campaign_name: string;
  start_event: string;
  stop_event: string;
  campaign_id?: number;
  created_at?: string;
  updated_at?: string;
}

// Site Information
export interface PESiteInfo {
  is_whitelabel: boolean;
  site_id: number;
  site_image: string;
  site_key: string;
  site_name: string;
  site_subdomain: string;
  site_url: string;
  shopify_domain: string | null;
  is_eu: boolean;
}

// Chicklet (Bell) Settings
export interface PEChickletSettings {
  settings: {
    delay: number;
  };
  bell: {
    bg: string;
    color: string;
    position: string; // 'br' = bottom-right, 'bl' = bottom-left, etc.
    label: string;
  };
}

// GCM Options
export interface PEGcmOptions {
  project_id: string;
}

// Opt-in Intermediate Settings
export interface PEOptinIntermediate {
  bg: string;
  page_heading: string;
  page_tagline: string;
  allow_btn_txt: string;
  allow_btn_bg: string;
}

// Opt-in Type Configuration
export interface PEOptinTypeConfig {
  cookie_duration: number;
  optin_category: string;
  optin_delay: number;
  optin_scroll: number;
  popup_disabled: number;
  optin_type: number;
  optin_name: string;
  optin_sw_support: number;
  bell?: {
    optin_title: string;
    bg: string;
    allowBtnBg: string;
    placement: string;
  };
  optin_segments?: unknown[];
  optin_title?: string;
  bg?: string;
  allowBtnBg?: string;
  placement?: string;
}

// Active Opt-in Configuration
export interface PEActiveOptin {
  http: { types: number[] };
  https: { types: number[] };
}

// Full Opt-in Settings
export interface PEOptinSettings {
  intermediate: PEOptinIntermediate;
  activeOptin: PEActiveOptin;
  optins: Record<string, {
    desktop?: { https?: PEOptinTypeConfig; http?: PEOptinTypeConfig };
    mobile?: { https?: PEOptinTypeConfig; http?: PEOptinTypeConfig };
  }>;
}

// Privacy Settings
export interface PEPrivacySettings {
  geoLocationEnabled: boolean;
}

// Service Worker Settings
export interface PEServiceWorker {
  scope: boolean;
  workerStatus: boolean;
  worker: string;
  keepMultipleSubscriptions: boolean;
}

// Subscription Analytics
export interface PESubAnalytics {
  enabled: boolean;
}

// Subscription Management Widget Trigger Button
export interface PETriggerButton {
  enabled: boolean;
  size: string;
  position_x: string;
  position_y: string;
  offset_top: number;
  offset_bottom: number;
  icon_background_color: string;
  icon_color: string;
  icon_type: string;
  z_index: number;
  rules: {
    enabled: boolean;
    exclude_countries: string[];
    exclude_devices: string[];
    exclude: Record<string, unknown>;
    include_countries: string[];
    include_devices: string[];
    include: Record<string, unknown>;
  };
}

// Segment Preference
export interface PESegmentPreference {
  enabled: boolean;
  subscribed_title: string;
  exclude_subscribed_segments: unknown[];
  show_all_subscribed_segment: boolean;
  title: string;
  segments: unknown[];
  checkbox_background_color: string;
  checkbox_tick_color: string;
  default_segment_selection: boolean;
}

// Unsubscribe Options
export interface PEUnsubscribeOptions {
  enabled: boolean;
  confirm_message: string;
  ok_text: string;
  cancel_text: string;
  ok_button_background_color: string;
  ok_button_text_color: string;
  cancel_button_background_color: string;
  cancel_button_text_color: string;
}

// Personal Notification Options
export interface PEPersonalNotificationOptions {
  enabled: boolean;
  label: string;
}

// Subscription Management Widget
export interface PESubscriptionManagementWidget {
  enabled: boolean;
  title: string;
  modal_background_color: string;
  modal_text_color: string;
  allow_text: string;
  on_switch_color: string;
  off_switch_color: string;
  trigger_button: PETriggerButton;
  segment_preference: PESegmentPreference;
  unsubscribe_options: PEUnsubscribeOptions;
  personal_notification_options: PEPersonalNotificationOptions;
}

// VAPID Key
export interface PEVapidKey {
  public_key: string;
}

// Reset Permission Popup Variant
export interface PEResetPermissionVariant {
  url: string;
  platform: string;
  message: string;
}

// Reset Notification Permission Popup
export interface PEResetNotificationPermissionPopup {
  message: string;
  background_color: string;
  retry_button_background_color: string;
  retry_button_label: string;
  close_button_background_color: string;
  close_button_label: string;
  variants: PEResetPermissionVariant[];
}

// Shopify Alert Campaign Message
export interface PEShopifyAlertMessage {
  before_subscription: string;
  after_subscription: string;
  allow_btn_txt: string;
}

// Shopify Options
export interface PEShopifyOptions {
  money_format: string;
  alert_campaign: {
    bell_color: string;
    bell_background: string;
    text_color: string;
    message: {
      price_drop: PEShopifyAlertMessage;
      inventory: PEShopifyAlertMessage;
    };
  };
}

// Full Site Settings
export interface PESiteSettings {
  chicklet_settings: PEChickletSettings;
  gcm_options: PEGcmOptions;
  optin_settings: PEOptinSettings;
  privacy_settings: PEPrivacySettings;
  service_worker: PEServiceWorker;
  sub_analytics: PESubAnalytics;
  subscription_management_widget: PESubscriptionManagementWidget;
  vapid_key: PEVapidKey;
  reset_notification_permission_popup: PEResetNotificationPermissionPopup;
  shopify_options: PEShopifyOptions;
  shopify_wa_cart_abandonment: Record<string, unknown>;
}

// Segment
export interface PESegment {
  id: number;
  name: string;
  description?: string;
  subscriber_count?: number;
}

// Subscriber Attribute
export interface PESubscriberAttribute {
  id: number;
  name: string;
  type: string;
  default_value?: string;
}

// Chat Widget
export interface PEChatWidget {
  id: number;
  name: string;
  enabled: boolean;
}

/**
 * Main PushEngage App Configuration
 * 
 * This is the response from PushEngage.getAppConfig()
 */
export interface PEAppConfig {
  browseAbandonments: PECampaign[];
  cartAbandonments: PECampaign[];
  priceDropAlerts: unknown[];
  backInStockAlerts: unknown[];
  customTriggerCampaigns: PECampaign[];
  site: PESiteInfo;
  siteSettings: PESiteSettings;
  segments: PESegment[];
  chatWidgets: PEChatWidget[];
  subscriberAttributes: PESubscriberAttribute[];
}

// ===== Helper Types =====

// Campaign Summary Statistics
export interface PECampaignSummary {
  totalCampaigns: number;
  activeCampaigns: number;
  inactiveCampaigns: number;
  browseAbandonments: number;
  cartAbandonments: number;
  customTriggers: number;
  priceDropAlerts: number;
  backInStockAlerts: number;
}

// Key Settings Extract (for display)
export interface PEKeySettings {
  siteName: string;
  siteUrl: string;
  siteId: number;
  chickletPosition: string;
  chickletLabel: string;
  geoLocation: boolean;
  analytics: boolean;
  segmentsCount: number;
  attributesCount: number;
}

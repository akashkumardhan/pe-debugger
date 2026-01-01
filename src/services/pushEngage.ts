/**
 * PushEngage Service Layer
 * 
 * Provides utilities for parsing and formatting PushEngage configuration data
 * for display in the UI and for building AI context.
 * 
 * Data is fetched from PushEngage.getAppConfig() in the content script.
 */

import type { 
  PEAppConfig, 
  PECampaign, 
  PECampaignSummary, 
  PEKeySettings 
} from '../types/pushEngage';

export class PushEngageService {
  /**
   * Build comprehensive AI context from PushEngage configuration
   * 
   * This formats the PE config into a readable string that can be
   * included in AI system prompts for querying the configuration.
   */
  buildAIContext(config: PEAppConfig): string {
    const campaigns = this.formatCampaigns(config);
    const siteInfo = this.formatSiteInfo(config);
    const settings = this.formatSettings(config);
    const segments = this.formatSegments(config);

    return `
${campaigns}

${siteInfo}

${settings}

${segments}
    `.trim();
  }

  /**
   * Format campaign information for AI context
   */
  private formatCampaigns(config: PEAppConfig): string {
    const formatCampaignList = (campaigns: PECampaign[], label: string): string => {
      if (!campaigns?.length) return `- ${label}: 0 campaigns`;
      
      const list = campaigns.map(c => 
        `  • "${c.campaign_name}" [${c.status.toUpperCase()}]\n    Trigger: ${c.start_event} → Stop: ${c.stop_event}`
      ).join('\n');
      
      return `- ${label}: ${campaigns.length} campaign(s)\n${list}`;
    };

    const activeCampaigns = this.getActiveCampaigns(config);

    return `## CAMPAIGNS OVERVIEW

Total Active Campaigns: ${activeCampaigns.length}

### Browse Abandonment Campaigns
${formatCampaignList(config.browseAbandonments || [], 'Browse Abandonments')}

### Cart Abandonment Campaigns
${formatCampaignList(config.cartAbandonments || [], 'Cart Abandonments')}

### Custom Trigger Campaigns
${formatCampaignList(config.customTriggerCampaigns || [], 'Custom Triggers')}

### Alert Campaigns
- Price Drop Alerts: ${config.priceDropAlerts?.length || 0} configured
- Back In Stock Alerts: ${config.backInStockAlerts?.length || 0} configured`;
  }

  /**
   * Format site information for AI context
   */
  private formatSiteInfo(config: PEAppConfig): string {
    const site = config.site;
    if (!site) return '## SITE INFO\nNot available';

    return `## SITE INFORMATION

- **Site Name:** ${site.site_name}
- **Site ID:** ${site.site_id}
- **Site URL:** ${site.site_url}
- **Site Key:** ${site.site_key}
- **Subdomain:** ${site.site_subdomain}
- **Is EU Site:** ${site.is_eu ? 'Yes' : 'No'}
- **Is Whitelabel:** ${site.is_whitelabel ? 'Yes' : 'No'}
- **Shopify Domain:** ${site.shopify_domain || 'Not connected'}
- **Site Image:** ${site.site_image}`;
  }

  /**
   * Format settings for AI context
   * Includes ALL objects from the SiteSettingsSchema for comprehensive AI context
   */
  private formatSettings(config: PEAppConfig): string {
    const settings = config.siteSettings;
    if (!settings) return '## SETTINGS\nNot available';

    const chicklet = settings.chicklet_settings?.bell;
    const intermediate = settings.optin_settings?.intermediate;
    const privacy = settings.privacy_settings;
    const analytics = settings.sub_analytics;
    const widget = settings.subscription_management_widget;
    const serviceWorker = settings.service_worker;
    const gcm = settings.gcm_options;
    const vapid = settings.vapid_key;
    const resetPopup = settings.reset_notification_permission_popup;
    const shopify = settings.shopify_options;
    const subManagement = settings.sub_management_settings;
    const optinManagement = settings.optin_management_settings;

    // Format position label
    const positionMap: Record<string, string> = {
      'br': 'Bottom Right',
      'bl': 'Bottom Left',
      'tr': 'Top Right',
      'tl': 'Top Left'
    };
    const chickletPosition = positionMap[chicklet?.position || ''] || chicklet?.position || 'N/A';

    // Format active opt-ins with full details including optin_name
    const activeOptinsFormatted = this.formatActiveOptins(settings);

    return `## SETTINGS

### Chicklet (Bell/Subscriber Recovery Widget) Settings
- **Position:** ${chickletPosition}
- **Label:** "${chicklet?.label || 'N/A'}"
- **Background Color:** ${chicklet?.bg || 'N/A'}
- **Icon Color:** ${chicklet?.color || 'N/A'}
- **Delay:** ${settings.chicklet_settings?.settings?.delay || 0} seconds

### Opt-in/Subscription Popup Configuration

#### Intermediate Screen Settings
- **Background Color:** ${intermediate?.bg || 'N/A'}
- **Page Heading:** "${intermediate?.page_heading || 'N/A'}"
- **Page Tagline:** "${intermediate?.page_tagline || 'N/A'}"
- **Allow Button Text:** "${intermediate?.allow_btn_txt || 'N/A'}"
- **Allow Button Color:** ${intermediate?.allow_btn_bg || 'N/A'}

#### Active Opt-in Types
- **Active HTTP Types:** ${settings.optin_settings?.activeOptin?.http?.types?.join(', ') || 'None'}
- **Active HTTPS Types:** ${settings.optin_settings?.activeOptin?.https?.types?.join(', ') || 'None'}

#### Configured Opt-in/Popup Modals (with names)
${activeOptinsFormatted}

### Targeting Rules (Opt-in Management Settings)
- **Include Rules:** ${optinManagement?.include?.length ? optinManagement.include.map((r: any) => `${r.rule}: "${r.value}"`).join(', ') : 'None configured'}
- **Include Countries:** ${optinManagement?.include_countries?.length ? optinManagement.include_countries.join(', ') : 'All countries'}

### Privacy Settings
- **Geo Location Enabled:** ${privacy?.geoLocationEnabled ? 'Yes' : 'No'}

### Analytics
- **Subscription Analytics:** ${analytics?.enabled ? 'Enabled' : 'Disabled'}

### Service Worker Configuration
> ⚠️ **IMPORTANT:** The Service Worker URL does NOT indicate Quick Install status.
> Quick Install is determined by the "optin_sw_support" field in each opt-in configuration (see "Configured Opt-in/Popup Modals" section above).
> For opt-in type 4 (single-step), Quick Install is NOT applicable - subscriptions are always collected on the user's domain.

- **Worker URL:** ${serviceWorker?.worker || 'N/A'}
- **Scope Enabled:** ${serviceWorker?.scope ? 'Yes' : 'No'}
- **Worker Status:** ${serviceWorker?.workerStatus ? 'Enabled' : 'Disabled'}
- **Keep Multiple Subscriptions:** ${serviceWorker?.keepMultipleSubscriptions ? 'Yes' : 'No'}

### GCM/Firebase Options
- **Project ID:** ${gcm?.project_id || 'N/A'}

### VAPID Key
- **Public Key:** ${vapid?.public_key ? vapid.public_key.substring(0, 20) + '...' : 'N/A'}

### Subscription Management Widget
- **Enabled:** ${widget?.enabled ? 'Yes' : 'No'}
- **Title:** "${widget?.title || 'N/A'}"
- **Modal Background Color:** ${widget?.modal_background_color || 'N/A'}
- **Modal Text Color:** ${widget?.modal_text_color || 'N/A'}
- **Allow Text:** "${widget?.allow_text || 'N/A'}"
- **On Switch Color:** ${widget?.on_switch_color || 'N/A'}
- **Off Switch Color:** ${widget?.off_switch_color || 'N/A'}

#### Trigger Button
- **Enabled:** ${widget?.trigger_button?.enabled ? 'Yes' : 'No'}
- **Size:** ${widget?.trigger_button?.size || 'N/A'}
- **Position:** ${widget?.trigger_button?.position_x || 'N/A'} / ${widget?.trigger_button?.position_y || 'N/A'}
- **Offset Top:** ${widget?.trigger_button?.offset_top || 0}px
- **Offset Bottom:** ${widget?.trigger_button?.offset_bottom || 0}px
- **Icon Type:** ${widget?.trigger_button?.icon_type || 'N/A'}
- **Icon Background Color:** ${widget?.trigger_button?.icon_background_color || 'N/A'}
- **Icon Color:** ${widget?.trigger_button?.icon_color || 'N/A'}
- **Z-Index:** ${widget?.trigger_button?.z_index || 'N/A'}
- **Rules Enabled:** ${widget?.trigger_button?.rules?.enabled ? 'Yes' : 'No'}
- **Include Countries:** ${widget?.trigger_button?.rules?.include_countries?.length ? widget.trigger_button.rules.include_countries.join(', ') : 'All'}
- **Exclude Countries:** ${widget?.trigger_button?.rules?.exclude_countries?.length ? widget.trigger_button.rules.exclude_countries.join(', ') : 'None'}
- **Include Devices:** ${widget?.trigger_button?.rules?.include_devices?.length ? widget.trigger_button.rules.include_devices.join(', ') : 'All'}
- **Exclude Devices:** ${widget?.trigger_button?.rules?.exclude_devices?.length ? widget.trigger_button.rules.exclude_devices.join(', ') : 'None'}
- **URL Include Rules (Start):** ${widget?.trigger_button?.rules?.include?.start?.length ? widget.trigger_button.rules.include.start.join(', ') : 'None'}
- **URL Include Rules (Contains):** ${widget?.trigger_button?.rules?.include?.contains?.length ? widget.trigger_button.rules.include.contains.join(', ') : 'None'}
- **URL Include Rules (Exact):** ${widget?.trigger_button?.rules?.include?.exact?.length ? widget.trigger_button.rules.include.exact.join(', ') : 'None'}

#### Segment Preference
- **Enabled:** ${widget?.segment_preference?.enabled ? 'Yes' : 'No'}
- **Title:** "${widget?.segment_preference?.title || 'N/A'}"
- **Subscribed Title:** "${widget?.segment_preference?.subscribed_title || 'N/A'}"
- **Show All Subscribed Segments:** ${widget?.segment_preference?.show_all_subscribed_segment ? 'Yes' : 'No'}
- **Default Segment Selection:** ${widget?.segment_preference?.default_segment_selection ? 'Yes' : 'No'}
- **Checkbox Background Color:** ${widget?.segment_preference?.checkbox_background_color || 'N/A'}
- **Checkbox Tick Color:** ${widget?.segment_preference?.checkbox_tick_color || 'N/A'}
- **Available Segments:** ${widget?.segment_preference?.segments?.length || 0}
- **Excluded Subscribed Segments:** ${widget?.segment_preference?.exclude_subscribed_segments?.length || 0}

#### Unsubscribe Options
- **Enabled:** ${widget?.unsubscribe_options?.enabled ? 'Yes' : 'No'}
- **Confirm Message:** "${widget?.unsubscribe_options?.confirm_message || 'N/A'}"
- **OK Button Text:** "${widget?.unsubscribe_options?.ok_text || 'N/A'}"
- **OK Button Background Color:** ${widget?.unsubscribe_options?.ok_button_background_color || 'N/A'}
- **OK Button Text Color:** ${widget?.unsubscribe_options?.ok_button_text_color || 'N/A'}
- **Cancel Button Text:** "${widget?.unsubscribe_options?.cancel_text || 'N/A'}"
- **Cancel Button Background Color:** ${widget?.unsubscribe_options?.cancel_button_background_color || 'N/A'}
- **Cancel Button Text Color:** ${widget?.unsubscribe_options?.cancel_button_text_color || 'N/A'}

#### Personal Notification Options
- **Enabled:** ${widget?.personal_notification_options?.enabled ? 'Yes' : 'No'}
- **Label:** "${widget?.personal_notification_options?.label || 'N/A'}"

### Unsubscribe Button Widget (Sub Management Settings)
- **Position:** ${subManagement?.button?.position || 'N/A'}
- **Background Color:** ${subManagement?.button?.bg || 'N/A'}
- **Text Color:** ${subManagement?.button?.color || 'N/A'}
- **Unsubscribe Message:** "${subManagement?.button?.unsubMsg || 'N/A'}"
- **Thank You Message:** "${subManagement?.button?.thankMsg || 'N/A'}"
- **Confirm Message:** "${subManagement?.button?.confirmMsg || 'N/A'}"
- **Confirm Yes Text:** "${subManagement?.button?.ConfirmActionYes || 'N/A'}"
- **Confirm No Text:** "${subManagement?.button?.ConfirmActionNo || 'N/A'}"

### Reset Notification Permission Popup
- **Message:** "${resetPopup?.message || 'N/A'}"
- **Background Color:** ${resetPopup?.background_color || 'N/A'}
- **Retry Button Label:** "${resetPopup?.retry_button_label || 'N/A'}"
- **Retry Button Background Color:** ${resetPopup?.retry_button_background_color || 'N/A'}
- **Close Button Label:** "${resetPopup?.close_button_label || 'N/A'}"
- **Close Button Background Color:** ${resetPopup?.close_button_background_color || 'N/A'}
- **Platform Variants:** ${resetPopup?.variants?.length || 0}
${resetPopup?.variants?.length ? resetPopup.variants.map((v: any) => `  • ${v.platform}: "${v.message}" (${v.url})`).join('\n') : '  None configured'}

### Shopify Options
- **Money Format:** ${shopify?.money_format || 'N/A'}
- **Alert Bell Color:** ${shopify?.alert_campaign?.bell_color || 'N/A'}
- **Alert Bell Background:** ${shopify?.alert_campaign?.bell_background || 'N/A'}
- **Alert Text Color:** ${shopify?.alert_campaign?.text_color || 'N/A'}

#### Price Drop Alert Messages
- **Before Subscription:** "${shopify?.alert_campaign?.message?.price_drop?.before_subscription || 'N/A'}"
- **After Subscription:** "${shopify?.alert_campaign?.message?.price_drop?.after_subscription || 'N/A'}"
- **Allow Button Text:** "${shopify?.alert_campaign?.message?.price_drop?.allow_btn_txt || 'N/A'}"

#### Inventory Alert Messages
- **Before Subscription:** "${shopify?.alert_campaign?.message?.inventory?.before_subscription || 'N/A'}"
- **After Subscription:** "${shopify?.alert_campaign?.message?.inventory?.after_subscription || 'N/A'}"
- **Allow Button Text:** "${shopify?.alert_campaign?.message?.inventory?.allow_btn_txt || 'N/A'}"

### Shopify WhatsApp Cart Abandonment
- **Configured:** ${settings.shopify_wa_cart_abandonment && Object.keys(settings.shopify_wa_cart_abandonment).length > 0 ? 'Yes' : 'No'}`;
  }

  /**
   * Format active opt-ins with full configuration details including optin_name
   */
  private formatActiveOptins(settings: any): string {
    const optins = settings.optin_settings?.optins;
    const activeHttpsTypes = settings.optin_settings?.activeOptin?.https?.types || [];
    const activeHttpTypes = settings.optin_settings?.activeOptin?.http?.types || [];
    
    if (!optins || Object.keys(optins).length === 0) {
      return '  No opt-ins configured';
    }

    const lines: string[] = [];
    
    // Iterate through all opt-in configurations
    for (const [typeKey, typeConfig] of Object.entries(optins)) {
      const config = typeConfig as any;
      const isActiveHttps = activeHttpsTypes.includes(parseInt(typeKey));
      const isActiveHttp = activeHttpTypes.includes(parseInt(typeKey));
      
      // Check desktop HTTPS config (most common)
      const desktopHttps = config?.desktop?.https;
      const desktopHttp = config?.desktop?.http;
      const mobileHttps = config?.mobile?.https;
      const mobileHttp = config?.mobile?.http;
      
      // Use desktop HTTPS as primary, fallback to others
      const primaryConfig = desktopHttps || desktopHttp || mobileHttps || mobileHttp;
      
      if (primaryConfig) {
        const activeStatus = isActiveHttps ? '✅ ACTIVE' : (isActiveHttp ? '✅ ACTIVE (HTTP)' : '❌ INACTIVE');
        const optinTypeNum = parseInt(typeKey);
        
        // Quick Install (optin_sw_support) determination:
        // - For opt-in type 4 (single-step): Quick Install is NOT applicable - always uses user's domain
        // - For other types: optin_sw_support=1 means Quick Install ON (PushEngage subdomain), 0 means OFF (user's domain)
        let quickInstallStatus: string;
        if (optinTypeNum === 4) {
          quickInstallStatus = 'N/A (Type 4 single-step opt-in always collects on your domain - Quick Install not applicable)';
        } else if (primaryConfig.optin_sw_support === 1) {
          quickInstallStatus = '✅ ON (Subscriptions collected on PushEngage subdomain). This is helpful if the site is HTTP because, HTTP sites are not allowed to collect subscriptions on your own domain. So, PushEngage gives option to collect subscriptions on PushEngage subdomain.';
        } else {
          quickInstallStatus = '❌ OFF (Subscriptions collected on your domain)';
        }
        
        lines.push(`
**Opt-in Type ${typeKey}** [${activeStatus}]
- **Opt-in Name:** "${primaryConfig.optin_name || 'Unnamed'}"
- **Opt-in Type Number:** ${primaryConfig.optin_type || typeKey}
- **Opt-in Title:** "${primaryConfig.optin_title || 'N/A'}"
- **Category:** ${primaryConfig.optin_category || 'N/A'}
- **Placement:** ${primaryConfig.placement || 'N/A'}
- **Delay:** ${primaryConfig.optin_delay || 0} seconds
- **Scroll Trigger:** ${primaryConfig.optin_scroll || 0}%
- **Cookie Duration:** ${primaryConfig.cookie_duration || 0} days
- **Allow Button Text:** "${primaryConfig.optin_allow_btn_txt || 'N/A'}"
- **Background Color:** ${primaryConfig.bg || 'N/A'}
- **Allow Button Background:** ${primaryConfig.allowBtnBg || 'N/A'}
- **Checkbox Background:** ${primaryConfig.checkbox_bg || 'N/A'}
- **Checkbox Tick Color:** ${primaryConfig.checkbox_tick_color || 'N/A'}
- **Default Segment Selection:** ${primaryConfig.default_segment_selection ? 'Yes' : 'No'}
- **Popup Disabled:** ${primaryConfig.popup_disabled ? 'Yes' : 'No'}
- **Quick Install (optin_sw_support):** ${quickInstallStatus}
- **Associated Segments:** ${primaryConfig.optin_segments?.length || 0}`);
      }
    }
    
    return lines.length > 0 ? lines.join('\n') : '  No opt-in details available';
  }

  /**
   * Format segments and attributes for AI context
   */
  private formatSegments(config: PEAppConfig): string {
    // Format segments with full criteria details
    const formatSegmentCriteria = (criteria: any): string => {
      if (!criteria || !criteria.include) return 'None';
      const parts: string[] = [];
      if (criteria.include.start?.length) {
        parts.push(`Start with: ${criteria.include.start.join(', ')}`);
      }
      if (criteria.include.contains?.length) {
        parts.push(`Contains: ${criteria.include.contains.join(', ')}`);
      }
      if (criteria.include.exact?.length) {
        parts.push(`Exact: ${criteria.include.exact.join(', ')}`);
      }
      return parts.length > 0 ? parts.join('; ') : 'None';
    };

    const segmentsList = config.segments?.length 
      ? config.segments.map(s => 
        `  • **${s.segment_name}** (ID: ${s.segment_id})
    - Auto-add on Page Load: ${s.add_segment_on_page_load ? 'Yes' : 'No'}
    - Criteria: ${formatSegmentCriteria(s.segment_criteria)}`
      ).join('\n')
      : '  None configured';

    const attrsList = config.subscriberAttributes?.length
      ? config.subscriberAttributes.map(a => `  • ${a.name} (Type: ${a.type}${a.default_value ? `, Default: ${a.default_value}` : ''})`).join('\n')
      : '  None configured';

    const chatWidgetsList = config.chatWidgets?.length
      ? config.chatWidgets.map(w => `  • ${w.name} (ID: ${w.id}, Enabled: ${w.enabled ? 'Yes' : 'No'})`).join('\n')
      : '  None configured';

    return `## SEGMENTS & ATTRIBUTES

### Segments (${config.segments?.length || 0})
${segmentsList}

### Subscriber Attributes (${config.subscriberAttributes?.length || 0})
${attrsList}

### Chat Widgets (${config.chatWidgets?.length || 0})
${chatWidgetsList}`;
  }

  /**
   * Parse campaign summary statistics
   */
  parseCampaignSummary(config: PEAppConfig): PECampaignSummary {
    const allCampaigns: PECampaign[] = [
      ...(config.browseAbandonments || []),
      ...(config.cartAbandonments || []),
      ...(config.customTriggerCampaigns || [])
    ];

    return {
      totalCampaigns: allCampaigns.length,
      activeCampaigns: allCampaigns.filter(c => c.status === 'active').length,
      inactiveCampaigns: allCampaigns.filter(c => c.status !== 'active').length,
      browseAbandonments: config.browseAbandonments?.length || 0,
      cartAbandonments: config.cartAbandonments?.length || 0,
      customTriggers: config.customTriggerCampaigns?.length || 0,
      priceDropAlerts: config.priceDropAlerts?.length || 0,
      backInStockAlerts: config.backInStockAlerts?.length || 0
    };
  }

  /**
   * Extract key settings for quick display
   */
  extractKeySettings(config: PEAppConfig): PEKeySettings {
    const site = config.site;
    const settings = config.siteSettings;

    // Format position label
    const positionMap: Record<string, string> = {
      'br': 'Bottom Right',
      'bl': 'Bottom Left',
      'tr': 'Top Right',
      'tl': 'Top Left'
    };
    const rawPosition = settings?.chicklet_settings?.bell?.position || '';

    return {
      siteName: site?.site_name || 'Unknown',
      siteUrl: site?.site_url || '',
      siteId: site?.site_id || 0,
      chickletPosition: positionMap[rawPosition] || rawPosition || 'Not set',
      chickletLabel: settings?.chicklet_settings?.bell?.label || '',
      geoLocation: settings?.privacy_settings?.geoLocationEnabled || false,
      analytics: settings?.sub_analytics?.enabled || false,
      segmentsCount: config.segments?.length || 0,
      attributesCount: config.subscriberAttributes?.length || 0
    };
  }

  /**
   * Get campaigns by type
   */
  getCampaignsByType(config: PEAppConfig, type: 'browse' | 'cart' | 'custom'): PECampaign[] {
    switch (type) {
      case 'browse':
        return config.browseAbandonments || [];
      case 'cart':
        return config.cartAbandonments || [];
      case 'custom':
        return config.customTriggerCampaigns || [];
      default:
        return [];
    }
  }

  /**
   * Get all active campaigns
   */
  getActiveCampaigns(config: PEAppConfig): PECampaign[] {
    const all = [
      ...(config.browseAbandonments || []),
      ...(config.cartAbandonments || []),
      ...(config.customTriggerCampaigns || [])
    ];
    return all.filter(c => c.status === 'active');
  }

  /**
   * Check if a specific feature is enabled
   */
  isFeatureEnabled(config: PEAppConfig, feature: string): boolean {
    const settings = config.siteSettings;
    if (!settings) return false;

    switch (feature) {
      case 'geoLocation':
        return settings.privacy_settings?.geoLocationEnabled || false;
      case 'analytics':
        return settings.sub_analytics?.enabled || false;
      case 'subscriptionWidget':
        return settings.subscription_management_widget?.enabled || false;
      case 'segmentPreference':
        return settings.subscription_management_widget?.segment_preference?.enabled || false;
      default:
        return false;
    }
  }
}

// Export singleton instance
export const pushEngageService = new PushEngageService();

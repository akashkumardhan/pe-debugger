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
   */
  private formatSettings(config: PEAppConfig): string {
    const settings = config.siteSettings;
    if (!settings) return '## SETTINGS\nNot available';

    const chicklet = settings.chicklet_settings?.bell;
    const optin = settings.optin_settings?.intermediate;
    const privacy = settings.privacy_settings;
    const analytics = settings.sub_analytics;
    const widget = settings.subscription_management_widget;

    // Format position label
    const positionMap: Record<string, string> = {
      'br': 'Bottom Right',
      'bl': 'Bottom Left',
      'tr': 'Top Right',
      'tl': 'Top Left'
    };
    const chickletPosition = positionMap[chicklet?.position || ''] || chicklet?.position || 'N/A';

    return `## SETTINGS

### Chicklet (Bell) Settings
- **Position:** ${chickletPosition}
- **Label:** "${chicklet?.label || 'N/A'}"
- **Background Color:** ${chicklet?.bg || 'N/A'}
- **Icon Color:** ${chicklet?.color || 'N/A'}
- **Delay:** ${settings.chicklet_settings?.settings?.delay || 0} seconds

### Opt-in Configuration
- **Page Heading:** "${optin?.page_heading || 'N/A'}"
- **Page Tagline:** "${optin?.page_tagline || 'N/A'}"
- **Allow Button Text:** "${optin?.allow_btn_txt || 'N/A'}"
- **Allow Button Color:** ${optin?.allow_btn_bg || 'N/A'}
- **Active HTTPS Opt-in Types:** ${settings.optin_settings?.activeOptin?.https?.types?.join(', ') || 'None'}

### Privacy Settings
- **Geo Location Enabled:** ${privacy?.geoLocationEnabled ? 'Yes' : 'No'}

### Analytics
- **Subscription Analytics:** ${analytics?.enabled ? 'Enabled' : 'Disabled'}

### Subscription Management Widget
- **Enabled:** ${widget?.enabled ? 'Yes' : 'No'}
- **Title:** "${widget?.title || 'N/A'}"
- **Trigger Button Enabled:** ${widget?.trigger_button?.enabled ? 'Yes' : 'No'}
- **Segment Preference Enabled:** ${widget?.segment_preference?.enabled ? 'Yes' : 'No'}
- **Unsubscribe Options Enabled:** ${widget?.unsubscribe_options?.enabled ? 'Yes' : 'No'}

### Service Worker
- **Worker URL:** ${settings.service_worker?.worker || 'N/A'}
- **Scope Enabled:** ${settings.service_worker?.scope ? 'Yes' : 'No'}`;
  }

  /**
   * Format segments and attributes for AI context
   */
  private formatSegments(config: PEAppConfig): string {
    const segmentsList = config.segments?.length 
      ? config.segments.map(s => `  • ${s.name}`).join('\n')
      : '  None configured';

    const attrsList = config.subscriberAttributes?.length
      ? config.subscriberAttributes.map(a => `  • ${a.name} (${a.type})`).join('\n')
      : '  None configured';

    return `## SEGMENTS & ATTRIBUTES

### Segments (${config.segments?.length || 0})
${segmentsList}

### Subscriber Attributes (${config.subscriberAttributes?.length || 0})
${attrsList}

### Chat Widgets (${config.chatWidgets?.length || 0})
${config.chatWidgets?.length ? config.chatWidgets.map(w => `  • ${w.name}`).join('\n') : '  None configured'}`;
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

/**
 * PushEngage Dashboard Documentation
 * 
 * This file contains the authoritative documentation for all PushEngage dashboard
 * routes, menus, and features. The AI MUST use this documentation when answering
 * any questions about dashboard navigation.
 * 
 * IMPORTANT: Keep this file updated when the PushEngage dashboard changes.
 */

export const PUSHENGAGE_DASHBOARD_DOCS = `
# PushEngage Dashboard - Complete Feature Documentation

## Overview

This comprehensive documentation covers all routes, menus, and features available in the PushEngage dashboard. Use this as a reference guide to understand where users need to navigate for specific functionality.

---

## 🏠 Dashboard

**Route:** \`https://app.pushengage.com/\`
**Menu:** Dashboard

### Features
- **Campaign Overview**: Quick stats on recent campaigns
- **Subscriber Growth**: Real-time subscriber metrics
- **Recent Activity**: Latest campaign performance
- **Quick Actions**: Create new campaigns, view analytics
- **Site Switcher**: Switch between multiple sites (Business+ plans)

---

## 📢 Campaign Management

**Route Base:** \`https://app.pushengage.com/campaigns/\`
**Menu:** Campaign

### 1. Push Broadcasts

**Route:** \`https://app.pushengage.com/campaigns/notifications\`
**Menu:** Campaign > Push Broadcasts

#### Features
- **Create Campaign**: \`https://app.pushengage.com/campaigns/notifications/create\`
- **Edit Campaign**: \`https://app.pushengage.com/campaigns/notifications/edit/:id\`
- **Campaign Templates**: \`https://app.pushengage.com/campaigns/notifications/templates\`
- **Campaign List**: View all broadcast campaigns
- **Campaign Analytics**: Performance metrics per campaign
- **A/B Testing**: Smart A/B testing for notifications (Premium+)
- **Scheduling**: Schedule campaigns for future delivery
- **Multi-Action Notifications**: Add multiple action buttons (Business+)
- **UTM Tracking**: Track campaign performance with UTM parameters

### 2. Drip Autoresponders

**Route:** \`https://app.pushengage.com/campaigns/drip\`
**Menu:** Campaign > Drip Autoresponders
**Plan Requirement:** Premium+

#### Features
- **Create Drip**: \`https://app.pushengage.com/campaigns/drip/create\`
- **Edit Drip**: \`https://app.pushengage.com/campaigns/drip/edit/:id\`
- **View Drip**: \`https://app.pushengage.com/campaigns/drip/:id\`
- **Welcome Drip Campaigns**: Automated welcome series
- **Nurture Sequences**: Multi-step automated campaigns
- **Trigger-based Automation**: Based on user behavior
- **Delay Settings**: Configure timing between messages

### 3. Triggered Campaigns

**Route:** \`https://app.pushengage.com/campaigns/triggers\`
**Menu:** Campaign > Triggered Campaigns
**Plan Requirement:** Growth+

#### Features
- **Select Trigger Type**: \`https://app.pushengage.com/campaigns/triggers/select\`
- **Create Trigger**: \`https://app.pushengage.com/campaigns/triggers/create\`
- **Edit Trigger**: \`https://app.pushengage.com/campaigns/triggers/edit/:id\`
- **View Trigger**: \`https://app.pushengage.com/campaigns/triggers/:id\`
- **Behavioral Triggers**: Based on user actions
- **Time-based Triggers**: Scheduled automated campaigns
- **Event-based Triggers**: Custom event triggers
- **Conditional Logic**: Advanced trigger conditions

### 4. RSS Auto Push

**Route:** \`https://app.pushengage.com/campaigns/rss-autopush\`
**Menu:** Campaign > RSS Auto Push
**Plan Requirement:** Business+

#### Features
- **Create RSS Campaign**: \`https://app.pushengage.com/campaigns/rss-autopush/create\`
- **Edit RSS Campaign**: \`https://app.pushengage.com/campaigns/rss-autopush/edit/:id\`
- **RSS Feed Integration**: Automatically send campaigns for new posts
- **Custom Frequency**: Set campaign frequency
- **Content Customization**: Customize title, message, and images
- **Audience Targeting**: Use segments and groups for personalization

---

## 🎨 Design

**Route Base:** \`https://app.pushengage.com/design/\`
**Menu:** Design

### 1. Popup Modals

**Route:** \`https://app.pushengage.com/design/subscription-dialogbox\`
**Menu:** Design > Popup Modals

#### Available Popup Types
- **Sleek Opt-in Box**: Modern single-button opt-in
- **Safari Style Box**: Two-step popup modal
- **Bell Placed Bar**: Notification bell with bar
- **Floating Bar**: Floating notification bar
- **Push Single Step Opt-in**: One-click subscription
- **Large Safari Style Box**: Extended safari-style popup

#### Features
- **Edit Popup**: \`https://app.pushengage.com/design/subscription-dialogbox/edit-subscription-dialogbox\`
- **Desktop/Mobile Preview**: Real-time preview for both devices
- **Customization Options**: Colors, text, positioning, timing
- **A/B Testing**: Test different popup variations
- **Targeting Rules**: Show popups based on user behavior
- **Delay Settings**: Configure when popups appear
- **Exit Intent**: Show popup when user tries to leave
- **Page Targeting**: Show on specific pages

### 2. Widgets

**Route:** \`https://app.pushengage.com/design/widgets\`
**Menu:** Design > Widgets

#### Widget Types
- **Recovery Button Widget**: \`https://app.pushengage.com/design/widgets/edit-recovery-button-widget\`
- **Recovery Bell Widget**: \`https://app.pushengage.com/design/widgets/edit-recovery-bell-widget\`
- **Unsubscribe Button Widget**: \`https://app.pushengage.com/design/widgets/edit-unsubscribe-button-widget\`
- **Unsubscribe Bell Widget**: \`https://app.pushengage.com/design/widgets/edit-unsubscribe-bell-widget\`
- **Alert Bell Campaign Widget**: \`https://app.pushengage.com/design/widgets/edit-alert-bell-campaign-widget\`
- **Subscription Management Widget**: \`https://app.pushengage.com/design/widgets/edit-subscription-management-widget\`
- **Reset Notification Permission Popup**: \`https://app.pushengage.com/design/widgets/edit-reset-notification-permission-popup\`

#### Features
- **Custom Styling**: Colors, fonts, positioning
- **Responsive Design**: Mobile and desktop optimization
- **Smart Positioning**: Automatic optimal placement
- **Custom Branding**: Add your brand elements (Business+)

### 3. Targeting Rules

**Route:** \`https://app.pushengage.com/design/targeting-rule\`
**Menu:** Design > Targeting Rule

#### Features
- **Page-based Targeting**: Show popups on specific pages
- **Behavior-based Targeting**: Based on user actions
- **Geographic Targeting**: Location-based rules (Business+)
- **Device Targeting**: Desktop, mobile, tablet specific
- **Time-based Rules**: Show at specific times
- **Frequency Capping**: Limit popup frequency per user
- **New vs Returning Visitors**: Different rules for user types

---

## 👥 Audience Management

**Route Base:** \`https://app.pushengage.com/audience/\`
**Menu:** Audience

### 1. Subscribers

**Route:** \`https://app.pushengage.com/audience/subscribers\`
**Menu:** Audience > Subscribers

#### Features
- **Subscriber List**: View all subscribers with details
- **Search & Filter**: Find subscribers by various criteria
- **Bulk Actions**: Mass operations on subscribers
- **Export Data**: Download subscriber lists
- **Subscriber Details**: Individual subscriber profiles
- **Subscription History**: Track subscriber journey
- **Device Information**: Browser, OS, location data
- **Engagement Metrics**: Click rates, view rates per subscriber

### 2. Segments

**Route:** \`https://app.pushengage.com/audience/segments\`
**Menu:** Audience > Segments
**Plan Requirement:** Business+

#### Features
- **Create Segment**: \`https://app.pushengage.com/audience/segments/create\`
- **Edit Segment**: \`https://app.pushengage.com/audience/segments/edit/:id\`
- **View Segment**: \`https://app.pushengage.com/audience/segments/:id\`
- **Dynamic Segmentation**: Auto-update based on behavior
- **Geographic Segmentation**: Location-based segments
- **Device Segmentation**: Browser/device-based segments
- **Behavioral Segmentation**: Based on user actions
- **Custom Attributes**: Segment by custom data points

### 3. Audience Groups

**Route:** \`https://app.pushengage.com/audience/audience-groups\`
**Menu:** Audience > Audience Groups
**Plan Requirement:** Business+

#### Features
- **Create Audience Group**: \`https://app.pushengage.com/audience/audience-groups/create\`
- **Edit Audience Group**: \`https://app.pushengage.com/audience/audience-groups/edit/:id\`
- **Predefined Groups**: Ready-made audience groups
- **Custom Groups**: Create groups based on specific criteria
- **Group Analytics**: Performance metrics per group
- **Automated Grouping**: Auto-assign users to groups

### 4. Attributes

**Route:** \`https://app.pushengage.com/audience/attributes\`
**Menu:** Audience > Attributes (New Feature)
**Plan Requirement:** Business+

#### Features
- **Custom Attributes**: Define custom subscriber data
- **Attribute Management**: Add, edit, delete attributes
- **Data Collection**: Collect attributes via API or forms
- **Attribute-based Targeting**: Use in campaigns and segments
- **Data Analytics**: Analyze subscriber attributes

---

## 📊 Analytics

**Route Base:** \`https://app.pushengage.com/analytics/\`
**Menu:** Analytics

### 1. Overview

**Route:** \`https://app.pushengage.com/analytics/overview\`
**Menu:** Analytics > Overview

#### Features
- **Dashboard Metrics**: Key performance indicators
- **Campaign Performance**: Success rates, click-through rates
- **Subscriber Growth**: Growth trends and patterns
- **Revenue Tracking**: Conversion and revenue metrics
- **Time-based Analysis**: Performance over time
- **Comparative Analysis**: Compare different periods
- **Export Reports**: Download analytics data

### 2. Opt-in Analytics

**Route:** \`https://app.pushengage.com/analytics/subscription-optin\`
**Menu:** Analytics > Opt-in Analytics
**Plan Requirement:** Business+

#### Features
- **Opt-in Performance**: Conversion rates by popup type
- **A/B Testing Results**: Compare popup variations
- **Funnel Analysis**: Subscription funnel metrics
- **Device Performance**: Opt-in rates by device
- **Page Performance**: Opt-in rates by page
- **Time Analysis**: Best times for opt-ins
- **Settings**: \`https://app.pushengage.com/analytics/subscription-optin/settings\`

### 3. Goal Tracking

**Route:** \`https://app.pushengage.com/analytics/goal-tracking\`
**Menu:** Analytics > Goal Tracking
**Plan Requirement:** Premium+

#### Features
- **Conversion Tracking**: Track specific goals and conversions
- **Revenue Attribution**: Link campaigns to revenue
- **ROI Analysis**: Return on investment metrics
- **Custom Goals**: Define custom conversion events
- **Attribution Models**: Last-click, first-click attribution
- **Goal Funnel**: Track user journey to conversion
- **Revenue Reports**: Detailed revenue analytics

---

## ⚙️ Site Settings

**Route Base:** \`https://app.pushengage.com/settings/\`
**Menu:** Site Settings

### 1. Site Details

**Route:** \`https://app.pushengage.com/settings/site-details\`
**Menu:** Site Settings > Site Details

#### Features
- **Site Information**: Name, URL, description
- **Site Icon**: Upload and manage site icon
- **Timezone Settings**: Configure site timezone
- **Language Settings**: Set default language
- **Site Verification**: Verify site ownership
- **Domain Management**: Manage allowed domains

### 2. Campaign Defaults

**Route:** \`https://app.pushengage.com/settings/campaign-defaults\`
**Menu:** Site Settings > Campaign Defaults

#### Features
- **Default UTM Parameters**: Set default UTM tracking
- **Fallback Notification Settings**: Default title, message, URL
- **Notification Expiry**: Default expiration time (28 days)
- **Fallback Attributes**: Default custom attributes
- **Default Images**: Set default notification icons
- **Default Actions**: Configure default action buttons

### 3. Advanced Settings

**Route:** \`https://app.pushengage.com/settings/advanced-settings\`
**Menu:** Site Settings > Advanced Settings

#### Features
- **Service Worker Settings**:
  - Worker Status: Enable/disable service worker
  - Scope Configuration: Set service worker scope
  - Custom Worker: Upload custom service worker file
- **Custom Sub Domain**:
  - Enable custom subdomain
  - Configure subdomain URL
  - URL type settings (window/iframe)
- **Safari Push Settings**:
  - Push ID configuration
  - Certificate key management
  - Key passphrase settings

### 4. Installation

**Route:** \`https://app.pushengage.com/settings/installation\`
**Menu:** Site Settings > Installation

#### Features
- **Installation Code**: Get JavaScript installation code
- **WordPress Plugin**: WordPress-specific installation
- **Shopify Integration**: Shopify app installation
- **Custom Integration**: API and custom implementations
- **Installation Verification**: Verify proper installation
- **Troubleshooting**: Installation help and debugging

---

## 👤 Account Management

**Route Base:** \`https://app.pushengage.com/account/\`
**Menu:** Profile Dropdown

### 1. My Account

**Route:** \`https://app.pushengage.com/account\`
**Menu:** Profile > My Account

#### Features
- **Profile Information**: Name, email, contact details
- **Password Management**: Change password
- **Account Settings**: Personal preferences
- **Notification Preferences**: Email notification settings
- **API Keys**: Manage API access keys
- **Account Security**: Two-factor authentication

### 2. Billing

**Route:** \`https://app.pushengage.com/account/billing\`
**Menu:** Profile > Billing

#### Features
- **Subscription Plan**: Current plan details
- **Usage Metrics**: Current usage vs limits
- **Billing History**: Past invoices and payments
- **Payment Methods**: Manage credit cards and payment info
- **Plan Upgrade/Downgrade**: Change subscription plans
- **Billing Address**: Update billing information
- **Tax Information**: VAT/tax settings

### 3. Site Management

**Route:** \`https://app.pushengage.com/account/site-management\`
**Menu:** Profile > Site Management
**Plan Requirement:** Business+

#### Features
- **Multiple Sites**: Manage multiple websites
- **Add New Site**: Add additional sites to account
- **Site Switching**: Switch between managed sites
- **Site Settings**: Individual site configurations
- **Site Analytics**: Per-site performance metrics
- **Site Permissions**: User access per site

### 4. User Management

**Route:** \`https://app.pushengage.com/account/user-management\`
**Menu:** Profile > User Management
**Plan Requirement:** Premium+

#### Features
- **Team Members**: Invite and manage team members
- **User Roles**: Assign different permission levels
- **Permission Management**: Control access to features
- **User Activity**: Track team member actions
- **Account-level Permissions**:
  - Billing Management
  - Site Management
  - User Management
  - Publisher Access
- **Site-level Permissions**:
  - Campaign Management
  - Design Settings
  - Analytics Access
  - Audience Management

### 5. Support

**Route:** \`https://app.pushengage.com/account/support\`
**Menu:** Profile > Support

#### Features
- **Help Documentation**: Access to help articles
- **Contact Support**: Submit support tickets
- **Live Chat**: Real-time support chat
- **Video Tutorials**: Educational content
- **Feature Requests**: Submit feature suggestions
- **Bug Reports**: Report issues

### 6. Subscription Plan

**Route:** \`https://app.pushengage.com/account/subscription-plan\`
**Menu:** Accessible via billing section

#### Features
- **Plan Comparison**: Compare available plans
- **Feature Matrix**: See what's included in each plan
- **Upgrade Options**: Upgrade to higher plans
- **Plan Benefits**: Detailed feature explanations
- **Usage Limits**: Current limits and restrictions

---

## 🛒 E-commerce Integrations

### Shopify Integration

**Route Base:** \`https://app.pushengage.com/shopify-\`

#### Features
- **Shopify Onboarding**: \`https://app.pushengage.com/shopify-onboarding\`
- **Shopify Campaigns**: \`https://app.pushengage.com/shopify-campaigns\`
- **Product Notifications**: Automated product-based campaigns
- **Order Notifications**: Order confirmation and updates
- **Abandoned Cart**: Cart abandonment campaigns
- **New Product Alerts**: Notify about new products
- **Price Drop Alerts**: Price change notifications

---

## 📱 Mobile App Push

**Route Base:** \`https://app.pushengage.com/mobile-app-push/\`

#### Features
- **Mobile Campaign Creation**: \`https://app.pushengage.com/mobile-app-push/create-campaign\`
- **iOS Push Settings**: Configure iOS-specific options
- **Android Push Settings**: Configure Android-specific options
- **App Integration**: SDK integration for mobile apps
- **Deep Linking**: Direct users to specific app screens

---

## 🔧 Publisher Features

**Route:** \`https://app.pushengage.com/publisher\`
**Plan Requirement:** Enterprise

#### Features
- **Account Overview**: Publisher-specific dashboard
- **Revenue Sharing**: Publisher revenue metrics
- **Site Network**: Manage publisher network
- **Performance Analytics**: Publisher-specific analytics

---

## Plan-Based Feature Availability

### Free Plan
- Push Broadcast Campaigns
- Welcome Drip Campaign
- Smart Opt-in Reminder
- Targeted Opt-in Trigger
- UTM Tracking
- Basic Analytics

### Business Plan
- All Free features
- Multi-user access
- Multi-site management
- Custom Segments
- Subscriber Attributes
- Scheduled Notifications
- Multi-Action Notifications
- RSS Auto Push
- Geo and Device Segmentation
- Advanced Analytics
- Custom Branding
- Opt-in Analytics

### Premium Plan
- All Business features
- Smart A/B Testing
- Drip Auto Responder
- Goal Tracking
- User Management

### Growth Plan
- All Premium features
- Triggered Campaigns
- Account Manager

### Enterprise Plan
- All Growth features
- Publisher Access
- Custom Solutions
- Priority Support

---

## Quick Navigation Guide

### For Campaign Management
- **Create Push Campaign**: Campaign > Push Broadcasts > Create
- **Set up Automation**: Campaign > Drip Autoresponders or Triggered Campaigns
- **RSS Integration**: Campaign > RSS Auto Push

### For Design Customization
- **Popup Setup**: Design > Popup Modals
- **Widget Customization**: Design > Widgets
- **Targeting Rules**: Design > Targeting Rules

### For Audience Management
- **View Subscribers**: Audience > Subscribers
- **Create Segments**: Audience > Segments (Business+)
- **Manage Groups**: Audience > Audience Groups (Business+)

### For Analytics
- **Campaign Performance**: Analytics > Overview
- **Opt-in Analysis**: Analytics > Opt-in Analytics (Business+)
- **Goal Tracking**: Analytics > Goal Tracking (Premium+)

### For Settings
- **Basic Setup**: Site Settings > Site Details
- **Advanced Config**: Site Settings > Advanced Settings
- **Installation**: Site Settings > Installation

### For Account
- **Profile**: Click profile dropdown > My Account
- **Billing**: Click profile dropdown > Billing
- **Team Management**: Click profile dropdown > User Management (Premium+)

---

## Support and Resources

- **Help Documentation**: Available in Support section
- **Video Tutorials**: Embedded throughout the platform
- **Live Chat**: Available for paid plans
- **Email Support**: Available for all users
- **Feature Requests**: Submit via Support section

---

_This documentation covers all major features and routes in the PushEngage dashboard. Features marked with plan requirements are only available to users with the specified subscription level or higher._
`;

/**
 * Critical instructions for the AI to follow when answering dashboard questions
 */
export const DASHBOARD_NAVIGATION_RULES = `
## 🚨 CRITICAL: PUSHENGAGE DASHBOARD NAVIGATION RULES

When users ask about:
- Dashboard menu locations
- Where to find settings or features
- Route URLs or paths
- How to navigate to specific functionality
- How to change/configure dashboard settings

You MUST:
1. **ONLY use the "PUSHENGAGE DASHBOARD DOCUMENTATION" section below** - this is the authoritative source
2. **NEVER use pre-trained/memorized knowledge** about dashboard routes, menus, or paths
3. **Always include the exact Route URL** from the documentation (e.g., \`https://app.pushengage.com/settings/advanced-settings\`)
4. **Always include the exact Menu path** from the documentation (e.g., "Site Settings > Advanced Settings")
5. **Include the Plan Requirement** if the feature requires a specific plan
6. **List the specific features available** at that location

### EXAMPLE - Correct Response Format:

User: "How can I change the service worker settings?"

✅ CORRECT Response:
"To change Service Worker settings in PushEngage dashboard:

**Menu:** Site Settings > Advanced Settings
**Route:** \`https://app.pushengage.com/settings/advanced-settings\`

In the **Service Worker Settings** section, you can:
- Worker Status: Enable/disable service worker
- Scope Configuration: Set service worker scope
- Custom Worker: Upload custom service worker file"

❌ WRONG Response (using pre-trained data):
"Navigate to Site Settings > Installation Settings..."  ← THIS PATH DOES NOT EXIST

### If Feature Not Found:
If the user asks about something NOT in the documentation below, say:
"I don't have information about that specific feature in my PushEngage dashboard documentation. Please check the PushEngage help center or contact support for assistance."

---
`;


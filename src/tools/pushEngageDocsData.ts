/**
 * Embedded PushEngage Web SDK Documentation
 * 
 * Since the PushEngage docs website (https://pushengage.com/api/web-sdk/) is a SPA
 * and cannot be scraped with simple fetch, we embed the documentation directly.
 * 
 * This provides accurate API reference for the AI assistant.
 */

export interface DocMethod {
  name: string;
  description: string;
  syntax: string;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
  returns?: string;
  example?: string;
  notes?: string;
}

export interface DocSection {
  title: string;
  description: string;
  methods: DocMethod[];
}

export const PUSHENGAGE_WEB_SDK_DOCS: DocSection[] = [
  {
    title: "Initialization & Configuration",
    description: "Methods for initializing and configuring the PushEngage SDK",
    methods: [
      {
        name: "PushEngage.push",
        description: "Queue commands to execute when the PushEngage SDK is fully loaded. This is the primary way to interact with the SDK.",
        syntax: "PushEngage.push(callback)",
        parameters: [
          { name: "callback", type: "function", required: true, description: "A function to execute when SDK is ready" }
        ],
        example: `window.PushEngage = window.PushEngage || [];
PushEngage.push(function() {
  // SDK is ready, call other methods here
  PushEngage.getSubscriberId(function(subscriberId) {
    console.log('Subscriber ID:', subscriberId);
  });
});`,
        notes: "Always wrap PushEngage API calls inside PushEngage.push() to ensure the SDK is loaded."
      },
      {
        name: "PushEngage.getAppConfig",
        description: "Retrieves the current PushEngage application configuration including site settings, campaigns, and opt-in settings.",
        syntax: "PushEngage.getAppConfig()",
        returns: "Promise<AppConfig> | AppConfig - Returns the application configuration object",
        example: `PushEngage.push(function() {
  const config = PushEngage.getAppConfig();
  console.log('Site Name:', config.site.site_name);
  console.log('Site URL:', config.site.site_url);
});`
      }
    ]
  },
  {
    title: "Subscriber Management",
    description: "Methods for managing subscriber information and subscriptions",
    methods: [
      {
        name: "PushEngage.getSubscriberId",
        description: "Retrieves the unique subscriber ID (hash) for the current browser/device.",
        syntax: "PushEngage.getSubscriberId(callback)",
        parameters: [
          { name: "callback", type: "function", required: true, description: "Callback function that receives the subscriber ID" }
        ],
        returns: "void - The subscriber ID is passed to the callback",
        example: `PushEngage.push(function() {
  PushEngage.getSubscriberId(function(subscriberId) {
    if (subscriberId) {
      console.log('Subscriber ID:', subscriberId);
    } else {
      console.log('User is not subscribed');
    }
  });
});`
      },
      {
        name: "PushEngage.getSubscriptionStatus",
        description: "Checks if the current user is subscribed to push notifications.",
        syntax: "PushEngage.getSubscriptionStatus(callback)",
        parameters: [
          { name: "callback", type: "function", required: true, description: "Callback function that receives the subscription status" }
        ],
        returns: "void - Status object with isSubscribed boolean is passed to callback",
        example: `PushEngage.push(function() {
  PushEngage.getSubscriptionStatus(function(status) {
    if (status.isSubscribed) {
      console.log('User is subscribed');
    } else {
      console.log('User is not subscribed');
    }
  });
});`
      },
      {
        name: "PushEngage.subscribe",
        description: "Programmatically triggers the subscription prompt to subscribe the user to push notifications.",
        syntax: "PushEngage.subscribe(callback)",
        parameters: [
          { name: "callback", type: "function", required: false, description: "Optional callback after subscription attempt" }
        ],
        example: `PushEngage.push(function() {
  PushEngage.subscribe(function(result) {
    if (result.success) {
      console.log('User subscribed successfully');
    } else {
      console.log('Subscription failed:', result.error);
    }
  });
});`
      },
      {
        name: "PushEngage.unsubscribe",
        description: "Unsubscribes the current user from push notifications.",
        syntax: "PushEngage.unsubscribe(callback)",
        parameters: [
          { name: "callback", type: "function", required: false, description: "Optional callback after unsubscription" }
        ],
        example: `PushEngage.push(function() {
  PushEngage.unsubscribe(function(result) {
    if (result.success) {
      console.log('User unsubscribed successfully');
    }
  });
});`
      }
    ]
  },
  {
    title: "Segments",
    description: "Methods for adding and removing subscribers from segments for targeted notifications",
    methods: [
      {
        name: "PushEngage.addSegment",
        description: "Adds the current subscriber to one or more segments. Segments are used to group subscribers for targeted campaigns.",
        syntax: "PushEngage.addSegment(segments, callback)",
        parameters: [
          { name: "segments", type: "string | string[]", required: true, description: "Segment name or array of segment names to add" },
          { name: "callback", type: "function", required: false, description: "Optional callback after segment addition" }
        ],
        example: `// Add to single segment
PushEngage.push(function() {
  PushEngage.addSegment('premium_users', function(result) {
    console.log('Added to segment:', result);
  });
});

// Add to multiple segments
PushEngage.push(function() {
  PushEngage.addSegment(['sports', 'technology', 'news'], function(result) {
    console.log('Added to segments:', result);
  });
});`,
        notes: "Segments are created automatically if they don't exist. Segment names are case-sensitive."
      },
      {
        name: "PushEngage.removeSegment",
        description: "Removes the current subscriber from one or more segments.",
        syntax: "PushEngage.removeSegment(segments, callback)",
        parameters: [
          { name: "segments", type: "string | string[]", required: true, description: "Segment name or array of segment names to remove" },
          { name: "callback", type: "function", required: false, description: "Optional callback after segment removal" }
        ],
        example: `PushEngage.push(function() {
  PushEngage.removeSegment('premium_users', function(result) {
    console.log('Removed from segment:', result);
  });
});`
      },
      {
        name: "PushEngage.getSegments",
        description: "Retrieves the list of segments the current subscriber belongs to.",
        syntax: "PushEngage.getSegments(callback)",
        parameters: [
          { name: "callback", type: "function", required: true, description: "Callback function that receives the segments array" }
        ],
        example: `PushEngage.push(function() {
  PushEngage.getSegments(function(segments) {
    console.log('User segments:', segments);
    // Example output: ['sports', 'premium_users', 'weekly_digest']
  });
});`
      }
    ]
  },
  {
    title: "Subscriber Attributes",
    description: "Methods for managing custom subscriber attributes for personalization",
    methods: [
      {
        name: "PushEngage.setAttribute",
        description: "Sets a custom attribute for the current subscriber. Attributes can be used for personalization in notifications.",
        syntax: "PushEngage.setAttribute(key, value, callback)",
        parameters: [
          { name: "key", type: "string", required: true, description: "Attribute name/key" },
          { name: "value", type: "string | number | boolean", required: true, description: "Attribute value" },
          { name: "callback", type: "function", required: false, description: "Optional callback after attribute is set" }
        ],
        example: `PushEngage.push(function() {
  // Set user's name for personalization
  PushEngage.setAttribute('first_name', 'John', function(result) {
    console.log('Attribute set:', result);
  });

  // Set user preferences
  PushEngage.setAttribute('preferred_category', 'electronics');
  PushEngage.setAttribute('loyalty_tier', 'gold');
});`,
        notes: "Attributes can be used in notification templates with {{attribute_name}} syntax."
      },
      {
        name: "PushEngage.setAttributes",
        description: "Sets multiple custom attributes for the current subscriber at once.",
        syntax: "PushEngage.setAttributes(attributes, callback)",
        parameters: [
          { name: "attributes", type: "object", required: true, description: "Object containing key-value pairs of attributes" },
          { name: "callback", type: "function", required: false, description: "Optional callback after attributes are set" }
        ],
        example: `PushEngage.push(function() {
  PushEngage.setAttributes({
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    loyalty_points: 500,
    is_premium: true
  }, function(result) {
    console.log('Attributes set:', result);
  });
});`
      },
      {
        name: "PushEngage.getAttribute",
        description: "Retrieves a specific attribute value for the current subscriber.",
        syntax: "PushEngage.getAttribute(key, callback)",
        parameters: [
          { name: "key", type: "string", required: true, description: "Attribute name/key to retrieve" },
          { name: "callback", type: "function", required: true, description: "Callback function that receives the attribute value" }
        ],
        example: `PushEngage.push(function() {
  PushEngage.getAttribute('first_name', function(value) {
    console.log('First name:', value);
  });
});`
      },
      {
        name: "PushEngage.getAttributes",
        description: "Retrieves all custom attributes for the current subscriber.",
        syntax: "PushEngage.getAttributes(callback)",
        parameters: [
          { name: "callback", type: "function", required: true, description: "Callback function that receives all attributes" }
        ],
        example: `PushEngage.push(function() {
  PushEngage.getAttributes(function(attributes) {
    console.log('All attributes:', attributes);
    // Example: { first_name: 'John', loyalty_points: 500, is_premium: true }
  });
});`
      },
      {
        name: "PushEngage.deleteAttribute",
        description: "Deletes a specific attribute for the current subscriber.",
        syntax: "PushEngage.deleteAttribute(key, callback)",
        parameters: [
          { name: "key", type: "string", required: true, description: "Attribute name/key to delete" },
          { name: "callback", type: "function", required: false, description: "Optional callback after deletion" }
        ],
        example: `PushEngage.push(function() {
  PushEngage.deleteAttribute('temporary_promo', function(result) {
    console.log('Attribute deleted:', result);
  });
});`
      }
    ]
  },
  {
    title: "Triggered Campaigns",
    description: "Methods for triggering automated campaigns programmatically",
    methods: [
      {
        name: "PushEngage.trigger",
        description: "Triggers a custom automation campaign for the current subscriber. Use this to start drip campaigns or event-based notifications.",
        syntax: "PushEngage.trigger(eventName, eventData, callback)",
        parameters: [
          { name: "eventName", type: "string", required: true, description: "Name of the trigger event configured in PushEngage dashboard" },
          { name: "eventData", type: "object", required: false, description: "Optional data to pass to the campaign for personalization" },
          { name: "callback", type: "function", required: false, description: "Optional callback after trigger is sent" }
        ],
        example: `// Trigger a purchase event
PushEngage.push(function() {
  PushEngage.trigger('purchase_completed', {
    product_name: 'iPhone 15',
    order_id: 'ORD-12345',
    amount: 999.99
  }, function(result) {
    console.log('Trigger sent:', result);
  });
});

// Trigger a simple event
PushEngage.push(function() {
  PushEngage.trigger('viewed_pricing_page');
});`,
        notes: "The event name must match a trigger configured in your PushEngage dashboard. Event data can be used in notification templates."
      }
    ]
  },
  {
    title: "Cart & Browse Abandonment",
    description: "Methods for e-commerce cart and browse abandonment tracking",
    methods: [
      {
        name: "PushEngage.addToCart",
        description: "Tracks when a product is added to the cart for cart abandonment campaigns.",
        syntax: "PushEngage.addToCart(product, callback)",
        parameters: [
          { name: "product", type: "object", required: true, description: "Product object with id, name, price, quantity, image, url" },
          { name: "callback", type: "function", required: false, description: "Optional callback after cart update" }
        ],
        example: `PushEngage.push(function() {
  PushEngage.addToCart({
    id: 'SKU-12345',
    name: 'iPhone 15 Pro',
    price: 999.99,
    quantity: 1,
    image: 'https://example.com/iphone.jpg',
    url: 'https://example.com/products/iphone-15'
  });
});`
      },
      {
        name: "PushEngage.removeFromCart",
        description: "Removes a product from cart tracking.",
        syntax: "PushEngage.removeFromCart(productId, callback)",
        parameters: [
          { name: "productId", type: "string", required: true, description: "Product ID to remove" },
          { name: "callback", type: "function", required: false, description: "Optional callback" }
        ],
        example: `PushEngage.push(function() {
  PushEngage.removeFromCart('SKU-12345');
});`
      },
      {
        name: "PushEngage.clearCart",
        description: "Clears all products from cart tracking. Call this after successful checkout.",
        syntax: "PushEngage.clearCart(callback)",
        parameters: [
          { name: "callback", type: "function", required: false, description: "Optional callback after cart is cleared" }
        ],
        example: `PushEngage.push(function() {
  // After successful checkout
  PushEngage.clearCart(function() {
    console.log('Cart cleared');
  });
});`
      },
      {
        name: "PushEngage.trackBrowse",
        description: "Tracks product page views for browse abandonment campaigns.",
        syntax: "PushEngage.trackBrowse(product, callback)",
        parameters: [
          { name: "product", type: "object", required: true, description: "Product object with id, name, price, image, url, category" },
          { name: "callback", type: "function", required: false, description: "Optional callback" }
        ],
        example: `PushEngage.push(function() {
  PushEngage.trackBrowse({
    id: 'SKU-12345',
    name: 'iPhone 15 Pro',
    price: 999.99,
    image: 'https://example.com/iphone.jpg',
    url: window.location.href,
    category: 'Electronics > Phones'
  });
});`
      }
    ]
  },
  {
    title: "Price Drop & Back in Stock Alerts",
    description: "Methods for product alert subscriptions",
    methods: [
      {
        name: "PushEngage.subscribeToPriceDropAlert",
        description: "Subscribes the user to receive a notification when the product price drops.",
        syntax: "PushEngage.subscribeToPriceDropAlert(product, callback)",
        parameters: [
          { name: "product", type: "object", required: true, description: "Product object with id, name, price, image, url" },
          { name: "callback", type: "function", required: false, description: "Optional callback" }
        ],
        example: `PushEngage.push(function() {
  PushEngage.subscribeToPriceDropAlert({
    id: 'SKU-12345',
    name: 'MacBook Pro',
    price: 2499.99,
    image: 'https://example.com/macbook.jpg',
    url: window.location.href
  }, function(result) {
    console.log('Subscribed to price drop:', result);
  });
});`
      },
      {
        name: "PushEngage.subscribeToBackInStockAlert",
        description: "Subscribes the user to receive a notification when an out-of-stock product is back in stock.",
        syntax: "PushEngage.subscribeToBackInStockAlert(product, callback)",
        parameters: [
          { name: "product", type: "object", required: true, description: "Product object with id, name, image, url, variants" },
          { name: "callback", type: "function", required: false, description: "Optional callback" }
        ],
        example: `PushEngage.push(function() {
  PushEngage.subscribeToBackInStockAlert({
    id: 'SKU-12345',
    name: 'Limited Edition Sneakers',
    image: 'https://example.com/sneakers.jpg',
    url: window.location.href,
    variants: ['Size: 10', 'Color: Black']
  }, function(result) {
    console.log('Subscribed to back in stock:', result);
  });
});`
      }
    ]
  },
  {
    title: "Revenue Tracking",
    description: "Methods for tracking revenue and conversions from push notifications",
    methods: [
      {
        name: "PushEngage.trackRevenue",
        description: "Tracks a revenue event (purchase) for analytics and campaign attribution.",
        syntax: "PushEngage.trackRevenue(order, callback)",
        parameters: [
          { name: "order", type: "object", required: true, description: "Order object with orderId, total, currency, products" },
          { name: "callback", type: "function", required: false, description: "Optional callback" }
        ],
        example: `PushEngage.push(function() {
  PushEngage.trackRevenue({
    orderId: 'ORD-12345',
    total: 149.99,
    currency: 'USD',
    products: [
      { id: 'SKU-001', name: 'T-Shirt', price: 29.99, quantity: 2 },
      { id: 'SKU-002', name: 'Jeans', price: 89.99, quantity: 1 }
    ]
  }, function(result) {
    console.log('Revenue tracked:', result);
  });
});`
      },
      {
        name: "PushEngage.trackGoal",
        description: "Tracks a custom goal conversion for campaign analytics.",
        syntax: "PushEngage.trackGoal(goalName, goalValue, callback)",
        parameters: [
          { name: "goalName", type: "string", required: true, description: "Name of the goal" },
          { name: "goalValue", type: "number", required: false, description: "Optional numeric value for the goal" },
          { name: "callback", type: "function", required: false, description: "Optional callback" }
        ],
        example: `PushEngage.push(function() {
  // Track a signup goal
  PushEngage.trackGoal('newsletter_signup');

  // Track a goal with value
  PushEngage.trackGoal('download_completed', 1);
});`
      }
    ]
  },
  {
    title: "Opt-in Management",
    description: "Methods for controlling the opt-in prompt behavior",
    methods: [
      {
        name: "PushEngage.showOptin",
        description: "Programmatically shows the opt-in/subscription prompt.",
        syntax: "PushEngage.showOptin()",
        example: `// Show opt-in on button click
document.getElementById('subscribe-btn').addEventListener('click', function() {
  PushEngage.push(function() {
    PushEngage.showOptin();
  });
});`
      },
      {
        name: "PushEngage.hideOptin",
        description: "Hides the opt-in prompt if it's currently displayed.",
        syntax: "PushEngage.hideOptin()",
        example: `PushEngage.push(function() {
  PushEngage.hideOptin();
});`
      },
      {
        name: "PushEngage.disableAutoOptin",
        description: "Disables the automatic display of the opt-in prompt. Use this if you want to control when the prompt appears.",
        syntax: "PushEngage.disableAutoOptin()",
        example: `// Put this before the PushEngage script loads
window._peq = window._peq || [];
window._peq.push(['disable_auto_optin']);

// Then show opt-in manually when ready
PushEngage.push(function() {
  PushEngage.showOptin();
});`
      }
    ]
  },
  {
    title: "Notification Bell (Chicklet)",
    description: "Methods for controlling the floating notification bell widget",
    methods: [
      {
        name: "PushEngage.showBell",
        description: "Shows the floating notification bell/chicklet widget.",
        syntax: "PushEngage.showBell()",
        example: `PushEngage.push(function() {
  PushEngage.showBell();
});`
      },
      {
        name: "PushEngage.hideBell",
        description: "Hides the floating notification bell/chicklet widget.",
        syntax: "PushEngage.hideBell()",
        example: `PushEngage.push(function() {
  PushEngage.hideBell();
});`
      }
    ]
  },
  {
    title: "Utility Methods",
    description: "Utility and helper methods",
    methods: [
      {
        name: "PushEngage.getNotificationPermission",
        description: "Gets the current browser notification permission status.",
        syntax: "PushEngage.getNotificationPermission(callback)",
        parameters: [
          { name: "callback", type: "function", required: true, description: "Callback with permission status" }
        ],
        returns: "'granted' | 'denied' | 'default'",
        example: `PushEngage.push(function() {
  PushEngage.getNotificationPermission(function(permission) {
    console.log('Permission:', permission);
    // 'granted' - user has allowed notifications
    // 'denied' - user has blocked notifications
    // 'default' - user hasn't made a choice yet
  });
});`
      },
      {
        name: "PushEngage.isSubscribed",
        description: "Quick check if the current user is subscribed.",
        syntax: "PushEngage.isSubscribed(callback)",
        parameters: [
          { name: "callback", type: "function", required: true, description: "Callback with boolean result" }
        ],
        example: `PushEngage.push(function() {
  PushEngage.isSubscribed(function(subscribed) {
    if (subscribed) {
      console.log('User is subscribed');
    } else {
      console.log('User is not subscribed');
    }
  });
});`
      }
    ]
  }
];

/**
 * Search the embedded documentation for a query
 */
export function searchEmbeddedDocs(query: string): DocMethod[] {
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/).filter(k => k.length > 2);
  
  const results: { method: DocMethod; score: number }[] = [];
  
  for (const section of PUSHENGAGE_WEB_SDK_DOCS) {
    for (const method of section.methods) {
      let score = 0;
      
      // Check method name
      if (method.name.toLowerCase().includes(queryLower)) {
        score += 10;
      }
      
      // Check keywords in description
      for (const keyword of keywords) {
        if (method.name.toLowerCase().includes(keyword)) {
          score += 5;
        }
        if (method.description.toLowerCase().includes(keyword)) {
          score += 3;
        }
        if (method.example?.toLowerCase().includes(keyword)) {
          score += 2;
        }
        if (section.title.toLowerCase().includes(keyword)) {
          score += 2;
        }
      }
      
      if (score > 0) {
        results.push({ method, score });
      }
    }
  }
  
  // Sort by score and return methods
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(r => r.method);
}

/**
 * Format documentation for AI consumption
 */
export function formatDocsForAI(methods: DocMethod[]): string {
  if (methods.length === 0) {
    return "No relevant documentation found.";
  }
  
  return methods.map(m => {
    let doc = `## ${m.name}\n\n`;
    doc += `**Description:** ${m.description}\n\n`;
    doc += `**Syntax:** \`${m.syntax}\`\n\n`;
    
    if (m.parameters && m.parameters.length > 0) {
      doc += `**Parameters:**\n`;
      for (const p of m.parameters) {
        doc += `- \`${p.name}\` (${p.type}${p.required ? ', required' : ', optional'}): ${p.description}\n`;
      }
      doc += '\n';
    }
    
    if (m.returns) {
      doc += `**Returns:** ${m.returns}\n\n`;
    }
    
    if (m.example) {
      doc += `**Example:**\n\`\`\`javascript\n${m.example}\n\`\`\`\n\n`;
    }
    
    if (m.notes) {
      doc += `**Notes:** ${m.notes}\n\n`;
    }
    
    return doc;
  }).join('\n---\n\n');
}

/**
 * Get all documentation as a formatted string
 */
export function getAllDocsFormatted(): string {
  let result = '# PushEngage Web SDK API Reference\n\n';
  
  for (const section of PUSHENGAGE_WEB_SDK_DOCS) {
    result += `## ${section.title}\n\n`;
    result += `${section.description}\n\n`;
    
    for (const method of section.methods) {
      result += `### ${method.name}\n\n`;
      result += `${method.description}\n\n`;
      result += `**Syntax:** \`${method.syntax}\`\n\n`;
      
      if (method.parameters && method.parameters.length > 0) {
        result += `**Parameters:**\n`;
        for (const p of method.parameters) {
          result += `- \`${p.name}\` (${p.type}${p.required ? ', required' : ', optional'}): ${p.description}\n`;
        }
        result += '\n';
      }
      
      if (method.returns) {
        result += `**Returns:** ${method.returns}\n\n`;
      }
      
      if (method.example) {
        result += `**Example:**\n\`\`\`javascript\n${method.example}\n\`\`\`\n\n`;
      }
      
      if (method.notes) {
        result += `> **Note:** ${method.notes}\n\n`;
      }
    }
  }
  
  return result;
}


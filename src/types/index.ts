// Console Error Types
export interface ConsoleError {
  id: number;
  type: 'error' | 'warning';
  message: string;
  stack: string;
  filename: string;
  lineno: number;
  timestamp: number;
  url: string;
  tabId?: number; // ID of the tab where the error occurred
  sessionId?: number; // Session ID to track page load sessions (prevents duplicates across refreshes)
}

// Chat Message Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

// API Configuration
export interface ApiConfig {
  apiKey: string;
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
}

// Chat Mode Type
export type ChatMode = 'debug' | 'pushengage' | 'general';

// App State
export interface AppState {
  errors: ConsoleError[];
  selectedError: ConsoleError | null;
  peData: PEAppConfig | null;
  peAvailable: boolean;
  apiConfig: ApiConfig | null;
  activeTab: 'errors' | 'pushengage' | 'chat' | 'settings';
  chatMode: ChatMode;
  debugMessages: ChatMessage[];
  pushengageMessages: ChatMessage[];
  generalMessages: ChatMessage[];
  isLoading: boolean;
}

// Message Types for Chrome Runtime
export interface ChromeMessage {
  type: 'CONSOLE_ERROR' | 'PE_DETECTION' | 'PE_CONFIG' | 'PE_SUBSCRIBER_DETAILS' | 'GET_ERRORS' | 'CLEAR_ERRORS' | 'GET_PE_CONFIG' | 'GET_PE_STATUS' | 'GET_PE_SUBSCRIBER' | 'PAGE_SESSION_START' | 'REFRESH_ERRORS';
  error?: ConsoleError;
  hasPushEngage?: boolean;
  url?: string;
  config?: PEAppConfig;
  subscriberDetails?: PESubscriberDetails;
  tabId?: number; // For filtering errors by tab
  sessionId?: number; // Session ID for page load tracking
}

// Import PushEngage types
import { PEAppConfig } from './pushEngage';
export type { PEAppConfig } from './pushEngage';

// Re-export subscriber details type from tools/types for convenience
import type { SubscriberDetails } from '../tools/types';
export type PESubscriberDetails = SubscriberDetails;


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

// App State
export interface AppState {
  errors: ConsoleError[];
  selectedError: ConsoleError | null;
  peData: PEAppConfig | null;
  peAvailable: boolean;
  apiConfig: ApiConfig | null;
  activeTab: 'errors' | 'pushengage' | 'chat' | 'settings';
  chatMode: 'debug' | 'pushengage';
  messages: ChatMessage[];
  isLoading: boolean;
}

// Message Types for Chrome Runtime
export interface ChromeMessage {
  type: 'CONSOLE_ERROR' | 'PE_DETECTION' | 'PE_CONFIG' | 'GET_ERRORS' | 'CLEAR_ERRORS' | 'GET_PE_CONFIG' | 'GET_PE_STATUS';
  error?: ConsoleError;
  hasPushEngage?: boolean;
  url?: string;
  config?: PEAppConfig;
}

// Import PushEngage types
import { PEAppConfig } from './pushEngage';
export type { PEAppConfig } from './pushEngage';


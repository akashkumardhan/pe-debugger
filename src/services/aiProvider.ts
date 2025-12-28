/**
 * AI Provider Service
 * 
 * This module re-exports the TanStack AI Client functionality
 * and provides backward compatibility with the original API.
 * 
 * All AI functionality now uses @tanstack/ai-client under the hood.
 * 
 * @see https://tanstack.com/ai
 */

import type { ChatMessage, ApiConfig } from '../types';
import type { AIProvider } from '../utils/llm-providers';
import { 
  createChatClient, 
  testAIConnection, 
  streamChat,
  ChatClient,
  type StreamCallbacks
} from './aiClient';

// Re-export everything from aiClient for convenience
export { 
  createChatClient, 
  testAIConnection, 
  streamChat,
  ChatClient,
  type StreamCallbacks
};

/**
 * AIProviderService Class
 * 
 * Backward-compatible wrapper around @tanstack/ai-client.
 * Maintains the same API as before for existing code compatibility.
 */
export class AIProviderService {
  private config: ApiConfig;
  private client: ChatClient | null = null;

  constructor(apiKey: string, provider: AIProvider, model: string) {
    this.config = { apiKey, provider, model };
  }

  /**
   * Send a streaming chat request using @tanstack/ai-client
   */
  async streamChat(
    messages: ChatMessage[],
    callbacks: StreamCallbacks
  ): Promise<void> {
    await streamChat(this.config, messages, callbacks);
  }

  /**
   * Abort the current streaming request
   */
  abort(): void {
    if (this.client) {
      this.client.stop();
    }
  }

  /**
   * Test API connection using @tanstack/ai-client
   */
  static async testConnection(
    apiKey: string,
    provider: AIProvider,
    model: string
  ): Promise<{ success: boolean; error?: string }> {
    return testAIConnection({ apiKey, provider, model });
  }
}

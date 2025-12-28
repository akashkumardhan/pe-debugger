/**
 * TanStack AI Client Service
 * 
 * This module provides the AI client integration using @tanstack/ai-client
 * for all AI-related functionality in the DevDebug AI extension.
 * 
 * Uses the ChatClient class with a custom stream adapter to connect
 * directly to AI provider APIs (OpenAI, Anthropic, Google) from the browser.
 * 
 * @see https://tanstack.com/ai
 */

import { ChatClient, stream } from '@tanstack/ai-client';
import type { ChatMessage, ApiConfig } from '../types';
import type { AIProvider } from '../utils/llm-providers';
import { API_ENDPOINTS } from '../utils/llm-providers';

// Re-export types for convenience
export type { AIProvider } from '../utils/llm-providers';

/**
 * Stream callback interface for use in React components
 */
export interface StreamCallbacks {
  onChunk: (content: string) => void;
  onError: (error: Error) => void;
  onComplete: () => void;
}

/**
 * Message format used by TanStack AI
 */
interface ModelMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Create a TanStack AI ChatClient with a custom stream adapter
 * that connects directly to AI provider APIs
 */
export function createChatClient(
  config: ApiConfig,
  callbacks: {
    onChunk?: (chunk: unknown) => void;
    onFinish?: (message: unknown) => void;
    onError?: (error: Error) => void;
    onMessagesChange?: (messages: unknown[]) => void;
  } = {}
): ChatClient {
  const { apiKey, provider, model } = config;

  // Create a custom stream adapter that calls AI provider APIs directly
  // Using 'as any' cast due to @tanstack/ai type incompatibility with tool messages
  const connection = stream((async function* (messages: ModelMessage[], _data?: Record<string, unknown>) {
    const response = await callAIProvider(provider, apiKey, model, messages);
    
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const chunk = parseStreamLine(line, provider);
          if (chunk) {
            yield chunk;
          }
        }
      }

      // Process remaining buffer
      if (buffer) {
        const chunk = parseStreamLine(buffer, provider);
        if (chunk) {
          yield chunk;
        }
      }
    } finally {
      reader.releaseLock();
    }
  }) as any);

  return new ChatClient({
    connection,
    onChunk: callbacks.onChunk,
    onFinish: callbacks.onFinish,
    onError: callbacks.onError,
    onMessagesChange: callbacks.onMessagesChange,
  });
}

/**
 * Call the appropriate AI provider API
 */
async function callAIProvider(
  provider: AIProvider,
  apiKey: string,
  model: string,
  messages: ModelMessage[]
): Promise<Response> {
  switch (provider) {
    case 'openai':
      return callOpenAI(apiKey, model, messages);
    case 'anthropic':
      return callAnthropic(apiKey, model, messages);
    case 'google':
      return callGoogle(apiKey, model, messages);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  apiKey: string,
  model: string,
  messages: ModelMessage[]
): Promise<Response> {
  const response = await fetch(API_ENDPOINTS.openai, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }

  return response;
}

/**
 * Call Anthropic API
 */
async function callAnthropic(
  apiKey: string,
  model: string,
  messages: ModelMessage[]
): Promise<Response> {
  const systemMessage = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch(API_ENDPOINTS.anthropic, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemMessage?.content || '',
      messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
      stream: true
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
  }

  return response;
}

/**
 * Call Google Gemini API
 */
async function callGoogle(
  apiKey: string,
  model: string,
  messages: ModelMessage[]
): Promise<Response> {
  const endpoint = `${API_ENDPOINTS.google}/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  const systemMessage = messages.find(m => m.role === 'system');
  const systemInstruction = systemMessage
    ? { parts: [{ text: systemMessage.content }] }
    : undefined;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents,
      systemInstruction,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Google API error: ${response.status}`);
  }

  return response;
}

/**
 * Parse a stream line based on provider format and return TanStack-compatible chunk
 */
function parseStreamLine(line: string, provider: AIProvider): object | null {
  if (!line.trim()) return null;
  
  const data = line.startsWith('data: ') ? line.slice(6).trim() : line.trim();
  if (data === '[DONE]') return null;

  try {
    const parsed = JSON.parse(data);

    switch (provider) {
      case 'openai': {
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          return {
            type: 'text',
            content
          };
        }
        return null;
      }

      case 'anthropic': {
        if (parsed.type === 'content_block_delta') {
          const content = parsed.delta?.text;
          if (content) {
            return {
              type: 'text',
              content
            };
          }
        }
        return null;
      }

      case 'google': {
        const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
          return {
            type: 'text',
            content
          };
        }
        return null;
      }

      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Test AI connection using TanStack AI Client
 */
export async function testAIConnection(
  config: ApiConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'Say "OK" and nothing else.' }
    ];

    const response = await callAIProvider(
      config.provider,
      config.apiKey,
      config.model,
      messages
    );

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response');

    let hasContent = false;
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const text = decoder.decode(value);
      if (text.length > 0) {
        hasContent = true;
        break;
      }
    }

    reader.releaseLock();
    return { success: hasContent };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    };
  }
}

/**
 * Stream chat using TanStack AI Client
 * 
 * This function creates a ChatClient instance and handles the streaming
 * response from the AI provider.
 */
export async function streamChat(
  config: ApiConfig,
  messages: ChatMessage[],
  callbacks: StreamCallbacks
): Promise<void> {
  let fullContent = '';

  const client = createChatClient(config, {
    onChunk: (chunk: unknown) => {
      const typedChunk = chunk as { type?: string; content?: string };
      if (typedChunk.type === 'text' && typedChunk.content) {
        fullContent += typedChunk.content;
        callbacks.onChunk(typedChunk.content);
      }
    },
    onFinish: () => {
      callbacks.onComplete();
    },
    onError: (error: Error) => {
      callbacks.onError(error);
    }
  });

  // Set initial messages (excluding the last user message which we'll send)
  const initialMessages = messages.slice(0, -1).map(m => ({
    id: `msg-${Date.now()}-${Math.random()}`,
    role: m.role as 'user' | 'assistant' | 'system',
    parts: [{ type: 'text' as const, content: m.content }],
    createdAt: new Date()
  }));

  if (initialMessages.length > 0) {
    client.setMessagesManually(initialMessages);
  }

  // Get the last user message to send
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.role === 'user') {
    await client.sendMessage(lastMessage.content);
  }
}

// Export ChatClient for direct use if needed
export { ChatClient } from '@tanstack/ai-client';

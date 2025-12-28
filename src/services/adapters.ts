/**
 * AI Provider Adapters
 * 
 * Multi-provider adapter support using @tanstack/ai.
 * Supports OpenAI, Anthropic Claude, and Google Gemini.
 * 
 * @see https://tanstack.com/ai
 */

import type { AIProvider } from '../utils/llm-providers';
import { API_ENDPOINTS } from '../utils/llm-providers';

/**
 * Adapter configuration for each provider
 */
export interface AdapterConfig {
  apiKey: string;
  model: string;
}

/**
 * Message format for adapters
 */
export interface AdapterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Stream chunk from adapter
 */
export interface StreamChunk {
  type: 'text' | 'tool_call' | 'tool_result';
  content?: string;
  toolCall?: {
    id: string;
    name: string;
    arguments: string;
  };
}

/**
 * Adapter interface for AI providers
 */
export interface AIAdapter {
  provider: AIProvider;
  model: string;
  stream: (
    messages: AdapterMessage[],
    options?: {
      tools?: unknown[];
      signal?: AbortSignal;
    }
  ) => AsyncGenerator<StreamChunk>;
}

/**
 * Create OpenAI adapter
 */
export function openaiAdapter(config: AdapterConfig): AIAdapter {
  return {
    provider: 'openai',
    model: config.model,
    async *stream(messages, options) {
      const response = await fetch(API_ENDPOINTS.openai, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: true,
          max_tokens: 4096,
          tools: options?.tools ? formatToolsForOpenAI(options.tools) : undefined,
        }),
        signal: options?.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
      }

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
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              
              if (delta?.content) {
                yield { type: 'text', content: delta.content };
              }
              
              if (delta?.tool_calls?.[0]) {
                const toolCall = delta.tool_calls[0];
                yield {
                  type: 'tool_call',
                  toolCall: {
                    id: toolCall.id || '',
                    name: toolCall.function?.name || '',
                    arguments: toolCall.function?.arguments || '',
                  },
                };
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
  };
}

/**
 * Create Anthropic adapter
 */
export function anthropicAdapter(config: AdapterConfig): AIAdapter {
  return {
    provider: 'anthropic',
    model: config.model,
    async *stream(messages, options) {
      const systemMessage = messages.find(m => m.role === 'system');
      const chatMessages = messages.filter(m => m.role !== 'system');

      const response = await fetch(API_ENDPOINTS.anthropic, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 4096,
          system: systemMessage?.content || '',
          messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
          stream: true,
          tools: options?.tools ? formatToolsForAnthropic(options.tools) : undefined,
        }),
        signal: options?.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
      }

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
            if (!line.startsWith('data: ')) continue;
            
            try {
              const parsed = JSON.parse(line.slice(6));
              
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                yield { type: 'text', content: parsed.delta.text };
              }
              
              if (parsed.type === 'content_block_start' && parsed.content_block?.type === 'tool_use') {
                yield {
                  type: 'tool_call',
                  toolCall: {
                    id: parsed.content_block.id || '',
                    name: parsed.content_block.name || '',
                    arguments: '',
                  },
                };
              }
              
              if (parsed.type === 'message_stop') return;
            } catch {
              // Skip invalid JSON
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
  };
}

/**
 * Create Google Gemini adapter
 */
export function geminiAdapter(config: AdapterConfig): AIAdapter {
  return {
    provider: 'google',
    model: config.model,
    async *stream(messages, options) {
      const endpoint = `${API_ENDPOINTS.google}/${config.model}:streamGenerateContent?key=${config.apiKey}&alt=sse`;

      const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      const systemMessage = messages.find(m => m.role === 'system');
      const systemInstruction = systemMessage
        ? { parts: [{ text: systemMessage.content }] }
        : undefined;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
          tools: options?.tools ? formatToolsForGemini(options.tools) : undefined,
        }),
        signal: options?.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `Google API error: ${response.status}`);
      }

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
            if (!line.startsWith('data: ')) continue;

            try {
              const parsed = JSON.parse(line.slice(6));
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              
              if (text) {
                yield { type: 'text', content: text };
              }

              const functionCall = parsed.candidates?.[0]?.content?.parts?.[0]?.functionCall;
              if (functionCall) {
                yield {
                  type: 'tool_call',
                  toolCall: {
                    id: `fc-${Date.now()}`,
                    name: functionCall.name,
                    arguments: JSON.stringify(functionCall.args || {}),
                  },
                };
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
  };
}

/**
 * Create adapter based on provider selection
 */
export function createAdapter(
  provider: AIProvider,
  apiKey: string,
  model: string
): AIAdapter {
  const config = { apiKey, model };

  switch (provider) {
    case 'openai':
      return openaiAdapter(config);
    case 'anthropic':
      return anthropicAdapter(config);
    case 'google':
      return geminiAdapter(config);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// ============================================================
// TOOL FORMATTING HELPERS
// ============================================================

function formatToolsForOpenAI(tools: unknown[]): unknown[] {
  return tools.map((tool: any) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema ? zodToJsonSchema(tool.inputSchema) : {},
    },
  }));
}

function formatToolsForAnthropic(tools: unknown[]): unknown[] {
  return tools.map((tool: any) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema ? zodToJsonSchema(tool.inputSchema) : {},
  }));
}

function formatToolsForGemini(tools: unknown[]): unknown[] {
  return [{
    functionDeclarations: tools.map((tool: any) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema ? zodToJsonSchema(tool.inputSchema) : {},
    })),
  }];
}

/**
 * Simple Zod to JSON Schema converter
 * Note: For production, use a proper library like zod-to-json-schema
 */
function zodToJsonSchema(schema: any): object {
  // If schema has _def, it's a Zod schema
  if (schema?._def) {
    const def = schema._def;
    
    if (def.typeName === 'ZodObject') {
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      
      for (const [key, value] of Object.entries(def.shape() || {})) {
        properties[key] = zodToJsonSchema(value);
        // Check if not optional
        if ((value as any)?._def?.typeName !== 'ZodOptional' && 
            (value as any)?._def?.typeName !== 'ZodDefault') {
          required.push(key);
        }
      }
      
      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }
    
    if (def.typeName === 'ZodString') {
      return { type: 'string', description: def.description };
    }
    
    if (def.typeName === 'ZodNumber') {
      return { type: 'number', description: def.description };
    }
    
    if (def.typeName === 'ZodBoolean') {
      return { type: 'boolean', description: def.description };
    }
    
    if (def.typeName === 'ZodEnum') {
      return { type: 'string', enum: def.values, description: def.description };
    }
    
    if (def.typeName === 'ZodOptional' || def.typeName === 'ZodDefault') {
      return zodToJsonSchema(def.innerType);
    }
    
    if (def.typeName === 'ZodArray') {
      return {
        type: 'array',
        items: zodToJsonSchema(def.type),
      };
    }
  }
  
  return { type: 'string' };
}


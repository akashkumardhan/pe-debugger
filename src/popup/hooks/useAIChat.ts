/**
 * useAIChat Hook
 * 
 * A React hook for AI chat functionality using @tanstack/ai with:
 * - Multi-provider adapters (OpenAI, Anthropic, Gemini)
 * - Client-side tool execution
 * - Streaming responses
 * 
 * @see https://tanstack.com/ai
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, ApiConfig, ConsoleError, PEAppConfig } from '../../types';
import { createAdapter, type AIAdapter, type AdapterMessage } from '../../services/adapters';
import { clientTools, registerUIUpdateCallback, unregisterUIUpdateCallback } from '../../tools/client';
import { allToolDefinitions } from '../../tools/definitions';
import { pushEngageService } from '../../services/pushEngage';

interface UseAIChatOptions {
  apiConfig: ApiConfig | null;
  mode: 'debug' | 'pushengage';
  selectedError: ConsoleError | null;
  peData: PEAppConfig | null;
  onUIUpdate?: (message: string, type: string, duration: number) => void;
}

interface UseAIChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  stopGeneration: () => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

/**
 * Build system prompt based on chat mode and available context
 */
function buildSystemPrompt(
  mode: 'debug' | 'pushengage',
  selectedError: ConsoleError | null,
  peData: PEAppConfig | null
): string {
  const toolsDescription = `
You have access to the following tools:
- get_subscription_details: Get PushEngage subscription and configuration details
- scrape_website: Scrape and extract content from a website URL
- update_ui: Display notifications in the extension popup
- save_to_storage: Save data to browser storage
- analyze_error: Analyze a captured console error

When appropriate, use these tools to help answer questions.
`;

  if (mode === 'debug' && selectedError) {
    return `You are an expert JavaScript debugger and developer assistant. Your role is to analyze console errors and provide clear, actionable solutions.

${toolsDescription}

## CURRENT ERROR CONTEXT

**Error Type:** ${selectedError.type}
**Error Message:** ${selectedError.message}
**Source File:** ${selectedError.filename}
**Line Number:** ${selectedError.lineno}
**Page URL:** ${selectedError.url}
**Timestamp:** ${new Date(selectedError.timestamp).toLocaleString()}

**Stack Trace:**
\`\`\`
${selectedError.stack}
\`\`\`

## YOUR RESPONSE SHOULD INCLUDE:

1. **Root Cause Analysis** - Explain what's causing this error in simple terms
2. **Step-by-Step Solution** - Provide clear steps to fix the issue
3. **Code Example** - Show corrected code when applicable
4. **Prevention Tips** - Suggest how to avoid this error in the future

Use markdown formatting for code blocks and be concise but thorough.`;
  }

  if (mode === 'pushengage' && peData) {
    const peContext = pushEngageService.buildAIContext(peData);
    
    return `You are a helpful assistant specialized in PushEngage push notification platform configuration and management.

${toolsDescription}

## PUSHENGAGE CONFIGURATION DATA

${peContext}

## RESPONSE GUIDELINES:

1. Answer questions based on the configuration data provided above
2. Use the get_subscription_details tool to fetch fresh data if needed
3. Use the scrape_website tool to fetch PushEngage documentation from https://pushengage.com/api/web-sdk/ if needed
4. Be concise, accurate, and helpful
5. Use markdown formatting for better readability
6. When listing campaigns or settings, format them clearly`;
  }

  return `You are a helpful AI assistant for developers. 

${toolsDescription}

Provide clear, concise answers with code examples when appropriate. Use markdown formatting.`;
}

/**
 * Execute a tool call and return the result
 */
async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const tool = clientTools.find(t => (t as any).name === toolName);
  
  if (!tool) {
    return { error: `Unknown tool: ${toolName}` };
  }

  try {
    // Execute the client tool
    const result = await (tool as any).execute(args);
    return result;
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Tool execution failed' };
  }
}

/**
 * useAIChat Hook - Uses @tanstack/ai adapters and tools
 */
export function useAIChat(options: UseAIChatOptions): UseAIChatReturn {
  const { apiConfig, mode, selectedError, peData, onUIUpdate } = options;
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const adapterRef = useRef<AIAdapter | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Register UI update callback
  useEffect(() => {
    if (onUIUpdate) {
      registerUIUpdateCallback(onUIUpdate);
    }
    return () => {
      unregisterUIUpdateCallback();
    };
  }, [onUIUpdate]);

  /**
   * Send a message and stream the AI response using adapters
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!apiConfig?.apiKey || !content.trim()) {
      setError('API key is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: ChatMessage = { role: 'user', content: content.trim() };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Create adapter for selected provider
      const adapter = createAdapter(
        apiConfig.provider,
        apiConfig.apiKey,
        apiConfig.model
      );
      adapterRef.current = adapter;

      // Create abort controller
      abortControllerRef.current = new AbortController();

      // Build system prompt with context
      const systemPrompt = buildSystemPrompt(mode, selectedError, peData);

      // Prepare all messages for the API
      const allMessages: AdapterMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: content.trim() },
      ];

      // Stream the response
      let assistantResponse = '';
      let pendingToolCall: { id: string; name: string; arguments: string } | null = null;

      const stream = adapter.stream(allMessages, {
        tools: allToolDefinitions,
        signal: abortControllerRef.current.signal,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'text' && chunk.content) {
          assistantResponse += chunk.content;
          
          // Update messages with streaming response
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage?.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                { role: 'assistant', content: assistantResponse },
              ];
            } else {
              return [...prev, { role: 'assistant', content: assistantResponse }];
            }
          });
        }

        if (chunk.type === 'tool_call' && chunk.toolCall) {
          // Accumulate tool call arguments
          if (pendingToolCall && pendingToolCall.id === chunk.toolCall.id) {
            pendingToolCall.arguments += chunk.toolCall.arguments;
          } else {
            // Execute previous tool call if exists
            if (pendingToolCall) {
              try {
                const args = JSON.parse(pendingToolCall.arguments);
                const result = await executeToolCall(pendingToolCall.name, args);
                
                // Add tool result to response
                assistantResponse += `\n\n**Tool Result (${pendingToolCall.name}):**\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n`;
                
                setMessages(prev => {
                  const lastMessage = prev[prev.length - 1];
                  if (lastMessage?.role === 'assistant') {
                    return [
                      ...prev.slice(0, -1),
                      { role: 'assistant', content: assistantResponse },
                    ];
                  }
                  return prev;
                });
              } catch (e) {
                console.error('Tool execution error:', e);
              }
            }
            
            pendingToolCall = {
              id: chunk.toolCall.id,
              name: chunk.toolCall.name,
              arguments: chunk.toolCall.arguments,
            };
          }
        }
      }

      // Execute final pending tool call
      if (pendingToolCall) {
        try {
          const args = JSON.parse(pendingToolCall.arguments);
          const result = await executeToolCall(pendingToolCall.name, args);
          
          assistantResponse += `\n\n**Tool Result (${pendingToolCall.name}):**\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n`;
          
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage?.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                { role: 'assistant', content: assistantResponse },
              ];
            }
            return prev;
          });
        } catch (e) {
          console.error('Tool execution error:', e);
        }
      }

    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ **Error:** ${errorMessage}\n\nPlease check your API key and try again.`,
        },
      ]);
    } finally {
      setIsLoading(false);
      adapterRef.current = null;
      abortControllerRef.current = null;
    }
  }, [apiConfig, messages, mode, selectedError, peData]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  /**
   * Stop the current generation
   */
  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    stopGeneration,
    setMessages,
  };
}

export default useAIChat;

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
import type { ChatMessage, ApiConfig, ConsoleError, PEAppConfig, ChatMode } from '../../types';
import { createAdapter, type AIAdapter, type AdapterMessage } from '../../services/adapters';
import { clientTools, registerUIUpdateCallback, unregisterUIUpdateCallback } from '../../tools/client';
import { allToolDefinitions } from '../../tools/definitions';
import { pushEngageService } from '../../services/pushEngage';

interface UseAIChatOptions {
  apiConfig: ApiConfig | null;
  mode: ChatMode;
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
  mode: ChatMode,
  selectedError: ConsoleError | null,
  peData: PEAppConfig | null
): string {
  const toolsDescription = `
You have access to the following tools:
- get_subscription_app_config: Get PushEngage subscription app configuration details from the current page (campaigns, site settings, segments, opt-in configuration)
- get_subscription_details: Get PushEngage subscription details from the current page, including isSubDomain, appId, subscriber id, isSubscribed, endpoint, and subscriber details like expiresAt, city, country, device, browser type, subscription URL, timezone, segments, and trigger status
- get_service_worker_info: Get the currently active service worker details and compare with PushEngage expected configuration. Use this to verify if the correct service worker is installed for PushEngage integration.
- fetch_pushengage_docs: Search PushEngage Web SDK documentation for API methods, code examples, and usage guides
- update_ui: Display notifications in the extension popup
- save_to_storage: Save data to browser storage
- analyze_error: Analyze a captured console error

## 🚨 CRITICAL PUSHENGAGE CODE RULES - VIOLATIONS ARE UNACCEPTABLE 🚨

### ABSOLUTE RULE: NEVER WRITE PUSHENGAGE CODE FROM MEMORY

1. **ALL PushEngage JavaScript code MUST come from the "fetch_pushengage_docs" tool.**
   - Before showing ANY PushEngage code, you MUST call "fetch_pushengage_docs" tool first
   - If you haven't called the tool, you CANNOT provide PushEngage code
   - This applies to initialization, SDK methods, event listeners, EVERYTHING

2. **FORBIDDEN CODE PATTERNS (NEVER USE - These are hallucinations from training data):**
   - ❌ \`window._peq = window._peq || [];\` - WRONG, NOT IN DOCS
   - ❌ \`window._peq.push(['init']);\` - WRONG, NOT IN DOCS
   - ❌ \`_pe.push(...)\` - WRONG, NOT IN DOCS
   - ❌ \`pushengage.push(...)\` - WRONG CASING
   - ❌ Any PushEngage code you "remember" - IT'S LIKELY WRONG

3. **CORRECT PATTERNS (From documentation ONLY):**
   - ✅ \`PushEngage.push(function() { PushEngage.method() })\` - Wrapper pattern
   - ✅ \`PushEngage.push(['init', { appId: '...' }])\` - Initialization
   - ✅ Capital "PushEngage" always (capital P, capital E)

4. **MANDATORY PROCEDURE FOR ANY PUSHENGAGE CODE REQUEST:**
   - Step 1: STOP - Do not write code from memory
   - Step 2: Call "fetch_pushengage_docs" with relevant query
   - Step 3: Copy code EXACTLY from tool response - NO modifications
   - Step 4: If no code found, say "No code example found in PushEngage documentation"

5. **FOR SERVICE WORKER ERRORS:** Call fetch_pushengage_docs with query "service worker" or "init" to get correct setup code

## TOOL USAGE GUIDELINES:

- PushEngage JavaScript API, SDK methods, code examples, "how to" questions → Use "fetch_pushengage_docs" tool
- Specific PushEngage configuration, campaigns, settings → Use "get_subscription_app_config" tool
- Subscription status, subscriber ID, device info, location → Use "get_subscription_details" tool
- Service worker issues, SW path verification, SW registration problems → Use "get_service_worker_info" tool
- Use tools proactively when they can help answer the question

## SERVICE WORKER DEBUGGING:
When users ask about service worker issues or PushEngage not working:
1. Use "get_service_worker_info" to check if the correct SW is installed
2. The tool compares active SW path with PushEngage expected path (from siteSettings.service_worker.worker)
3. If paths don't match, guide user to install correct service worker
4. Use "fetch_pushengage_docs" with query "service worker" for installation instructions
`;

  // Debug mode - with or without selected error
  if (mode === 'debug') {
    if (selectedError) {
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

## 🚨 CRITICAL FOR PUSHENGAGE-RELATED ERRORS:
If this error mentions PushEngage, pushengage, service-worker, SDK, or PE:
1. **DO NOT suggest code fixes from memory** - Your training data is outdated
2. **MUST call "fetch_pushengage_docs" tool FIRST** with query like "service worker", "init", or the relevant method
3. **ONLY use code from the tool response** - Copy exactly, no modifications
4. **NEVER use these patterns** (they are WRONG):
   - ❌ window._peq = window._peq || [];
   - ❌ window._peq.push(['init']);
5. **Correct casing**: Always "PushEngage" (capital P, capital E)

Use markdown formatting for code blocks and be concise but thorough.`;
    } else {
      return `You are an expert JavaScript debugger and developer assistant. You help developers understand and fix console errors, debugging issues, and common JavaScript/TypeScript problems.

${toolsDescription}

## YOUR CAPABILITIES:

1. **Error Analysis** - Explain what common errors mean and how to fix them
2. **Debugging Guidance** - Provide debugging strategies and techniques
3. **Code Review** - Help identify potential issues in code snippets
4. **Best Practices** - Share debugging best practices and tips

No specific error is currently selected. Help the user with general debugging questions or guide them to select an error from the Errors tab for detailed analysis.

## IMPORTANT FOR PUSHENGAGE QUESTIONS:
If the user asks about PushEngage code or APIs, ALWAYS use "fetch_pushengage_docs" tool first. Never write PushEngage code from memory.

Use markdown formatting for code blocks and be concise but thorough.`;
    }
  }

  // PushEngage mode - with or without PE data
  if (mode === 'pushengage') {
    if (peData) {
      const peContext = pushEngageService.buildAIContext(peData);
      
      return `You are a helpful assistant specialized in PushEngage push notification platform configuration and management.

${toolsDescription}

## PUSHENGAGE CONFIGURATION DATA (Current Site)

${peContext}

## RESPONSE GUIDELINES:

1. For questions about THIS SITE'S specific configuration/campaigns/settings → Answer from the data above OR use "get_subscription_app_config" tool
2. **For ANY PushEngage JavaScript SDK/API methods, code examples, how to implement features → ALWAYS use "fetch_pushengage_docs" tool FIRST**
3. Be concise, accurate, and helpful
4. Use markdown formatting for better readability
5. When showing code examples, use ONLY code from fetch_pushengage_docs - NEVER write PushEngage code from memory
6. Always use "PushEngage" (capital P, capital E) - never "pushengage"

## EXAMPLES:
- "Is this a Shopify site?" → Answer from config data above
- "How do I add a segment?" → Use fetch_pushengage_docs with query "addSegment"
- "What campaigns are active?" → Answer from config data above  
- "Show me cart abandonment code" → Use fetch_pushengage_docs with query "addToCart"
- "How to trigger campaign?" → Use fetch_pushengage_docs with query "trigger"
- "Subscribe user to notifications" → Use fetch_pushengage_docs with query "subscribe"`;
    } else {
      return `You are a helpful assistant specialized in PushEngage push notification platform.

${toolsDescription}

## YOUR CAPABILITIES:

1. **PushEngage Knowledge** - Answer questions about PushEngage features, setup, and configuration
2. **Campaign Guidance** - Help with browse abandonment, cart abandonment, and other campaign types
3. **SDK Documentation** - Use the "fetch_pushengage_docs" tool to get accurate JavaScript API documentation
4. **Best Practices** - Share web push notification best practices

PushEngage is not detected on the current page. You can still help with general PushEngage questions and SDK documentation.

## CRITICAL RULE:
For ANY JavaScript SDK/API questions or code examples, you MUST use the "fetch_pushengage_docs" tool FIRST. 
- NEVER write PushEngage code from memory
- Always use "PushEngage" (capital P, capital E) in code
- If no code found in docs, say "No code example found in PushEngage documentation"

Use markdown formatting and be helpful.`;
    }
  }

  // General mode - acts like ChatGPT
  return `You are a helpful AI assistant, similar to ChatGPT. You can assist with a wide variety of topics including:

${toolsDescription}

## YOUR CAPABILITIES:

1. **Full-Stack Engineering** - Master-level expertise in JavaScript, TypeScript, React, Node.js, and all modern web ecosystems.
2. **Logic & Analysis** - Deep architectural breakdown of complex code, data structures, and advanced algorithmic logic.
3. **Smart Generation** - Rapid creation of clean, production-ready functions, modular components, and full-project scaffolding.
4. **Diagnostic Solving** - Advanced root-cause analysis for bugs, security vulnerabilities, and system performance bottlenecks.
5. **Pattern Excellence** - Strategic implementation of SOLID principles, design patterns, and industry-standard best practices.
6. **Universal Knowledge** - Expert-level answers on any topic including science, history, literature, and complex cross-disciplinary queries.

## RESPONSE GUIDELINES:

- Provide helpful, factually grounded, and conversational responses that adapt to any level of user expertise.
- Utilize Markdown, clear headers, and bolding to ensure all responses are organized and scannable at a glance.
- Enhance every technical or abstract explanation with practical, real-world examples and formatted code blocks.
- Maintain a "concise yet thorough" approach, ensuring no detail is missed while avoiding unnecessary filler.
- If a solution is ambiguous, information is unavailable, or a prompt is unclear, state your uncertainty or ask for clarity.
- Always conclude with a proactive next step, a follow-up question, or a suggestion to help the user advance their goal.

## SPECIAL RULE FOR PUSHENGAGE:
If the user asks about PushEngage JavaScript SDK, API methods, or code examples:
- ALWAYS use "fetch_pushengage_docs" tool FIRST to get accurate documentation
- NEVER write PushEngage code from memory - use ONLY code from the tool
- Always use "PushEngage" (capital P, capital E) - never "pushengage"
- If no code found, say "No code example found in PushEngage documentation"

Feel free to ask me anything!`;
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
  
  // Use ref to track current messages to avoid stale closure issues
  const messagesRef = useRef<ChatMessage[]>([]);
  
  // Track current request ID to prevent stale updates
  const currentRequestIdRef = useRef<number>(0);
  
  // Keep messagesRef in sync with messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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

    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create unique request ID to prevent stale updates
    const requestId = Date.now();
    currentRequestIdRef.current = requestId;
    
    console.log('[AI Chat] Starting request:', requestId, 'content:', content.substring(0, 50));

    setIsLoading(true);
    setError(null);

    // Helper to check if this request is still current
    const isCurrentRequest = () => currentRequestIdRef.current === requestId;

    // Build the user message
    const userMessage: ChatMessage = { role: 'user', content: content.trim() };
    
    // IMPORTANT: Capture current messages BEFORE setState to avoid async timing issues
    // This ensures we have the correct conversation history for the API call
    const previousMessages = [...messagesRef.current];
    
    // Build the messages array for the API call SYNCHRONOUSLY
    const messagesForAPI = [...previousMessages, userMessage];
    
    // Calculate assistant message index
    const assistantMessageIndex = messagesForAPI.length;
    
    // Now update state with user message + placeholder
    const newMessagesWithPlaceholder = [...messagesForAPI, { role: 'assistant' as const, content: '' }];
    messagesRef.current = newMessagesWithPlaceholder;
    setMessages(newMessagesWithPlaceholder);
    
    console.log('[AI Chat] Messages for API:', messagesForAPI.length, 'assistantIndex:', assistantMessageIndex);

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
      
      // Prepare all messages for the API (use the synchronously captured messages)
      const allMessages: AdapterMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messagesForAPI.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ];
      
      console.log('[AI Chat] Sending', allMessages.length, 'messages to API (user messages:', messagesForAPI.length, ')');

      // Stream the response
      let assistantResponse = '';
      let pendingToolCall: { id: string; name: string; arguments: string } | null = null;
      const toolResults: { name: string; result: unknown }[] = [];
      let chunkCount = 0;

      // Helper to update assistant message - more robust version
      const updateAssistantMessage = (content: string) => {
        // Skip update if this request is no longer current
        if (!isCurrentRequest()) {
          console.log('[AI Chat] Skipping stale update for request:', requestId);
          return;
        }

        setMessages(prev => {
          const newMessages = [...prev];
          // Find and update the last assistant message (more robust than index-based)
          let updated = false;
          for (let i = newMessages.length - 1; i >= 0; i--) {
            if (newMessages[i].role === 'assistant') {
              newMessages[i] = { role: 'assistant', content };
              updated = true;
              break;
            }
          }
          if (!updated) {
            console.log('[AI Chat] Warning: No assistant message found to update');
          }
          messagesRef.current = newMessages;
          return newMessages;
        });
      };

      // Helper to execute a tool and collect result
      const executeTool = async (toolCall: { id: string; name: string; arguments: string }) => {
        try {
          const args = JSON.parse(toolCall.arguments);
          const result = await executeToolCall(toolCall.name, args);
          toolResults.push({ name: toolCall.name, result });
          
          // Show a brief loading indicator
          updateAssistantMessage('🔧 Fetching documentation...');
        } catch (e) {
          console.error('Tool execution error:', e);
          toolResults.push({ name: toolCall.name, result: { error: 'Tool execution failed' } });
        }
      };

      const stream = adapter.stream(allMessages, {
        tools: allToolDefinitions,
        signal: abortControllerRef.current.signal,
      });

      for await (const chunk of stream) {
        chunkCount++;
        
        // Log first few chunks for debugging
        if (chunkCount <= 3) {
          console.log('[AI Chat] Chunk', chunkCount, ':', JSON.stringify(chunk).substring(0, 200));
        }
        
        if (chunk.type === 'text' && chunk.content) {
          assistantResponse += chunk.content;
          updateAssistantMessage(assistantResponse);
        }

        if (chunk.type === 'tool_call' && chunk.toolCall) {
          // Accumulate tool call arguments
          if (pendingToolCall && pendingToolCall.id === chunk.toolCall.id) {
            pendingToolCall.arguments += chunk.toolCall.arguments;
          } else {
            // Execute previous tool call if exists
            if (pendingToolCall) {
              await executeTool(pendingToolCall);
            }
            
            pendingToolCall = {
              id: chunk.toolCall.id,
              name: chunk.toolCall.name,
              arguments: chunk.toolCall.arguments,
            };
          }
        }
      }
      
      console.log('[AI Chat] Stream complete. Chunks:', chunkCount, 'Response length:', assistantResponse.length, 'Tools:', toolResults.length);

      // Execute final pending tool call
      if (pendingToolCall) {
        await executeTool(pendingToolCall);
      }

      // If we have tool results and limited/no text response, make a follow-up call
      // to get the AI to generate a proper response using the tool results
      if (toolResults.length > 0 && isCurrentRequest()) {
        // Build a follow-up prompt with tool results
        const toolResultsContext = toolResults.map(tr => {
          // Extract the most useful parts from the tool result
          const result = tr.result as any;
          if (tr.name === 'fetch_pushengage_docs' && result?.success && result?.documentation?.formattedContent) {
            return `**Tool: ${tr.name}**\n\n${result.documentation.formattedContent}`;
          }
          return `**Tool: ${tr.name}**\n\`\`\`json\n${JSON.stringify(tr.result, null, 2)}\n\`\`\``;
        }).join('\n\n');

        // Make follow-up call to get AI to interpret tool results
        const followUpMessages: AdapterMessage[] = [
          ...allMessages,
          { 
            role: 'assistant', 
            content: `I'll look that up in the documentation.\n\n[Tool executed: ${toolResults.map(t => t.name).join(', ')}]` 
          },
          { 
            role: 'user', 
            content: `Based on the documentation below, please provide a clear, concise answer to the original question. Show the relevant code example and explain it briefly. Don't show raw JSON.\n\n${toolResultsContext}` 
          },
        ];

        // Stream the follow-up response
        assistantResponse = '';
        updateAssistantMessage(''); // Clear loading indicator
        
        // Check again before making follow-up call
        if (!isCurrentRequest()) {
          return;
        }
        
        const followUpStream = adapter.stream(followUpMessages, {
          signal: abortControllerRef.current?.signal,
        });

        for await (const chunk of followUpStream) {
          // Check if request is still current before each update
          if (!isCurrentRequest()) {
            break;
          }
          if (chunk.type === 'text' && chunk.content) {
            assistantResponse += chunk.content;
            updateAssistantMessage(assistantResponse);
          }
        }
      }

      // Final response handling
      if (isCurrentRequest()) {
        if (assistantResponse) {
          // Ensure final response is displayed
          console.log('[AI Chat] Final response update, length:', assistantResponse.length);
          updateAssistantMessage(assistantResponse);
        } else if (toolResults.length === 0) {
          // No response AND no tools - show error message
          console.log('[AI Chat] No response received, showing error');
          updateAssistantMessage('⚠️ No response received from AI. Please try again.');
        }
        // If toolResults.length > 0 but no assistantResponse, the follow-up call should have handled it
      }

    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // Don't modify state for aborted requests
        return;
      }

      // Only show error if this is still the current request
      if (!isCurrentRequest()) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.log('[AI Chat] Error:', errorMessage);
      setError(errorMessage);
      
      // Update the placeholder with error message (find last assistant message)
      setMessages(prev => {
        const newMessages = [...prev];
        for (let i = newMessages.length - 1; i >= 0; i--) {
          if (newMessages[i].role === 'assistant') {
            newMessages[i] = {
              role: 'assistant',
              content: `❌ **Error:** ${errorMessage}\n\nPlease check your API key and try again.`,
            };
            break;
          }
        }
        messagesRef.current = newMessages;
        return newMessages;
      });
    } finally {
      setIsLoading(false);
      adapterRef.current = null;
      abortControllerRef.current = null;
    }
  }, [apiConfig, mode, selectedError, peData]);

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

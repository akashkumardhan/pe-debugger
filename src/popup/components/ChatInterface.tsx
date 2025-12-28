/**
 * ChatInterface Component
 * 
 * Dual-mode AI chat interface for:
 * - Debug Mode: Analyze console errors with AI assistance
 * - PushEngage Mode: Query PE configuration in natural language
 * - Generic Mode: General developer assistance when no specific context
 * 
 * Uses useAIChat hook which mimics @tanstack/ai-client API pattern
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Trash2, Copy, Check, Bot, User, StopCircle, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ConsoleError, ChatMessage, ApiConfig, PEAppConfig } from '../../types';
import { useAIChat } from '../hooks/useAIChat';

// Toast notification state
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

import type { ChatMode } from '../../types';

interface ChatInterfaceProps {
  mode: ChatMode;
  selectedError: ConsoleError | null;
  peData: PEAppConfig | null;
  apiConfig: ApiConfig | null;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  onModeChange: (mode: ChatMode) => void;
}

export default function ChatInterface({
  mode,
  selectedError,
  peData,
  apiConfig,
  messages,
  onMessagesChange,
  onModeChange
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle UI updates from AI tools
  const handleUIUpdate = useCallback((message: string, type: string, duration: number) => {
    const id = Date.now();
    const toast: Toast = { id, message, type: type as Toast['type'] };
    setToasts(prev => [...prev, toast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  // Initialize AI Chat hook with current context
  const {
    messages: chatMessages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    stopGeneration,
    setMessages
  } = useAIChat({
    apiConfig,
    onUIUpdate: handleUIUpdate,
    mode,
    selectedError,
    peData
  });

  // Sync messages with parent component
  useEffect(() => {
    onMessagesChange(chatMessages);
  }, [chatMessages, onMessagesChange]);

  // Initialize from parent messages
  useEffect(() => {
    if (messages.length > 0 && chatMessages.length === 0) {
      setMessages(messages);
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle form submit
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  }, [input, isLoading, sendMessage]);

  // Handle clear
  const handleClear = useCallback(() => {
    clearMessages();
    onMessagesChange([]);
  }, [clearMessages, onMessagesChange]);

  // Copy message to clipboard
  const copyMessage = async (content: string, index: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Check if API is configured
  if (!apiConfig?.apiKey) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <Bot size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-sm font-medium text-gray-700 mb-2">API Key Required</h3>
          <p className="text-xs text-gray-500">
            Please configure your API key in Settings to use AI chat.
          </p>
        </div>
      </div>
    );
  }

  // Toast icon based on type
  const getToastIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-green-500" />;
      case 'error': return <AlertCircle size={16} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'info': return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="absolute top-2 right-2 z-50 space-y-2">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm animate-slide-in ${
                toast.type === 'success' ? 'bg-green-50 border border-green-200' :
                toast.type === 'error' ? 'bg-red-50 border border-red-200' :
                toast.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-blue-50 border border-blue-200'
              }`}
            >
              {getToastIcon(toast.type)}
              <span className="text-gray-700">{toast.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Context Header - Mode selector and context */}
      <div className="p-3 border-b bg-white">
        {/* Mode Radio Buttons */}
        <div className="flex items-center gap-4 mb-3 pb-3 border-b border-gray-100">
          <span className="text-xs text-gray-500 font-medium">Mode:</span>
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <input 
              type="radio" 
              name="chatMode" 
              value="debug" 
              checked={mode === 'debug'} 
              onChange={() => onModeChange('debug')}
              className="w-3.5 h-3.5 text-red-500 focus:ring-red-500 cursor-pointer"
            />
            <span className={`text-xs ${mode === 'debug' ? 'text-red-600 font-semibold' : 'text-gray-600 group-hover:text-gray-800'}`}>
              🔧 Debug
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <input 
              type="radio" 
              name="chatMode" 
              value="pushengage" 
              checked={mode === 'pushengage'} 
              onChange={() => onModeChange('pushengage')}
              className="w-3.5 h-3.5 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
            />
            <span className={`text-xs ${mode === 'pushengage' ? 'text-indigo-600 font-semibold' : 'text-gray-600 group-hover:text-gray-800'}`}>
              📊 PushEngage
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <input 
              type="radio" 
              name="chatMode" 
              value="general" 
              checked={mode === 'general'} 
              onChange={() => onModeChange('general')}
              className="w-3.5 h-3.5 text-blue-500 focus:ring-blue-500 cursor-pointer"
            />
            <span className={`text-xs ${mode === 'general' ? 'text-blue-600 font-semibold' : 'text-gray-600 group-hover:text-gray-800'}`}>
              💬 General
            </span>
          </label>
        </div>

        {/* Context Display based on mode */}
        {mode === 'debug' ? (
          selectedError ? (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-sm font-mono text-red-900 line-clamp-2">{selectedError.message}</p>
              <p className="text-xs text-red-600 mt-1">
                {selectedError.filename}:{selectedError.lineno}
              </p>
            </div>
          ) : (
            <div className="bg-red-50/50 p-3 rounded-lg border border-red-100">
              <p className="text-xs text-red-600">
                No error selected. Select an error from the Errors tab to analyze, or ask general debugging questions.
              </p>
            </div>
          )
        ) : mode === 'pushengage' ? (
          peData ? (
            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
              <p className="text-sm font-semibold text-indigo-900">
                {peData.site?.site_name || 'Unknown Site'}
              </p>
              <p className="text-xs text-indigo-600">{peData.site?.site_url}</p>
              <div className="flex gap-2 mt-2 text-[10px] text-indigo-500">
                <span>{peData.browseAbandonments?.length || 0} browse campaigns</span>
                <span>•</span>
                <span>{peData.cartAbandonments?.length || 0} cart campaigns</span>
                <span>•</span>
                <span>{peData.segments?.length || 0} segments</span>
              </div>
            </div>
          ) : (
            <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
              <p className="text-xs text-indigo-600">
                PushEngage not detected on this page. Visit a page with PE SDK or ask general questions about PushEngage.
              </p>
            </div>
          )
        ) : (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              💡 General AI Assistant - Ask me anything about web development, JavaScript, debugging, or any other topic!
            </p>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatMessages.length === 0 ? (
          <div className="text-center py-8">
            <Bot size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500 mb-2">
              {mode === 'debug' && selectedError
                ? 'Ask questions about the error or request debugging help'
                : mode === 'pushengage' && peData
                  ? 'Ask questions about your PushEngage configuration'
                  : mode === 'general'
                    ? 'Ask me anything - coding, debugging, web development, or general questions!'
                    : 'Ask me anything about web development, debugging, or PushEngage!'}
            </p>
            {/* Show example queries */}
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-400">Try asking:</p>
              {mode === 'debug' && selectedError ? (
                <div className="flex flex-wrap gap-2 justify-center">
                  <ExampleChip text="What's causing this error?" onClick={() => setInput("What's causing this error?")} />
                  <ExampleChip text="How do I fix this?" onClick={() => setInput("How do I fix this error?")} />
                  <ExampleChip text="Show me a code example" onClick={() => setInput("Show me a code example to fix this")} />
                </div>
              ) : mode === 'pushengage' && peData ? (
                <div className="flex flex-wrap gap-2 justify-center">
                  <ExampleChip text="List all campaigns" onClick={() => setInput("Show me all active campaigns")} />
                  <ExampleChip text="Cart abandonment settings" onClick={() => setInput("What are my cart abandonment settings?")} />
                  <ExampleChip text="Opt-in configuration" onClick={() => setInput("Explain my opt-in configuration")} />
                </div>
              ) : mode === 'general' ? (
                // General mode examples
                <div className="flex flex-wrap gap-2 justify-center">
                  <ExampleChip text="Explain async/await" onClick={() => setInput("How does async/await work in JavaScript?")} />
                  <ExampleChip text="Best practices for React" onClick={() => setInput("What are the best practices for React development?")} />
                  <ExampleChip text="CSS Grid vs Flexbox" onClick={() => setInput("When should I use CSS Grid vs Flexbox?")} />
                  <ExampleChip text="Debug CORS errors" onClick={() => setInput("How do I debug CORS errors?")} />
                </div>
              ) : mode === 'debug' ? (
                // Debug mode without selected error
                <div className="flex flex-wrap gap-2 justify-center">
                  <ExampleChip text="Common JavaScript errors" onClick={() => setInput("What are the most common JavaScript errors and how to fix them?")} />
                  <ExampleChip text="Debug null errors" onClick={() => setInput("How do I debug 'Cannot read property of null' errors?")} />
                  <ExampleChip text="Console debugging tips" onClick={() => setInput("What are some advanced console debugging tips?")} />
                </div>
              ) : (
                // PushEngage mode without PE data
                <div className="flex flex-wrap gap-2 justify-center">
                  <ExampleChip text="What is PushEngage?" onClick={() => setInput("What is PushEngage and how does it work?")} />
                  <ExampleChip text="Setup push notifications" onClick={() => setInput("How do I set up web push notifications?")} />
                  <ExampleChip text="Cart abandonment campaigns" onClick={() => setInput("How do cart abandonment campaigns work?")} />
                </div>
              )}
            </div>
          </div>
        ) : (
          chatMessages.map((m, i) =>
            m.role !== 'system' && (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-xl p-3 ${
                    m.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  {/* Message header */}
                  <div className={`flex items-center gap-2 mb-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
                    {m.role === 'assistant' && <Bot size={14} className="text-primary" />}
                    <span className="text-[10px] font-semibold uppercase opacity-70">
                      {m.role === 'user' ? 'You' : 'AI'}
                    </span>
                    {m.role === 'user' && <User size={14} />}
                  </div>

                  {/* Message content with Markdown */}
                  <div
                    className={`text-sm prose prose-sm max-w-none ${
                      m.role === 'user' ? 'prose-invert' : ''
                    }`}
                  >
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>

                  {/* Copy button for assistant messages */}
                  {m.role === 'assistant' && (
                    <button
                      onClick={() => copyMessage(m.content, i)}
                      className="mt-2 flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600"
                    >
                      {copiedIndex === i ? <Check size={12} /> : <Copy size={12} />}
                      {copiedIndex === i ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>
            )
          )
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-gray-500">AI is thinking...</span>
                <button
                  onClick={stopGeneration}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                >
                  <StopCircle size={14} />
                  Stop
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t bg-white">
        {chatMessages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-error mb-2"
          >
            <Trash2 size={12} />
            Clear chat
          </button>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'debug'
                ? selectedError
                  ? 'Ask about this error...'
                  : 'Ask debugging questions...'
                : mode === 'pushengage'
                  ? peData
                    ? 'Ask about PushEngage config...'
                    : 'Ask about PushEngage...'
                  : 'Ask me anything...'
            }
            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-gray-50"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

// Example query chip component
function ExampleChip({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
    >
      {text}
    </button>
  );
}

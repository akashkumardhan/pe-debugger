import { useState, useEffect, useCallback } from 'react';
import { ScrollText, Megaphone, MessageSquare, Settings as SettingsIcon, Bug } from 'lucide-react';
import type { ConsoleError, ApiConfig, ChatMessage, PEAppConfig, ChatMode, PELog } from '../types';
import { getApiConfig, getErrors, getPEStatus, getCurrentTabId, getPELogs } from '../utils/storage';
import LogsList from './components/LogsList';
import ChatInterface from './components/ChatInterface';
import PushEngagePanel from './components/PushEngagePanel';
import Settings from './components/Settings';
import ApiKeySetup from './components/ApiKeySetup';

type Tab = 'logs' | 'pushengage' | 'chat' | 'settings';

export default function App() {
  // State
  const [errors, setErrors] = useState<ConsoleError[]>([]);
  const [peLogs, setPeLogs] = useState<PELog[]>([]);
  const [selectedError, setSelectedError] = useState<ConsoleError | null>(null);
  const [peData, setPeData] = useState<PEAppConfig | null>(null);
  const [peAvailable, setPeAvailable] = useState(false);
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('logs');
  const [chatMode, setChatMode] = useState<ChatMode>('pushengage');
  // Separate message histories for each mode
  const [debugMessages, setDebugMessages] = useState<ChatMessage[]>([]);
  const [pushengageMessages, setPushengageMessages] = useState<ChatMessage[]>([]);
  const [generalMessages, setGeneralMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [currentTabId, setCurrentTabId] = useState<number | undefined>(undefined);

  // Load initial data including current tab ID
  useEffect(() => {
    async function loadData() {
      try {
        // Get current tab ID first
        const tabId = await getCurrentTabId();
        setCurrentTabId(tabId);

        const [config, errorList, peStatus, peLogsList] = await Promise.all([
          getApiConfig(),
          getErrors(tabId), // Filter errors by current tab
          getPEStatus(),
          getPELogs(tabId) // Filter PE logs by current tab
        ]);

        setApiConfig(config);
        setErrors(errorList);
        setPeAvailable(peStatus.available);
        setPeData(peStatus.config);
        setPeLogs(peLogsList);

        // Show setup if no API key
        if (!config?.apiKey) {
          setShowSetup(true);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    // Listen for storage changes
    const handleStorageChange = async (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const tabId = await getCurrentTabId();
      
      if (changes.errors) {
        // Re-fetch errors filtered by current tab
        if (tabId !== undefined) {
          const filteredErrors = await getErrors(tabId);
          setErrors(filteredErrors);
        }
      }
      if (changes.peLogs) {
        // Re-fetch PE logs filtered by current tab
        if (tabId !== undefined) {
          const filteredLogs = await getPELogs(tabId);
          setPeLogs(filteredLogs);
        }
      }
      if (changes.peConfig) {
        setPeData(changes.peConfig.newValue);
      }
      if (changes.peAvailable) {
        setPeAvailable(changes.peAvailable.newValue);
      }
    };

    chrome.storage.local.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.local.onChanged.removeListener(handleStorageChange);
  }, []);

  // Refresh data periodically for current tab
  useEffect(() => {
    const interval = setInterval(async () => {
      const tabId = await getCurrentTabId();
      
      // Update currentTabId if it changed (user switched tabs)
      if (tabId !== currentTabId) {
        setCurrentTabId(tabId);
      }

      const [errorList, peStatus, peLogsList] = await Promise.all([
        getErrors(tabId), // Filter by current tab
        getPEStatus(),
        getPELogs(tabId) // Filter PE logs by current tab
      ]);
      
      setErrors(errorList);
      setPeAvailable(peStatus.available);
      if (peStatus.config) {
        setPeData(peStatus.config);
      }
      setPeLogs(peLogsList);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentTabId]);

  // Get current messages based on mode
  const getCurrentMessages = useCallback((): ChatMessage[] => {
    switch (chatMode) {
      case 'debug': return debugMessages;
      case 'pushengage': return pushengageMessages;
      case 'general': return generalMessages;
    }
  }, [chatMode, debugMessages, pushengageMessages, generalMessages]);

  // Set messages for current mode
  const setCurrentMessages = useCallback((messages: ChatMessage[]) => {
    switch (chatMode) {
      case 'debug': setDebugMessages(messages); break;
      case 'pushengage': setPushengageMessages(messages); break;
      case 'general': setGeneralMessages(messages); break;
    }
  }, [chatMode]);

  // Handle error analysis - switches to debug mode
  const handleAnalyzeError = useCallback((error: ConsoleError) => {
    setSelectedError(error);
    setChatMode('debug');
    setActiveTab('chat');
  }, []);

  // Handle PE query selection - switches to pushengage mode
  const handlePEQuerySelect = useCallback((query: string) => {
    setChatMode('pushengage');
    setActiveTab('chat');
    // Add the query as a user message to pushengage messages
    setPushengageMessages(prev => [...prev, { role: 'user', content: query }]);
  }, []);

  // Handle explicit mode change from radio buttons
  const handleModeChange = useCallback((newMode: ChatMode) => {
    setChatMode(newMode);
  }, []);

  // Handle config save
  const handleConfigSave = useCallback((config: ApiConfig) => {
    setApiConfig(config);
    setShowSetup(false);
  }, []);

  // Refresh PE data
  const handleRefreshPE = useCallback(async () => {
    const peStatus = await getPEStatus();
    setPeAvailable(peStatus.available);
    if (peStatus.config) {
      setPeData(peStatus.config);
    }
  }, []);

  // Handle errors update (for clearing)
  const handleErrorsUpdate = useCallback((newErrors: ConsoleError[]) => {
    setErrors(newErrors);
  }, []);

  // Handle PE logs update (for clearing)
  const handlePELogsUpdate = useCallback((newLogs: PELog[]) => {
    setPeLogs(newLogs);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading DevDebug AI...</p>
        </div>
      </div>
    );
  }

  // Setup screen
  if (showSetup) {
    return (
      <ApiKeySetup 
        onSave={handleConfigSave}
        onSkip={() => setShowSetup(false)}
      />
    );
  }

  // Tab content
  const renderContent = () => {
    switch (activeTab) {
      case 'logs':
        return (
          <LogsList
            errors={errors}
            peLogs={peLogs}
            onAnalyze={handleAnalyzeError}
            onErrorsUpdate={handleErrorsUpdate}
            onPELogsUpdate={handlePELogsUpdate}
            currentTabId={currentTabId}
          />
        );
      case 'pushengage':
        return (
          <PushEngagePanel
            peData={peData}
            peAvailable={peAvailable}
            onRefresh={handleRefreshPE}
            onQuerySelect={handlePEQuerySelect}
          />
        );
      case 'chat':
        return (
          <ChatInterface
            mode={chatMode}
            selectedError={selectedError}
            peData={peData}
            apiConfig={apiConfig}
            messages={getCurrentMessages()}
            onMessagesChange={setCurrentMessages}
            onModeChange={handleModeChange}
          />
        );
      case 'settings':
        return (
          <Settings
            apiConfig={apiConfig}
            onConfigSave={handleConfigSave}
            errors={errors}
            peData={peData}
          />
        );
      default:
        return null;
    }
  };

  const tabs: { id: Tab; icon: React.ReactNode; label: string; badge?: number }[] = [
    { id: 'logs', icon: <ScrollText size={18} />, label: 'Logs', badge: errors.length + peLogs.length > 0 ? errors.length + peLogs.length : undefined },
    { id: 'pushengage', icon: <Megaphone size={18} />, label: 'PE' },
    { id: 'chat', icon: <MessageSquare size={18} />, label: 'Chat' },
    { id: 'settings', icon: <SettingsIcon size={18} />, label: 'Settings' }
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <Bug size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">DevDebug AI</h1>
            <p className="text-xs text-gray-500">
              {peAvailable ? '🟢 PE Detected' : '⚪ PE Not Found'}
            </p>
          </div>
        </div>
        {!apiConfig?.apiKey && (
          <button
            onClick={() => setShowSetup(true)}
            className="text-xs bg-primary text-white px-3 py-1 rounded-full hover:bg-primary/90"
          >
            Setup API Key
          </button>
        )}
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b px-2">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors relative ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-error text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
}

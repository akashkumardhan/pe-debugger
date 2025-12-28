import { useState, useEffect, useCallback } from 'react';
import { Bug, Megaphone, MessageSquare, Settings as SettingsIcon } from 'lucide-react';
import type { ConsoleError, ApiConfig, ChatMessage, PEAppConfig } from '../types';
import { getApiConfig, getErrors, getPEStatus } from '../utils/storage';
import ErrorList from './components/ErrorList';
import ChatInterface from './components/ChatInterface';
import PushEngagePanel from './components/PushEngagePanel';
import Settings from './components/Settings';
import ApiKeySetup from './components/ApiKeySetup';

type Tab = 'errors' | 'pushengage' | 'chat' | 'settings';
type ChatMode = 'debug' | 'pushengage';

export default function App() {
  // State
  const [errors, setErrors] = useState<ConsoleError[]>([]);
  const [selectedError, setSelectedError] = useState<ConsoleError | null>(null);
  const [peData, setPeData] = useState<PEAppConfig | null>(null);
  const [peAvailable, setPeAvailable] = useState(false);
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('errors');
  const [chatMode, setChatMode] = useState<ChatMode>('debug');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [config, errorList, peStatus] = await Promise.all([
          getApiConfig(),
          getErrors(),
          getPEStatus()
        ]);

        setApiConfig(config);
        setErrors(errorList);
        setPeAvailable(peStatus.available);
        setPeData(peStatus.config);

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
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.errors) {
        setErrors(changes.errors.newValue || []);
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

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      const [errorList, peStatus] = await Promise.all([
        getErrors(),
        getPEStatus()
      ]);
      setErrors(errorList);
      setPeAvailable(peStatus.available);
      if (peStatus.config) {
        setPeData(peStatus.config);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Handle error analysis
  const handleAnalyzeError = useCallback((error: ConsoleError) => {
    setSelectedError(error);
    setChatMode('debug');
    setActiveTab('chat');
  }, []);

  // Handle PE query selection
  const handlePEQuerySelect = useCallback((query: string) => {
    setChatMode('pushengage');
    setActiveTab('chat');
    // Add the query as a user message
    setMessages(prev => [...prev, { role: 'user', content: query }]);
  }, []);

  // Handle mode switch
  const handleModeSwitch = useCallback(() => {
    setChatMode(prev => prev === 'debug' ? 'pushengage' : 'debug');
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

  // Handle errors update
  const handleErrorsUpdate = useCallback((newErrors: ConsoleError[]) => {
    setErrors(newErrors);
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
      case 'errors':
        return (
          <ErrorList
            errors={errors}
            onAnalyze={handleAnalyzeError}
            onUpdate={handleErrorsUpdate}
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
            messages={messages}
            onMessagesChange={setMessages}
            onModeSwitch={handleModeSwitch}
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
    { id: 'errors', icon: <Bug size={18} />, label: 'Errors', badge: errors.length },
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


import { useState } from 'react';
import { Key, Sparkles, Bug, Megaphone, ArrowRight, Eye, EyeOff, ExternalLink, CheckCircle, XCircle, Cpu } from 'lucide-react';
import type { ApiConfig } from '../../types';
import { saveApiConfig } from '../../utils/storage';
import { LLM_PROVIDERS, getProviderModels, getDefaultModel, getProviderApiKeyUrl, type AIProvider } from '../../utils/llm-providers';
import { testAIConnection } from '../../services/aiClient';

interface ApiKeySetupProps {
  onSave: (config: ApiConfig) => void;
  onSkip: () => void;
}

export default function ApiKeySetup({ onSave, onSkip }: ApiKeySetupProps) {
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(getDefaultModel('openai'));
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Handle provider selection
  const handleProviderSelect = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setModel(getDefaultModel(newProvider));
    setTestResult(null);
  };

  // Test connection using @tanstack/ai-client
  const handleTestConnection = async () => {
    if (!apiKey) {
      setTestResult({ success: false, error: 'API key is required' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Use TanStack AI Client for connection testing
      const result = await testAIConnection({ apiKey, provider, model });
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : 'Connection test failed'
      });
    } finally {
      setTesting(false);
    }
  };

  // Save and finish
  const handleFinish = async () => {
    if (!apiKey) return;

    setSaving(true);
    try {
      const config: ApiConfig = { apiKey, provider, model };
      await saveApiConfig(config);
      onSave(config);
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to save'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Bug size={32} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Welcome to DevDebug AI</h1>
        <p className="text-sm text-gray-600 mt-1">
          AI-powered debugging for developers
        </p>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {step === 1 && (
          <div className="space-y-4">
            {/* Features */}
            <div className="grid gap-3">
              <FeatureCard
                icon={<Bug size={20} />}
                title="Error Debugging"
                description="Capture console errors and get AI-powered solutions"
                color="red"
              />
              <FeatureCard
                icon={<Megaphone size={20} />}
                title="PushEngage Integration"
                description="Query your PushEngage config in natural language"
                color="indigo"
              />
              <FeatureCard
                icon={<Sparkles size={20} />}
                title="Multiple AI Providers"
                description="OpenAI, Anthropic Claude, and Google Gemini"
                color="purple"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
            >
              Get Started
              <ArrowRight size={18} />
            </button>

            <button
              onClick={onSkip}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Skip for now
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 text-center">
              Choose your AI provider
            </h2>

            <div className="grid gap-2">
              {Object.entries(LLM_PROVIDERS).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleProviderSelect(key as AIProvider)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    provider === key
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    provider === key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Key size={20} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-gray-900">{value.name}</p>
                    <p className="text-xs text-gray-500">{value.models.length} models available</p>
                  </div>
                  {provider === key && (
                    <CheckCircle size={20} className="text-primary" />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
            >
              Continue
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => setStep(1)}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Back
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 text-center">
              Enter your {LLM_PROVIDERS[provider].name} API key
            </h2>

            {/* API Key Input */}
            <div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 pr-12 text-sm border-2 rounded-xl focus:outline-none focus:border-primary"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <a
                href={getProviderApiKeyUrl(provider)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
              >
                Get your {LLM_PROVIDERS[provider].name} API key
                <ExternalLink size={10} />
              </a>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Select Model
              </label>
              <select
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setTestResult(null);
                }}
                className="w-full px-4 py-3 text-sm border-2 rounded-xl focus:outline-none focus:border-primary"
              >
                {getProviderModels(provider).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Connection Button */}
            <button
              onClick={handleTestConnection}
              disabled={testing || !apiKey}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-xl hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Cpu size={16} />
              {testing ? 'Testing...' : 'Test Connection'}
            </button>

            {/* Test Result */}
            {testResult && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                testResult.success
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {testResult.success ? (
                  <>
                    <CheckCircle size={18} />
                    <span>Connection successful! Ready to use.</span>
                  </>
                ) : (
                  <>
                    <XCircle size={18} />
                    <span>{testResult.error || 'Connection failed'}</span>
                  </>
                )}
              </div>
            )}

            {/* Finish Button */}
            <button
              onClick={handleFinish}
              disabled={saving || !apiKey}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Sparkles size={18} />
              {saving ? 'Saving...' : 'Start Using DevDebug AI'}
            </button>

            <button
              onClick={() => setStep(2)}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Back
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 text-center text-xs text-gray-500 border-t">
        Your API key is stored locally and never shared
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  description,
  color
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'red' | 'indigo' | 'purple';
}) {
  const colorClasses = {
    red: 'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="flex items-start gap-3 p-4 bg-white rounded-xl border">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}


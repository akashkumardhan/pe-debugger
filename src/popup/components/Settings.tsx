import { useState } from 'react';
import { Save, Eye, EyeOff, CheckCircle, XCircle, Trash2, Download, ExternalLink, Key, Cpu, Shield } from 'lucide-react';
import type { ApiConfig, ConsoleError, PEAppConfig } from '../../types';
import { saveApiConfig, clearErrors, clearPEConfig, exportErrorsAsJSON, exportPEConfigAsJSON } from '../../utils/storage';
import { LLM_PROVIDERS, getProviderModels, getDefaultModel, getProviderApiKeyUrl, type AIProvider } from '../../utils/llm-providers';
import { testAIConnection } from '../../services/aiClient';

interface SettingsProps {
  apiConfig: ApiConfig | null;
  onConfigSave: (config: ApiConfig) => void;
  errors: ConsoleError[];
  peData: PEAppConfig | null;
}

export default function Settings({
  apiConfig,
  onConfigSave,
  errors,
  peData
}: SettingsProps) {
  const [apiKey, setApiKey] = useState(apiConfig?.apiKey || '');
  const [provider, setProvider] = useState<AIProvider>(apiConfig?.provider || 'openai');
  const [model, setModel] = useState(apiConfig?.model || getDefaultModel('openai'));
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Handle provider change
  const handleProviderChange = (newProvider: AIProvider) => {
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

  // Save settings
  const handleSave = async () => {
    if (!apiKey) return;

    setSaving(true);
    try {
      const config: ApiConfig = { apiKey, provider, model };
      await saveApiConfig(config);
      onConfigSave(config);
      setTestResult({ success: true });
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to save settings'
      });
    } finally {
      setSaving(false);
    }
  };

  // Clear all errors
  const handleClearErrors = async () => {
    if (confirm('Are you sure you want to clear all captured errors?')) {
      await clearErrors();
    }
  };

  // Clear PE config
  const handleClearPEConfig = async () => {
    if (confirm('Are you sure you want to clear PushEngage config cache?')) {
      await clearPEConfig();
    }
  };

  // Export errors
  const handleExportErrors = () => {
    if (errors.length === 0) {
      alert('No errors to export');
      return;
    }
    exportErrorsAsJSON(errors);
  };

  // Export PE config
  const handleExportPEConfig = () => {
    if (!peData) {
      alert('No PushEngage config to export');
      return;
    }
    exportPEConfigAsJSON(peData);
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      {/* API Configuration */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Key size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-gray-900">API Configuration</h2>
        </div>

        <div className="space-y-3">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              AI Provider
            </label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {Object.entries(LLM_PROVIDERS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.name}
                </option>
              ))}
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                }}
                placeholder={`Enter your ${LLM_PROVIDERS[provider].name} API key`}
                className="w-full px-3 py-2 pr-10 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <a
              href={getProviderApiKeyUrl(provider)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1.5 text-xs text-primary hover:underline"
            >
              Get your API key
              <ExternalLink size={10} />
            </a>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setTestResult(null);
              }}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {getProviderModels(provider).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
              testResult.success
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {testResult.success ? (
                <>
                  <CheckCircle size={16} />
                  <span>Connection successful!</span>
                </>
              ) : (
                <>
                  <XCircle size={16} />
                  <span>{testResult.error || 'Connection failed'}</span>
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleTestConnection}
              disabled={testing || !apiKey}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-primary text-primary rounded-lg hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Cpu size={16} />
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !apiKey}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </section>

      {/* Data Management */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-900">Data Management</h2>
        </div>

        <div className="space-y-2">
          {/* Export Errors */}
          <button
            onClick={handleExportErrors}
            disabled={errors.length === 0}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <div className="flex items-center gap-2">
              <Download size={16} className="text-gray-500" />
              <span>Export Errors as JSON</span>
            </div>
            <span className="text-xs text-gray-400">{errors.length} errors</span>
          </button>

          {/* Export PE Config */}
          <button
            onClick={handleExportPEConfig}
            disabled={!peData}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <div className="flex items-center gap-2">
              <Download size={16} className="text-gray-500" />
              <span>Export PushEngage Config</span>
            </div>
            <span className="text-xs text-gray-400">{peData ? 'Available' : 'Not loaded'}</span>
          </button>

          {/* Clear Errors */}
          <button
            onClick={handleClearErrors}
            disabled={errors.length === 0}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={16} />
            <span>Clear All Errors</span>
          </button>

          {/* Clear PE Cache */}
          <button
            onClick={handleClearPEConfig}
            disabled={!peData}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={16} />
            <span>Clear PushEngage Cache</span>
          </button>
        </div>
      </section>

      {/* About */}
      <section className="pt-4 border-t">
        <div className="text-center text-xs text-gray-500">
          <p className="font-medium">DevDebug AI v1.0.0</p>
          <p className="mt-1">AI-powered console debugger with PushEngage integration</p>
          <p className="mt-2">Your data stays local • No tracking</p>
        </div>
      </section>
    </div>
  );
}


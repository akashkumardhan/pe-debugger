// LLM Provider Configurations

export const LLM_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    requiresApiKey: true,
  },
  anthropic: {
    name: 'Anthropic Claude',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ],
    defaultModel: 'claude-3-5-sonnet-20241022',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    requiresApiKey: true,
  },
  google: {
    name: 'Google Gemini',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-pro'],
    defaultModel: 'gemini-2.5-pro',
    apiKeyUrl: 'https://makersuite.google.com/app/apikey',
    requiresApiKey: true,
  }
} as const;

export type AIProvider = keyof typeof LLM_PROVIDERS;

export function getProviderModels(provider: AIProvider): string[] {
  return [...LLM_PROVIDERS[provider].models];
}

export function getDefaultModel(provider: AIProvider): string {
  return LLM_PROVIDERS[provider].defaultModel;
}

export function getProviderApiKeyUrl(provider: AIProvider): string {
  return LLM_PROVIDERS[provider].apiKeyUrl;
}

export function getProviderName(provider: AIProvider): string {
  return LLM_PROVIDERS[provider].name;
}

// AI API Endpoints
export const API_ENDPOINTS = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  google: 'https://generativelanguage.googleapis.com/v1beta/models'
} as const;


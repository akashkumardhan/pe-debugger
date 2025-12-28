// Chrome Storage Utilities
import type { ConsoleError, ApiConfig, PEAppConfig } from '../types';

// ===== API KEY MANAGEMENT =====

export async function saveApiConfig(config: ApiConfig): Promise<void> {
  await chrome.storage.sync.set({ apiConfig: config });
}

export async function getApiConfig(): Promise<ApiConfig | null> {
  try {
    const { apiConfig } = await chrome.storage.sync.get('apiConfig') as { apiConfig?: ApiConfig };
    return apiConfig || null;
  } catch {
    return null;
  }
}

export async function clearApiConfig(): Promise<void> {
  await chrome.storage.sync.remove('apiConfig');
}

// ===== ERROR MANAGEMENT =====

export async function getErrors(): Promise<ConsoleError[]> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_ERRORS' });
    return response || [];
  } catch {
    return [];
  }
}

export async function clearErrors(): Promise<void> {
  await chrome.runtime.sendMessage({ type: 'CLEAR_ERRORS' });
}

export function exportErrorsAsJSON(errors: ConsoleError[]): void {
  const dataStr = JSON.stringify(errors, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `devdebug-errors-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== PUSHENGAGE DATA MANAGEMENT =====

export async function getPEStatus(): Promise<{ available: boolean; config: PEAppConfig | null }> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_PE_STATUS' });
    return response || { available: false, config: null };
  } catch {
    return { available: false, config: null };
  }
}

export async function getPEConfig(): Promise<PEAppConfig | null> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_PE_CONFIG' });
    return response || null;
  } catch {
    return null;
  }
}

export async function clearPEConfig(): Promise<void> {
  await chrome.runtime.sendMessage({ type: 'CLEAR_PE_CONFIG' });
}

export function exportPEConfigAsJSON(config: PEAppConfig): void {
  const dataStr = JSON.stringify(config, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `pushengage-config-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== PRIVACY SETTINGS =====

interface PrivacySettings {
  errorCaptureEnabled: boolean;
  peDetectionEnabled: boolean;
}

export async function getPrivacySettings(): Promise<PrivacySettings> {
  try {
    const { privacySettings } = await chrome.storage.sync.get('privacySettings') as { privacySettings?: PrivacySettings };
    return privacySettings || { errorCaptureEnabled: true, peDetectionEnabled: true };
  } catch {
    return { errorCaptureEnabled: true, peDetectionEnabled: true };
  }
}

export async function savePrivacySettings(settings: PrivacySettings): Promise<void> {
  await chrome.storage.sync.set({ privacySettings: settings });
}


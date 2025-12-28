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

/**
 * Get errors, optionally filtered by tab ID
 * @param tabId - If provided, only returns errors from that specific tab
 */
export async function getErrors(tabId?: number): Promise<ConsoleError[]> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_ERRORS', tabId });
    return response || [];
  } catch {
    return [];
  }
}

/**
 * Clear errors, optionally only for a specific tab
 * @param tabId - If provided, only clears errors from that specific tab
 */
export async function clearErrors(tabId?: number): Promise<void> {
  await chrome.runtime.sendMessage({ type: 'CLEAR_ERRORS', tabId });
}

/**
 * Refresh errors for a tab - clears existing and re-injects content script
 * @param tabId - The tab ID to refresh errors for
 */
export async function refreshErrors(tabId?: number): Promise<{ success: boolean; errors: ConsoleError[] }> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'REFRESH_ERRORS', tabId });
    return response || { success: false, errors: [] };
  } catch {
    return { success: false, errors: [] };
  }
}

/**
 * Get the current active tab ID
 */
export async function getCurrentTabId(): Promise<number | undefined> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id;
  } catch {
    return undefined;
  }
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


// Chrome Storage Utilities
import type { ConsoleError, ApiConfig, PEAppConfig } from '../types';
import type { DocCache } from '../tools/types';

// ===== CONSTANTS =====
const PE_DOCS_CACHE_KEY = 'pe_docs_cache';
const DOCS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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
 * Refresh errors for a tab - re-injects content script and returns current errors
 * Does NOT clear existing errors - use clearErrors() for that
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

// ===== PUSHENGAGE DOCUMENTATION CACHE =====

/**
 * Save PushEngage documentation to cache
 * @param docs - The documentation cache object
 */
export async function savePEDocs(docs: DocCache): Promise<void> {
  try {
    await chrome.storage.local.set({ [PE_DOCS_CACHE_KEY]: docs });
  } catch (error) {
    console.error('Failed to save PE docs cache:', error);
    throw error;
  }
}

/**
 * Get PushEngage documentation from cache
 * @returns The cached documentation or null if not found/expired
 */
export async function getPEDocs(): Promise<DocCache | null> {
  try {
    const result = await chrome.storage.local.get(PE_DOCS_CACHE_KEY) as { [PE_DOCS_CACHE_KEY]?: DocCache };
    const docs = result[PE_DOCS_CACHE_KEY];
    
    if (!docs) {
      return null;
    }
    
    return docs;
  } catch (error) {
    console.error('Failed to get PE docs cache:', error);
    return null;
  }
}

/**
 * Check if the documentation cache is valid (not expired)
 * @returns Object with validity status and cache if valid
 */
export async function isPEDocsCacheValid(): Promise<{ valid: boolean; cache: DocCache | null; reason?: string }> {
  const docs = await getPEDocs();
  
  if (!docs) {
    return { valid: false, cache: null, reason: 'No cache found' };
  }
  
  const now = Date.now();
  
  if (now > docs.expiresAt) {
    return { valid: false, cache: docs, reason: 'Cache expired' };
  }
  
  return { valid: true, cache: docs };
}

/**
 * Clear the PushEngage documentation cache
 */
export async function clearPEDocsCache(): Promise<void> {
  try {
    await chrome.storage.local.remove(PE_DOCS_CACHE_KEY);
  } catch (error) {
    console.error('Failed to clear PE docs cache:', error);
    throw error;
  }
}

/**
 * Get cache metadata without loading full content
 */
export async function getPEDocsCacheInfo(): Promise<{
  exists: boolean;
  lastUpdated?: number;
  expiresAt?: number;
  totalPages?: number;
  isExpired?: boolean;
} | null> {
  const docs = await getPEDocs();
  
  if (!docs) {
    return { exists: false };
  }
  
  const now = Date.now();
  
  return {
    exists: true,
    lastUpdated: docs.lastUpdated,
    expiresAt: docs.expiresAt,
    totalPages: docs.totalPages,
    isExpired: now > docs.expiresAt,
  };
}

/**
 * Create a fresh cache object with proper timestamps
 */
export function createDocCache(baseUrl: string, pages: DocCache['pages']): DocCache {
  const now = Date.now();
  return {
    version: 1,
    lastUpdated: now,
    expiresAt: now + DOCS_CACHE_TTL_MS,
    baseUrl,
    pages,
    totalPages: pages.length,
  };
}

/**
 * Export constants for external use
 */
export { PE_DOCS_CACHE_KEY, DOCS_CACHE_TTL_MS };


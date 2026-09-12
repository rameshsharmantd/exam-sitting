import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const FALLBACK_PROJECT_ID = 'pkshcgdjjgijjkhijghf';
export const FALLBACK_SUPABASE_URL = 'https://pkshcgdjjgijjkhijghf.supabase.co';
export const FALLBACK_ANON_KEY = 'sb_publishable_8sANNl5sr1WbTkn9n8QCjg_C6LgtYYT';

/**
 * Robustly normalizes and validates a Supabase URL to guarantee HTTP/HTTPS compliance
 */
export const normalizeSupabaseUrl = (inputUrl?: string, projectId?: string): string => {
  let url = (inputUrl || '').trim();

  // If URL is empty, derive from projectId if available
  if (!url) {
    const cleanId = (projectId || '').trim();
    if (cleanId) {
      return `https://${cleanId}.supabase.co`;
    }
    return FALLBACK_SUPABASE_URL;
  }

  // Remove any quotes, whitespace, or accidental formatting
  url = url.replace(/['"]+/g, '').trim();

  // If user only provided a project ID instead of a full URL
  if (!url.includes('.') && !url.includes('/')) {
    return `https://${url}.supabase.co`;
  }

  // Ensure valid HTTP or HTTPS protocol
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Remove trailing slashes
  url = url.replace(/\/+$/, '').trim();

  // Validate with URL constructor
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.origin;
    }
  } catch (e) {
    console.warn(`[SupabaseClient] Malformed URL '${inputUrl}', falling back to default.`, e);
  }

  return FALLBACK_SUPABASE_URL;
};

export interface SupabaseConfig {
  projectId: string;
  url: string;
  anonKey: string;
}

// Default Supabase configuration
export const DEFAULT_SUPABASE_CONFIG: SupabaseConfig = {
  projectId: FALLBACK_PROJECT_ID,
  url: normalizeSupabaseUrl(
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL
      ? import.meta.env.VITE_SUPABASE_URL
      : FALLBACK_SUPABASE_URL,
    FALLBACK_PROJECT_ID
  ),
  anonKey:
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY
      ? (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim() || FALLBACK_ANON_KEY
      : FALLBACK_ANON_KEY
};

const STORAGE_KEY = 'sm_supabase_credentials';

export const normalizeSupabaseConfig = (cfg: Partial<SupabaseConfig>): SupabaseConfig => {
  const projectId = (cfg.projectId || '').trim() || FALLBACK_PROJECT_ID;
  const url = normalizeSupabaseUrl(cfg.url, projectId);
  const anonKey = (cfg.anonKey || '').trim() || FALLBACK_ANON_KEY;

  return {
    projectId,
    url,
    anonKey
  };
};

export const getStoredSupabaseConfig = (): SupabaseConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        const normalized = normalizeSupabaseConfig(parsed);
        // Save cleaned version back to prevent persistent bad state
        saveStoredSupabaseConfig(normalized);
        return normalized;
      }
    }
  } catch (e) {
    console.warn('Error reading Supabase config from storage:', e);
  }
  return DEFAULT_SUPABASE_CONFIG;
};

export const saveStoredSupabaseConfig = (config: SupabaseConfig) => {
  try {
    const normalized = normalizeSupabaseConfig(config);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch (e) {
    console.error('Error saving Supabase config to storage:', e);
  }
};

export const clearStoredSupabaseConfig = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    currentConfig = DEFAULT_SUPABASE_CONFIG;
    clientInstance = null;
  } catch (e) {
    console.error('Error clearing Supabase config:', e);
  }
};

let clientInstance: SupabaseClient | null = null;
let currentConfig: SupabaseConfig = getStoredSupabaseConfig();

export const getSupabaseClient = (customConfig?: SupabaseConfig): SupabaseClient => {
  if (customConfig) {
    const safeConfig = normalizeSupabaseConfig(customConfig);
    currentConfig = safeConfig;
    saveStoredSupabaseConfig(safeConfig);

    try {
      clientInstance = createClient(safeConfig.url, safeConfig.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      return clientInstance;
    } catch (err) {
      console.error('[SupabaseClient] Error initializing with custom config, falling back:', err);
      // Fallback to default
      currentConfig = DEFAULT_SUPABASE_CONFIG;
      clientInstance = createClient(DEFAULT_SUPABASE_CONFIG.url, DEFAULT_SUPABASE_CONFIG.anonKey);
      return clientInstance;
    }
  }

  if (!clientInstance) {
    currentConfig = getStoredSupabaseConfig();
    try {
      clientInstance = createClient(currentConfig.url, currentConfig.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    } catch (err) {
      console.error('[SupabaseClient] Error initializing stored config, resetting to default:', err);
      currentConfig = DEFAULT_SUPABASE_CONFIG;
      clientInstance = createClient(DEFAULT_SUPABASE_CONFIG.url, DEFAULT_SUPABASE_CONFIG.anonKey);
    }
  }

  return clientInstance;
};

export const getCurrentSupabaseConfig = (): SupabaseConfig => currentConfig;

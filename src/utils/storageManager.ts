/**
 * SHUDDHO CLINICAL INFORMATICS ARCHITECTURE
 * Safe Storage Manager with Write-Back Verification & Quota Resilience
 * 
 * Complies with Section 6.2 & Section 11 of Step 01 specifications:
 * - Performs atomic write-back verification to prevent silent persistence failures.
 * - Handles quota exceeded errors gracefully without throwing unhandled exceptions.
 * - Safe for client-side execution with SSR safety checks.
 */

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const safeStorage = {
  /**
   * Stores an item with immediate write-back verification.
   * Returns true only when write is confirmed on disk/browser storage.
   */
  setItem(key: string, value: any): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      window.localStorage.setItem(key, serialized);

      // Write-back verification
      const verify = window.localStorage.getItem(key);
      if (verify === null || verify !== serialized) {
        console.error(`[SafeStorage] Write-back verification failed for key "${key}"`);
        return false;
      }

      return true;
    } catch (err: any) {
      const isQuota = err?.name === 'QuotaExceededError' || 
                      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                      err?.code === 22 || 
                      err?.code === 1014;

      if (isQuota) {
        console.warn(`[SafeStorage] Browser storage quota exceeded while saving key "${key}". Attempting non-clinical cleanup.`);
        // Try to clear ephemeral or non-critical keys
        try {
          const keysToPrune = Object.keys(window.localStorage).filter(k => 
            k.startsWith('shuddho_temp_') || k.startsWith('shuddho_cache_')
          );
          for (const k of keysToPrune) {
            window.localStorage.removeItem(k);
          }
        } catch (_) {}
      } else {
        console.error(`[SafeStorage] Storage write failure for key "${key}":`, err);
      }
      return false;
    }
  },

  /**
   * Safely retrieves and parses an item from storage.
   */
  getItem<T = any>(key: string): T | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    } catch (err) {
      console.error(`[SafeStorage] Storage read failure for key "${key}":`, err);
      return null;
    }
  },

  /**
   * Removes an item from storage.
   */
  removeItem(key: string): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error(`[SafeStorage] Storage remove failure for key "${key}":`, err);
      return false;
    }
  },

  /**
   * Checks whether a key exists in storage.
   */
  hasItem(key: string): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    return window.localStorage.getItem(key) !== null;
  }
};

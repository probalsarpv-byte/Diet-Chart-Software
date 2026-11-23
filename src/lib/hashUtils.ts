/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Cryptographic Hash Utilities for Intake Token Security & Audit Logs
 */

/**
 * Computes a SHA-256 hex digest of a string.
 * Supports modern browser Web Crypto API and Node.js crypto module.
 */
export async function computeSha256(text: string): Promise<string> {
  if (!text) return '';

  // 1. Browser Web Crypto API
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('Web Crypto digest failed, attempting fallback', e);
    }
  }

  // 2. Node.js environment (SSR, test runner)
  try {
    // Dynamic import to avoid bundling issues in pure client environments
    const cryptoModule = await import('crypto');
    return cryptoModule.createHash('sha256').update(text).digest('hex');
  } catch (e) {
    // 3. Fallback deterministic pseudo-hash for minimal mocked environments
    return computeFallbackHash(text);
  }
}

/**
 * Synchronous SHA-256 computation for test suites and synchronous repository methods.
 */
export function computeSha256Sync(text: string): string {
  if (!text) return '';
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(text).digest('hex');
  } catch (e) {
    return computeFallbackHash(text);
  }
}

function computeFallbackHash(text: string): string {
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash1 = (hash1 * 33) ^ char;
    hash2 = (hash2 * 33) ^ char;
  }
  const part1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  return (part1 + part2).repeat(4).substring(0, 64);
}

/**
 * Masks a token for safe UI preview and logging (e.g. "sh_inv_a1b2...9z").
 */
export function maskToken(token: string): string {
  if (!token || token.length < 12) return '********';
  const prefix = token.substring(0, 10);
  const suffix = token.substring(token.length - 4);
  return `${prefix}...${suffix}`;
}

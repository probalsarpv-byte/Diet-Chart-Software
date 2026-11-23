/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Cryptographic Hash & Token Utilities for Intake Security & Audit Logs
 * 
 * Invariants:
 * 1. Cryptographically secure 256-bit entropy for tokens.
 * 2. Fail-closed: Never fallback to Math.random() or noncryptographic hashes.
 * 3. Supports Web Crypto API (browser) and Node.js crypto module (SSR / test runner).
 */

/**
 * Generates a cryptographically secure 256-bit random intake token.
 * Output format: 'sh_inv_' + 64 hex characters (32 random bytes = 256 bits entropy).
 * Fails closed if no cryptographically secure PRNG is available.
 */
export function generateSecureIntakeToken(prefix: string = 'sh_inv_'): string {
  const bytes = new Uint8Array(32); // 256 bits

  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodeCrypto = require('crypto');
      const buf = nodeCrypto.randomBytes(32);
      bytes.set(buf);
    } catch (err) {
      throw new Error('Cryptographic failure: No secure random source available. Token generation aborted.');
    }
  }

  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}${hex}`;
}

/**
 * Computes a SHA-256 hex digest of a string.
 * Supports modern browser Web Crypto API and Node.js crypto module.
 * Fails closed if secure cryptographic hash computation cannot be performed.
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
      console.warn('Web Crypto digest failed, attempting Node crypto fallback', e);
    }
  }

  // 2. Node.js environment (SSR, test runner)
  try {
    const cryptoModule = await import('crypto');
    return cryptoModule.createHash('sha256').update(text).digest('hex');
  } catch (e) {
    throw new Error('Cryptographic failure: SHA-256 computation failed and secure hash provider is unavailable.');
  }
}

/**
 * Synchronous SHA-256 computation for test suites and synchronous repository methods.
 * Fails closed if secure crypto provider is unavailable.
 */
export function computeSha256Sync(text: string): string {
  if (!text) return '';
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(text).digest('hex');
  } catch (e) {
    throw new Error('Cryptographic failure: Synchronous SHA-256 computation failed.');
  }
}

/**
 * Masks a token for safe UI preview and logging (e.g. "sh_inv_a1b2...9z").
 * Never exposes full bearer token in logs or UI.
 */
export function maskToken(token: string): string {
  if (!token || token.length < 12) return '********';
  const prefix = token.substring(0, 10);
  const suffix = token.substring(token.length - 4);
  return `${prefix}...${suffix}`;
}

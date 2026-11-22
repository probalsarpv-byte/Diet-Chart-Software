/**
 * SHUDDHO Clinical Functional Nutrition Platform
 * Repository Factory
 * Dynamically selects SupabasePracticeRepository when credentials exist,
 * or gracefully falls back to LocalDemoRepository for standalone/offline runs.
 */

import { IPracticeRepository } from './types';
import { LocalDemoRepository } from './LocalDemoRepository';
import { SupabasePracticeRepository } from './SupabasePracticeRepository';
import { isSupabaseConfigured, getSupabaseClient } from '@/lib/supabaseClient';

let repositoryInstance: IPracticeRepository | null = null;

export function getPracticeRepository(forceDemo: boolean = false): IPracticeRepository {
  if (forceDemo) {
    return new LocalDemoRepository();
  }

  if (!repositoryInstance) {
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        repositoryInstance = new SupabasePracticeRepository(client);
      } else {
        repositoryInstance = new LocalDemoRepository();
      }
    } else {
      repositoryInstance = new LocalDemoRepository();
    }
  }

  return repositoryInstance;
}

export * from './types';
export * from './LocalDemoRepository';
export * from './SupabasePracticeRepository';

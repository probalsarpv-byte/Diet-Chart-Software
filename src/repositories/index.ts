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
let currentBoundOrgId: string | undefined = undefined;

export function getPracticeRepository(forceDemo: boolean = false, organizationId?: string): IPracticeRepository {
  if (forceDemo) {
    return new LocalDemoRepository();
  }

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      if (!repositoryInstance || (organizationId && organizationId !== currentBoundOrgId)) {
        repositoryInstance = new SupabasePracticeRepository(client, organizationId);
        currentBoundOrgId = organizationId;
      }
      return repositoryInstance;
    }
  }

  if (!repositoryInstance) {
    repositoryInstance = new LocalDemoRepository();
  }
  return repositoryInstance;
}

export function resetPracticeRepository(): void {
  repositoryInstance = null;
  currentBoundOrgId = undefined;
}

export * from './types';
export * from './LocalDemoRepository';
export * from './SupabasePracticeRepository';

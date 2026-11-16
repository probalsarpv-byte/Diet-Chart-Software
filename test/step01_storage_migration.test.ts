/**
 * TASK 8 & 9: STORAGE MANAGER & IDEMPOTENT MIGRATION TESTS
 */

import { migratePatientRecord } from '../src/utils/legacyMigration';
import { safeStorage } from '../src/utils/storageManager';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`\x1b[31m  ✗ FAIL: ${message}\x1b[0m`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`\x1b[32m  ✓ PASS: ${message}\x1b[0m`);
}

console.log("\n=====================================================================");
console.log("TASKS 8 & 9: STORAGE MANAGER & LEGACY MIGRATION TESTS");
console.log("=====================================================================\n");

// Mock localStorage in Node environment
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    for (const k in store) delete store[k];
  }
};
(globalThis as any).localStorage = mockLocalStorage;
(globalThis as any).window = globalThis;

// 1. Storage Manager Write-Back Verification
console.log("1. Storage Manager Operations");
const testKey = 'test_shuddho_data';
const testPayload = { patientId: 'pt_test_01', visitId: 'vis_test_01', status: 'active' };

const saveSuccess = safeStorage.setItem(testKey, testPayload);
assert(saveSuccess === true, "Storage write-back succeeded and verified");

const loaded = safeStorage.getItem<typeof testPayload>(testKey);
assert(loaded !== null && loaded.patientId === 'pt_test_01', "Storage read verified loaded payload");

safeStorage.removeItem(testKey);
assert(safeStorage.getItem(testKey) === null, "Storage item successfully removed");

// 2. Storage Quota Exceeded Handling
console.log("\n2. Storage Quota Handling");
const originalSetItem = mockLocalStorage.setItem;
mockLocalStorage.setItem = () => {
  const err = new Error("QuotaExceededError");
  err.name = "QuotaExceededError";
  throw err;
};

const quotaResult = safeStorage.setItem('overflow_key', { data: 'large' });
assert(quotaResult === false, "Storage gracefully handles QuotaExceededError without throwing");

// Restore normal setItem
mockLocalStorage.setItem = originalSetItem;

// 3. Idempotent Legacy Migration
console.log("\n3. Idempotent Legacy Migration");
const legacyRaw = {
  patient: {
    id: 'pt_legacy_001',
    name: 'Old Record Patient',
    age: 45,
    gender: 'male',
    current_visit_id: 'vis_001'
  },
  clinical_visits: [
    { id: 'vis_001', visit_date: '2025-10-10', visit_type: 'baseline_consultation' }
  ],
  visit_snapshots: [
    {
      visit_id: 'vis_001',
      anthropometrics: { weight_kg: 74, height_cm: 172 }
    }
  ]
};

const migrated1 = migratePatientRecord(legacyRaw);
assert(migrated1.schema_version === 2, "Migrated record has schema_version 2");
assert(migrated1.clinical_visits![0].visit_id === 'vis_001', "Clinical visit has visit_id populated from id");
assert(migrated1.clinical_visits![0].patient_id === 'pt_legacy_001', "Clinical visit references correct patient_id");
assert(Boolean(migrated1.visit_snapshots![0].snapshot_id), "Snapshot received stable snapshot_id");
assert(migrated1.visit_snapshots![0].patient_id === 'pt_legacy_001', "Snapshot references patient_id");
assert(migrated1.visit_snapshots![0].revision === 1, "Snapshot revision initialized to 1");
assert(migrated1.visit_snapshots![0].approval_status === 'draft', "Snapshot default status is draft");

// Verify Idempotency: Running migration again must not change IDs, timestamps, or revisions
const migrated2 = migratePatientRecord(migrated1);
assert(migrated2.schema_version === migrated1.schema_version, "Idempotent: schema_version identical");
assert(migrated2.visit_snapshots![0].snapshot_id === migrated1.visit_snapshots![0].snapshot_id, "Idempotent: snapshot_id identical");
assert(migrated2.visit_snapshots![0].revision === migrated1.visit_snapshots![0].revision, "Idempotent: revision unchanged");
assert(migrated2.clinical_visits![0].visit_id === migrated1.clinical_visits![0].visit_id, "Idempotent: visit_id unchanged");

console.log("\nALL STORAGE & MIGRATION TESTS PASSED!\n");

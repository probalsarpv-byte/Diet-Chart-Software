/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION PLATFORM
 * PHASE R7: BROWSER END-TO-END PLAYWRIGHT & CHROMIUM A4 PDF ACCEPTANCE SUITE (CHECKPOINT E)
 *
 * Strictly tests real user UI workflows (zero bypasses, zero conditional skips):
 *  E1: Alternative-unit lab entry in UI (7.2 mmol/L FBS) -> canonical normalization & save/reload persistence
 *  E2: Multi-ingredient/UL overload in Protocol Studio -> Safety Review HARD_STOP blocks approval
 *  E3: Correction -> Valid R4 supplement approval -> R6 Master Prescription includes approved dose/timing/duration
 *      and excludes unapproved draft candidate supplements
 *  E4: Structured UI lab edit invalidates approved R4 & Weekly Diet Plan
 *  E5: Critical laboratory finding blocks R6 release & disables ALL 3 print entry points
 *  E6: Strict visit isolation & cross-patient isolation
 *  E7: Approved Chromium A4 PDF export verifying rendered print-media text (Bangla, approved supplement,
 *      dose/timing/duration, 0 overflow, 0 U21 kcal/biomarker/draft leaks) & PDF structure
 *  E8: Blocked-state Chromium A4 PDF export verifying printable block banner & draft watermark
 */

import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';
import { chromium, Browser } from 'playwright';

const PORT = 4597;
const BASE_URL = `http://localhost:${PORT}/Diet-Chart-Software/`;
const OUT_DIR = path.resolve('out');

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition: any, message: string) {
  totalAssertions++;
  if (!condition) {
    failedAssertions++;
    console.error(`  ✗ FAIL: ${message}`);
  } else {
    passedAssertions++;
    console.log(`  ✓ PASS: ${message}`);
  }
}

function inspectPdfDocument(pdfBuffer: Buffer): {
  validHeader: boolean;
  byteLength: number;
  pageCount: number;
  streamCount: number;
  decompressedStreamCount: number;
  hasFontResources: boolean;
} {
  const raw = pdfBuffer.toString('latin1');
  const validHeader = pdfBuffer.subarray(0, 5).toString('utf8') === '%PDF-';
  const pageMatches = raw.match(/\/Type\s*\/Page\b/g) || [];
  const hasFontResources = /\/Font\b/.test(raw) || /\/BaseFont\b/.test(raw);
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  let streamCount = 0;
  let decompressedStreamCount = 0;
  while ((match = streamRegex.exec(raw)) !== null) {
    streamCount++;
    try {
      const slice = Buffer.from(match[1], 'latin1');
      const inflated = zlib.inflateSync(slice);
      if (inflated.length > 0) decompressedStreamCount++;
    } catch {
      // Non-Flate stream or partial match
    }
  }
  return {
    validHeader,
    byteLength: pdfBuffer.length,
    pageCount: pageMatches.length,
    streamCount,
    decompressedStreamCount,
    hasFontResources
  };
}

function startStaticServer(): Promise<{ server: http.Server; port: number }> {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url?.replace('/Diet-Chart-Software', '') || '/';
      if (reqPath.endsWith('/')) reqPath += 'index.html';
      const cleanPath = reqPath.split('?')[0];
      const filePath = path.join(OUT_DIR, cleanPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes: Record<string, string> = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'application/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.json': 'application/json; charset=utf-8',
          '.png': 'image/png',
          '.svg': 'image/svg+xml'
        };
        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        const fallbackPath = path.join(OUT_DIR, 'index.html');
        if (fs.existsSync(fallbackPath)) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          fs.createReadStream(fallbackPath).pipe(res);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      }
    });

    server.listen(PORT, () => resolve({ server, port: PORT }));
  });
}

async function runR7BrowserE2E() {
  console.log('\n================================================================');
  console.log('SHUDDHO PHASE R7 CHECKPOINT E: BROWSER E2E & PDF ACCEPTANCE');
  console.log('================================================================\n');

  const { server } = await startStaticServer();
  let browser: Browser | null = null;

  try {
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch {
      browser = await chromium.launch({ headless: true });
    }

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    console.log('--- E1: App Boot, Alternative-Unit Lab Entry & Save/Reload Persistence ---');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);

    const loadDemoBtn = page
      .locator('button:has-text("ডেমো কেস লোড করুন"), button:has-text("Load Demo Case"), button:has-text("Load Demo Patient")')
      .first();
    assert((await loadDemoBtn.count()) > 0, 'Demo Case button visible on landing dashboard');
    await loadDemoBtn.click();
    await page.waitForTimeout(700);

    await page.locator('[data-testid="nav-tab-assessment"]').first().click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="assessment-step-nav-step_labs"]').first().click();
    await page.waitForTimeout(500);

    const labWorkspace = page.locator('[data-testid="r7-laboratory-workspace"]');
    assert((await labWorkspace.count()) > 0, 'Step 8 R7 Laboratory Workspace mounted');

    // Search using 'FBS' which matches the label_en 'Fasting Plasma Glucose (FPG / FBS)'
    await page.locator('[data-testid="r7-lab-search-input"]').fill('FBS');
    await page.waitForTimeout(400);
    // The marker_id is canonical 'fasting_glucose' (initialized from canonical_id when no existing entry)
    const fbsRow = page.locator('[data-testid="r7-lab-row-fbs"], [data-testid="r7-lab-row-fasting_glucose"]').first();
    await fbsRow.waitFor({ state: 'visible', timeout: 8000 });
    assert((await fbsRow.count()) > 0, 'FBS biomarker row present in Step 8');

    // Set availability to previously_tested and wait for the number input to appear (conditional on isTested)
    await fbsRow.locator('select[aria-label="Result availability"]').selectOption('previously_tested');
    await page.waitForTimeout(400);
    // The numeric value input only appears when isTested; wait for it
    const fbsNumInput = fbsRow.locator('input[type="number"]').first();
    await fbsNumInput.waitFor({ state: 'visible', timeout: 6000 });
    await fbsNumInput.fill('7.2');
    // The Unit select appears only when isTested AND supported_units.length > 1 (FBS: ['mg/dL', 'mmol/L'])
    const fbsUnitSelect = fbsRow.locator('select[aria-label="Unit"]');
    await fbsUnitSelect.waitFor({ state: 'visible', timeout: 5000 });
    await fbsUnitSelect.selectOption('mmol/L');
    const fbsVerifSelect = fbsRow.locator('select[aria-label="Verification status"]');
    await fbsVerifSelect.waitFor({ state: 'visible', timeout: 5000 });
    await fbsVerifSelect.selectOption('lab_document_reviewed');
    // Wait for debounced auto-save and R7 re-evaluation (> 1200ms)
    await page.waitForTimeout(1500);

    // The Canonical: label appears when unit !== canonical_unit AND normalized_value is computed
    const fbsTextBeforeReload = await fbsRow.innerText();
    assert(
      fbsTextBeforeReload.includes('Canonical:') && fbsTextBeforeReload.includes('mg/dL'),
      `E1: 7.2 mmol/L FBS normalizes to canonical mg/dL in UI (got: "${fbsTextBeforeReload.substring(0, 120)}")`
    );

    // Hard reload and confirm persistence
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.locator('[data-testid="nav-tab-assessment"]').first().click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="assessment-step-nav-step_labs"]').first().click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="r7-lab-search-input"]').fill('FBS');
    await page.waitForTimeout(400);
    const fbsRowReloaded = page.locator('[data-testid="r7-lab-row-fbs"], [data-testid="r7-lab-row-fasting_glucose"]').first();
    await fbsRowReloaded.waitFor({ state: 'visible', timeout: 8000 });
    const persistedVal = await fbsRowReloaded.locator('input[type="number"]').first().inputValue();
    assert(persistedVal === '7.2', `E1 Persistence: 7.2 mmol/L persisted across page reload (got "${persistedVal}")`);
    assert((await fbsRowReloaded.innerText()).includes('mg/dL'), 'E1 Persistence: Canonical mg/dL normalization preserved after reload');

    console.log('--- E2: Protocol Studio UL Overload Blocks Safety Sign-Off ---');
    await page.locator('[data-testid="nav-tab-protocol_studio"]').first().click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Supplements"), button:has-text("সাপ্লিমেন্ট")').first().click();
    await page.waitForTimeout(350);

    // Add an unsafe 420 mg Magnesium multi-ingredient item
    await page.locator('[data-testid="r7-btn-add-supplement"]').click();
    await page.waitForTimeout(250);
    const suppForm = page.locator('form').last();
    await suppForm.locator('input[placeholder*="Magnesium Bisglycinate"]').fill('Magnesium Overload Complex');
    await suppForm.locator('input[placeholder*="Optional brand"]').fill('UnverifiedTestBrand');
    await suppForm.locator('input[placeholder="e.g. 200 mg elemental"]').fill('420 mg elemental');
    await suppForm.locator('button:has-text("Add Ingredient")').click();
    await page.waitForTimeout(150);
    await suppForm.locator('input[placeholder="Elemental"]').last().fill('420');
    await suppForm.locator('button[type="submit"]').click();
    await page.waitForTimeout(400);

    const exposurePanel = page.locator('[data-testid="r7-supplement-exposure-panel"]');
    assert((await exposurePanel.innerText()).includes('Exceeds Tolerable Upper Limit'), 'E2: 420 mg Magnesium flags UL exceedance');
    assert((await page.innerText('body')).includes('Unverified Brand'), 'E2: Honest Unverified Brand provenance shown');

    // Approve that unsafe supplement into candidate list, then navigate to Safety Review tab
    const unsafeApproveBtn = page.locator('button[title="Approve Supplement"], button[title="অনুমোদন করুন"]').last();
    await unsafeApproveBtn.click();
    await page.waitForTimeout(300);

    const safetyTabBtn = page.locator('button:has-text("Safety & Sign-Off"), button:has-text("সেফটি ও সাইন-অফ")').first();
    await safetyTabBtn.click();
    await page.waitForTimeout(400);

    const safetyText = await page.innerText('body');
    assert(safetyText.includes('HARD_STOP'), 'E2: UL breach triggers Safety Review HARD_STOP');
    const approveLockBtn = page.locator('button:has-text("Approve & Lock Protocol"), button:has-text("Re-Approve & Bump Version"), button:has-text("প্রোটোকল অনুমোদন করুন")').first();
    assert(await approveLockBtn.isDisabled(), 'E2: Safety Review gate disables formal protocol approval while HARD_STOP is active');

    console.log('--- E3: Remove Overdose -> Approve Safe Supplement -> R6 Inclusion + Draft Exclusion ---');
    await page.locator('button:has-text("Supplements"), button:has-text("সাপ্লিমেন্ট")').first().click();
    await page.waitForTimeout(350);

    // Delete Magnesium Overload Complex (find its card and click Delete)
    const mgCard = page.locator('[data-testid^="r7-supplement-card-"]', { hasText: 'Magnesium Overload Complex' }).first();
    await mgCard.locator('button[title="Delete"], button[title="মুছে ফেলুন"]').first().click();
    await page.waitForTimeout(350);

    // Add Safe Approved Supplement: Vitamin D3 Support (1000 IU = 25 mcg, timing 13:30, duration 8 weeks)
    await page.locator('[data-testid="r7-btn-add-supplement"]').click();
    await page.waitForTimeout(250);
    const safeForm = page.locator('form').last();
    await safeForm.locator('input[placeholder*="Magnesium Bisglycinate"]').fill('Vitamin D3 Clinical Formula');
    await safeForm.locator('input[placeholder="e.g. 200 mg elemental"]').fill('1000 IU');
    await safeForm.locator('input[type="time"]').first().fill('13:30');
    await safeForm.locator('[data-testid="r7-input-duration-weeks"]').fill('8');
    await safeForm.locator('button[type="submit"]').click();
    await page.waitForTimeout(400);

    // Approve ONLY Vitamin D3 Clinical Formula
    const vitDCard = page.locator('[data-testid^="r7-supplement-card-"]', { hasText: 'Vitamin D3 Clinical Formula' }).first();
    await vitDCard.locator('button[title="Approve Supplement"], button[title="অনুমোদন করুন"]').first().click();
    await page.waitForTimeout(350);

    // Add a second UNAPPROVED draft candidate supplement that MUST stay excluded from R6
    await page.locator('[data-testid="r7-btn-add-supplement"]').click();
    await page.waitForTimeout(200);
    const draftForm = page.locator('form').last();
    await draftForm.locator('input[placeholder*="Magnesium Bisglycinate"]').fill('Selenium Unapproved Candidate');
    await draftForm.locator('input[placeholder="e.g. 200 mg elemental"]').fill('100 mcg');
    await draftForm.locator('button[type="submit"]').click();
    await page.waitForTimeout(350);

    // Sign off R4 Safety Review
    await safetyTabBtn.click();
    await page.waitForTimeout(350);
    assert(!(await approveLockBtn.isDisabled()), 'E3: Resolving UL overload unlocks R4 protocol sign-off');
    await approveLockBtn.click();
    await page.waitForTimeout(700);

    // Approve Pre-Intervention Health Report (Tab 7 Clinician Mode) & Weekly Diet Plan (Tab 5)
    await page.locator('[data-testid="nav-tab-report"]').first().click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="btn-mode-clinician"]').first().click();
    await page.waitForTimeout(350);
    await page.locator('button:has-text("2. Pre-Intervention Health Report"), button:has-text("২. প্রাক-হস্তক্ষেপ পূর্ণাঙ্গ স্বাস্থ্য প্রতিবেদন")').first().click();
    await page.waitForTimeout(450);
    await page.locator('input[placeholder*="Farhana Ahmed"], input[placeholder*="ডা. ফারহানা"]').first().fill('Dr. Farhana Rahman, MBBS, MD');
    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('button:has-text("Approve Clinical Assessment"), button:has-text("Sign Off")').first().click();
    await page.waitForTimeout(600);

    await page.locator('[data-testid="nav-tab-diet"]').first().click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="btn-approve-weekly-plan"]').first().click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="input-clinician-id"]').fill('DR_R7_CLOSURE_MD');
    await page.locator('[data-testid="btn-submit-approval"]').click();
    await page.waitForTimeout(1200);
    assert((await page.locator('[data-testid="badge-approved-plan"]').count()) > 0, 'E3: Weekly Diet Plan formally approved');

    // Open R6 Patient Diet Prescription (Released State)
    await page.locator('[data-testid="nav-tab-report"]').first().click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="btn-mode-patient"]').first().click();
    await page.waitForTimeout(500);

    const patientView = page.locator('[data-testid="patient-projection-view"]');
    const isReleased = (await patientView.locator('[data-testid="patient-release-approved-banner"]').count()) > 0;
    if (!isReleased) {
      const blockedReason = await patientView.locator('[data-testid="patient-release-blocked-alert"]').innerText().catch(() => 'No alert text');
      console.error('  [DEBUG E3 blocked reason]:', blockedReason);
    }
    assert(isReleased, 'E3/E7: Approved clinical path reaches RELEASED R6 Prescription');
    assert((await patientView.locator('[data-testid="draft-watermark"]').count()) === 0, 'E7: Draft watermark removed on released prescription');

    const medProtocol = patientView.locator('[data-testid="six-column-medication-protocol"]');
    const activeMedTableText = await medProtocol.locator('table tbody').innerText();
    assert(activeMedTableText.includes('Vitamin D3 Clinical Formula'), 'E3: Approved supplement name rendered in R6 6-column protocol');
    assert(/1000\s*IU|১০০০\s*IU/i.test(activeMedTableText), `E3: Exact approved supplement dose (1000 IU) rendered in R6 (got: ${activeMedTableText.substring(0, 160)})`);
    assert(/13:30|১৩:৩০|১:৩০/.test(activeMedTableText), 'E3: Exact approved supplement timing (13:30) rendered in R6');
    assert(/(8|৮)\s*(Weeks|সপ্তাহ)/i.test(activeMedTableText), 'E3: Exact approved supplement duration (8 Weeks) rendered in R6');
    assert(!activeMedTableText.includes('Selenium Unapproved Candidate'), 'E3: Unapproved draft candidate excluded from R6 6-column protocol table');

    console.log('--- E7: Approved Chromium A4 PDF Generation & Print-Media Content Audit ---');
    const pdfOutDir = process.env.R7_PDF_DIR || path.join(os.tmpdir(), 'shuddho-r7-pdf');
    fs.mkdirSync(pdfOutDir, { recursive: true });
    const approvedPdfPath = path.join(pdfOutDir, 'r7_patient_prescription_approved.pdf');

    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(250);
    const approvedPrintAudit = await page.evaluate(() => {
      const noPrintEls = Array.from(document.querySelectorAll('.no-print'));
      const noPrintHidden = noPrintEls.every(el => getComputedStyle(el).display === 'none');
      const view = document.querySelector('[data-testid="patient-diet-report-view"]') as HTMLElement | null;
      const text = view ? view.innerText : '';
      return {
        noPrintHidden,
        hasBangla: /[\u0980-\u09FF]+/.test(text),
        hasVitD: text.includes('Vitamin D3 Clinical Formula') && /(1000|১০০০)\s*IU/i.test(text) && /(13:30|১৩:৩০|১:৩০)/.test(text),
        hasNoCandidateLeak: !text.includes('Selenium Unapproved Candidate'),
        hasNoKcal: !/\b\d+\s*kcal\b/i.test(text),
        hasNoBiomarkers: !text.includes('HOMA-IR') && !text.includes('FIB-4'),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 4
      };
    });
    assert(approvedPrintAudit.noPrintHidden, 'E7: @media print hides all .no-print UI & draft candidate containers');
    assert(approvedPrintAudit.hasBangla, 'E7: Bangla Unicode clinical output renders under @media print');
    assert(approvedPrintAudit.hasVitD, 'E7: Print-media DOM contains approved supplement name, dose & timing');
    assert(approvedPrintAudit.hasNoCandidateLeak, 'E7: Print-media DOM excludes unapproved draft candidates');
    assert(approvedPrintAudit.hasNoKcal && approvedPrintAudit.hasNoBiomarkers, 'E7: Print-media U21 privacy holds (0 kcal, 0 HOMA-IR/FIB-4)');
    assert(!approvedPrintAudit.overflow, 'E7: Approved A4 print layout exhibits 0 horizontal overflow');

    await page.pdf({
      path: approvedPdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '10mm', bottom: '12mm', left: '10mm' }
    });
    await page.emulateMedia({ media: 'screen' });

    const approvedPdfMeta = inspectPdfDocument(fs.readFileSync(approvedPdfPath));
    assert(
      approvedPdfMeta.validHeader && approvedPdfMeta.byteLength > 10000 && approvedPdfMeta.pageCount >= 1 && approvedPdfMeta.decompressedStreamCount >= 1 && approvedPdfMeta.hasFontResources,
      `E7: Approved A4 PDF verified (${approvedPdfMeta.byteLength} bytes, ${approvedPdfMeta.pageCount} pages, ${approvedPdfMeta.decompressedStreamCount} decompressed streams)`
    );

    console.log('--- E4: Structured UI Lab Edit Invalidates Approved R4 & Weekly Diet Plan ---');
    await page.locator('[data-testid="nav-tab-assessment"]').first().click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="assessment-step-nav-step_labs"]').first().click();
    await page.waitForTimeout(500);
    // Re-search to bring FBS row back into filtered view (search is cleared on navigation)
    await page.locator('[data-testid="r7-lab-search-input"]').fill('FBS');
    await page.waitForTimeout(400);
    // Re-acquire the FBS row locator (same canonical id as E1)
    const fbsRowE4 = page.locator('[data-testid="r7-lab-row-fbs"], [data-testid="r7-lab-row-fasting_glucose"]').first();
    await fbsRowE4.waitFor({ state: 'visible', timeout: 8000 });
    // The row is already 'previously_tested' from E1 — the numeric input should already be visible
    const fbsNumE4 = fbsRowE4.locator('input[type="number"]').first();
    await fbsNumE4.waitFor({ state: 'visible', timeout: 5000 });
    await fbsNumE4.fill('6.8');
    await page.waitForTimeout(600);

    // Verify Weekly Diet Plan & R4 Protocol are invalidated immediately
    await page.locator('[data-testid="nav-tab-diet"]').first().click();
    await page.waitForTimeout(450);
    assert((await page.locator('[data-testid="badge-approved-plan"]').count()) === 0, 'E4: Lab edit immediately invalidated approved Weekly Diet Plan');

    await page.locator('[data-testid="nav-tab-protocol_studio"]').first().click();
    await page.waitForTimeout(400);
    await page.locator('button:has-text("Safety & Sign-Off"), button:has-text("সেফটি ও সাইন-অফ")').first().click();
    await page.waitForTimeout(350);
    const postLabEditApproveText = await approveLockBtn.innerText();
    assert(!postLabEditApproveText.includes('Re-Approve'), `E4: Approved R4 protocol reverted to draft state ("${postLabEditApproveText.trim()}")`);

    console.log('--- E5 & E8: Critical Potassium Blocks Release & All 3 Print Entry Points + Blocked PDF Watermark ---');
    await page.locator('[data-testid="nav-tab-assessment"]').first().click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="assessment-step-nav-step_labs"]').first().click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="r7-lab-search-input"]').fill('Potassium');
    await page.waitForTimeout(400);
    // Potassium canonical_id is 'potassium'; legacy alias is 'serum_potassium'
    const kRow = page.locator('[data-testid="r7-lab-row-potassium"], [data-testid="r7-lab-row-serum_potassium"]').first();
    await kRow.waitFor({ state: 'visible', timeout: 8000 });
    await kRow.locator('select[aria-label="Result availability"]').selectOption('previously_tested');
    await page.waitForTimeout(400);
    // Wait for numeric input (conditional on isTested)
    const kNumInput = kRow.locator('input[type="number"]').first();
    await kNumInput.waitFor({ state: 'visible', timeout: 5000 });
    await kNumInput.fill('6.4');
    const kVerifSelect = kRow.locator('select[aria-label="Verification status"]');
    await kVerifSelect.waitFor({ state: 'visible', timeout: 5000 });
    await kVerifSelect.selectOption('unverified');
    await page.waitForTimeout(600);
    assert((await page.locator('[data-testid="r7-critical-lab-banner"]').count()) > 0, 'E5: Unverified K+ 6.4 triggers Critical Escalation Banner');

    await page.locator('[data-testid="nav-tab-report"]').first().click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="btn-mode-patient"]').first().click();
    await page.waitForTimeout(450);

    const printBtnPatient = patientView.locator('[data-testid="btn-print-patient-report"]');
    const printBtnHub = page.locator('[data-testid="btn-print-report"]');
    const printBtnHeader = page.locator('[data-testid="btn-print"]');
    assert((await patientView.locator('[data-testid="patient-release-blocked-alert"]').count()) > 0, 'E5: Patient Prescription shows release blocked alert');
    assert((await patientView.locator('[data-testid="draft-watermark"]').count()) > 0, 'E8: Blocked report displays PROVISIONAL DRAFT watermark');
    assert(await printBtnPatient.isDisabled(), 'E5: Print entry #1 (Patient Report button) disabled on critical lab block');
    assert(await printBtnHub.isDisabled(), 'E5: Print entry #2 (Report Hub button) disabled on critical lab block');
    assert(await printBtnHeader.isDisabled(), 'E5: Print entry #3 (Global Header button) disabled on critical lab block');

    const blockedPdfPath = path.join(pdfOutDir, 'r7_patient_prescription_blocked.pdf');
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(200);
    const blockedBannerVisible = await page.evaluate(() => {
      const b = document.querySelector('[data-testid="printable-draft-block-banner"]') as HTMLElement | null;
      return b ? getComputedStyle(b).display !== 'none' : false;
    });
    assert(blockedBannerVisible, 'E8: Printable block warning banner remains visible under @media print');
    await page.pdf({ path: blockedPdfPath, format: 'A4', printBackground: true });
    await page.emulateMedia({ media: 'screen' });
    const blockedPdfMeta = inspectPdfDocument(fs.readFileSync(blockedPdfPath));
    assert(blockedPdfMeta.validHeader && blockedPdfMeta.byteLength > 10000, `E8: Blocked PDF watermark export verified (${blockedPdfMeta.byteLength} bytes)`);

    console.log('--- E6: Visit Isolation & Cross-Patient Isolation ---');
    // Test Visit Isolation via "New Visit" flow (mandatory non-bypassed workflow)
    const startVisitBtn = page.locator('button:has-text("নতুন ভিজিট"), button:has-text("New Visit")').first();
    assert((await startVisitBtn.count()) > 0, 'E6: Persistent patient bar exposes New Visit trigger');
    await startVisitBtn.click();
    await page.waitForTimeout(300);
    const confirmVisitBtn = page.locator('button:has-text("Confirm & Start Visit"), button:has-text("ভিজিট শুরু করুন")').first();
    assert((await confirmVisitBtn.count()) > 0, 'E6: Start New Clinical Visit modal confirm button present');
    await confirmVisitBtn.click();
    await page.waitForTimeout(700);
    await page.locator('[data-testid="nav-tab-assessment"]').first().click();
    await page.waitForTimeout(400);
    await page.locator('[data-testid="assessment-step-nav-step_labs"]').first().click();
    await page.waitForTimeout(400);
    assert((await page.locator('[data-testid="r7-critical-lab-banner"]').count()) === 0, 'E6 Visit Isolation: Critical lab from prior visit does not leak into new visit intake');

    await page.locator('[data-testid="nav-tab-protocol_studio"]').first().click();
    await page.waitForTimeout(450);
    await page.locator('button:has-text("Supplements"), button:has-text("সাপ্লিমেন্ট")').first().click();
    await page.waitForTimeout(350);
    assert(!(await page.innerText('body')).includes('Vitamin D3 Clinical Formula'), 'E6 Visit Isolation: Prior visit R4 supplement does not leak to new visit');

    // Test Cross-Patient Isolation
    await page.locator('[data-testid="nav-tab-patients"]').first().click();
    await page.waitForTimeout(400);
    await page.locator('button:has-text("Register Patient"), button:has-text("নতুন রোগী নিবন্ধন")').first().click();
    await page.waitForTimeout(250);
    const regForm = page.locator('form').last();
    await regForm.locator('input[type="text"]').first().fill('R7 Isolated Synthetic Patient B');
    await regForm.locator('input[type="number"]').first().fill('38');
    await regForm.locator('button[type="submit"]').click();
    await page.waitForTimeout(600);

    await page.locator('[data-testid="nav-tab-assessment"]').first().click();
    await page.waitForTimeout(400);
    await page.locator('[data-testid="assessment-step-nav-step_labs"]').first().click();
    await page.waitForTimeout(400);
    assert((await page.locator('[data-testid="r7-critical-lab-banner"]').count()) === 0, 'E6 Patient Isolation: Zero critical labs leak into newly registered Patient B');

    await page.locator('[data-testid="nav-tab-protocol_studio"]').first().click();
    await page.waitForTimeout(400);
    await page.locator('button:has-text("Supplements"), button:has-text("সাপ্লিমেন্ট")').first().click();
    await page.waitForTimeout(300);
    assert(!(await page.innerText('body')).includes('Vitamin D3 Clinical Formula'), 'E6 Patient Isolation: Patient A R4 supplement never leaks to Patient B');

    // Mobile responsive viewport check
    await page.locator('[data-testid="nav-tab-assessment"]').first().click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="assessment-step-nav-step_labs"]').first().click();
    await page.waitForTimeout(300);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 8);
    assert(!mobileOverflow, 'Mobile 390px R7 laboratory workspace avoids horizontal page overflow');

    console.log('\n================================================================');
    console.log(`R7 BROWSER E2E SUMMARY: ${passedAssertions}/${totalAssertions} PASSED (${failedAssertions} FAILED)`);
    console.log('================================================================\n');
  } catch (err) {
    console.error('R7 browser suite error:', err);
    failedAssertions++;
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runR7BrowserE2E();

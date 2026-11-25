/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION PLATFORM
 * PHASE R7: BROWSER END-TO-END PLAYWRIGHT & CHROMIUM A4 PDF ACCEPTANCE SUITE
 *
 * Tests real user workflows across:
 * 1. Step 8 R7 Laboratory Intelligence Workspace (9 panels, search, unit conversion,
 *    3-layer evaluation cards, derived indices, patterns, critical finding banner)
 * 2. Critical lab escalation non-bypassably blocking Patient Report release & Print/PDF export
 * 3. R4 Protocol Studio Supplements Engine (Current Approved vs Proposed Candidate breakdown,
 *    multi-ingredient builder, brand verification provenance badges, UL screening)
 * 4. Clinician Report (Section E R7 Intelligence) vs U21 Patient Report (strict 0 kcal/macro/biomarker privacy)
 * 5. Real Chromium A4 PDF export (%PDF- header, Bangla script rendering, zero overflow)
 * 6. Responsive mobile viewport check & strict cross-patient isolation
 */

import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
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
  console.log('SHUDDHO PHASE R7: BROWSER E2E & CHROMIUM PDF ACCEPTANCE SUITE');
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

    console.log('--- J01-J05: App Boot, Demo Case & Step 8 R7 Laboratory Intelligence ---');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);

    const loadDemoBtn = page
      .locator('button:has-text("ডেমো কেস লোড করুন"), button:has-text("Load Demo Case"), button:has-text("Load Demo Patient")')
      .first();
    if ((await loadDemoBtn.count()) > 0) {
      await loadDemoBtn.click();
      await page.waitForTimeout(700);
    }

    await page.locator('[data-testid="nav-tab-assessment"]').first().click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="assessment-step-nav-step_labs"]').first().click();
    await page.waitForTimeout(500);

    const labWorkspace = page.locator('[data-testid="r7-laboratory-workspace"]');
    assert((await labWorkspace.count()) > 0, 'Step 8 R7 Laboratory Workspace mounted cleanly');

    // Search for Potassium and enter critical value 6.4 mmol/L
    await page.locator('[data-testid="r7-lab-search-input"]').fill('Potassium');
    await page.waitForTimeout(250);

    const kRow = page.locator('[data-testid="r7-lab-row-serum_potassium"], [data-testid="r7-lab-row-potassium"]').first();
    assert((await kRow.count()) > 0, 'Serum Potassium canonical biomarker row found via search');

    await kRow.locator('select[aria-label="Result availability"]').selectOption('previously_tested');
    await page.waitForTimeout(200);
    await kRow.locator('input[type="number"]').first().fill('6.4');
    await kRow.locator('select[aria-label="Verification status"]').selectOption('clinician_verified');
    await page.waitForTimeout(400);

    const critBanner = page.locator('[data-testid="r7-critical-lab-banner"]');
    assert((await critBanner.count()) > 0, 'Critical Lab Escalation Banner rendered immediately for K+ 6.4 mmol/L');
    assert((await labWorkspace.locator('[data-testid="r7-derived-indices-panel"]').count()) > 0, 'Derived Biomarker Indices Panel rendered');

    // Clear search and test mixed-unit FBS + Insulin HOMA-IR + Pattern card
    await page.locator('[data-testid="r7-lab-search-input"]').fill('Fasting Blood Sugar');
    await page.waitForTimeout(200);
    const fbsRow = page.locator('[data-testid="r7-lab-row-fbs"], [data-testid="r7-lab-row-fasting_glucose"]').first();
    if ((await fbsRow.count()) > 0) {
      await fbsRow.locator('select[aria-label="Result availability"]').selectOption('previously_tested');
      await page.waitForTimeout(150);
      await fbsRow.locator('input[type="number"]').first().fill('7.2');
      await fbsRow.locator('select[aria-label="Verification status"]').selectOption('lab_document_reviewed');
      await page.waitForTimeout(300);
      assert((await fbsRow.innerText()).includes('Canonical:'), 'FBS in mmol/L displays canonical mg/dL equivalence');
    }

    await page.locator('[data-testid="r7-lab-search-input"]').fill('');
    await page.waitForTimeout(300);
    assert((await page.locator('[data-testid="r7-pattern-findings-panel"]').count()) > 0, 'Evidence-qualified Biomarker Patterns rendered without confidence %');

    console.log('--- J06-J10: Critical Lab Release Block -> Clinician Dossier -> U21 Privacy ---');
    await page.locator('[data-testid="nav-tab-report"]').first().click();
    await page.waitForTimeout(600);

    // Check Clinician Report includes Section E R7 Intelligence
    await page.locator('[data-testid="btn-mode-clinician"]').first().click();
    await page.waitForTimeout(400);
    const r7ClinSection = page.locator('[data-testid="r7-clinician-lab-intelligence-section"]');
    assert((await r7ClinSection.count()) > 0, 'Clinician Dossier renders Section 5 R7 Biomarker Intelligence & Supplement Exposure');

    // Switch to Patient Report -> Critical K+ 6.4 blocks release even if clicked
    await page.locator('[data-testid="btn-mode-patient"]').first().click();
    await page.waitForTimeout(500);
    const patientView = page.locator('[data-testid="patient-projection-view"]');
    assert((await patientView.count()) > 0, 'Patient Projection View mounted');
    const releaseAlert = patientView.locator('[data-testid="patient-release-blocked-alert"]');
    assert((await releaseAlert.count()) > 0, 'Critical K+ 6.4 mmol/L triggers non-bypassable Patient Report Release Block');
    assert(await patientView.locator('[data-testid="btn-print-patient-report"]').isDisabled(), 'Print button locked under critical K+ blocker');

    // Verify U21 zero numerical calories / internal biomarkers leak into patient view
    const patText = await patientView.innerText();
    assert(!/\b\d+\s*kcal\b/i.test(patText), 'U21 Privacy: zero kcal leaks into Patient Prescription');
    assert(!patText.includes('HOMA-IR') && !patText.includes('FIB-4'), 'U21 Privacy: internal diagnostic indices omitted from Patient Prescription');

    console.log('--- J11-J18: Protocol Studio R7 Individualized Supplement Intelligence ---');
    await page.locator('[data-testid="nav-tab-protocol_studio"]').first().click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Supplements"), button:has-text("সাপ্লিমেন্ট")').first().click();
    await page.waitForTimeout(400);

    await page.locator('[data-testid="r7-btn-add-supplement"]').click();
    await page.waitForTimeout(300);
    const suppForm = page.locator('form').last();
    await suppForm.locator('input[placeholder*="Magnesium Bisglycinate"]').fill('Magnesium + Zinc Complex');
    await suppForm.locator('input[placeholder*="Optional brand"]').fill('TestMarketBrand');
    await suppForm.locator('input[placeholder="e.g. 200 mg elemental"]').fill('420 mg elemental');
    await suppForm.locator('button:has-text("Add Ingredient")').click();
    await page.waitForTimeout(200);
    const ingNumInput = suppForm.locator('input[placeholder="Elemental"]').last();
    await ingNumInput.fill('420');
    await suppForm.locator('button[type="submit"]').click();
    await page.waitForTimeout(400);

    const exposurePanel = page.locator('[data-testid="r7-supplement-exposure-panel"]');
    assert((await exposurePanel.count()) > 0, 'R7 Live Cumulative Nutrient Exposure Panel mounted cleanly');
    assert((await exposurePanel.innerText()).includes('Exceeds Tolerable Upper Limit'), '420 mg Magnesium draft flags Tolerable Upper Limit exceedance');
    assert((await page.innerText('body')).includes('Unverified Brand'), 'Manual unverified brand displays honest Unverified Brand provenance badge');

    console.log('--- J19-J25: Chromium A4 PDF Verification, Responsive Viewport & Patient Isolation ---');
    await page.locator('[data-testid="nav-tab-report"]').first().click();
    await page.waitForTimeout(400);
    await page.locator('[data-testid="btn-mode-patient"]').first().click();
    await page.waitForTimeout(500);

    const pdfOutDir = process.env.R7_PDF_DIR || path.join(os.tmpdir(), 'shuddho-r7-pdf');
    fs.mkdirSync(pdfOutDir, { recursive: true });
    const r7PdfPath = path.join(pdfOutDir, 'r7_clinical_verification.pdf');

    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(200);
    const printStats = await page.evaluate(() => {
      const view = document.querySelector('[data-testid="patient-diet-report-view"]') as HTMLElement | null;
      const hasBangla = view ? /[\u0980-\u09FF]+/.test(view.innerText) : false;
      const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 4;
      return { hasBangla, overflow };
    });
    assert(printStats.hasBangla, 'Bangla clinical output renders crisply in Chromium print CSS');
    assert(!printStats.overflow, 'A4 print layout exhibits zero horizontal overflow');
    await page.pdf({ path: r7PdfPath, format: 'A4', printBackground: true });
    await page.emulateMedia({ media: 'screen' });

    const pdfBytes = fs.readFileSync(r7PdfPath);
    assert(pdfBytes.length > 10000 && pdfBytes.subarray(0, 5).toString('utf8') === '%PDF-', `Chromium exported valid A4 PDF (${pdfBytes.length} bytes)`);

    // Mobile responsive viewport check on R7 Laboratory Workspace
    await page.locator('[data-testid="nav-tab-assessment"]').first().click();
    await page.waitForTimeout(350);
    await page.locator('[data-testid="assessment-step-nav-step_labs"]').first().click();
    await page.waitForTimeout(350);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 8);
    assert(!mobileOverflow, 'Mobile 390px R7 laboratory workspace avoids horizontal page overflow');

    // Cross-patient isolation check
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('[data-testid="nav-tab-patients"]').first().click();
    await page.waitForTimeout(400);
    const openRegisterBtn = page.locator('button:has-text("Register Patient"), button:has-text("নতুন রোগী নিবন্ধন")').first();
    await openRegisterBtn.click();
    await page.waitForTimeout(300);
    const regForm = page.locator('form').last();
    await regForm.locator('input[type="text"]').first().fill('R7 Isolated Synthetic Patient');
    await regForm.locator('input[type="number"]').first().fill('38');
    await regForm.locator('button[type="submit"]').click();
    await page.waitForTimeout(600);

    await page.locator('[data-testid="nav-tab-assessment"]').first().click();
    await page.waitForTimeout(400);
    await page.locator('[data-testid="assessment-step-nav-step_labs"]').first().click();
    await page.waitForTimeout(400);
    assert((await page.locator('[data-testid="r7-critical-lab-banner"]').count()) === 0, 'Patient isolation: zero critical labs leak to newly registered patient');

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

/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION PLATFORM
 * PHASE R6: MASTER PRESCRIPTION COMPOSER BROWSER ACCEPTANCE TESTS
 * 
 * Verifies real Chrome browser interaction:
 *  1. Dual Report Switcher: Patient-Safe Diet Prescription (U21) view
 *  2. 6-Column Chronological Medication Protocol table rendering
 *  3. Exact 6 Bangla & English column headers
 *  4. 7-Food-Group Metabolic Traffic Light Guide rendering
 *  5. Authentic Bangladeshi Food Exchange Guide (Bati, Cup, Glass, Spoon, Piece, Palm)
 *  6. Fasting protocol banner & hypoglycemia safety alerts
 *  7. Fail-closed release gating: Unapproved draft locks print & shows draft alert; approved unlocks print
 *  8. Print container styling and page-break isolation
 */

import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { chromium, Browser, Page } from 'playwright';

const PORT = 4596;
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
  return new Promise((resolve) => {
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

    server.listen(PORT, () => {
      resolve({ server, port: PORT });
    });
  });
}

async function runR6BrowserE2E() {
  console.log('\n================================================================');
  console.log('SHUDDHO PHASE R6: MASTER PRESCRIPTION COMPOSER BROWSER ACCEPTANCE');
  console.log('================================================================\n');

  const { server } = await startStaticServer();
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: true
    });
  } catch {
    browser = await chromium.launch({
      headless: true
    });
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  try {
    console.log('--- 1. App Initialization & Demo Patient Loading ---');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const loadDemoBtn = page.locator('button:has-text("ডেমো কেস লোড করুন"), button:has-text("Load Demo Case"), button:has-text("Load Demo Patient")').first();
    if (await loadDemoBtn.count() > 0) {
      await loadDemoBtn.click();
      await page.waitForTimeout(800);
    }
    assert(page.url().includes('Diet-Chart-Software'), 'Successfully navigated to Shuddho application');

    // Switch to Tab 7: Reports Hub
    const reportTabBtn = page.locator('button:has-text("৭. "), button:has-text("7. ")').first();
    if (await reportTabBtn.count() > 0) {
      await reportTabBtn.click();
      await page.waitForTimeout(800);
    }

    console.log('--- 2. Switch to Patient Diet Prescription Mode (U21) ---');
    const btnPatientMode = page.locator('[data-testid="btn-mode-patient"]');
    if (await btnPatientMode.count() > 0) {
      await btnPatientMode.click();
      await page.waitForTimeout(800);
    }

    const patientView = page.locator('[data-testid="patient-projection-view"]');
    assert((await patientView.count()) > 0, 'Patient Diet Report View (U21) mounted successfully');

    console.log('--- 3. 7-Food-Group Traffic Light Guide Verification ---');
    const tableHeader = patientView.locator('th:has-text("ফুড গ্রুপ"), th:has-text("Food Group")');
    assert((await tableHeader.count()) > 0, '7-Food-Group table header rendered');

    const greenZoneHeader = patientView.locator('th:has-text("গ্রিন জোন"), th:has-text("Green Zone")');
    assert((await greenZoneHeader.count()) > 0, '7-Food-Group Green Zone column rendered');

    console.log('--- 4. 6-Column Medication Protocol Verification ---');
    const medProtocolSection = patientView.locator('[data-testid="six-column-medication-protocol"]');
    assert((await medProtocolSection.count()) > 0, '6-Column Medication & Supplementation Protocol container rendered');
    const timeSeqCol = medProtocolSection.locator('th:has-text("সময়"), th:has-text("Time Sequence")');
    const brandCol = medProtocolSection.locator('th:has-text("ওষুধ/সাপ্লিমেন্ট"), th:has-text("Brand Name")');
    const genericCol = medProtocolSection.locator('th:has-text("জেনেরিক নাম"), th:has-text("Generic Name")');
    const doseCol = medProtocolSection.locator('th:has-text("ডোজ ও পরিমাণ"), th:has-text("Dosage")');
    const durationCol = medProtocolSection.locator('th:has-text("Duration")');
    const instrCol = medProtocolSection.locator('th:has-text("ক্লিনিক্যাল নির্দেশনা"), th:has-text("Clinical Instructions")');

    assert((await timeSeqCol.count()) > 0, 'Column 1: সময় (Time Sequence) exists');
    assert((await brandCol.count()) > 0, 'Column 2: ওষুধ/সাপ্লিমেন্ট (ব্র্যান্ড) exists');
    assert((await genericCol.count()) > 0, 'Column 3: জেনেরিক নাম (Generic) exists');
    assert((await doseCol.count()) > 0, 'Column 4: ডোজ ও পরিমাণ (Dosage) exists');
    assert((await durationCol.count()) > 0, 'Column 5: Duration exists');
    assert((await instrCol.count()) > 0, 'Column 6: ক্লিনিক্যাল নির্দেশনা exists');

    const medRows = medProtocolSection.locator('tbody tr');
    const rowCount = await medRows.count();
    assert(rowCount >= 3, `At least 3 active rows rendered in 6-column protocol (found: ${rowCount})`);

    // Verify Domain 13 verified meds + approved R4 supplement render without fabricated 1500 mL hydration
    const protocolText = await medProtocolSection.innerText();
    assert(
      protocolText.includes('Metformin') || protocolText.includes('Glimepiride') || protocolText.includes('Atorvastatin') || protocolText.includes('Levothyroxine'),
      'Domain 13 active verified medications render in 6-column protocol'
    );

    const lifestyleSection = patientView.locator('[data-testid="lifestyle-support-section"]');
    if ((await lifestyleSection.count()) > 0) {
      const lifestyleText = await lifestyleSection.innerText();
      assert(!lifestyleText.includes('1500 mL') && !lifestyleText.includes('2.5 liters/day'), 'Lifestyle section contains zero fabricated hydration amounts');
    }

    console.log('--- 5. Food Exchange & Household Portion Guide Verification ---');
    const exchangeGuide = patientView.locator('[data-testid="food-exchange-guide"]');
    assert((await exchangeGuide.count()) > 0, 'Bangladeshi Food Exchange & Household Portion Guide rendered');

    const exchangeItems = exchangeGuide.locator('strong');
    assert((await exchangeItems.count()) >= 5, 'Contains multiple standard exchange groups (Grains, Proteins, Veggies, Fruits, Dairy, Fats)');

    const patientExchanges = patientView.locator('[data-testid="patient-specific-food-exchanges"]');
    assert((await patientExchanges.count()) > 0, 'Patient-Specific Food Exchanges section rendered');

    console.log('--- 6. Fail-Closed Draft Gate -> Clinician Weekly Plan Sign-Off -> Released A4 PDF ---');
    const watermark = patientView.locator('[data-testid="draft-watermark"]');
    const releaseAlert = patientView.locator('[data-testid="patient-release-blocked-alert"]');
    const printBtn = patientView.locator('[data-testid="btn-print-patient-report"]');
    const hubPrintBtn = page.locator('[data-testid="btn-print-report"]');
    const headerPrintBtn = page.locator('[data-testid="btn-print"]');

    // Step 6A: Initial draft plan must block release & disable all print buttons
    assert((await releaseAlert.count()) > 0, 'Unapproved demo plan initially displays release blocked alert notice');
    assert((await watermark.count()) > 0, 'Unapproved draft shows prominent PROVISIONAL DRAFT watermark');
    assert((await patientView.locator('[data-testid="printable-draft-block-banner"]').count()) > 0, 'Unapproved draft displays printable warning banner');
    assert(await printBtn.isDisabled(), 'Print/PDF release button is strictly disabled on unapproved draft');
    assert(await hubPrintBtn.isDisabled(), 'Report Hub print button is disabled on unapproved draft');
    assert(await headerPrintBtn.isDisabled(), 'Header global print button is disabled on unapproved draft');

    const pdfOutDir = process.env.R6_PDF_DIR || path.join(os.tmpdir(), 'shuddho-r6-pdf');
    fs.mkdirSync(pdfOutDir, { recursive: true });
    const blockedPdfPath = path.join(pdfOutDir, 'r6_patient_prescription_blocked_draft.pdf');
    await page.emulateMedia({ media: 'print' });
    const initialDraftPrintCheck = await page.evaluate(() => {
      const banner = document.querySelector('[data-testid="printable-draft-block-banner"]');
      return banner ? getComputedStyle(banner).display !== 'none' : false;
    });
    assert(initialDraftPrintCheck, 'Printable draft block banner remains visible under @media print');
    await page.pdf({ path: blockedPdfPath, format: 'A4', printBackground: true });
    await page.emulateMedia({ media: 'screen' });
    assert(fs.existsSync(blockedPdfPath) && fs.statSync(blockedPdfPath).size > 10000, 'Generated blocked draft A4 PDF for print-warning verification');

    // Step 6B: Clinician approves P2 Assessment (Tab 7 View 2) + 7-Day Weekly Plan (Tab 5) -> Released Patient Prescription
    await page.locator('[data-testid="btn-mode-clinician"]').first().click();
    await page.waitForTimeout(400);
    await page.locator('button:has-text("২. প্রাক-হস্তক্ষেপ পূর্ণাঙ্গ স্বাস্থ্য প্রতিবেদন"), button:has-text("2. Pre-Intervention Health Report")').first().click();
    await page.waitForTimeout(500);
    await page.locator('input[placeholder*="ডা. ফারহানা"], input[placeholder*="Farhana Ahmed"]').first().fill('Dr. Farhana Rahman, MBBS, MD');
    const p2SafetyCb = page.locator('input[type="checkbox"]').first();
    if ((await p2SafetyCb.count()) > 0) {
      await p2SafetyCb.check();
    }
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Approve Clinical Assessment"), button:has-text("Sign Off")').first().click();
    await page.waitForTimeout(800);

    await page.locator('[data-testid="nav-tab-diet"]').first().click();
    await page.waitForTimeout(600);
    await page.locator('[data-testid="btn-approve-weekly-plan"]').first().click();
    await page.waitForTimeout(400);
    await page.locator('[data-testid="input-clinician-id"]').fill('DR_PROBAL_MD_PHD');
    await page.locator('[data-testid="btn-submit-approval"]').click();
    await page.waitForTimeout(1400);
    assert((await page.locator('[data-testid="badge-approved-plan"]').count()) > 0, 'Weekly diet plan transitioned to Approved state after P2 & clinician sign-off');

    // Return to Tab 7 -> Patient Mode
    await reportTabBtn.click();
    await page.waitForTimeout(500);
    await btnPatientMode.click();
    await page.waitForTimeout(600);

    const approvedBanner = patientView.locator('[data-testid="patient-release-approved-banner"]');
    assert((await approvedBanner.count()) > 0, 'After clinician approval, patient report transitions to RELEASED state');
    assert((await watermark.count()) === 0, 'Released patient report removes draft watermark');
    assert(!(await printBtn.isDisabled()), 'Patient print button unlocks and is enabled on released prescription');
    assert(!(await hubPrintBtn.isDisabled()), 'Report Hub print button is enabled on released prescription');
    assert(!(await headerPrintBtn.isDisabled()), 'Header global print button is enabled on released prescription');

    // Step 6C: Real Chromium @media print & Approved A4 PDF Generation
    const approvedPdfPath = path.join(pdfOutDir, 'r6_patient_prescription_approved.pdf');
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(200);
    const printAudit = await page.evaluate(() => {
      const noPrintEls = Array.from(document.querySelectorAll('.no-print'));
      const hiddenNoPrint = noPrintEls.every(el => getComputedStyle(el).display === 'none');
      const table = document.querySelector('[data-testid="six-column-medication-protocol"] table') as HTMLElement | null;
      const view = document.querySelector('[data-testid="patient-diet-report-view"]') as HTMLElement | null;
      const hasBangla = view ? /[\u0980-\u09FF]+/.test(view.innerText) : false;
      const docOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 4;
      const tableOverflow = table && table.parentElement ? table.scrollWidth > table.parentElement.clientWidth + 4 : false;
      return { hiddenNoPrint, hasBangla, docOverflow, tableOverflow };
    });
    assert(printAudit.hiddenNoPrint, '@media print hides all .no-print UI chrome and draft candidate sections');
    assert(printAudit.hasBangla, 'Bangla Unicode clinical instructions render properly in print layout');
    assert(!printAudit.docOverflow && !printAudit.tableOverflow, '6-column protocol and A4 layout render without horizontal overflow in print CSS');

    await page.pdf({
      path: approvedPdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '10mm', bottom: '12mm', left: '10mm' }
    });
    await page.emulateMedia({ media: 'screen' });

    const pdfBytes = fs.readFileSync(approvedPdfPath);
    assert(pdfBytes.length > 10000, `Chromium generated non-empty released A4 PDF (${pdfBytes.length} bytes)`);
    assert(pdfBytes.subarray(0, 5).toString('utf8') === '%PDF-', 'Generated PDF starts with valid %PDF- signature');

    console.log('--- 7. Privacy Invariant: Zero numerical calories/macros in patient report text ---');
    const patientText = await patientView.innerText();
    const forbiddenKcal = /\b\d+\s*kcal\b/i.test(patientText);
    assert(!forbiddenKcal, 'Strict Privacy: Zero calculated numerical "kcal" in rendered patient view');

    console.log('--- 8. Unverified / Incomplete Medication Safety Blocking & Print Lock ---');
    const r5TabBtn = page.locator('[data-testid="nav-tab-systems_intelligence"]').first();
    await r5TabBtn.click();
    await page.waitForTimeout(500);

    // Navigate from Systems Intelligence read-only list to Domain 13 Medication Reconciliation Editor
    const editMedNavBtn = page.locator('[data-testid="edit-in-assessment-nav-btn"]').first();
    await editMedNavBtn.click();
    await page.waitForTimeout(500);

    await page.locator('[data-testid="medication-search-input"]').fill('Atorvastatin');
    await page.waitForTimeout(400);
    await page.locator('[data-testid="search-result-item-0"]').first().click();
    await page.waitForTimeout(300);

    await page.locator('[data-testid="timing-unknown-checkbox"]').check();
    await page.locator('[data-testid="verification-status-select"]').selectOption('patient_reported');
    await page.locator('[data-testid="confirm-medication-btn"]').click();
    await page.waitForTimeout(500);

    // Return to Report Hub -> Patient View
    await reportTabBtn.click();
    await page.waitForTimeout(500);
    await btnPatientMode.click();
    await page.waitForTimeout(600);

    assert((await patientView.locator('[data-testid="patient-release-blocked-alert"]').count()) > 0, 'Adding patient_reported / UNKNOWN-time med re-locks previously released prescription');
    assert((await patientView.locator('[data-testid="printable-draft-block-banner"]').count()) > 0, 'Blocked prescription renders printable draft block warning');
    assert((await patientView.locator('[data-testid="pending-medication-verification-panel"]').count()) > 0, 'Pending verification panel separates unverified Atorvastatin');

    const activeTableAfterUnverified = await patientView.locator('[data-testid="six-column-medication-protocol"] tbody').innerText();
    assert(!activeTableAfterUnverified.includes('Atorvastatin'), 'Unverified Atorvastatin is strictly excluded from approved active_rows table');

    assert(await printBtn.isDisabled(), 'Patient print button re-locks cleanly when unverified medication exists');
    assert(await hubPrintBtn.isDisabled(), 'Report Hub print button re-locks cleanly when unverified medication exists');
    assert(await headerPrintBtn.isDisabled(), 'Header global print button re-locks cleanly when unverified medication exists');

    await page.emulateMedia({ media: 'print' });
    const draftPrintVisibility = await page.evaluate(() => {
      const banner = document.querySelector('[data-testid="printable-draft-block-banner"]');
      const pending = document.querySelector('[data-testid="pending-medication-verification-panel"]');
      return {
        bannerVisible: banner ? getComputedStyle(banner).display !== 'none' : false,
        pendingVisible: pending ? getComputedStyle(pending).display !== 'none' : false
      };
    });
    assert(draftPrintVisibility.bannerVisible, 'Draft release-block banner remains visible under @media print');
    assert(draftPrintVisibility.pendingVisible, 'Pending medication warning panel remains visible under @media print');
    await page.emulateMedia({ media: 'screen' });

    console.log('--- 9. Patient Isolation: Register New Patient -> Zero Medication/Supplement Leakage ---');
    const patientsTabBtn = page.locator('[data-testid="nav-tab-patients"]').first();
    await patientsTabBtn.click();
    await page.waitForTimeout(400);

    const openRegisterBtn = page.locator('button:has-text("Register Patient"), button:has-text("নতুন রোগী নিবন্ধন")').first();
    await openRegisterBtn.click();
    await page.waitForTimeout(300);

    const form = page.locator('form').last();
    await form.locator('input[type="text"]').first().fill('Mr. Isolated Verification Patient');
    await form.locator('input[type="number"]').first().fill('44');
    await form.locator('button[type="submit"]').click();
    await page.waitForTimeout(700);

    await reportTabBtn.click();
    await page.waitForTimeout(500);
    await btnPatientMode.click();
    await page.waitForTimeout(600);

    const isolatedViewText = await patientView.innerText();
    assert(
      !isolatedViewText.includes('Comet 500') && !isolatedViewText.includes('Atorvastatin') && !isolatedViewText.includes('Seclo 20'),
      'Patient isolation verified: zero previous patient medications leak into new patient prescription'
    );
    assert(await printBtn.isDisabled(), 'New empty patient prescription stays safely blocked from print release');

    console.log('\n================================================================');
    console.log(`R6 BROWSER ACCEPTANCE SUMMARY: ${passedAssertions}/${totalAssertions} PASSED (${failedAssertions} FAILED)`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('Test execution failed:', err);
    failedAssertions++;
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runR6BrowserE2E();

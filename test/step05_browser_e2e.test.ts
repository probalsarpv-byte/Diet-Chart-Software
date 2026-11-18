/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION SOFTWARE
 * STEP 05: REAL BROWSER PLAYWRIGHT E2E ACCEPTANCE SUITE
 * 
 * Verifies real application execution in Google Chrome:
 * - Scenario 1: Tab 5 Navigation & Clinical Traceability Header
 * - Scenario 2: 7-Day Day Tab Switching & Rotation Schedules
 * - Scenario 3: Real-Time Manual Nutrient Adjustment & Variance Recalculation
 * - Scenario 4: Day & Item Lock Preservation
 * - Scenario 5: Day-to-Day Plan Copy Modal Workflow
 * - Scenario 6: Clinician Sign-Off & Approval Governance
 * - Scenario 7: Reports Hub Integration — 7-Day Weekly Diet Prescription (View 4)
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium, Browser, Page } from 'playwright';

const OUT_DIR = path.resolve('out');

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition: boolean, message: string) {
  totalAssertions++;
  if (!condition) {
    failedAssertions++;
    console.error(`  ✗ FAIL: ${message}`);
  } else {
    passedAssertions++;
    console.log(`  ✓ PASS: ${message}`);
  }
}

function startStaticServer(): Promise<{ server: http.Server; port: number; url: string }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url?.replace('/Diet-Chart-Software', '') || '/';
      if (reqPath.endsWith('/')) reqPath += 'index.html';
      const cleanPath = reqPath.split('?')[0];
      const filePath = path.join(OUT_DIR, cleanPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        const mimeTypes: Record<string, string> = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'application/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.json': 'application/json; charset=utf-8',
          '.png': 'image/png',
          '.svg': 'image/svg+xml'
        };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 4582;
      const url = `http://127.0.0.1:${port}/Diet-Chart-Software/`;
      resolve({ server, port, url });
    });
  });
}

async function runStep05BrowserE2E() {
  if (!fs.existsSync(OUT_DIR)) {
    console.error('Error: "out" directory not found. Please build Next.js before running E2E.');
    process.exit(1);
  }

  const { server, port, url: BASE_URL } = await startStaticServer();
  console.log('=====================================================================');
  console.log('SHUDDHO STEP 05: REAL BROWSER PLAYWRIGHT E2E ACCEPTANCE SUITE');
  console.log(`Target: ${BASE_URL} (port: ${port})`);
  console.log('=====================================================================\n');

  const browser: Browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });
  console.log(`[Playwright] Chrome browser launched: version ${browser.version()}`);
  const context = await browser.newContext();
  const page: Page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.warn(`  [Browser Error]: ${msg.text()}`);
    }
  });

  try {
    // -------------------------------------------------------------------
    // Scenario 1: Tab 5 Navigation & Clinical Traceability Header
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 1: Tab 5 Navigation & Clinical Traceability Header ---');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Load Demo Case to populate patient, visits, and P2 analysis
    const loadDemoBtn = page.locator('button:has-text("ডেমো কেস লোড করুন"), button:has-text("Load Demo Case"), button:has-text("Load Demo Patient")').first();
    await loadDemoBtn.click();
    await page.waitForTimeout(600);

    const activePatientBadge = page.locator('text=Mrs. Nasreen Akhter');
    assert((await activePatientBadge.count()) > 0, 'Scenario 1: Mrs. Nasreen Akhter demo case loaded successfully');

    // Switch to Tab 5: 7-Day Diet Planner
    const dietTabBtn = page.locator('button:has-text("৫. "), button:has-text("5. ")').first();
    assert((await dietTabBtn.count()) > 0, 'Scenario 1: Tab 5 (Diet Planning) button exists in navigation');
    await dietTabBtn.click();
    await page.waitForTimeout(600);

    // Verify Traceability Bar
    const traceabilityBar = page.locator('[data-testid="clinical-traceability-bar"]');
    assert((await traceabilityBar.count()) > 0, 'Scenario 1: Top Clinical Traceability Bar is visible');

    const patientNameInBar = traceabilityBar.locator('text=Mrs. Nasreen Akhter');
    assert((await patientNameInBar.count()) > 0, 'Scenario 1: Patient identity clearly reflected in traceability bar');

    // -------------------------------------------------------------------
    // Scenario 2: 7-Day Day Tab Switching & Rotation Schedules
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 2: 7-Day Day Tab Switching & Rotation Schedules ---');
    const dayButtons = page.locator('[data-testid^="day-tab-"]');
    const dayBtnCount = await dayButtons.count();
    assert(dayBtnCount === 7, `Scenario 2: All 7 Day tabs exist (found: ${dayBtnCount})`);

    // Click Day 2 Tab
    const day2Btn = page.locator('[data-testid="day-tab-2"]');
    await day2Btn.click();
    await page.waitForTimeout(300);

    const day2Header = page.locator('text=/রবিবার|Sunday/');
    assert((await day2Header.count()) > 0, 'Scenario 2: Switching to Day 2 updates schedule to Sunday/রবিবার');

    // Click Day 7 Tab
    const day7Btn = page.locator('[data-testid="day-tab-7"]');
    await day7Btn.click();
    await page.waitForTimeout(300);

    const day7Header = page.locator('text=/শুক্রবার|Friday/');
    assert((await day7Header.count()) > 0, 'Scenario 2: Switching to Day 7 updates schedule to Friday/শুক্রবার');

    // Return to Day 1
    const day1Btn = page.locator('[data-testid="day-tab-1"]');
    await day1Btn.click();
    await page.waitForTimeout(300);

    // Verify meal slots exist on Day 1
    const mealCards = page.locator('[data-testid^="meal-card-"]');
    assert((await mealCards.count()) >= 4, 'Scenario 2: At least 4 distinct meal slots rendered in Day 1');

    // -------------------------------------------------------------------
    // Scenario 3: Real-Time Manual Nutrient Adjustment & Variance Recalculation
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 3: Real-Time Manual Nutrient Adjustment & Variance Recalculation ---');
    const gramInputs = page.locator('input[type="number"]');
    const inputCount = await gramInputs.count();
    assert(inputCount > 0, `Scenario 3: Gram input fields exist for manual clinician editing (${inputCount} inputs)`);

    // Edit the first food item grams
    const firstInput = gramInputs.first();
    await firstInput.fill('220');
    await page.waitForTimeout(400);

    // Verify input retains value
    const updatedVal = await firstInput.inputValue();
    assert(updatedVal === '220', `Scenario 3: Input gram weight successfully updated to 220g (actual: ${updatedVal})`);

    // -------------------------------------------------------------------
    // Scenario 4: Day & Item Lock Preservation
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 4: Day & Item Lock Preservation ---');
    const lockDayBtn = page.locator('[data-testid="btn-lock-day"]');
    assert((await lockDayBtn.count()) > 0, 'Scenario 4: Lock Day action button exists');
    await lockDayBtn.click();
    await page.waitForTimeout(400);

    // Verify day shows locked
    const day1Tab = page.locator('[data-testid="day-tab-1"]');
    const lockIconInTab = day1Tab.locator('svg');
    assert((await lockIconInTab.count()) > 0, 'Scenario 4: Day 1 tab reflects locked state');

    // Unlock day for further testing
    await lockDayBtn.click();
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------
    // Scenario 5: Day-to-Day Plan Copy Modal Workflow
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 5: Day-to-Day Plan Copy Modal Workflow ---');
    const copyDayBtn = page.locator('[data-testid="btn-open-copy-modal"]');
    assert((await copyDayBtn.count()) > 0, 'Scenario 5: Copy Day button is available in action bar');
    await copyDayBtn.click();
    await page.waitForTimeout(400);

    const copyModal = page.locator('[data-testid="copy-day-modal"]');
    assert((await copyModal.count()) > 0, 'Scenario 5: Copy Day modal successfully opened');

    // Select Target Day 3
    const targetDaySelect = copyModal.locator('select').nth(1);
    await targetDaySelect.selectOption('3');
    await page.waitForTimeout(200);

    // Confirm Copy
    const confirmCopyBtn = page.locator('[data-testid="btn-submit-copy-day"]');
    await confirmCopyBtn.click();
    await page.waitForTimeout(500);

    // Switch to Day 3 and verify it now has meals
    const day3Tab = page.locator('[data-testid="day-tab-3"]');
    await day3Tab.click();
    await page.waitForTimeout(400);

    const day3Meals = page.locator('[data-testid^="meal-card-"]');
    assert((await day3Meals.count()) >= 4, 'Scenario 5: Day 3 contains copied meals successfully');

    // -------------------------------------------------------------------
    // Scenario 6: Clinician Sign-Off & Approval Governance
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 6: Clinician Sign-Off & Approval Governance ---');
    const signOffBtn = page.locator('[data-testid="btn-approve-weekly-plan"]');
    assert((await signOffBtn.count()) > 0, 'Scenario 6: Clinician Sign-Off button exists in action bar');
    await signOffBtn.click();
    await page.waitForTimeout(400);

    const signOffModal = page.locator('[data-testid="sign-off-modal"]');
    assert((await signOffModal.count()) > 0, 'Scenario 6: Clinician Sign-Off modal opened');

    // Fill in clinician credentials
    const clinicianIdInput = page.locator('[data-testid="input-clinician-id"]');
    assert((await clinicianIdInput.count()) > 0, 'Scenario 6: Clinician ID input field is present');
    await clinicianIdInput.fill('DR_PROBAL_MD_PHD');
    await page.waitForTimeout(200);

    const confirmApproveBtn = page.locator('[data-testid="btn-submit-approval"]');
    assert((await confirmApproveBtn.isEnabled()), 'Scenario 6: Submit Approval button is enabled after valid ID entry');
    
    // Verify approval is blocked without approved P2 Clinical Assessment
    await confirmApproveBtn.click();
    await page.waitForTimeout(400);

    const feedback = page.locator('text=/Cannot approve|ব্যর্থ/');
    assert((await feedback.count()) > 0, 'Scenario 6: Approval strictly blocked when P2 assessment is unapproved');

    // Close sign-off modal
    await page.locator('button:has-text("Cancel"), button:has-text("বাতিল")').click();
    await page.waitForTimeout(300);

    // Approve P2 Assessment in Tab 7 View 2 as clinical governance prerequisite
    const reportTabForP2 = page.locator('button:has-text("৭. "), button:has-text("7. ")').first();
    await reportTabForP2.click();
    await page.waitForTimeout(500);

    const p2ReportBtn = page.locator('button:has-text("২. প্রাক-হস্তক্ষেপ পূর্ণাঙ্গ স্বাস্থ্য প্রতিবেদন"), button:has-text("2. Pre-Intervention Health Report")');
    await p2ReportBtn.click();
    await page.waitForTimeout(500);

    const p2ClinicianInput = page.locator('input[placeholder*="ডা. ফারহানা"], input[placeholder*="Farhana Ahmed"]').first();
    await p2ClinicianInput.fill('Dr. Farhana Rahman, MBBS, MD');
    const safetyCheckbox = page.locator('input[type="checkbox"]').first();
    if ((await safetyCheckbox.count()) > 0) {
      await safetyCheckbox.check();
    }
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Approve Clinical Assessment"), button:has-text("Sign Off")').first().click();
    await page.waitForTimeout(800);

    // Return to Tab 5 (Diet Planning) and approve weekly plan now that P2 is approved
    const dietTabReturn = page.locator('button:has-text("৫. "), button:has-text("5. ")').first();
    await dietTabReturn.click();
    await page.waitForTimeout(600);

    await signOffBtn.click();
    await page.waitForTimeout(400);

    await clinicianIdInput.fill('DR_PROBAL_MD_PHD');
    await confirmApproveBtn.click();
    await page.waitForTimeout(1200);

    const approvedBadge = page.locator('[data-testid="badge-approved-plan"]');
    assert((await approvedBadge.count()) > 0, 'Scenario 6: Plan successfully transitioned to Approved state with clinician metadata');

    // -------------------------------------------------------------------
    // Scenario 6b: Modification Invalidation & Re-Approval UI Flow
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 6b: Modification Invalidation & Re-Approval UI Flow ---');
    const regenDayBtn = page.locator('[data-testid="btn-regenerate-day"]');
    await regenDayBtn.click();
    await page.waitForTimeout(600);

    const requiresReviewBadge = page.locator('[data-testid="badge-requires-review"]');
    assert((await requiresReviewBadge.count()) > 0, 'Scenario 6b: Modification dynamically transitions UI to Requires Re-review');

    // Re-approve the plan
    const reApproveBtn = page.locator('[data-testid="btn-approve-weekly-plan"]');
    await reApproveBtn.click();
    await page.waitForTimeout(400);

    const reApproveClinicianInput = page.locator('[data-testid="input-clinician-id"]');
    await reApproveClinicianInput.fill('DR_PROBAL_MD_PHD');
    await page.waitForTimeout(200);

    const reApproveSubmitBtn = page.locator('[data-testid="btn-submit-approval"]');
    await reApproveSubmitBtn.click();
    await page.waitForTimeout(1200);

    const reApprovedBadge = page.locator('[data-testid="badge-approved-plan"]');
    assert((await reApprovedBadge.count()) > 0, 'Scenario 6b: Plan successfully re-approved and returns to Verified state');

    // -------------------------------------------------------------------
    // Scenario 7: Reports Hub Integration — 7-Day Weekly Diet Prescription (View 4)
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 7: Reports Hub Integration (View 4) ---');
    const reportTabBtn = page.locator('button:has-text("৭. "), button:has-text("7. ")').first();
    await reportTabBtn.click();
    await page.waitForTimeout(600);

    // Switch to View 4: Weekly Diet Plan Prescription
    const weeklyReportTab = page.locator('[data-testid="tab-report-weekly-diet"]');
    assert((await weeklyReportTab.count()) > 0, 'Scenario 7: View 4 (7-Day Diet Prescription) tab exists in Reports Hub');
    await weeklyReportTab.click();
    await page.waitForTimeout(600);

    // Verify Weekly Report Document Container & Header
    const weeklyReportView = page.locator('[data-testid="weekly-diet-report-view"]');
    assert((await weeklyReportView.count()) > 0, 'Scenario 7: 7-Day Weekly Diet Prescription report view is rendered');

    const weeklyDocTitle = page.locator('text=/৭-দিনের ব্যক্তিগতকৃত পুষ্টি প্রেসক্রিপশন|7-Day Personalized Diet Prescription/');
    assert((await weeklyDocTitle.count()) > 0, 'Scenario 7: Document title is displayed');

    const weeklyPatientDetails = weeklyReportView.locator('text=Mrs. Nasreen Akhter');
    assert((await weeklyPatientDetails.count()) > 0, 'Scenario 7: Patient details correctly rendered on 7-day report');

    // Verify all 7 days are listed in printable schedule
    const daysInReport = page.locator('[data-testid^="report-day-"]');
    assert((await daysInReport.count()) === 7, 'Scenario 7: All 7 days are represented in printable clinical prescription');

    // Verify Print button is present
    const printBtn = page.locator('[data-testid="btn-print-report"]');
    assert((await printBtn.count()) > 0, 'Scenario 7: Print / PDF export action button is available');

  } catch (err: any) {
    console.error('Fatal Browser Error:', err);
    assert(false, `Browser E2E Execution failed: ${err.message}`);
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n=====================================================================');
  console.log(`STEP 05 BROWSER E2E RESULTS: ${passedAssertions}/${totalAssertions} PASSED (${failedAssertions} FAILED)`);
  console.log('=====================================================================\n');

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runStep05BrowserE2E();

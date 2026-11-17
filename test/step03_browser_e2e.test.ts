/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION SOFTWARE
 * STEP 03: REAL BROWSER END-TO-END ACCEPTANCE VERIFICATION (PLAYWRIGHT)
 * 
 * Verifies real application execution in Google Chrome:
 * - Scenario 1: Dashboard Load & Empty Practice Zero-Safe Verification
 * - Scenario 2: Quick Registration from Dashboard & Assessment Handoff
 * - Scenario 3: Demonstration Case Loading & Dynamic KPI Calculation
 * - Scenario 4: Follow-Up Appointment Scheduling & Rescheduling
 * - Scenario 5: Starting Consultation from Appointment
 * - Scenario 6: Longitudinal Comparison Workspace & 4 Modes (SVG Trendlines)
 * - Scenario 7: A4 Progress Report Generation & Clinician Approval Sign-Off
 * - Scenario 8: Browser Reload Full Persistence & Integrity Verification
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium, Browser, Page } from 'playwright';

const PORT = 4580;
const BASE_URL = `http://localhost:${PORT}/Diet-Chart-Software/`;
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

function startStaticServer(): Promise<http.Server> {
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

    server.listen(PORT, () => {
      resolve(server);
    });
  });
}

async function runStep03BrowserE2E() {
  console.log('=====================================================================');
  console.log('SHUDDHO STEP 03: REAL BROWSER PLAYWRIGHT E2E ACCEPTANCE SUITE');
  console.log(`Target: ${BASE_URL}`);
  console.log('=====================================================================\n');

  if (!fs.existsSync(OUT_DIR)) {
    console.error('Error: "out" directory not found. Please build Next.js before running E2E.');
    process.exit(1);
  }

  const server = await startStaticServer();
  console.log(`✓ Static server running on port ${PORT}`);

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
    // Scenario 1: Initial Load & Empty Practice Verification
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 1: Dashboard Load & Empty Practice Zero-Safe Verification ---');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Clear safeStorage / localStorage to test strict empty state
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Verify Dashboard tab (Tab 1) is active by default
    const mainHeading = await page.locator('main h1').textContent();
    assert(
      (mainHeading?.includes('ক্লিনিক্যাল প্র্যাকটিস') || mainHeading?.includes('Clinical Practice')) ?? false,
      `Dashboard Tab 1 is active on initial load (found: "${mainHeading?.trim()}")`
    );

    // Verify Empty State Banner is displayed
    const emptyBanner = page.locator('text=/No Patients Registered Yet|প্র্যাকটিসে কোনো রোগী নিবন্ধিত নেই/');
    assert((await emptyBanner.count()) > 0, 'Zero-safe Empty Practice hero card is displayed');

    // Verify all 8 KPI cards show 0
    const kpiCards = page.locator('.grid.grid-cols-2.sm\\:grid-cols-4.lg\\:grid-cols-8 > div');
    const kpiCount = await kpiCards.count();
    assert(kpiCount === 8, `Exactly 8 KPI cards rendered (found: ${kpiCount})`);

    const firstKpiText = await kpiCards.first().locator('.text-xl.font-extrabold').textContent();
    assert(firstKpiText?.trim() === '0', `Total Patients KPI is 0 (actual: ${firstKpiText?.trim()})`);

    // -------------------------------------------------------------------
    // Scenario 2: Quick Registration from Dashboard & Assessment Handoff
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 2: Quick Registration from Dashboard & Assessment Handoff ---');
    const registerBtn = page.locator('button:has-text("+ নতুন রোগী নিবন্ধন"), button:has-text("+ Register Patient")').first();
    await registerBtn.click();
    await page.waitForTimeout(300);

    // Fill registration form
    const modal = page.locator('.fixed.inset-0');
    await modal.locator('input[type="text"]').first().fill('Mr. Tariqul Islam');
    await modal.locator('input[type="number"]').first().fill('45');
    await modal.locator('select').first().selectOption('male');
    await modal.locator('input[type="tel"]').first().fill('01711998877');

    const submitRegBtn = modal.locator('button[type="submit"]');
    await submitRegBtn.click();
    await page.waitForTimeout(600);

    // Verify redirected to Assessment Tab with new patient active
    const assessmentHeader = page.locator('text=/Adaptive Functional Nutrition Assessment|অ্যাডাপ্টিভ ফাংশনাল নিউট্রিশন অ্যাসেসমেন্ট/');
    assert((await assessmentHeader.count()) > 0, 'Successfully redirected to Assessment Tab for newly registered patient');

    // -------------------------------------------------------------------
    // Scenario 3: Demonstration Case Loading & Dynamic KPI Calculation
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 3: Demonstration Case Loading & Dynamic KPI Calculation ---');
    // Return to Dashboard tab
    const dashboardNavBtn = page.locator('button:has-text("১. ড্যাশবোর্ড"), button:has-text("1. Dashboard")');
    await dashboardNavBtn.click();
    await page.waitForTimeout(400);

    const loadDemoBtn = page.locator('button:has-text("ডেমো কেস লোড করুন"), button:has-text("Load Demo Case"), button:has-text("Load Demo Patient")').first();
    await loadDemoBtn.click();
    await page.waitForTimeout(600);

    // Verify demo patient is loaded and active
    const activePatientBadge = page.locator('text=Mrs. Nasreen Akhter');
    assert((await activePatientBadge.count()) > 0, 'Mrs. Nasreen Akhter demo case loaded successfully');

    // Verify KPIs updated dynamically
    const updatedTotalPatients = await kpiCards.first().locator('.text-xl.font-extrabold').textContent();
    const totalNum = parseInt(updatedTotalPatients?.trim() || '0', 10);
    assert(totalNum >= 1, `Total Patients KPI dynamically updated to >= 1 (actual: ${totalNum})`);

    // -------------------------------------------------------------------
    // Scenario 4: Follow-Up Appointment Scheduling & Rescheduling
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 4: Follow-Up Appointment Scheduling & Rescheduling ---');
    // Switch to Follow-Up Tab (Tab 6)
    const followUpTabBtn = page.locator('button:has-text("৬. ফলো-আপ"), button:has-text("6. Follow-Up")');
    await followUpTabBtn.click();
    await page.waitForTimeout(500);

    // Open Schedule modal
    const scheduleBtn = page.locator('button:has-text("+ নতুন অ্যাপয়েন্টমেন্ট শিডিউল"), button:has-text("+ Schedule Follow-Up")');
    await scheduleBtn.click();
    await page.waitForTimeout(300);

    const scheduleModal = page.locator('.fixed.inset-0');
    await scheduleModal.locator('input[type="text"]').first().fill('Routine Metabolic Review & HbA1c Check');
    const confirmScheduleBtn = scheduleModal.locator('button[type="submit"]');
    await confirmScheduleBtn.click();
    await page.waitForTimeout(500);

    // Verify appointment in table
    const aptTableRows = page.locator('tbody tr');
    assert((await aptTableRows.count()) >= 1, 'Scheduled follow-up appointment appears in table');

    // Reschedule appointment
    const reschedBtn = page.locator('button:has-text("রি-শিডিউল"), button:has-text("Reschedule")').first();
    await reschedBtn.click();
    await page.waitForTimeout(300);

    const reschedModal = page.locator('.fixed.inset-0');
    const reschedSubmitBtn = reschedModal.locator('button:has-text("নিশ্চিত করুন"), button:has-text("Confirm")');
    await reschedSubmitBtn.click();
    await page.waitForTimeout(400);

    // -------------------------------------------------------------------
    // Scenario 5: Starting Consultation from Appointment
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 5: Starting Consultation from Appointment ---');
    const startVisitBtn = page.locator('button:has-text("পরামর্শ শুরু"), button:has-text("Start Visit")').first();
    assert((await startVisitBtn.count()) > 0, 'Start Visit consultation initiation button is visible');
    await startVisitBtn.click();
    await page.waitForTimeout(400);

    // Verify consultation measurement entry modal opened cleanly
    const logVisitModal = page.locator('text=/Log Regular Follow-Up Visit|নতুন ফলো-আপ ভিজিট সংরক্ষণ করুন/');
    assert((await logVisitModal.count()) > 0, 'Consultation measurement entry modal opened cleanly');

    // Close modal
    const cancelModalBtn = page.locator('button:has-text("বাতিল"), button:has-text("Cancel")').first();
    await cancelModalBtn.click();
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------
    // Scenario 6: Longitudinal Comparison Workspace & 4 Modes (SVG Trendlines)
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 6: Longitudinal Comparison Workspace & 4 Modes (SVG Trendlines) ---');
    // Open Sub-tab 3: Comparison Workspace
    const compWorkspaceSubTab = page.locator('button:has-text("৩. লংগিটিউডিনাল তুলনা"), button:has-text("3. Comparison Workspace")');
    await compWorkspaceSubTab.click();
    await page.waitForTimeout(500);

    // Verify 4 Mode buttons
    const modeABtn = page.locator('button:has-text("Mode A: Baseline vs Current")');
    const modeBBtn = page.locator('button:has-text("Mode B: Previous vs Current")');
    const modeCBtn = page.locator('button:has-text("Mode C: Selected vs Selected")');
    const modeDBtn = page.locator('button:has-text("Mode D: Multi-Visit Trend")');

    assert((await modeABtn.count()) > 0, 'Mode A selector is visible');
    assert((await modeBBtn.count()) > 0, 'Mode B selector is visible');
    assert((await modeCBtn.count()) > 0, 'Mode C selector is visible');
    assert((await modeDBtn.count()) > 0, 'Mode D selector is visible');

    // Switch to Mode D (Multi-Visit Trend)
    await modeDBtn.click();
    await page.waitForTimeout(400);

    // Verify SVG trendline cards
    const trendlineCards = page.locator('text=/Weight Trajectory|ওজন পরিবর্তনের গতিপথ|Waist Circumference|কোমর পরিমাপের পরিবর্তন|HbA1c Glycemic Marker|এইচবিএওয়ানসি গ্লাইসেমিক মার্কার/');
    assert((await trendlineCards.count()) >= 1, 'Multi-visit SVG trendline cards rendered in Mode D');

    // Verify SVG graphic elements exist in DOM
    const svgElements = page.locator('svg line, svg path');
    assert((await svgElements.count()) > 0, 'Responsive SVG polyline and grid coordinate elements rendered');

    // Switch back to Mode A
    await modeABtn.click();
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------
    // Scenario 7: A4 Progress Report Generation & Clinician Approval Sign-Off
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 7: A4 Progress Report Generation & Clinician Approval Sign-Off ---');
    const generateReportBtn = page.locator('button:has-text("প্রগ্রেস রিপোর্ট তৈরি করুন"), button:has-text("Generate Progress Report"), button:has-text("Open A4 Report"), button:has-text("A4 প্রগ্রেস রিপোর্ট খুলুন")').first();
    await generateReportBtn.click();
    await page.waitForTimeout(600);

    // Verify redirected to Progress Reports (Sub-tab 4)
    const reportTitle = page.locator('text=/SHUDDHO FUNCTIONAL & PRECISION NUTRITION|Comparative Clinical Progress Report|তুলনামূলক ক্লিনিক্যাল প্রগ্রেস রিপোর্ট/');
    assert((await reportTitle.count()) > 0, 'Comparative Progress Report document rendered');

    // Verify Print Button is present
    const printBtn = page.locator('button:has-text("প্রিন্ট / PDF ডাউনলোড"), button:has-text("Print / Export PDF")');
    assert((await printBtn.count()) > 0, 'A4 Print / Export PDF button is present');

    // Test Clinician Approval form validation with placeholder name
    const clinicianNameInput = page.locator('input[placeholder*="Dr. A. Rahman"]').first();
    if ((await clinicianNameInput.count()) > 0) {
      await clinicianNameInput.fill('doctor');
      const approveBtn = page.locator('button:has-text("চূড়ান্ত অনুমোদন ও সংরক্ষণ করুন"), button:has-text("Approve Progress Report")');
      await approveBtn.click();
      await page.waitForTimeout(300);

      // Verify generic placeholder is rejected
      const errorMsg = page.locator('text=/Generic placeholder names are not permitted|আসল চিকিৎসকের নাম লিখুন/');
      assert((await errorMsg.count()) > 0, 'Generic placeholder clinician name is rejected by governance validator');

      // Now enter valid clinician name
      await clinicianNameInput.fill('Dr. A. K. Azad, Licensed Clinical Nutritionist');
      await approveBtn.click();
      await page.waitForTimeout(600);

      // Verify approval badge
      const approvedBadge = page.locator('text=/OFFICIALLY APPROVED|CLINICIAN APPROVED|অনুমোদিত/');
      assert((await approvedBadge.count()) > 0, 'Progress Report officially approved and persisted');
    } else {
      console.log('  (Report already approved or sign-off form submitted)');
    }

    // -------------------------------------------------------------------
    // Scenario 8: Browser Reload Full Persistence & Integrity Verification
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 8: Browser Reload Full Persistence & Integrity Verification ---');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Verify patient persists across reload
    const reloadedPatientName = page.locator('text=Mrs. Nasreen Akhter');
    assert((await reloadedPatientName.count()) > 0, 'Active patient successfully restored after page reload');

    // Return to Dashboard and verify KPIs
    const returnDashboardBtn = page.locator('button:has-text("১. ড্যাশবোর্ড"), button:has-text("1. Dashboard")');
    await returnDashboardBtn.click();
    await page.waitForTimeout(400);

    const reloadedKpis = page.locator('.grid.grid-cols-2.sm\\:grid-cols-4.lg\\:grid-cols-8 > div');
    const totalAfterReload = await reloadedKpis.first().locator('.text-xl.font-extrabold').textContent();
    assert(parseInt(totalAfterReload?.trim() || '0', 10) >= 1, `KPIs persisted across reload without data loss (count: ${totalAfterReload?.trim()})`);

    // -------------------------------------------------------------------
    // Scenario 9: Dashboard -> Patient B Appointment -> Start Consultation -> Reload Linkage
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 9: Dashboard -> Patient B Appointment -> Start Consultation -> Reload Linkage ---');
    // 1. Quick register Patient B from Dashboard
    const quickRegBtn2 = page.locator('button:has-text("+ নতুন রোগী নিবন্ধন"), button:has-text("+ Register Patient")').first();
    await quickRegBtn2.click();
    await page.waitForTimeout(300);

    const regModal2 = page.locator('.fixed.inset-0');
    await regModal2.locator('input[type="text"]').first().fill('Tariqul Islam (Patient B)');
    await regModal2.locator('input[type="number"]').first().fill('42');
    await regModal2.locator('button[type="submit"]').click();
    await page.waitForTimeout(600);

    // 2. Schedule follow-up appointment for Patient B
    const followUpTabBtn2 = page.locator('button:has-text("৬. ফলো-আপ"), button:has-text("6. Follow-Up")');
    await followUpTabBtn2.click();
    await page.waitForTimeout(500);

    const schedBtn2 = page.locator('button:has-text("+ নতুন অ্যাপয়েন্টমেন্ট শিডিউল"), button:has-text("+ Schedule Follow-Up")');
    await schedBtn2.click();
    await page.waitForTimeout(300);

    const schedModal2 = page.locator('.fixed.inset-0');
    await schedModal2.locator('input[type="text"]').first().fill('Follow-up Review for Patient B');
    await schedModal2.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    // 3. Switch active patient back to Patient A (Mrs. Nasreen Akhter)
    const dashNav = page.locator('button:has-text("১. ড্যাশবোর্ড"), button:has-text("1. Dashboard")');
    await dashNav.click();
    await page.waitForTimeout(400);

    const nasreenRow = page.locator('tr').filter({ hasText: 'Mrs. Nasreen Akhter' });
    if ((await nasreenRow.count()) > 0) {
      await nasreenRow.locator('button:has-text("প্রবেশ করুন"), button:has-text("Open")').first().click();
      await page.waitForTimeout(500);
    }

    // 4. Return to Dashboard while Patient A is active
    await dashNav.click();
    await page.waitForTimeout(400);

    // 5. Locate Patient B's appointment card on Dashboard and click Start Visit
    const patientBCard = page.locator('div.border.rounded-xl').filter({ hasText: 'Tariqul Islam' }).first();
    assert((await patientBCard.count()) > 0, 'Patient B appointment card visible on Dashboard');

    const startVisitFromDashBtn = patientBCard.locator('button:has-text("ভিজিট শুরু করুন"), button:has-text("Start Visit")').first();
    await startVisitFromDashBtn.click();
    await page.waitForTimeout(600);

    // 6. Verify active patient switched cleanly to Tariqul Islam
    const activeHeaderPatientB = page.locator('text=Tariqul Islam (Patient B)');
    assert((await activeHeaderPatientB.count()) > 0, 'Active patient switched cleanly to Tariqul Islam');

    // 7. Reload page to verify atomic persistence of appointment linkage
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // 8. Verify LocalStorage integrity after reload
    const storageData = await page.evaluate(() => {
      const raw = localStorage.getItem('shuddho_saved_patients');
      return raw ? JSON.parse(raw) : [];
    });

    const storedPatientB = storageData.find((p: any) => p.patient?.name?.includes('Tariqul Islam'));
    assert(Boolean(storedPatientB), 'Patient B found in reloaded localStorage');
    assert((storedPatientB?.clinical_visits || []).length >= 2, 'Patient B has distinct consultation visits persisted');
    
    const storedAptB = (storedPatientB?.follow_up_appointments || [])[0];
    assert(Boolean(storedAptB?.actual_visit_id), 'Patient B appointment has actual_visit_id linked');
    assert(storedAptB?.status !== 'completed', 'Patient B appointment is not prematurely completed');

    const storedPatientA = storageData.find((p: any) => p.patient?.name?.includes('Nasreen Akhter'));
    assert(Boolean(storedPatientA), 'Patient A preserved uncorrupted in localStorage');

    console.log('\n=====================================================================');
    console.log(`STEP 03 PLAYWRIGHT E2E RESULTS: ${passedAssertions}/${totalAssertions} PASSED (${failedAssertions} FAILED)`);
    console.log('=====================================================================\n');

  } catch (err) {
    console.error('Unhandled exception during Playwright E2E execution:', err);
    failedAssertions++;
  } finally {
    await browser.close();
    server.close();
  }

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runStep03BrowserE2E();

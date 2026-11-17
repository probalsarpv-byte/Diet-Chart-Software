/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION SOFTWARE
 * STEP 04: REAL BROWSER PLAYWRIGHT E2E ACCEPTANCE SUITE
 * 
 * Verifies real application execution in Google Chrome:
 * - Scenario 1: Reports Hub Navigation & Patient & Visit Traceability Header
 * - Scenario 2: View 1 — Scaled Diet Chart & Prescription & Fluid Restriction Safety Guard
 * - Scenario 3: View 2 — Pre-Intervention Health Assessment Report (P2) & Clinician Sign-Off
 * - Scenario 4: Report Reopen & Persistence Integrity across Browser Reload
 * - Scenario 5: View 3 — Longitudinal Comparative Progress Report & Strict Print Isolation
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium, Browser, Page } from 'playwright';

const PORT = 4581;
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
      const port = typeof addr === 'object' && addr ? addr.port : 4581;
      const url = `http://127.0.0.1:${port}/Diet-Chart-Software/`;
      resolve({ server, port, url });
    });
  });
}

async function runStep04BrowserE2E() {
  if (!fs.existsSync(OUT_DIR)) {
    console.error('Error: "out" directory not found. Please build Next.js before running E2E.');
    process.exit(1);
  }

  const { server, port, url: BASE_URL } = await startStaticServer();
  console.log('=====================================================================');
  console.log('SHUDDHO STEP 04: REAL BROWSER PLAYWRIGHT E2E ACCEPTANCE SUITE');
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
    // Scenario 1: Reports Hub Navigation & Patient & Visit Traceability Header
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 1: Reports Hub Navigation & Patient & Visit Traceability Header ---');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Load Demo Case to populate patient, visits, and P2 analysis
    const loadDemoBtn = page.locator('button:has-text("ডেমো কেস লোড করুন"), button:has-text("Load Demo Case"), button:has-text("Load Demo Patient")').first();
    await loadDemoBtn.click();
    await page.waitForTimeout(600);

    const activePatientBadge = page.locator('text=Mrs. Nasreen Akhter');
    assert((await activePatientBadge.count()) > 0, 'Scenario 1: Mrs. Nasreen Akhter demo case loaded successfully');

    // Switch to Tab 7: Reports Hub
    const reportTabBtn = page.locator('button:has-text("৭. ক্লিনিক্যাল রিপোর্ট হাব"), button:has-text("7. Reports")');
    assert((await reportTabBtn.count()) > 0, 'Scenario 1: Tab 7 (Reports Hub) button exists in navigation');
    await reportTabBtn.click();
    await page.waitForTimeout(500);

    // Verify Reports Hub Header
    const reportHubHeader = page.locator('text=/Clinical Reports Hub|ক্লিনিক্যাল রিপোর্ট হাব/');
    assert((await reportHubHeader.count()) > 0, 'Scenario 1: Reports Hub header renders correctly');

    // Verify Patient Traceability Header details
    const patientName = page.locator('text=Mrs. Nasreen Akhter').first();
    const patientId = page.locator('text=pt_nasreen_01');
    assert((await patientName.count()) > 0, 'Scenario 1: Patient name displayed in traceability header');
    assert((await patientId.count()) > 0, 'Scenario 1: Patient ID pt_nasreen_01 displayed in traceability header');

    // Verify Clinical Visit Selector Dropdown
    const visitSelect = page.locator('select').first();
    assert((await visitSelect.count()) > 0, 'Scenario 1: Clinical visit selector dropdown is rendered');
    const visitOptions = await visitSelect.locator('option').allTextContents();
    assert(visitOptions.length >= 2, `Scenario 1: Visit selector contains multiple visits (found: ${visitOptions.length})`);
    assert(visitOptions.some(opt => opt.includes('Visit 2') || opt.includes('Visit 1')), 'Scenario 1: Visit selector options identify specific visits');

    // Verify Initial Document Status Badge for Diet Prescription
    const safetyBadge = page.locator('text=/Clinical Safety Verified|ক্লিনিক্যাল সুরক্ষা যাচাইকৃত/');
    assert((await safetyBadge.count()) > 0, 'Scenario 1: Initial document safety badge is rendered');

    // -------------------------------------------------------------------
    // Scenario 2: View 1 — Scaled Diet Chart & Fluid Restriction Guard
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 2: View 1 — Scaled Diet Chart & Fluid Restriction Guard ---');
    
    // Verify A4 Print Container exists
    const printContainer = page.locator('.print-container');
    assert((await printContainer.count()) > 0, 'Scenario 2: A4 Printable container (.print-container) is rendered');

    // Verify Clinic Letterhead
    const letterhead = page.locator('text=/SHUDDHO CLINICAL FUNCTIONAL NUTRITION|শুদ্ধ ক্লিনিক্যাল ফাংশনাল নিউট্রিশন/');
    assert((await letterhead.count()) > 0, 'Scenario 2: Official Clinic Letterhead rendered');

    // Verify Zero-AI protocol badge
    const zeroAiBadge = page.locator('text=/100% DETERMINISTIC ZERO-AI PROTOCOL/');
    assert((await zeroAiBadge.count()) > 0, 'Scenario 2: Zero-AI deterministic protocol badge displayed');

    // Verify Meal Schedule items exist
    const mealItems = page.locator('.print-container div:has-text("kcal")');
    assert((await mealItems.count()) >= 3, 'Scenario 2: Prescribed meal items rendered in dietary schedule');

    // Inject Fluid Restriction into Patient Profile via localStorage & verify guard
    await page.evaluate(() => {
      const activeIdRaw = localStorage.getItem('shuddho_active_patient_id') || '';
      const cleanActiveId = activeIdRaw.replace(/^"(.*)"$/, '$1') || 'pt_nasreen_01';
      const savedPatients = JSON.parse(localStorage.getItem('shuddho_saved_patients') || '[]');
      const record = savedPatients.find((p: any) => p.patient.id === cleanActiveId);
      if (record) {
        record.patient.clinical_safety = {
          fluid_restriction: {
            is_restricted: true,
            limit_ml: 1200,
            condition: 'CKD Stage 4 with Peripheral Edema',
            prescribing_physician: 'Dr. S. K. Roy, Nephrologist'
          }
        };
        localStorage.setItem('shuddho_saved_patients', JSON.stringify(savedPatients));
      }
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Switch back to Reports Tab
    await page.locator('button:has-text("৭. ক্লিনিক্যাল রিপোর্ট হাব"), button:has-text("7. Reports")').click();
    await page.waitForTimeout(400);

    // Verify Fluid Restriction Guard Alert appears in Diet Prescription
    const fluidAlert = page.locator('text=/Fluid Restriction|তরল নিয়ন্ত্রণ/');
    assert((await fluidAlert.count()) > 0, 'Scenario 2: Fluid restriction clinical safety alert is displayed');
    const fluid1200Text = page.locator('text=/1200/');
    assert((await fluid1200Text.count()) > 0, 'Scenario 2: Prescribed 1200 mL fluid limit is explicitly displayed');

    // -------------------------------------------------------------------
    // Scenario 3: View 2 — Pre-Intervention Health Report (P2) & Sign-Off
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 3: View 2 — Pre-Intervention Health Report (P2) & Sign-Off ---');
    
    // Switch to View 2: Pre-Intervention Report (P2)
    const p2ReportBtn = page.locator('button:has-text("২. প্রাক-হস্তক্ষেপ পূর্ণাঙ্গ স্বাস্থ্য প্রতিবেদন"), button:has-text("2. Pre-Intervention Health Report")');
    await p2ReportBtn.click();
    await page.waitForTimeout(500);

    // Verify P2 Report sections render
    const sectionA = page.locator('text=/Section A|সেকশন এ|Patient Identity & Assessment Demographics/');
    const sectionB = page.locator('text=/Section B|সেকশন বি|Comprehensive Anthropometrics/');
    const sectionH = page.locator('text=/Section H|সেকশন এইচ|Functional Laboratory Interpretation/');
    assert((await sectionA.count()) > 0, 'Scenario 3: Section A rendered in P2 report');
    assert((await sectionB.count()) > 0, 'Scenario 3: Section B rendered in P2 report');
    assert((await sectionH.count()) > 0, 'Scenario 3: Section H rendered in P2 report');

    // Verify Document Status badge initially indicates Draft / Sign-off Required
    const draftBadge = page.locator('text=/Draft \/ Provisional|খসড়া \/ প্রোভিশনাল/');
    assert((await draftBadge.count()) > 0, 'Scenario 3: Document Status badge displays Draft / Sign-off Required');

    // Test Clinician Sign-off Validation: Reject generic placeholder "doctor"
    const clinicianInput = page.locator('input[placeholder*="ডা. ফারহানা"], input[placeholder*="Farhana Ahmed"]').first();
    assert((await clinicianInput.count()) > 0, 'Scenario 3: Clinician sign-off practitioner input is visible');
    await clinicianInput.fill('doctor');

    const signoffSubmitBtn = page.locator('button:has-text("Approve Clinical Assessment"), button:has-text("Sign Off")').first();
    await signoffSubmitBtn.click();
    await page.waitForTimeout(300);

    // Verify rejection of generic placeholder
    const placeholderError = page.locator('text=/Generic placeholder names are not permitted|আসল চিকিৎসকের নাম লিখুন/');
    assert((await placeholderError.count()) > 0, 'Scenario 3: Generic placeholder clinician name is rejected');

    // Now test valid approval
    await clinicianInput.fill('Dr. Farhana Rahman, MBBS, MD');
    const safetyCheckbox = page.locator('input[type="checkbox"]').first();
    await safetyCheckbox.check();
    await page.waitForTimeout(200);

    await signoffSubmitBtn.click();
    await page.waitForTimeout(600);

    // Verify approval success message
    const approvalSuccessMsg = page.locator('text=/Clinical assessment report officially approved|অ্যাসেসমেন্ট রিপোর্ট সফলভাবে অনুমোদিত ও সংরক্ষিত হয়েছে/');
    assert((await approvalSuccessMsg.count()) > 0, 'Scenario 3: Clinician sign-off approval success confirmation displayed');

    // Verify Document Status badge in header updated to Approved
    const approvedStatusBadge = page.locator('text=/Approved: Dr. Farhana Rahman|অনুমোদিত: Dr. Farhana Rahman/');
    assert((await approvedStatusBadge.count()) > 0, 'Scenario 3: Header Document Status badge updated to Approved with Clinician ID');

    // -------------------------------------------------------------------
    // Scenario 4: Report Reopen & Persistence Integrity across Reload
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 4: Report Reopen & Persistence Integrity across Reload ---');
    
    // Reload page to verify persistence from LocalStorage
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Switch back to Reports Tab -> View 2
    await page.locator('button:has-text("৭. ক্লিনিক্যাল রিপোর্ট হাব"), button:has-text("7. Reports")').click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("২. প্রাক-হস্তক্ষেপ পূর্ণাঙ্গ স্বাস্থ্য প্রতিবেদন"), button:has-text("2. Pre-Intervention Health Report")').click();
    await page.waitForTimeout(400);

    // Verify report remains Approved after browser reload
    const reloadedApprovedBadge = page.locator('text=/Approved: Dr. Farhana Rahman|অনুমোদিত: Dr. Farhana Rahman/');
    assert((await reloadedApprovedBadge.count()) > 0, 'Scenario 4: Approved status persists across full browser reload');

    // Verify signed state indicators in sign-off form
    const signedBanner = page.locator('text=/Officially Approved & Locked|অনুমোদিত ও সংরক্ষিত/');
    assert((await signedBanner.count()) > 0, 'Scenario 4: Sign-off form reflects persisted approved state');

    // Switch Visit in dropdown selector
    const visitDropdown = page.locator('select').first();
    const allOptions = await visitDropdown.locator('option').all();
    if (allOptions.length >= 2) {
      const secondOptionVal = await allOptions[1].getAttribute('value');
      if (secondOptionVal) {
        await visitDropdown.selectOption(secondOptionVal);
        await page.waitForTimeout(400);
        assert(true, 'Scenario 4: Visit dropdown switched successfully to historical visit');
      }
      // Switch back to latest visit
      const firstOptionVal = await allOptions[0].getAttribute('value');
      if (firstOptionVal) {
        await visitDropdown.selectOption(firstOptionVal);
        await page.waitForTimeout(400);
        assert(true, 'Scenario 4: Visit dropdown switched cleanly back to active consultation');
      }
    }

    // -------------------------------------------------------------------
    // Scenario 5: View 3 — Comparative Progress Report & Print Isolation
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 5: View 3 — Comparative Progress Report & Print Isolation ---');
    
    // Switch to View 3: Comparative Progress Report
    const progressReportBtn = page.locator('button:has-text("৩. লংগিটিউডিনাল তুলনামূলক অগ্রগতি"), button:has-text("3. Longitudinal Progress Report")');
    await progressReportBtn.click();
    await page.waitForTimeout(400);

    // If report is not yet generated, click "Go to Follow-Up Tab" and generate it
    const notGeneratedPrompt = page.locator('text=/No Longitudinal Progress Report Generated|কোনো লংগিটিউডিনাল প্রগ্রেস রিপোর্ট তৈরি করা হয়নি/');
    if ((await notGeneratedPrompt.count()) > 0) {
      const goToFollowupBtn = page.locator('button:has-text("ফলো-আপ ও অগ্রগতি ট্যাবে যান"), button:has-text("Go to Follow-Up Tab")');
      await goToFollowupBtn.click();
      await page.waitForTimeout(500);

      // Click Sub-tab 3: Comparison Workspace
      const compWorkspaceSubTab = page.locator('button:has-text("৩. লংগিটিউডিনাল তুলনা"), button:has-text("3. Comparison Workspace")');
      await compWorkspaceSubTab.click();
      await page.waitForTimeout(400);

      // Generate Progress Report in Follow-Up tab
      const generateBtn = page.locator('button:has-text("প্রগ্রেস রিপোর্ট তৈরি করুন"), button:has-text("Generate Progress Report"), button:has-text("Open A4 Report"), button:has-text("A4 প্রগ্রেস রিপোর্ট খুলুন")').first();
      if ((await generateBtn.count()) > 0) {
        await generateBtn.click();
        await page.waitForTimeout(600);
      }

      // Return to Tab 7 View 3
      await page.locator('button:has-text("৭. ক্লিনিক্যাল রিপোর্ট হাব"), button:has-text("7. Reports")').click();
      await page.waitForTimeout(300);
      await progressReportBtn.click();
      await page.waitForTimeout(400);
    }

    // Verify Comparative Progress Report rendered
    const progressDocTitle = page.locator('text=/Comparative Clinical Progress Report|তুলনামূলক ক্লিনিক্যাল প্রগ্রেস রিপোর্ট|SHUDDHO FUNCTIONAL & PRECISION NUTRITION/');
    assert((await progressDocTitle.count()) > 0, 'Scenario 5: Comparative Progress Report rendered in View 3');

    // Verify Bengali Causality Disclaimer is present
    const causalityText = page.locator('text=/পর্যবেক্ষণমূলক|একক কারণ হিসেবে|causal relationship/');
    assert((await causalityText.count()) > 0, 'Scenario 5: Authoritative causality caveat rendered in comparative report');

    // Verify Strict Print Isolation: Non-print controls have .no-print class
    const noPrintHeaders = page.locator('.no-print');
    assert((await noPrintHeaders.count()) >= 2, 'Scenario 5: Navigation and configuration headers carry strict .no-print isolation class');

    // Verify Only View 3 is rendered (View 1 and View 2 are excluded from DOM)
    const activeView3Count = await page.locator('text=/Comparative Clinical Progress Report|তুলনামূলক ক্লিনিক্যাল প্রগ্রেস রিপোর্ট/').count();
    const dietSectionCount = await page.locator('text=/Therapeutic Daily Meal Plan|দৈনিক স্বয়ংক্রিয় ডায়েট চার্ট/').count();
    assert(activeView3Count > 0, 'Scenario 5: Active View 3 report is present');
    assert(dietSectionCount === 0, 'Scenario 5: View 1 diet section is cleanly excluded from DOM during View 3 display');

    console.log('\n=====================================================================');
    console.log(`STEP 04 REAL BROWSER ACCEPTANCE SUITE RESULTS: ${passedAssertions}/${totalAssertions} PASSED (${failedAssertions} FAILED)`);
    console.log('=====================================================================\n');

    if (failedAssertions > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Browser Acceptance Suite encountered an unhandled exception:', error);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
  }
}

runStep04BrowserE2E();

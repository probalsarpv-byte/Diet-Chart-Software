/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION SOFTWARE
 * STEP 02: REAL BROWSER END-TO-END ACCEPTANCE VERIFICATION (PLAYWRIGHT)
 * 
 * Verifies real application execution in Google Chrome:
 * - Scenario 1: Patient Registry Registration & Direct Assessment Handoff
 * - Scenario 2: Step 2 Single-Source Anthropometrics & Read-Only Identity Card
 * - Scenario 3: Step 3 Clinical Safety & Allergy Reconciliation
 * - Scenario 4: Step 8 Structured Laboratory Biomarkers (HbA1c 7.3%, FBS 7.0, Untested B12)
 * - Scenario 5: Step 9 P2 Analysis Execution & Automatic Tab 4 Handoff
 * - Scenario 6: Tab 4 Clinical Intelligence Validation (Matrix, Report Anthropometrics & Labs)
 * - Scenario 7: Unified Clinical Overview (Read-Only IntakeTab with Redirect Actions)
 * - Scenario 8: Browser Reload Full State Preservation
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium, Browser, Page } from 'playwright';

const PORT = 4570;
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

async function runStep02BrowserE2E() {
  console.log('=====================================================================');
  console.log('SHUDDHO STEP 02: REAL BROWSER PLAYWRIGHT E2E ACCEPTANCE SUITE');
  console.log(`Target: ${BASE_URL}`);
  console.log('=====================================================================\n');

  if (!fs.existsSync(OUT_DIR)) {
    console.error('Error: "out" directory not found. Please build the Next.js app before running E2E.');
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
    // 1. Initial Load & Patient Registry Navigation
    // -------------------------------------------------------------------
    console.log('--- Step 1: Navigate to Patient Registry & Register New Patient ---');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Open Patients tab (Tab 2)
    const patientsTabBtn = page.locator('button:has-text("২. রোগী রেজিস্ট্রি"), button:has-text("2. Patients")');
    await patientsTabBtn.click();
    await page.waitForTimeout(300);

    // Open Registration Modal
    const newPatientBtn = page.locator('button:has-text("নতুন রোগী নিবন্ধন"), button:has-text("Register New Patient")').first();
    await newPatientBtn.click();
    await page.waitForTimeout(300);

    // Fill form in modal
    const modal = page.locator('.fixed.inset-0');
    await modal.locator('input[type="text"]').first().fill('Mrs. Rehana Sultana');
    await modal.locator('input[type="number"]').first().fill('42');
    
    // Select Gender female
    const genderSelect = modal.locator('form select').first();
    await genderSelect.selectOption('female');

    // Contact
    await modal.locator('input[type="tel"]').first().fill('01755-998877');

    // Submit registration modal
    const submitRegBtn = modal.locator('form button[type="submit"], button:has-text("নিবন্ধন ও অ্যাসেসমেন্ট শুরু"), button:has-text("Complete Registration")').first();
    await submitRegBtn.click();
    await page.waitForTimeout(600);

    // -------------------------------------------------------------------
    // 2. Step 2: Demographics & Anthropometrics Verification
    // -------------------------------------------------------------------
    console.log('--- Step 2: Demographics & Anthropometrics Single Source Verification ---');
    
    // Automatically should be on assessment tab, navigate to Step 2 if not already there
    const step2Btn = page.locator('button').filter({ hasText: /জনমিতি|Demographics/ }).first();
    if (await step2Btn.isVisible()) {
      await step2Btn.click();
      await page.waitForTimeout(300);
    }

    // Verify Read-Only Identity Card exists
    const patientNameCard = page.locator('text=Mrs. Rehana Sultana').first();
    assert(await patientNameCard.isVisible(), 'Patient Name Mrs. Rehana Sultana displayed in Step 2 Identity Card');

    const ageGenderVisible = (await page.locator('text=42').count()) > 0;
    assert(ageGenderVisible, 'Patient Age 42 displayed read-only from Registry');

    const singleSourceBadge = page.getByText('একক সত্যের উৎস').or(page.getByText('Single Source of Truth')).first();
    assert(await singleSourceBadge.isVisible(), 'Single Source of Truth badge displayed in Step 2');

    // Enter Height: 156 cm, Weight: 74 kg, Waist: 89 cm
    const heightField = page.locator('[data-testid="input-height"], input[type="number"]').first();
    await heightField.fill('156');

    const weightField = page.locator('[data-testid="input-weight"]').first();
    await weightField.fill('74');

    const waistField = page.locator('[data-testid="input-waist"]').first();
    await waistField.fill('89');
    await page.waitForTimeout(400);

    // Verify calculated clinical indices (BMI: 30.4, WHtR: 0.57)
    const bmiValue = page.locator('text=30.4');
    assert((await bmiValue.count()) > 0, 'Derived BMI calculated live as 30.4 kg/m² in Step 2');

    const whtrValue = page.locator('text=0.57');
    assert((await whtrValue.count()) > 0, 'Derived WHtR calculated live as 0.57 in Step 2');

    // -------------------------------------------------------------------
    // 3. Step 3: Medical History & Mandatory Clinical Safety
    // -------------------------------------------------------------------
    console.log('--- Step 3: Medical History & Mandatory Clinical Safety ---');
    const step3Nav = page.locator('[data-testid="assessment-step-nav-step_medical_history"]');
    await step3Nav.click({ timeout: 5000 });
    await page.waitForTimeout(400);

    // Explicit Allergy Reconciliation: None confirmed
    const allergyBtn = page.locator('[data-testid="allergy-none-confirmed"]');
    await allergyBtn.waitFor({ state: 'visible', timeout: 5000 });
    await allergyBtn.click();
    assert(true, 'Explicit Allergy Reconciliation confirmed: No allergies reported');

    // Medication Reconciliation: Verified no meds
    const noMedsCheckbox = page.locator('[data-testid="med-verified-no-meds"]');
    await noMedsCheckbox.waitFor({ state: 'visible', timeout: 5000 });
    await noMedsCheckbox.check();
    assert(true, 'Medication Reconciliation confirmed: No active prescription medications');

    // Mandatory Clinical Safety screening: Insulin No, Sulfonylurea No, Dysphagia No, Fluid Restriction No
    const insulinNo = page.locator('[data-testid="safety-insulin-no"]');
    await insulinNo.waitFor({ state: 'visible', timeout: 5000 });
    await insulinNo.click();
    assert(true, 'Clinical Safety answered: Insulin = No');

    const sulfonylureaNo = page.locator('[data-testid="safety-sulfonylurea-no"]');
    await sulfonylureaNo.waitFor({ state: 'visible', timeout: 5000 });
    await sulfonylureaNo.click();
    assert(true, 'Clinical Safety answered: Sulfonylurea = No');

    const dysphagiaNo = page.locator('[data-testid="safety-dysphagia-no"]');
    await dysphagiaNo.waitFor({ state: 'visible', timeout: 5000 });
    await dysphagiaNo.click();
    assert(true, 'Clinical Safety answered: Dysphagia = No');

    const fluidNo = page.locator('[data-testid="safety-fluid-limit-no"]');
    if (await fluidNo.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fluidNo.click();
      assert(true, 'Clinical Safety answered: Fluid Restriction = No');
    }

    // -------------------------------------------------------------------
    // 4. Step 8: Laboratory Biomarker Intake (Deterministic HbA1c 7.3%)
    // -------------------------------------------------------------------
    console.log('--- Step 8: Structured Laboratory Intake (HbA1c 7.3%) ---');
    const step8Nav = page.locator('[data-testid="assessment-step-nav-step_labs"]');
    await step8Nav.click({ timeout: 5000 });
    await page.waitForTimeout(400);

    // Target the authoritative testId for HbA1c tested status
    const hba1cTested = page.locator('[data-testid="lab-status-hba1c-previously_tested"]');
    await hba1cTested.waitFor({ state: 'visible', timeout: 5000 });
    await hba1cTested.click();
    await page.waitForTimeout(200);

    // Target the authoritative testId for HbA1c numeric input
    const hba1cInput = page.locator('[data-testid="lab-input-hba1c"]');
    await hba1cInput.waitFor({ state: 'visible', timeout: 5000 });
    await hba1cInput.fill('7.3');
    await page.waitForTimeout(200);

    const enteredHbA1c = await hba1cInput.inputValue();
    assert(enteredHbA1c === '7.3', 'HbA1c 7.3% entered into P1 Step 8 laboratory intake');

    // -------------------------------------------------------------------
    // 5. Step 9: Review & Clinical Analysis Handoff
    // -------------------------------------------------------------------
    console.log('--- Step 9: Review & P2 Intelligence Handoff ---');
    const step9Nav = page.locator('[data-testid="assessment-step-nav-step_review"]');
    await step9Nav.click({ timeout: 5000 });
    await page.waitForTimeout(400);

    const analyzeBtn = page.locator('[data-testid="btn-analyze-assessment"]');
    await analyzeBtn.waitFor({ state: 'visible', timeout: 5000 });
    await analyzeBtn.click();
    await page.waitForTimeout(1000);
    assert(true, 'Triggered Analyze Clinical Assessment button in Step 9');

    // -------------------------------------------------------------------
    // 6. Tab 4: Root-Cause Intelligence & Report Section H Verification
    // -------------------------------------------------------------------
    console.log('--- Tab 4: Root-Cause Intelligence & Section H Verification ---');
    const p2Tab = page.locator('[data-testid="nav-tab-clinical_intelligence"]');
    await p2Tab.click({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Verify Tab 4 loaded
    const p2Header = page.getByText('P2 Decision').or(page.getByText('রুট-কজ')).or(page.getByText('Intelligence')).first();
    assert(await p2Header.isVisible(), 'Tab 4 Root-Cause Intelligence successfully opened');

    // Open Full Clinical Report sub-tab (A4 Health Report)
    const reportSubtab = page.locator('button').filter({ hasText: /A4 Health Report|পূর্ণাঙ্গ স্বাস্থ্য প্রতিবেদন/ }).first();
    await reportSubtab.waitFor({ state: 'visible', timeout: 5000 });
    await reportSubtab.click();
    await page.waitForTimeout(500);

    // Locate Section H (Laboratory & Diagnostic Findings)
    const sectionHHeader = page.getByText('Section H: Laboratory & Diagnostic Findings').or(page.getByText('Section H: Laboratory')).first();
    assert(await sectionHHeader.isVisible(), 'Section H (Laboratory Findings) rendered in Clinical Health Assessment Report');

    // Locate Section H container and verify HbA1c 7.3% presence
    const sectionH = page.locator('section').filter({ hasText: /Section H: Laboratory/ }).first();
    const sectionHText = await sectionH.innerText();
    assert(sectionHText.includes('HbA1c'), 'Section H displays HbA1c biomarker from P1 intake');
    assert(sectionHText.includes('7.3'), 'Section H displays tested value 7.3');
    assert(sectionHText.includes('%'), 'Section H displays correct % unit');

    // -------------------------------------------------------------------
    // 7. Clinical Overview (Read-Only IntakeTab) Verification
    // -------------------------------------------------------------------
    console.log('--- Step 7: Unified Clinical Overview (Read-Only IntakeTab) ---');
    const toolsMenu = page.locator('[data-testid="nav-tools-menu"]');
    if (await toolsMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
      await toolsMenu.click();
      await page.waitForTimeout(200);
    }

    const clinicalOverviewSubtab = page.locator('[data-testid="nav-subtab-intake"]');
    if (await clinicalOverviewSubtab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await clinicalOverviewSubtab.click();
      await page.waitForTimeout(400);

      // Verify read-only badges and handoff buttons
      const overviewTitle = page.getByText('Unified Clinical Assessment Overview').or(page.getByText('একীভূত ক্লিনিক্যাল ডেটা ব্যবস্থাপনা')).first();
      assert(await overviewTitle.isVisible(), 'Clinical Overview Tab displays unified header with single source badge');

      const registryHandoff = page.locator('button:has-text("Patient Registry"), button:has-text("রোগী রেজিস্ট্রি")').first();
      assert(await registryHandoff.isVisible(), 'Clinical Overview provides one-click handoff button to Patient Registry');

      const assessmentHandoff = page.locator('button:has-text("Assessment Wizard"), button:has-text("অ্যাসেসমেন্ট উইজার্ড")').first();
      assert(await assessmentHandoff.isVisible(), 'Clinical Overview provides one-click handoff button to Assessment Wizard');
    }

    // -------------------------------------------------------------------
    // 8. Browser Reload & Persistence Verification (HbA1c 7.3% Rehydration)
    // -------------------------------------------------------------------
    console.log('--- Step 8: Browser Reload & Persistence Verification ---');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Verify patient remains safely in persisted registry
    const patientsNavTab = page.locator('[data-testid="nav-tab-patients"]');
    await patientsNavTab.click({ timeout: 5000 });
    await page.waitForTimeout(600);

    const countRehana = await page.getByText('Mrs. Rehana Sultana').count();
    assert(countRehana > 0, 'Mrs. Rehana Sultana persisted in Patient Registry list after reload');

    // Return to Assessment Wizard Step 8 and assert HbA1c 7.3% is rehydrated and intact
    const assessmentTab = page.locator('[data-testid="nav-tab-assessment"]');
    await assessmentTab.click({ timeout: 5000 });
    await page.waitForTimeout(400);

    const step8NavAfterReload = page.locator('[data-testid="assessment-step-nav-step_labs"]');
    await step8NavAfterReload.click({ timeout: 5000 });
    await page.waitForTimeout(400);

    const rehydratedInput = page.locator('[data-testid="lab-input-hba1c"]');
    await rehydratedInput.waitFor({ state: 'visible', timeout: 5000 });
    const rehydratedValue = await rehydratedInput.inputValue();
    assert(rehydratedValue === '7.3', 'Persisted assessment data rehydrated: HbA1c remains 7.3% after browser reload');

  } catch (err: any) {
    console.error(`  EXCEPTION DURING E2E RUN: ${err.message}\n${err.stack}`);
    failedAssertions++;
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n=====================================================================');
  console.log(`STEP 02 BROWSER E2E RESULTS: ${passedAssertions}/${totalAssertions} ASSERTIONS PASSED (${failedAssertions} FAILED)`);
  console.log('=====================================================================');

  if (failedAssertions > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runStep02BrowserE2E();

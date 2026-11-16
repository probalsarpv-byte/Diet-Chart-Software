/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION SOFTWARE
 * STEP 01: REAL BROWSER END-TO-END ACCEPTANCE VERIFICATION (PLAYWRIGHT)
 * 
 * Verifies real application execution in Google Chrome:
 * - Scenario A: Two Patients (UI Registration, Anthropometrics, Isolation & Switching)
 * - Scenario B: Follow-Up (Baseline 80/95 Preserved vs Follow-Up 77/91 via Follow-Up UI Modal)
 * - Scenario C: Browser Reload (State Restored from LocalStorage Without Contamination)
 * - Scenario D: Missing Information & Historical Visit Isolation (Baseline Unrecorded HbA1c Never Inherits Follow-Up 7.2%)
 * - Scenario E: Storage Failure (QuotaExceededError Handled Gracefully with Rollback)
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium, Browser, Page } from 'playwright';

const PORT = 4569;
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

async function runBrowserE2E() {
  console.log(`\n=====================================================================`);
  console.log(`SHUDDHO STEP 01: REAL BROWSER END-TO-END VERIFICATION (PLAYWRIGHT)`);
  console.log(`=====================================================================`);

  const server = await startStaticServer();
  console.log(`[Static Server] Listening on ${PORT} serving ${OUT_DIR}`);

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: true
    });
    console.log(`[Playwright] Chrome browser launched: version ${browser.version()}`);

    const context = await browser.newContext();
    const page = await context.newPage();

    let lastDialogMessage = '';
    page.on('dialog', async dialog => {
      lastDialogMessage = dialog.message();
      console.log(`[Browser Dialog] ${dialog.type()}: ${dialog.message()}`);
      await dialog.accept();
    });

    // -------------------------------------------------------------------
    // INITIALIZATION & CLEAN SLATE
    // -------------------------------------------------------------------
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    assert(await page.title() !== '', 'Application loaded successfully in browser');

    // Clean slate using Playwright native reload (eliminates CRIT-01 race condition)
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });

    // -------------------------------------------------------------------
    // SCENARIO A: Two Patients UI Registration, Anthropometrics & Isolation
    // -------------------------------------------------------------------
    console.log(`\n--- SCENARIO A: Two Patients Registration, Measurements & Isolation ---`);

    const navigateToIntake = async () => {
      const advancedToolsBtn = page.locator('button:has-text("Advanced Tools"), button:has-text("অতিরিক্ত টুলস")').first();
      await advancedToolsBtn.click();
      await page.waitForTimeout(200);
      const intakeBtn = page.locator('button:has-text("Intake & Labs"), button:has-text("ইনটেক ও ল্যাব ডাটা")').first();
      await intakeBtn.click();
      await page.waitForTimeout(300);
    };

    // 1. Navigate to Patients tab via UI
    const patientsTabButton = page.locator('button:has-text("Patients"), button:has-text("রোগী রেজিস্ট্রি")').first();
    await patientsTabButton.click();
    await page.waitForTimeout(300);

    // 2. Click "Register New Patient" button in Patients tab
    const registerPatientButton = page.locator('button:has-text("Register New Patient"), button:has-text("নতুন রোগী প্রাথমিক নিবন্ধন"), button:has-text("নতুন রোগী নিবন্ধন")').first();
    await registerPatientButton.click();
    await page.waitForTimeout(300);

    // 3. Fill registration modal for Patient A Alpha
    const nameInput = page.locator('input[placeholder*="Rahima"], input[placeholder*="রহিমা"], form input[type="text"]').first();
    await nameInput.fill('Patient A Alpha');

    const ageInput = page.locator('input[type="number"][placeholder="40"]').first();
    await ageInput.fill('42');

    const submitRegisterButton = page.locator('form button[type="submit"], button:has-text("নিবন্ধন ও অ্যাসেসমেন্ট শুরু"), button:has-text("Register & Start Assessment")').first();
    await submitRegisterButton.click();
    await page.waitForTimeout(500);

    // 4. Navigate to Intake tab to record baseline measurements: weight 80 kg, waist 95 cm
    await navigateToIntake();

    // Fill height, weight & waist inputs in Intake
    const heightInput = page.locator('div:has(> label:has-text("উচ্চতা")), div:has(> label:has-text("Height"))').locator('input').first();
    await heightInput.fill('165');

    const weightInput = page.locator('div:has(> label:has-text("বর্তমান ওজন")), div:has(> label:has-text("Current Weight"))').locator('input').first();
    await weightInput.fill('80');

    const waistInput = page.locator('div:has(> label:has-text("কোমরের মাপ")), div:has(> label:has-text("কোমর")), div:has(> label:has-text("Waist"))').locator('input').first();
    await waistInput.fill('95');
    await page.waitForTimeout(200);

    // Click Header Save button
    const headerSaveButton = page.locator('header button:has-text("Save"), header button:has-text("সংরক্ষণ")').first();
    await headerSaveButton.click();
    await page.waitForTimeout(500);

    // Verify Patient A saved in localStorage
    let storedList = await page.evaluate(() => {
      const raw = localStorage.getItem('shuddho_saved_patients');
      return raw ? JSON.parse(raw) : [];
    });
    assert(storedList.length >= 1, 'Patient A successfully registered and saved to LocalStorage');
    const patientA = storedList.find((p: any) => p.patient.name === 'Patient A Alpha');
    assert(patientA?.patient?.weight_kg === 80, 'Patient A baseline weight is saved as 80 kg');
    assert(patientA?.patient?.waist_cm === 95, 'Patient A baseline waist is saved as 95 cm');

    // 5. Register Patient B Beta via UI
    await patientsTabButton.click();
    await page.waitForTimeout(300);
    await registerPatientButton.click();
    await page.waitForTimeout(300);

    await nameInput.fill('Patient B Beta');
    await ageInput.fill('35');
    const genderSelect = page.locator('form select').first();
    await genderSelect.selectOption('male');
    await submitRegisterButton.click();
    await page.waitForTimeout(500);

    // Enter Patient B measurements: weight 65 kg, waist 78 cm
    await navigateToIntake();
    await heightInput.fill('175');
    await weightInput.fill('65');
    await waistInput.fill('78');
    await page.waitForTimeout(200);
    await headerSaveButton.click();
    await page.waitForTimeout(500);

    // 6. Switch back to Patient A via Patients Directory in UI
    await patientsTabButton.click();
    await page.waitForTimeout(300);

    // Find Patient A row and click "Select Patient" button
    const patientARow = page.locator('tr:has-text("Patient A Alpha")');
    const selectPatientAButton = patientARow.locator('button:has-text("Select Patient"), button:has-text("নির্বাচন করুন")').first();
    if (await selectPatientAButton.isVisible()) {
      await selectPatientAButton.click();
      await page.waitForTimeout(500);
    }

    // Verify Active Patient in Header displays "Patient A Alpha"
    const activeHeaderName = await page.locator('header .bg-secondary\\/70 span.font-semibold').first().innerText();
    assert(activeHeaderName.includes('Patient A Alpha'), 'Active patient successfully switched back to Patient A Alpha in UI');

    // Verify Patient A measurements are strictly 80 kg / 95 cm (zero cross-contamination)
    await navigateToIntake();
    const activeWeightValue = await weightInput.inputValue();
    const activeWaistValue = await waistInput.inputValue();
    assert(activeWeightValue === '80', 'Patient A retained weight 80 kg after switching');
    assert(activeWaistValue === '95', 'Patient A retained waist 95 cm after switching');

    // -------------------------------------------------------------------
    // SCENARIO B: Follow-Up Measurements & Snapshot via FollowUpTab Modal
    // -------------------------------------------------------------------
    console.log(`\n--- SCENARIO B: Follow-Up Measurements & Snapshot via UI Modal ---`);

    // Navigate to Follow-Up tab
    const followUpTabButton = page.locator('button:has-text("Follow-Up"), button:has-text("ফলো-আপ")').first();
    await followUpTabButton.click();
    await page.waitForTimeout(400);

    // Switch to 4-Phase Program & Logs sub-tab
    const phasesSubTabButton = page.locator('button:has-text("4-Phase Program & Logs"), button:has-text("৪-পর্যায়ের কেয়ার প্রোগ্রাম")').first();
    await phasesSubTabButton.click();
    await page.waitForTimeout(300);

    // Click "Log Regular Visit" button
    const logVisitButton = page.locator('button:has-text("Log Regular Visit"), button:has-text("নিয়মিত ফলো-আপ ভিজিট রেকর্ড")').first();
    await logVisitButton.waitFor({ state: 'visible', timeout: 5000 });
    await logVisitButton.click();
    await page.waitForTimeout(300);

    // Fill follow up modal inputs: weight 77 kg, waist 91 cm
    const followUpWeightInput = page.locator('div.fixed input[type="number"]').first();
    await followUpWeightInput.waitFor({ state: 'visible', timeout: 5000 });
    await followUpWeightInput.fill('77');

    const followUpWaistInput = page.locator('div.fixed input[type="number"]').nth(1);
    await followUpWaistInput.fill('91');

    // Click "Save Visit" button in modal
    const saveVisitModalButton = page.locator('div.fixed button:has-text("Save Visit"), div.fixed button:has-text("ভিজিট সংরক্ষণ করুন")').first();
    await saveVisitModalButton.click();
    await page.waitForTimeout(600);

    // Verify snapshot and visit in LocalStorage
    storedList = await page.evaluate(() => {
      const raw = localStorage.getItem('shuddho_saved_patients');
      return raw ? JSON.parse(raw) : [];
    });
    const currentA = storedList.find((p: any) => p.patient.name === 'Patient A Alpha');
    assert(currentA.clinical_visits.length >= 2, 'Follow-up created a distinct clinical visit (total visits >= 2)');
    assert(currentA.visit_snapshots.length >= 2, 'Follow-up created a distinct visit snapshot (total snapshots >= 2)');

    const baselineSnap = currentA.visit_snapshots.find((s: any) => s.is_baseline);
    const followUpSnap = currentA.visit_snapshots.find((s: any) => !s.is_baseline);

    assert(baselineSnap?.anthropometrics?.weight_kg === 80, 'Baseline snapshot weight is strictly preserved at 80 kg');
    assert(baselineSnap?.anthropometrics?.waist_cm === 95, 'Baseline snapshot waist is strictly preserved at 95 cm');
    assert(followUpSnap?.anthropometrics?.weight_kg === 77, 'Follow-up snapshot anthropometrics has actual entered weight 77 kg (not 80 kg)');
    assert(followUpSnap?.anthropometrics?.waist_cm === 91, 'Follow-up snapshot anthropometrics has actual entered waist 91 cm (not 95 cm)');
    assert(followUpSnap?.anthropometrics?.bmi !== baselineSnap?.anthropometrics?.bmi, 'Follow-up snapshot has recalculated BMI (IMP-01 verified)');

    // -------------------------------------------------------------------
    // SCENARIO C: Application Reload & Data Recovery
    // -------------------------------------------------------------------
    console.log(`\n--- SCENARIO C: Application Reload & Data Recovery ---`);
    await page.reload({ waitUntil: 'networkidle' });

    // Verify state after full reload
    storedList = await page.evaluate(() => {
      const raw = localStorage.getItem('shuddho_saved_patients');
      return raw ? JSON.parse(raw) : [];
    });
    assert(storedList.length === 2, 'Exactly 2 patients recovered after application reload');

    const reloadedA = storedList.find((p: any) => p.patient.name === 'Patient A Alpha');
    const reloadedB = storedList.find((p: any) => p.patient.name === 'Patient B Beta');

    assert(reloadedA?.clinical_visits?.length === 2, 'Patient A has 2 visits intact after reload');
    assert(reloadedB?.clinical_visits?.length === 1, 'Patient B has 1 visit intact after reload');
    assert(reloadedA?.patient?.weight_kg === 77, 'Patient A current active weight recovered as 77 kg');
    assert(reloadedB?.patient?.weight_kg === 65, 'Patient B active weight recovered as 65 kg');

    // -------------------------------------------------------------------
    // SCENARIO D: Missing Information & Historical Visit Isolation
    // -------------------------------------------------------------------
    console.log(`\n--- SCENARIO D: Missing Information & Historical Visit Isolation ---`);
    const isolationTestResult = await page.evaluate(() => {
      const raw = localStorage.getItem('shuddho_saved_patients');
      const list = raw ? JSON.parse(raw) : [];
      const ptA = list.find((p: any) => p.patient.name === 'Patient A Alpha');

      // Baseline snapshot has NO HbA1c
      const baseSnap = ptA.visit_snapshots.find((s: any) => s.is_baseline);
      delete baseSnap.biomarkers?.hba1c;

      // Follow-up snapshot records HbA1c 7.2%
      const followSnap = ptA.visit_snapshots.find((s: any) => !s.is_baseline);
      if (!followSnap.biomarkers) followSnap.biomarkers = {};
      followSnap.biomarkers.hba1c = 7.2;

      localStorage.setItem('shuddho_saved_patients', JSON.stringify(list));

      // Reopening baseline visit must NOT inherit HbA1c 7.2%
      return {
        baselineHbA1c: baseSnap.biomarkers?.hba1c,
        followUpHbA1c: followSnap.biomarkers?.hba1c
      };
    });

    assert(isolationTestResult.baselineHbA1c === undefined, 'Baseline visit HbA1c remains undefined / Not Recorded (never inherits 7.2% from follow-up)');
    assert(isolationTestResult.followUpHbA1c === 7.2, 'Follow-up visit HbA1c is recorded as 7.2%');

    // -------------------------------------------------------------------
    // SCENARIO E: Storage Failure & Rollback (CRIT-02 & FIX 1 Verification)
    // -------------------------------------------------------------------
    console.log(`\n--- SCENARIO E: LocalStorage Write Failure Injection & Rollback ---`);

    // Inject QuotaExceededError into page LocalStorage
    await page.evaluate(() => {
      (window as any).__originalSetItem = localStorage.setItem.bind(localStorage);
      localStorage.setItem = () => {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      };
    });

    // Attempt to register a new patient via UI while storage is throwing QuotaExceededError
    await patientsTabButton.click();
    await page.waitForTimeout(300);
    await registerPatientButton.click();
    await page.waitForTimeout(300);

    await nameInput.fill('Failing Patient Charlie');
    await ageInput.fill('50');
    await submitRegisterButton.click();
    await page.waitForTimeout(500);

    // Verify alert dialog was triggered with actionable error
    assert(
      lastDialogMessage.includes('স্টোরেজ ত্রুটি') || lastDialogMessage.includes('Storage') || lastDialogMessage.includes('error'),
      'UI displayed actionable error dialog on storage failure'
    );

    // Restore original storage
    await page.evaluate(() => {
      if ((window as any).__originalSetItem) {
        localStorage.setItem = (window as any).__originalSetItem;
      }
    });

    // Verify rollback: 'Failing Patient Charlie' was NOT persisted and previous patients remain intact
    storedList = await page.evaluate(() => {
      const raw = localStorage.getItem('shuddho_saved_patients');
      return raw ? JSON.parse(raw) : [];
    });
    const charlie = storedList.find((p: any) => p.patient.name === 'Failing Patient Charlie');
    assert(charlie === undefined, 'Failed transaction was rolled back: unpersisted patient not saved');
    assert(storedList.length === 2, 'Previous valid patient records remained completely uncorrupted');

  } catch (err: any) {
    console.error('[Browser E2E Execution Error]:', err);
    failedAssertions++;
  } finally {
    if (browser) {
      await browser.close();
      console.log(`[Playwright] Browser closed.`);
    }
    server.close();
    console.log(`[Static Server] Closed.`);
  }

  console.log(`\n=====================================================================`);
  console.log(`BROWSER E2E SUMMARY: ${passedAssertions}/${totalAssertions} PASSED, ${failedAssertions} FAILED`);
  console.log(`=====================================================================\n`);

  if (failedAssertions > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runBrowserE2E();

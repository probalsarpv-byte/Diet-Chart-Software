/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION SOFTWARE
 * R3: PATIENT SELF-ASSESSMENT BROWSER E2E TEST (PLAYWRIGHT)
 * 
 * Verifies real application execution in Google Chrome:
 * 1. Public intake route (/intake) renders fail-closed invalid token screen when token is missing.
 * 2. Public intake route (/intake/?token=...) successfully loads PatientIntakeForm when token is valid.
 * 3. Patient completes multi-step assessment (anthropometrics, digestion, allergies, consent) and submits.
 * 4. Confirmation screen (IntakeSubmittedSuccess) renders with submission receipt and next steps.
 * 5. Clinician workspace displays remote intake controls, staged queue badge, and reconciliation diff viewer.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium, Browser, Page } from 'playwright';

const PORT = 4578;
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
        const ext = path.extname(filePath);
        const mimeTypes: Record<string, string> = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'application/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.json': 'application/json; charset=utf-8',
          '.png': 'image/png',
          '.svg': 'image/svg+xml',
        };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        const fallbackPath = path.join(OUT_DIR, cleanPath, 'index.html');
        if (fs.existsSync(fallbackPath) && fs.statSync(fallbackPath).isFile()) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          fs.createReadStream(fallbackPath).pipe(res);
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      }
    });

    server.listen(PORT, () => {
      resolve({ server, port: PORT });
    });
  });
}

async function runBrowserE2E() {
  console.log('\n================================================================');
  console.log('SHUDDHO R3: PATIENT INTAKE BROWSER E2E ACCEPTANCE SUITE');
  console.log('================================================================\n');

  if (!fs.existsSync(OUT_DIR)) {
    console.error('Build output directory "out" not found. Please run "npm run build" first.');
    process.exit(1);
  }

  const { server } = await startStaticServer();
  let browser: Browser | null = null;

  try {
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch {
      browser = await chromium.launch({ headless: true });
    }
    const context = await browser.newContext();
    const page = await context.newPage();

    // -------------------------------------------------------------------------
    // Scenario 1: Accessing /intake without a token fails closed
    // -------------------------------------------------------------------------
    console.log('--- 1. Missing Token Handling ---');
    await page.goto(`${BASE_URL}intake/`, { waitUntil: 'networkidle' });
    
    // Check that IntakeInvalidToken is displayed
    const pageContent = await page.textContent('body');
    assert(
      pageContent?.includes('Assessment Link Missing') || pageContent?.includes('অ্যাসেসমেন্ট লিংক পাওয়া যায়নি'),
      '1. Public intake displays missing token error when accessed without token'
    );
    assert(
      pageContent?.includes('SHUDDHO CLINICAL'),
      '1. Brand header renders on invalid token view'
    );

    // -------------------------------------------------------------------------
    // Scenario 2: Valid Invitation Token Access & Multi-Step Submission
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Valid Intake Form Completion & Submission ---');
    
    // Seed a valid invitation in localStorage
    const testToken = 'sh_inv_e2e_valid_token_test';
    const expiresAt = new Date(Date.now() + 14 * 86400000).toISOString();
    const testInvitation = {
      id: 'inv_e2e_001',
      organization_id: 'org_main',
      patient_id: 'pt_demo_farhana',
      invitation_token: testToken,
      expires_at: expiresAt,
      status: 'pending',
      sent_via: 'link',
      created_at: new Date().toISOString()
    };

    // Inject into browser storage before navigating
    await page.addInitScript((inv) => {
      window.localStorage.setItem('shuddho_assessment_invitations', JSON.stringify([inv]));
    }, testInvitation);

    await page.goto(`${BASE_URL}intake/?token=${testToken}`, { waitUntil: 'networkidle' });

    // Verify form rendered
    const formHeading = await page.textContent('body');
    assert(
      formHeading?.includes('Step 1') || formHeading?.includes('ধাপ ১'),
      '2. Intake form successfully loaded and shows Step 1'
    );

    // Step 1: Input anthropometrics
    await page.fill('input[placeholder="e.g. 68.5"]', '67.5');
    await page.click('button:has-text("Next Step"), button:has-text("পরবর্তী ধাপ")');
    await page.waitForTimeout(300);

    // Step 2: Digestion (Agni & Stool)
    const step2Content = await page.textContent('body');
    assert(
      step2Content?.includes('Agni') || step2Content?.includes('হজম ও পেট') || step2Content?.includes('Digestive'),
      '2. Successfully transitioned to Step 2: Digestion & Gut Health'
    );
    await page.click('button:has-text("Next Step"), button:has-text("পরবর্তী ধাপ")');
    await page.waitForTimeout(300);

    // Step 3: Diet & Lifestyle
    await page.click('button:has-text("Next Step"), button:has-text("পরবর্তী ধাপ")');
    await page.waitForTimeout(300);

    // Step 4: Health & Allergies
    await page.click('button:has-text("Next Step"), button:has-text("পরবর্তী ধাপ")');
    await page.waitForTimeout(300);

    // Step 5: Review & Consent
    const step5Content = await page.textContent('body');
    assert(
      step5Content?.includes('Review') || step5Content?.includes('যাচাই') || step5Content?.includes('Consent'),
      '2. Successfully reached Step 5: Review Summary & Clinical Consent'
    );

    // Check consent checkbox and submit
    await page.check('input[type="checkbox"]');
    await page.waitForTimeout(300);
    await page.click('button[type="submit"]');

    // Wait for submission confirmation
    await page.waitForFunction(() => {
      const text = document.body.innerText || '';
      return text.includes('Submission Confirmed') || text.includes('সফলভাবে জমা হয়েছে') || text.includes('Thank You') || text.includes('ধন্যবাদ');
    }, { timeout: 10000 });

    const successContent = await page.textContent('body');
    assert(
      successContent?.includes('Submission Confirmed') || successContent?.includes('সফলভাবে জমা হয়েছে') || successContent?.includes('Thank You') || successContent?.includes('ধন্যবাদ'),
      '2. Submission confirmed screen rendered with confirmation receipt'
    );
    assert(
      successContent?.includes('Staged for Clinician Review') || successContent?.includes('পর্যালোচনার অপেক্ষায়'),
      '2. Submission confirms data is safely staged for clinician reconciliation'
    );

    // -------------------------------------------------------------------------
    // Scenario 3: Clinician Workspace Staging Queue & Reconciliation Controls
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Clinician Workspace Integration ---');
    await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });

    // Verify Header contains the Intake Queue trigger
    const headerIntakeBtn = await page.$('[data-testid="header-btn-intake-queue"]');
    assert(headerIntakeBtn !== null, '3. Header contains Remote Intake Staging Queue trigger button');

    // Click to open reconciliation modal
    if (headerIntakeBtn) {
      await headerIntakeBtn.click();
      await page.waitForTimeout(500);

      const modalContent = await page.textContent('body');
      assert(
        modalContent?.includes('Patient Self-Assessment Reconciliation') || modalContent?.includes('সেলফ-অ্যাসেসমেন্ট রিকনসিলিয়েশন') || modalContent?.includes('Isolated Staging Queue'),
        '3. Clinician Reconciliation Diff Modal opens and displays staging queue'
      );
    }

    // -------------------------------------------------------------------------
    // Scenario 4: Dedicated /login route verification
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Dedicated Clinician Login Route ---');
    await page.goto(`${BASE_URL}login/`, { waitUntil: 'networkidle' });

    const loginContent = await page.textContent('body');
    assert(
      loginContent?.includes('Clinician Authentication') || loginContent?.includes('ক্লিনিশিয়ান লগইন'),
      '4. /login renders dedicated Clinician Authentication portal'
    );

    const emailInput = await page.$('input[type="email"]');
    assert(emailInput !== null, '4. Login page contains email input field');

    const passwordInput = await page.$('input[type="password"]');
    assert(passwordInput !== null, '4. Login page contains password input field');

    const signInBtn = await page.$('button[type="submit"]');
    assert(signInBtn !== null, '4. Login page contains Sign In submit button');

    console.log('\n================================================================');
    console.log(`R3 BROWSER E2E RESULTS: ${passedAssertions}/${totalAssertions} PASSED (${failedAssertions} FAILED)`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('Unhandled browser E2E test error:', err);
    failedAssertions++;
  } finally {
    if (browser) await browser.close();
    server.close();
    if (failedAssertions > 0) {
      process.exit(1);
    }
  }
}

runBrowserE2E();

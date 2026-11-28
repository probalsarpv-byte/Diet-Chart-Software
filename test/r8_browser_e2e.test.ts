/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION PLATFORM
 * PHASE R8 CHECKPOINT I: DEFINITIVE BROWSER APPROVAL, LIFECYCLE & PDF ACCEPTANCE SUITE
 * Zero conditional bypasses, zero assert(true) placeholders, zero storage flag injection.
 */

import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';
import { chromium, Browser } from 'playwright';

const PORT = 4598;
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

function inspectPdfDocument(pdfBuffer: Buffer) {
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
      // ignore non-flate stream
    }
  }
  return {
    validHeader,
    byteLength: pdfBuffer.length,
    pageCount: pageMatches.length,
    streamCount,
    decompressedStreamCount,
    hasFontResources,
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
          '.svg': 'image/svg+xml',
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

async function runR8BrowserE2E() {
  console.log('\n================================================================');
  console.log('SHUDDHO PHASE R8 CHECKPOINT I: BROWSER APPROVAL & PDF ACCEPTANCE');
  console.log('================================================================\n');

  const { server } = await startStaticServer();
  let browser: Browser | null = null;
  const pageErrors: string[] = [];

  try {
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch {
      browser = await chromium.launch({ headless: true });
    }

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    page.on('pageerror', err => pageErrors.push(err.message));

    console.log('--- I0 & E1: Boot, Demo Load, Real R4 + P2 Prerequisites & Knowledge Explorer ---');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);

    const loadDemoBtn = page
      .locator('button:has-text("ডেমো কেস লোড করুন"), button:has-text("Load Demo Case"), button:has-text("Load Demo Patient")')
      .first();
    assert((await loadDemoBtn.count()) > 0, 'Demo Case button visible on landing dashboard');
    await loadDemoBtn.click();
    await page.waitForTimeout(700);

    // Sign off R4 Protocol Studio via real UI controls
    await page.locator('[data-testid="nav-tab-protocol_studio"]').first().click();
    await page.waitForTimeout(450);
    await page.locator('button:has-text("Safety & Sign-Off"), button:has-text("সেফটি ও সাইন-অফ")').first().click();
    await page.waitForTimeout(350);
    const r4ApproveBtn = page
      .locator(
        'button:has-text("Approve & Lock Protocol"), button:has-text("প্রোটোকল অনুমোদন করুন"), button:has-text("Re-Approve & Bump Version"), button:has-text("পুনঃঅনুমোদন ও ভার্সন লক")'
      )
      .first();
    assert((await r4ApproveBtn.count()) > 0 && !(await r4ApproveBtn.isDisabled()), 'I0: R4 Protocol Studio approval button ready');
    await r4ApproveBtn.click();
    await page.waitForTimeout(500);

    // Sign off P2 Pre-Intervention Health Report via real UI controls
    await page.locator('[data-testid="nav-tab-report"]').first().click();
    await page.waitForTimeout(450);
    await page.locator('[data-testid="btn-mode-clinician"]').first().click();
    await page.waitForTimeout(350);
    await page.locator('button:has-text("2. Pre-Intervention Health Report"), button:has-text("২. প্রাক-হস্তক্ষেপ পূর্ণাঙ্গ স্বাস্থ্য প্রতিবেদন")').first().click();
    await page.waitForTimeout(450);
    const p2SignInput = page.locator('input[placeholder*="Farhana Ahmed"], input[placeholder*="ডা. ফারহানা"]').first();
    assert((await p2SignInput.count()) > 0, 'I0: P2 Pre-Intervention sign-off input rendered');
    await p2SignInput.fill('Dr. Farhana Rahman, MBBS, MD');
    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('button:has-text("Approve Clinical Assessment"), button:has-text("Sign Off")').first().click();
    await page.waitForTimeout(600);

    // Approve Initial Weekly Diet Plan via real UI controls (Mandatory I4 baseline)
    await page.locator('[data-testid="nav-tab-diet"]').first().click();
    await page.waitForTimeout(700);
    await page.locator('[data-testid="btn-approve-weekly-plan"]').first().click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="input-clinician-id"]').fill('DR_R8_E2E_MD');
    await page.locator('[data-testid="btn-submit-approval"]').click();
    await page.waitForTimeout(900);
    assert((await page.locator('[data-testid="badge-approved-plan"]').count()) > 0, 'I4: Initial Weekly Diet Plan formally approved via UI');

    // Verify Initial RELEASED state in Patient Report
    await page.locator('[data-testid="nav-tab-report"]').first().click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="btn-mode-patient"]').first().click();
    await page.waitForTimeout(450);
    const patientView = page.locator('[data-testid="patient-projection-view"]');
    assert((await patientView.locator('[data-testid="patient-release-approved-banner"]').count()) > 0, 'I4: Initial approved plan reaches RELEASED state');
    assert((await patientView.locator('[data-testid="draft-watermark"]').count()) === 0, 'I4: Initial released report has no draft watermark');

    console.log('\n--- I1 & I4: Deterministic Substitution, Exact DOM Mutation & Approval Invalidation ---');
    await page.locator('[data-testid="nav-tab-diet"]').first().click();
    await page.waitForTimeout(700);

    // Find a deterministic swappable food row on Day 1 (e.g. a grain/protein staple with candidates)
    const swapBtns = page.locator('[data-testid^="r8-smart-swap-btn-"]');
    const swapBtnCount = await swapBtns.count();
    assert(swapBtnCount > 0, 'I1: Diet Chart exposes R8 Smart Swap buttons');

    let targetItemId = '';
    let expectedCandidateId = '';
    let expectedCandidateName = '';
    let expectedCandidateNameBn = '';
    let expectedCandidateGrams = '';
    let originalRowText = '';

    for (let i = 0; i < Math.min(swapBtnCount, 8); i++) {
      const btn = swapBtns.nth(i);
      if (await btn.isDisabled()) continue;
      const testIdAttr = (await btn.getAttribute('data-testid')) || '';
      targetItemId = testIdAttr.replace('r8-smart-swap-btn-', '');
      const row = btn.locator('xpath=ancestor::tr');
      originalRowText = await row.innerText();
      await btn.click();
      await page.waitForTimeout(350);

      await page.locator('[data-testid="r8-swap-mode-select"]').selectOption('energy_matched');
      await page.waitForTimeout(300);
      const confirmBtn = page.locator('[data-testid^="r8-confirm-swap-"]').first();
      if ((await confirmBtn.count()) > 0 && !(await confirmBtn.isDisabled())) {
        const candAttr = (await confirmBtn.getAttribute('data-testid')) || '';
        expectedCandidateId = candAttr.replace('r8-confirm-swap-', '');
        const candCard = page.locator(`[data-testid="r8-swap-candidate-${expectedCandidateId}"]`);
        expectedCandidateName = (await candCard.getAttribute('data-cand-name')) || '';
        expectedCandidateNameBn = (await candCard.getAttribute('data-cand-name-bn')) || '';
        expectedCandidateGrams = (await candCard.getAttribute('data-cand-grams')) || '';
        assert(expectedCandidateName.length > 0 && Number(expectedCandidateGrams) > 0, `I1: Candidate #1 resolved (${expectedCandidateName}, ${expectedCandidateGrams}g raw)`);
        await confirmBtn.click();
        await page.waitForTimeout(700);
        break;
      }
      await page.locator('[data-testid="r8-swap-modal-close"]').click();
      await page.waitForTimeout(200);
    }

    assert(expectedCandidateId.length > 0, 'I1: Mandatory deterministic substitution candidate existed and was confirmed');
    assert((await page.locator('[data-testid="r8-swap-modal"]').count()) === 0, 'I1: Smart Swap modal closed ONLY after successful mutation');

    const updatedRow = page.locator(`[data-testid="r8-smart-swap-btn-${targetItemId}"]`).locator('xpath=ancestor::tr');
    const updatedRowText = await updatedRow.innerText();
    const updatedRowGramsVal = await updatedRow.locator('input[type="number"]').first().inputValue();
    assert(
      updatedRowText !== originalRowText &&
        (updatedRowText.includes(expectedCandidateName) || updatedRowText.includes(expectedCandidateNameBn)) &&
        Number(updatedRowGramsVal) === Number(expectedCandidateGrams),
      `I1: Committed row (${targetItemId}) reflects exact replacement (${expectedCandidateName}, ${updatedRowGramsVal}g)`
    );
    assert((await page.locator('[data-testid="badge-approved-plan"]').count()) === 0, 'I4: Substitution immediately invalidated prior Diet Plan approval');

    // Verify blocked state on unapproved swapped plan (I7)
    await page.locator('[data-testid="nav-tab-report"]').first().click();
    await page.waitForTimeout(450);
    await page.locator('[data-testid="btn-mode-patient"]').first().click();
    await page.waitForTimeout(450);
    assert((await patientView.locator('[data-testid="patient-release-blocked-alert"]').count()) > 0, 'I7: Unapproved post-swap plan blocks patient release');
    assert((await patientView.locator('[data-testid="draft-watermark"]').count()) > 0, 'I7: Unapproved post-swap report renders draft watermark');
    assert(await patientView.locator('[data-testid="btn-print-patient-report"]').isDisabled(), 'I7: Patient print disabled while unapproved');

    console.log('\n--- I3 & E1: Food Knowledge Explorer & Exact Recipe Editing + Diet Inclusion ---');
    await page.locator('[data-testid="nav-tab-food_knowledge"]').first().click();
    await page.waitForTimeout(450);
    await page.locator('[data-testid="r8-food-search"]').fill('Spinach');
    await page.waitForTimeout(250);
    await page.locator('[data-testid="r8-food-item-f_04_0025"]').click();
    await page.waitForTimeout(250);
    const spinachDetail = await page.locator('[data-testid="r8-food-detail"]').innerText();
    assert(spinachDetail.toLowerCase().includes('fctb') && spinachDetail.includes('f_04_0025'), 'E1: Spinach composition & provenance rendered');

    await page.locator('[data-testid="r8-tab-recipes"]').click();
    await page.waitForTimeout(350);
    await page.locator('[data-testid="r8-recipe-select-rec_bd_cauliflower_sesame_steam"]').click();
    await page.waitForTimeout(200);
    assert((await page.locator('[data-testid="r8-recipe-safety-banner"]').innerText()).toLowerCase().includes('sesame'), 'I3: Sesame recipe propagates allergen');

    await page.locator('[data-testid="r8-recipe-select-rec_bd_masoor_dal"]').click();
    await page.waitForTimeout(250);
    const beforeGrid = await page.locator('[data-testid="r8-recipe-nutrients-grid"]').innerText();
    const beforeKcalMatch = beforeGrid.match(/Energy[\s\S]*?([0-9]+(?:\.[0-9]+)?)\s*kcal/i);
    const beforeKcal = beforeKcalMatch ? parseFloat(beforeKcalMatch[1]) : 0;

    await page.locator('[data-testid="r8-recipe-ing-grams-0"]').fill('120');
    await page.waitForTimeout(250);
    const afterGrid = await page.locator('[data-testid="r8-recipe-nutrients-grid"]').innerText();
    const afterKcalMatch = afterGrid.match(/Energy[\s\S]*?([0-9]+(?:\.[0-9]+)?)\s*kcal/i);
    const afterKcal = afterKcalMatch ? parseFloat(afterKcalMatch[1]) : 0;
    assert(afterKcal > beforeKcal + 50, `I3: Increasing Masoor Dal lentil 60g -> 120g increased energy/serving (${beforeKcal} -> ${afterKcal} kcal)`);

    await page.locator('[data-testid="r8-recipe-include-btn"]').click();
    await page.waitForTimeout(400);
    assert((await page.locator('[data-testid="r8-recipe-action-msg"]').innerText()).toLowerCase().includes('included'), 'I3: Edited recipe included into Day 1 Diet Plan draft');

    console.log('\n--- I4b, I5 & I6: Reauthorization, Consistency, U21 Privacy & Approved Chromium A4 PDF ---');
    await page.locator('[data-testid="nav-tab-diet"]').first().click();
    await page.waitForTimeout(700);
    const dietBodyText = await page.locator('main').innerText();
    assert(dietBodyText.includes('Light Masoor Dal') || dietBodyText.includes('হালকা মসুর ডাল'), 'I3: Included recipe appears on Day 1 Diet Chart with recipe identity');
    const recipeSwapBtn = page.locator('tr:has-text("Light Masoor Dal") [data-testid^="r8-smart-swap-btn-"], tr:has-text("হালকা মসুর ডাল") [data-testid^="r8-smart-swap-btn-"]').first();
    assert((await recipeSwapBtn.count()) > 0 && (await recipeSwapBtn.isDisabled()), 'H6: Single-ingredient Smart Swap disabled on recipe-derived meal item');

    // Reauthorize updated Diet Plan (containing BOTH swapped item AND included recipe)
    await page.locator('[data-testid="btn-approve-weekly-plan"]').first().click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="input-clinician-id"]').fill('DR_R8_E2E_MD');
    await page.locator('[data-testid="btn-submit-approval"]').click();
    await page.waitForTimeout(900);
    assert((await page.locator('[data-testid="badge-approved-plan"]').count()) > 0, 'I4b: Plan reauthorized cleanly via UI');

    // Switch to Report Hub -> Patient View (Released State)
    await page.locator('[data-testid="nav-tab-report"]').first().click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="btn-mode-clinician"]').first().click();
    await page.waitForTimeout(300);
    assert((await page.locator('[data-testid="r8-clinician-report-provenance"]').count()) > 0, 'I5: ClinicianReportView renders R8 provenance');

    await page.locator('[data-testid="btn-mode-patient"]').first().click();
    await page.waitForTimeout(450);
    assert((await patientView.locator('[data-testid="patient-release-approved-banner"]').count()) > 0, 'I5/I6: Reauthorized prescription reaches RELEASED state');
    assert((await patientView.locator('[data-testid="draft-watermark"]').count()) === 0, 'I6: Approved patient report has NO draft watermark');
    assert(!(await patientView.locator('[data-testid="btn-print-patient-report"]').isDisabled()), 'I6: Patient print action enabled on RELEASED prescription');

    const pdfOutDir = path.join(os.tmpdir(), 'shuddho-r8-pdf');
    fs.mkdirSync(pdfOutDir, { recursive: true });
    const approvedPdfPath = path.join(pdfOutDir, 'r8_patient_prescription_approved.pdf');

    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(250);
    const printAudit = await page.evaluate(({ candNameEn, candNameBn }) => {
      const noPrintEls = Array.from(document.querySelectorAll('.no-print'));
      const noPrintHidden = noPrintEls.every(el => getComputedStyle(el).display === 'none');
      const view = document.querySelector('[data-testid="patient-diet-report-view"]') as HTMLElement | null;
      const text = view ? view.innerText : '';
      return {
        noPrintHidden,
        hasBangla: /[\u0980-\u09FF]+/.test(text),
        hasRecipe: text.includes('Light Masoor Dal') || text.includes('হালকা মসুর ডাল'),
        hasReplacement: (candNameEn ? text.includes(candNameEn) : false) || (candNameBn ? text.includes(candNameBn) : false),
        hasNoKcal: !/\b\d+\s*kcal\b/i.test(text),
        hasNoBiomarkers: !text.includes('HOMA-IR') && !text.includes('FIB-4'),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 4,
      };
    }, { candNameEn: expectedCandidateName, candNameBn: expectedCandidateNameBn });

    assert(printAudit.noPrintHidden, 'I6: @media print hides all .no-print UI elements');
    assert(printAudit.hasBangla, 'I6: Bangla typography renders in approved print DOM');
    assert(printAudit.hasRecipe && printAudit.hasReplacement, 'I5/I6: Released patient print DOM includes exact approved replacement and recipe');
    assert(printAudit.hasNoKcal && printAudit.hasNoBiomarkers, 'I6/U21: Print DOM leaks 0 kcal and 0 internal biomarkers');
    assert(!printAudit.overflow, 'I6: Approved A4 print DOM has 0 horizontal overflow');

    await page.pdf({ path: approvedPdfPath, format: 'A4', printBackground: true });
    await page.emulateMedia({ media: 'screen' });

    const pdfInfo = inspectPdfDocument(fs.readFileSync(approvedPdfPath));
    assert(
      pdfInfo.validHeader && pdfInfo.byteLength > 10000 && pdfInfo.pageCount >= 1 && pdfInfo.decompressedStreamCount >= 1 && pdfInfo.hasFontResources,
      `I6: Chromium A4 approved PDF verified (${pdfInfo.byteLength} bytes, ${pdfInfo.pageCount} pages, ${pdfInfo.decompressedStreamCount} decompressed streams)`
    );

    console.log('\n--- I8, I10 & I13: Reload Persistence, Cross-Patient Isolation, 390px Overflow & 0 Errors ---');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.locator('[data-testid="nav-tab-diet"]').first().click();
    await page.locator('[data-testid="badge-approved-plan"]').first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    assert((await page.locator('[data-testid="badge-approved-plan"]').count()) > 0, 'I10: Approved plan status persists across reload');
    const reloadedDietText = await page.locator('main').innerText();
    assert(reloadedDietText.includes('Light Masoor Dal') || reloadedDietText.includes('হালকা মসুর ডাল'), 'I3/I10: Prescribed recipe in Diet Plan persists across reload');

    // Cross-patient isolation (switch to Patients tab -> Register another patient via modal)
    await page.locator('[data-testid="nav-tab-patients"]').first().click();
    await page.waitForTimeout(450);
    const newPatientBtn = page.locator('button:has-text("Register Patient"), button:has-text("নতুন রোগী নিবন্ধন")').first();
    assert((await newPatientBtn.count()) > 0, 'I8: Register Patient button present on Patients tab');
    await newPatientBtn.click();
    await page.waitForTimeout(350);
    await page.locator('input[placeholder*="Rahima Begum"], input[placeholder*="রহিমা বেগম"]').first().fill('Patient B Isolation Check');
    await page.locator('input[placeholder="40"]').first().fill('38');
    await page.locator('button:has-text("Register & Start Assessment"), button:has-text("নিবন্ধন ও অ্যাসেসমেন্ট শুরু")').first().click();
    await page.waitForTimeout(550);

    await page.locator('[data-testid="nav-tab-food_knowledge"]').first().click();
    await page.waitForTimeout(400);
    await page.locator('[data-testid="r8-tab-recipes"]').click();
    await page.waitForTimeout(300);
    const patientBGrams = await page.locator('[data-testid="r8-recipe-ing-grams-0"]').inputValue();
    assert(patientBGrams === '60', `I8: Patient A edited recipe draft (120g) does NOT leak to Patient B (got "${patientBGrams}")`);

    await page.locator('[data-testid="nav-tab-food_knowledge"]').first().click();
    await page.waitForTimeout(300);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(350);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert(overflow <= 2, `I13: Zero horizontal overflow on 390px mobile viewport (overflow=${overflow}px)`);
    assert(pageErrors.length === 0, `I13: Zero uncaught runtime page errors (got ${pageErrors.length})`);
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  console.log('\n================================================================');
  console.log(`R8 BROWSER E2E SUMMARY: ${passedAssertions}/${totalAssertions} PASSED, ${failedAssertions} FAILED`);
  console.log('================================================================\n');

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runR8BrowserE2E().catch(err => {
  console.error(err);
  process.exit(1);
});

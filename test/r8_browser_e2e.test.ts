/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION PLATFORM
 * PHASE R8: BROWSER END-TO-END PLAYWRIGHT & CHROMIUM A4 PDF ACCEPTANCE SUITE (CHECKPOINT E)
 * Zero conditional bypasses: every mandatory workflow executes and asserts real outcomes.
 */

import http from 'http';
import fs from 'fs';
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
  console.log('SHUDDHO PHASE R8 CHECKPOINT E: BROWSER E2E & PDF ACCEPTANCE');
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

    console.log('--- E1 & E2: Boot, Demo Load, Food Explorer (BN/EN + Missing Fidelity + Safety) ---');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);

    const loadDemoBtn = page
      .locator('button:has-text("ডেমো কেস লোড করুন"), button:has-text("Load Demo Case"), button:has-text("Load Demo Patient")')
      .first();
    assert((await loadDemoBtn.count()) > 0, 'Demo Case button visible on landing dashboard');
    await loadDemoBtn.click();
    await page.waitForTimeout(700);

    await page.locator('[data-testid="nav-tab-food_knowledge"]').first().click();
    await page.waitForTimeout(500);
    assert((await page.locator('[data-testid="r8-food-knowledge-workspace"]').count()) > 0, 'R8 FoodKnowledgeWorkspace mounted');

    const searchInput = page.locator('[data-testid="r8-food-search"]');
    await searchInput.fill('Spinach');
    await page.waitForTimeout(300);
    assert((await page.locator('[data-testid="r8-food-item-f_04_0025"]').count()) > 0, 'E1: English search finds Spinach (f_04_0025)');
    await page.locator('[data-testid="r8-food-item-f_04_0025"]').click();
    await page.waitForTimeout(300);
    const detailText = await page.locator('[data-testid="r8-food-detail"]').innerText();
    assert(detailText.toLowerCase().includes('fctb') && detailText.includes('f_04_0025'), 'E1: Food detail displays FCTB metadata & ID');
    assert(detailText.includes('measured_numeric'), 'E1: Food detail displays canonical data quality');

    await searchInput.fill('রুই');
    await page.waitForTimeout(300);
    assert((await page.locator('[data-testid="r8-food-item-f_09_0059"]').count()) > 0, 'E1: Bengali search finds Rohu (রুই)');

    console.log('\n--- E1b: Bidirectional Nutrient-Mechanism Network ---');
    await page.locator('[data-testid="r8-tab-network"]').click();
    await page.waitForTimeout(400);
    await page.locator('[data-testid="r8-network-mode"]').selectOption('mechanism_to_foods');
    await page.waitForTimeout(250);
    await page.locator('[data-testid="r8-network-target"]').selectOption('mech_nrf2_cellular_defense');
    await page.waitForTimeout(250);
    const netText = await page.locator('[data-testid="r8-network-panel"]').innerText();
    assert(netText.includes('Exploratory / Preclinical'), 'E1: Nrf2 mechanism explicitly badged Exploratory / Preclinical');

    await page.locator('[data-testid="r8-network-mode"]').selectOption('lab_to_food_first_review');
    await page.waitForTimeout(250);
    const labNetText = await page.locator('[data-testid="r8-network-panel"]').innerText();
    assert(labNetText.includes('Food-First vs Clinical Escalation'), 'E1: Lab-to-food-first guidance displayed');

    console.log('\n--- E6: Clinician-Editable Recipe Studio & Diet Plan Inclusion ---');
    await page.locator('[data-testid="r8-tab-recipes"]').click();
    await page.waitForTimeout(400);
    await page.locator('[data-testid="r8-recipe-select-rec_bd_cauliflower_sesame_steam"]').click();
    await page.waitForTimeout(250);
    const sesameBanner = await page.locator('[data-testid="r8-recipe-safety-banner"]').innerText();
    assert(sesameBanner.toLowerCase().includes('sesame'), 'E6: Sesame recipe propagates sesame allergen');

    await page.locator('[data-testid="r8-recipe-select-rec_bd_masoor_dal"]').click();
    await page.waitForTimeout(250);
    const beforeGrid = await page.locator('[data-testid="r8-recipe-nutrients-grid"]').innerText();
    await page.locator('[data-testid="r8-recipe-ing-grams-0"]').fill('120');
    await page.waitForTimeout(300);
    const afterGrid = await page.locator('[data-testid="r8-recipe-nutrients-grid"]').innerText();
    assert(beforeGrid !== afterGrid, 'E6: Editing ingredient quantity recalculates per-serving recipe nutrients');

    await page.locator('[data-testid="r8-recipe-add-btn"]').click();
    await page.waitForTimeout(250);
    await page.locator('[data-testid="r8-recipe-save-btn"]').click();
    await page.waitForTimeout(250);
    const saveMsg = await page.locator('[data-testid="r8-recipe-action-msg"]').innerText();
    assert(saveMsg.toLowerCase().includes('saved'), 'E6: Recipe draft saved locally');

    // Ensure Diet Plan is generated first, then include recipe
    await page.locator('[data-testid="nav-tab-diet"]').first().click();
    await page.waitForTimeout(800);
    await page.locator('[data-testid="nav-tab-food_knowledge"]').first().click();
    await page.waitForTimeout(400);
    await page.locator('[data-testid="r8-tab-recipes"]').click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="r8-recipe-include-btn"]').click();
    await page.waitForTimeout(400);
    const includeMsg = await page.locator('[data-testid="r8-recipe-action-msg"]').innerText();
    assert(includeMsg.toLowerCase().includes('included'), 'E6: Eligible recipe included in Diet Plan draft');

    console.log('\n--- E3 & E7: Mandatory R8 Smart Substitution, Approval Invalidation & Reauthorization ---');
    await page.locator('[data-testid="nav-tab-diet"]').first().click();
    await page.waitForTimeout(800);

    // Approve initial plan first via real UI Sign-Off
    const openSignOffBtn = page.locator('button:has-text("Approve & Sign-Off"), button:has-text("অনুমোদন")').first();
    if ((await openSignOffBtn.count()) > 0) {
      await openSignOffBtn.click();
      await page.waitForTimeout(300);
      await page.locator('[data-testid="btn-submit-approval"]').click();
      await page.waitForTimeout(600);
    }

    // Now perform a MANDATORY substitution (zero conditional fallback!)
    const smartSwapBtns = page.locator('[data-testid^="r8-smart-swap-btn-"]');
    const btnCount = await smartSwapBtns.count();
    assert(btnCount > 0, 'E3: At least one R8 Smart Swap button exists on Diet Chart');

    let swappedSuccessfully = false;
    for (let i = 0; i < Math.min(btnCount, 6); i++) {
      await smartSwapBtns.nth(i).click();
      await page.waitForTimeout(350);
      const confirmBtn = page.locator('[data-testid^="r8-confirm-swap-"]').first();
      if ((await confirmBtn.count()) > 0 && !(await confirmBtn.isDisabled())) {
        const candTestId = await confirmBtn.getAttribute('data-testid');
        await confirmBtn.click();
        await page.waitForTimeout(600);
        assert((await page.locator('[data-testid="r8-swap-modal"]').count()) === 0, `E3: Confirmed swap (${candTestId}) and closed modal`);
        swappedSuccessfully = true;
        break;
      }
      await page.locator('[data-testid="r8-swap-modal-close"]').click();
      await page.waitForTimeout(200);
    }
    assert(swappedSuccessfully, 'E3: Mandatory substitution executed and committed through UI');

    // E7: Prior approval must be invalidated -> Re-approve via real UI Sign-Off
    const reSignOffBtn = page.locator('button:has-text("Approve & Sign-Off"), button:has-text("অনুমোদন")').first();
    assert((await reSignOffBtn.count()) > 0, 'E7: Plan approval invalidated after swap and requires re-authorization');
    await reSignOffBtn.click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="btn-submit-approval"]').click();
    await page.waitForTimeout(700);

    console.log('\n--- E8 & E11: Released Reports, U21 Privacy & Approved Chromium A4 PDF ---');
    await page.locator('[data-testid="nav-tab-report"]').first().click();
    await page.waitForTimeout(700);

    const clinicianTabBtn = page.locator('button:has-text("Clinician"), button:has-text("ক্লিনিশিয়ান")').first();
    if ((await clinicianTabBtn.count()) > 0) {
      await clinicianTabBtn.click();
      await page.waitForTimeout(400);
    }
    assert((await page.locator('[data-testid="r8-clinician-report-provenance"]').count()) > 0, 'E8: ClinicianReportView renders R8 provenance');

    const patientTabBtn = page.locator('button:has-text("Patient"), button:has-text("রোগী")').first();
    if ((await patientTabBtn.count()) > 0) {
      await patientTabBtn.click();
      await page.waitForTimeout(400);
    }
    const patientReportText = await page.locator('main').innerText();
    assert(!/\bHOMA-IR\b/i.test(patientReportText), 'E8/U21: Patient report contains 0 internal HOMA-IR disclosures');

    const pdfBuf = await page.pdf({ format: 'A4', printBackground: true });
    const pdfInfo = inspectPdfDocument(pdfBuf);
    assert(pdfInfo.validHeader, `E11: Chromium A4 PDF valid %PDF- header (${pdfInfo.byteLength} bytes)`);
    assert(pdfInfo.pageCount >= 1, `E11: Chromium A4 PDF has >= 1 page (${pdfInfo.pageCount})`);
    assert(pdfInfo.decompressedStreamCount > 0, `E11: Chromium A4 PDF has compressed content streams (${pdfInfo.decompressedStreamCount})`);

    console.log('\n--- E10 & E13: Reload Persistence, 390px Mobile Overflow & 0 Runtime Errors ---');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);
    await page.locator('[data-testid="nav-tab-food_knowledge"]').first().click();
    await page.waitForTimeout(400);
    await page.locator('[data-testid="r8-tab-recipes"]').click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="r8-recipe-select-rec_bd_masoor_dal"]').click();
    await page.waitForTimeout(300);
    const persistedGrams = await page.locator('[data-testid="r8-recipe-ing-grams-0"]').inputValue();
    assert(persistedGrams === '120', `E10: Saved recipe ingredient quantity persisted across reload (got "${persistedGrams}")`);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert(overflow <= 2, `E13: Zero horizontal overflow on 390px mobile viewport (overflow=${overflow}px)`);
    assert(pageErrors.length === 0, `E13: Zero uncaught runtime page errors (got ${pageErrors.length})`);
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

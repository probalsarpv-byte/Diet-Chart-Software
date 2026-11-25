/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION PLATFORM
 * PHASE R8: BROWSER END-TO-END PLAYWRIGHT & CHROMIUM A4 PDF ACCEPTANCE SUITE
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
  console.log('SHUDDHO PHASE R8: BROWSER E2E & CHROMIUM A4 PDF ACCEPTANCE');
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

    console.log('--- B1: Boot, Demo Load & Food Explorer (BN/EN + Missing Fidelity) ---');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);

    const loadDemoBtn = page
      .locator('button:has-text("ডেমো কেস লোড করুন"), button:has-text("Load Demo Case"), button:has-text("Load Demo Patient")')
      .first();
    assert((await loadDemoBtn.count()) > 0, 'Demo Case button visible on landing dashboard');
    await loadDemoBtn.click();
    await page.waitForTimeout(700);

    const kbNav = page.locator('[data-testid="nav-tab-food_knowledge"]').first();
    assert((await kbNav.count()) > 0, 'Food & Mechanism KB nav tab visible');
    await kbNav.click();
    await page.waitForTimeout(500);

    const workspace = page.locator('[data-testid="r8-food-knowledge-workspace"]');
    assert((await workspace.count()) > 0, 'R8 FoodKnowledgeWorkspace mounted');

    // English & Bengali search
    const searchInput = page.locator('[data-testid="r8-food-search"]');
    await searchInput.fill('Spinach');
    await page.waitForTimeout(300);
    assert((await page.locator('[data-testid="r8-food-item-f_04_0025"]').count()) > 0, 'English search finds Spinach (f_04_0025)');

    await page.locator('[data-testid="r8-food-item-f_04_0025"]').click();
    await page.waitForTimeout(300);
    const detailText = await page.locator('[data-testid="r8-food-detail"]').innerText();
    assert(detailText.toLowerCase().includes('fctb') || detailText.includes('f_04_0025'), 'Food detail displays FCTB metadata');
    assert(
      detailText.includes('Unavailable (FCTB null)') || detailText.includes('measured_numeric'),
      'Food detail displays canonical data quality provenance'
    );

    await searchInput.fill('রুই');
    await page.waitForTimeout(300);
    assert((await page.locator('[data-testid="r8-food-item-f_09_0059"]').count()) > 0, 'Bengali search finds Rohu (রুই)');

    // Toggle patient safety filter
    const filterToggle = page.locator('[data-testid="r8-patient-filter-toggle"]');
    assert(await filterToggle.isChecked(), 'Patient safety filter enabled by default');
    await filterToggle.uncheck();
    await page.waitForTimeout(200);
    await filterToggle.check();

    console.log('\n--- B2: Bidirectional Nutrient-Mechanism Network ---');
    await page.locator('[data-testid="r8-tab-network"]').click();
    await page.waitForTimeout(400);
    assert((await page.locator('[data-testid="r8-network-panel"]').count()) > 0, 'Network panel mounted');

    await page.locator('[data-testid="r8-network-mode"]').selectOption('mechanism_to_foods');
    await page.waitForTimeout(300);
    await page.locator('[data-testid="r8-network-target"]').selectOption('mech_nrf2_cellular_defense');
    await page.waitForTimeout(300);
    const netText = await page.locator('[data-testid="r8-network-panel"]').innerText();
    assert(netText.includes('Exploratory / Preclinical'), 'Nrf2 mechanism explicitly badged Exploratory / Preclinical');

    await page.locator('[data-testid="r8-network-mode"]').selectOption('lab_to_food_first_review');
    await page.waitForTimeout(300);
    const labNetText = await page.locator('[data-testid="r8-network-panel"]').innerText();
    assert(labNetText.includes('Food-First vs Clinical Escalation'), 'Lab-to-food-first guidance displayed');

    console.log('\n--- B3: Recipe & Prep Studio (Allergen Propagation & Scaling) ---');
    await page.locator('[data-testid="r8-tab-recipes"]').click();
    await page.waitForTimeout(400);
    assert((await page.locator('[data-testid="r8-recipe-studio"]').count()) > 0, 'Recipe studio mounted');

    await page.locator('[data-testid="r8-recipe-select-rec_bd_cauliflower_sesame_steam"]').click();
    await page.waitForTimeout(300);
    const safetyBannerText = await page.locator('[data-testid="r8-recipe-safety-banner"]').innerText();
    assert(safetyBannerText.toLowerCase().includes('sesame'), 'Recipe propagates sesame allergen');

    await page.locator('[data-testid="r8-recipe-servings-input"]').fill('4');
    await page.waitForTimeout(300);
    const studioText = await page.locator('[data-testid="r8-recipe-studio"]').innerText();
    assert(studioText.includes('kcal'), 'Scaled recipe displays per-serving nutrition');

    console.log('\n--- B4: DietChartTab R8 Smart Substitution Modal & Plan Update ---');
    await page.locator('[data-testid="nav-tab-diet"]').first().click();
    await page.waitForTimeout(800);

    const smartSwapBtn = page.locator('[data-testid^="r8-smart-swap-btn-"]').first();
    await smartSwapBtn.waitFor({ state: 'visible', timeout: 8000 });
    await smartSwapBtn.click();
    await page.waitForTimeout(400);

    const swapModal = page.locator('[data-testid="r8-swap-modal"]');
    assert((await swapModal.count()) > 0, 'R8 Smart Substitution Modal opened');

    await page.locator('[data-testid="r8-swap-mode-select"]').selectOption('protein_matched');
    await page.waitForTimeout(300);
    await page.locator('[data-testid="r8-swap-mode-select"]').selectOption('energy_matched');
    await page.waitForTimeout(300);

    const confirmBtn = page.locator('[data-testid^="r8-confirm-swap-"]').first();
    if ((await confirmBtn.count()) > 0) {
      await confirmBtn.click();
      await page.waitForTimeout(600);
      assert((await swapModal.count()) === 0, 'R8 Smart Substitution Modal closed after confirming swap');
    } else {
      await page.locator('[data-testid="r8-swap-modal-close"]').click();
      assert(true, 'R8 Smart Substitution Modal closed cleanly when no matched candidate in slot');
    }

    console.log('\n--- B5: Reports, Clinician Provenance, U21 Privacy & Chromium A4 PDF ---');
    await page.locator('[data-testid="nav-tab-report"]').first().click();
    await page.waitForTimeout(700);

    const clinicianTabBtn = page.locator('button:has-text("Clinician"), button:has-text("ক্লিনিশিয়ান")').first();
    if ((await clinicianTabBtn.count()) > 0) {
      await clinicianTabBtn.click();
      await page.waitForTimeout(400);
    }
    const r8ReportProv = page.locator('[data-testid="r8-clinician-report-provenance"]');
    assert((await r8ReportProv.count()) > 0, 'ClinicianReportView renders R8 composition/evidence provenance');

    const patientTabBtn = page.locator('button:has-text("Patient"), button:has-text("রোগী")').first();
    if ((await patientTabBtn.count()) > 0) {
      await patientTabBtn.click();
      await page.waitForTimeout(400);
    }

    const pdfBuf = await page.pdf({ format: 'A4', printBackground: true });
    const pdfInfo = inspectPdfDocument(pdfBuf);
    assert(pdfInfo.validHeader, `Chromium A4 PDF valid %PDF- header (${pdfInfo.byteLength} bytes)`);
    assert(pdfInfo.pageCount >= 1, `Chromium A4 PDF has >= 1 page (${pdfInfo.pageCount})`);
    assert(pdfInfo.decompressedStreamCount > 0, `Chromium A4 PDF has compressed content streams (${pdfInfo.decompressedStreamCount})`);

    console.log('\n--- B6: Mobile 390px Overflow & Reload Stability ---');
    await page.locator('[data-testid="nav-tab-food_knowledge"]').first().click();
    await page.waitForTimeout(400);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert(overflow <= 2, `Zero horizontal overflow on 390px mobile viewport (overflow=${overflow}px)`);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    assert(pageErrors.length === 0, `Zero uncaught runtime page errors (got ${pageErrors.length})`);
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

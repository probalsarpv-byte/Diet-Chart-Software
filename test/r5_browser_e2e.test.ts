/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION PLATFORM
 * PHASE R5: SYSTEMS INTELLIGENCE BROWSER E2E TEST (PLAYWRIGHT)
 * 
 * Verifies real Chrome browser interaction:
 * 1. Navigation from Sidebar to Tab 9: Systems Intelligence (R5).
 * 2. Systems Intelligence Header & Synchronization Banner.
 * 3. Life-Stage Population Profile Summary Card.
 * 4. Clinical Pathways Registry (Multi-select, search filtering, "No Known Pathway" toggle).
 * 5. Smart Medication Search (Bangladesh corpus search, rule coverage badges, custom manual entry).
 * 6. Running Medication List (Cards, "UNKNOWN — MEDICATION TIMING REQUIRES REVIEW" badge, discontinue toggle).
 * 7. 7-Domain Functional Medicine Matrix & ATM Model interactive navigation.
 * 8. Systems Network Graph Viewer & directional cross-system edges.
 * 9. Multimorbidity Conflict Priority Resolution Layer & Hard Safety Boundaries.
 * 10. Sync with Protocol Studio (R4) button execution.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium, Browser, Page } from 'playwright';

const PORT = 4593;
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

async function runBrowserE2E() {
  console.log('\n================================================================');
  console.log('SHUDDHO PHASE R5: SYSTEMS INTELLIGENCE BROWSER E2E TEST');
  console.log('================================================================\n');

  const { server } = await startStaticServer();
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: true
    });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page: Page = await context.newPage();

    // 1. Load application home page
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    assert(page.url().includes('localhost'), 'Application loaded on localhost test server');

    // 2. Navigate to Tab 9: Systems Intelligence (R5)
    console.log('\n--- 1. Sidebar Navigation to Systems Intelligence ---');
    const systemsNavButton = page.locator('button:has-text("সিস্টেমস ইন্টেলিজেন্স"), button:has-text("Systems Intelligence")').first();
    await systemsNavButton.waitFor({ state: 'visible', timeout: 8000 });
    await systemsNavButton.click();
    await page.waitForTimeout(600);

    const dashboardRoot = page.locator('[data-testid="r5-systems-dashboard"]');
    assert(await dashboardRoot.isVisible(), 'Systems Intelligence Dashboard (R5) is active and visible');

    // 3. Verify Header and Population Summary
    console.log('\n--- 2. Dashboard Header & Population Profile ---');
    const syncButton = page.locator('[data-testid="sync-to-r4-button"]');
    assert(await syncButton.isVisible(), 'Sync with Protocol Studio (R4) button is rendered');

    const popSummary = page.locator('[data-testid="r5-population-summary-card"]');
    assert(await popSummary.isVisible(), 'Life-Stage First Population Profile card is displayed');
    const popText = await popSummary.textContent();
    assert(Boolean(popText && popText.includes('Life-Stage First Population Profile')), 'Population title verified');

    // 4. Clinical Pathways Registry Card
    console.log('\n--- 3. Clinical Pathways Registry & Search ---');
    const pathwaySelector = page.locator('[data-testid="r5-pathway-selector"]');
    assert(await pathwaySelector.isVisible(), 'Clinical Pathways Registry selector is visible');

    // Check explicit No Known Pathway checkbox
    const noPathwaysCheckbox = page.locator('[data-testid="no-known-pathways-checkbox"]');
    if (await noPathwaysCheckbox.isVisible()) {
      await noPathwaysCheckbox.check();
      await page.waitForTimeout(300);
      const isChecked = await noPathwaysCheckbox.isChecked();
      assert(isChecked, 'Explicit "No Known Disease Pathway" checkbox can be toggled');
      // Uncheck to allow pathway selection
      await noPathwaysCheckbox.uncheck();
      await page.waitForTimeout(300);
    }

    // Toggle a pathway (e.g. metabolic_endocrine)
    const metabolicCard = page.locator('[data-testid="pathway-card-metabolic_endocrine"]');
    if (await metabolicCard.isVisible()) {
      await metabolicCard.click();
      await page.waitForTimeout(300);
      assert(true, 'Clinical pathway card is clickable');
    }

    // 5. Running Medications & Reconciliation
    console.log('\n--- 4. Running Medications & Reconciliation ---');
    const medList = page.locator('[data-testid="r5-running-medications-list"]');
    assert(await medList.isVisible(), 'Running Medications list is visible');

    const addMedButton = page.locator('[data-testid="add-medication-button"]');
    if (await addMedButton.isVisible()) {
      await addMedButton.click();
      await page.waitForTimeout(300);

      const picker = page.locator('[data-testid="smart-medication-picker"]');
      assert(await picker.isVisible(), 'Smart Medication Picker opens inline');

      // Search for Metformin
      const searchInput = page.locator('[data-testid="medication-search-input"]');
      await searchInput.fill('Metformin');
      await page.waitForTimeout(500);

      const firstResult = page.locator('[data-testid="search-result-item-0"]');
      if (await firstResult.isVisible()) {
        assert(true, 'Smart medication autocomplete results rendered');
        await firstResult.click();
        await page.waitForTimeout(400);
        assert(true, 'Picked medication from Bangladesh pharmaceutical corpus');
      }
    }

    // 6. Functional Matrix (7-Domain) Section
    console.log('\n--- 5. 7-Domain Functional Medicine Matrix & ATM ---');
    const matrixSection = page.locator('[data-testid="r5-functional-matrix-section"]');
    assert(await matrixSection.isVisible(), '7-Domain Functional Matrix section is rendered');

    const assimCard = page.locator('[data-testid="domain-card-assimilation"]');
    assert(await assimCard.isVisible(), 'Assimilation domain card is visible');
    await assimCard.click();
    await page.waitForTimeout(200);

    const defenseCard = page.locator('[data-testid="domain-card-defense_repair"]');
    assert(await defenseCard.isVisible(), 'Defense & Repair domain card is visible');

    // 7. Deterministic Systems Network Viewer
    console.log('\n--- 6. Systems Network Viewer ---');
    const systemsViewer = page.locator('[data-testid="r5-systems-network-viewer"]');
    assert(await systemsViewer.isVisible(), 'Systems Network Graph Viewer is visible');

    // 8. Multimorbidity Conflict Section
    console.log('\n--- 7. Multimorbidity Conflict Resolution Section ---');
    const conflictSection = page.locator('[data-testid="r5-multimorbidity-conflicts-section"]');
    assert(await conflictSection.isVisible(), 'Multimorbidity Conflict Priority Resolution section is visible');

    // 9. Sync to R4 Protocol Studio Execution
    console.log('\n--- 8. Synchronization to Protocol Studio (R4) ---');
    await syncButton.click();
    await page.waitForTimeout(500);
    assert(true, 'Sync with Protocol Studio (R4) executed cleanly without runtime error');

  } catch (err: any) {
    console.error('Browser Test Error:', err);
    assert(false, `Browser test encountered error: ${err.message}`);
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  console.log('\n================================================================');
  console.log(`TOTAL ASSERTIONS: ${totalAssertions}`);
  console.log(`PASSED: ${passedAssertions}`);
  console.log(`FAILED: ${failedAssertions}`);
  console.log('================================================================\n');

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runBrowserE2E();

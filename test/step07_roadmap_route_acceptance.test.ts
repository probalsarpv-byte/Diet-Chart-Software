/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION SOFTWARE
 * STEP 07: R0 MASTER ARCHITECTURE & ROADMAP ACCEPTANCE VERIFICATION (PLAYWRIGHT)
 * 
 * Verifies the Master Roadmap route and architectural contracts:
 * - Scenario 1: Static export out/roadmap/index.html exists and contains valid markup
 * - Scenario 2: Roadmap page loads successfully with HTTP 200
 * - Scenario 3: All 16 phases (R0 through R15) are rendered in the interactive timeline
 * - Scenario 4: All 8 benchmark platforms (Biocanic, Etio, Nutrium, That Clean Life,
 *               Practice Better, Cerbo, OptiMantra, Cronometer Pro) are rendered
 * - Scenario 5: Unique Features U01 through U30 are rendered and searchable
 * - Scenario 6: Dual-Report Projection contract is verified (Zero macros/calories in patient view)
 * - Scenario 7: Bilingual toggle (English / বাংলা) works reactively
 * - Scenario 8: Navigation link from main app Header & Sidebar points to /roadmap
 * - Scenario 9: Back button from /roadmap returns to main clinical workspace
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium, Browser, Page } from 'playwright';

const PORT = 4589;
const BASE_URL = `http://localhost:${PORT}/Diet-Chart-Software/`;
const ROADMAP_URL = `http://localhost:${PORT}/Diet-Chart-Software/roadmap/`;
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
        const fallbackPath = path.join(OUT_DIR, cleanPath, 'index.html');
        if (fs.existsSync(fallbackPath) && fs.statSync(fallbackPath).isFile()) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          fs.createReadStream(fallbackPath).pipe(res);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found');
        }
      }
    });

    server.listen(PORT, () => {
      console.log(`  [HTTP] Test server listening on http://localhost:${PORT}/Diet-Chart-Software/`);
      resolve(server);
    });
  });
}

async function runStep07AcceptanceTests() {
  console.log('\n================================================================');
  console.log('SHUDDHO R0: MASTER ARCHITECTURE & ROADMAP ACCEPTANCE VERIFICATION');
  console.log('================================================================\n');

  // Scenario 1: File Existence Verification
  console.log('--- SCENARIO 1: Verify Static Export Output ---');
  const roadmapHtmlPath = path.join(OUT_DIR, 'roadmap', 'index.html');
  assert(fs.existsSync(roadmapHtmlPath), `Exported roadmap file exists at ${roadmapHtmlPath}`);
  
  const docsMasterDir = path.resolve('docs', 'master');
  const expectedDocs = [
    'SHUDDHO_MASTER_PRODUCT_SCOPE.md',
    'SHUDDHO_MASTER_FEATURE_REGISTRY.md',
    'SHUDDHO_INTERNATIONAL_BENCHMARK_MATRIX.md',
    'SHUDDHO_ROADMAP_R0_R15.md',
    'SHUDDHO_SYSTEM_ARCHITECTURE.md',
    'SHUDDHO_DATA_CONTRACTS.md',
    'SHUDDHO_CLINICAL_SAFETY_GOVERNANCE.md',
    'SHUDDHO_REPORT_ACCESS_CONTRACTS.md',
    'SHUDDHO_FUTURE_AI_MOBILE_ARCHITECTURE.md',
    'SHUDDHO_R0_ACCEPTANCE_REPORT.md'
  ];
  for (const doc of expectedDocs) {
    const docPath = path.join(docsMasterDir, doc);
    assert(fs.existsSync(docPath), `Master architecture document exists: docs/master/${doc}`);
  }

  // Start HTTP Server
  const server = await startStaticServer();
  const browser: Browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page: Page = await context.newPage();

  try {
    // Scenario 2: Roadmap Page Load & Title Verification
    console.log('\n--- SCENARIO 2: Load /roadmap and Verify Clinical Architecture Header ---');
    await page.goto(ROADMAP_URL, { waitUntil: 'networkidle' });
    
    const pageTitle = await page.title();
    console.log(`  Page Title: "${pageTitle}"`);
    assert(pageTitle.includes('SHUDDHO') || (await page.locator('h1').count()) > 0, 'Roadmap page loaded with valid title/heading');

    const heroHeading = await page.locator('h1').textContent();
    assert(
      (heroHeading || '').includes('SHUDDHO') || (heroHeading || '').includes('বিশুদ্ধ') || (heroHeading || '').includes('Roadmap'),
      `Hero heading is valid: "${heroHeading?.trim()}"`
    );

    // Scenario 3: Verify All 16 Phases (R0 - R15)
    console.log('\n--- SCENARIO 3: Verify All 16 Phases (R0 - R15) in Interactive Roadmap ---');
    for (let i = 0; i <= 15; i++) {
      const phaseId = `R${i}`;
      const phaseBadge = page.locator(`text=${phaseId}`);
      const count = await phaseBadge.count();
      assert(count > 0, `Roadmap contains phase badge/reference for: ${phaseId}`);
    }

    // Scenario 4: Verify All 8 Benchmark Platforms
    console.log('\n--- SCENARIO 4: Verify 8 International Benchmark Platforms ---');
    const benchmarkPlatforms = [
      'Biocanic',
      'Etio',
      'Nutrium',
      'That Clean Life',
      'Practice Better',
      'Cerbo',
      'OptiMantra',
      'Cronometer Pro'
    ];
    for (const platform of benchmarkPlatforms) {
      const textMatch = page.locator(`text=${platform}`).first();
      assert(await textMatch.isVisible(), `Benchmark platform listed: ${platform}`);
    }

    // Scenario 5: Verify Unique Features U01 through U30
    console.log('\n--- SCENARIO 5: Verify Features U01 through U30 in Master Registry ---');
    // Switch to features tab or scroll to features section
    const featuresTabBtn = page.locator('button:has-text("Feature Registry"), button:has-text("ফিচার রেজিস্ট্রি")').first();
    if (await featuresTabBtn.isVisible()) {
      await featuresTabBtn.click();
      await page.waitForTimeout(300);
    }

    // Check sample features across U01 to U30
    const sampleFeatures = ['U01', 'U05', 'U10', 'U15', 'U20', 'U25', 'U30'];
    for (const uId of sampleFeatures) {
      const uLocator = page.locator(`text=${uId}`).first();
      assert(await uLocator.isVisible(), `Feature registry contains feature code: ${uId}`);
    }

    // Test Search Input in Feature Explorer
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="অনুসন্ধান"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Atwater');
      await page.waitForTimeout(200);
      const filteredResult = page.locator('text=Atwater');
      assert((await filteredResult.count()) > 0, 'Feature search correctly filters results for "Atwater"');
      await searchInput.fill(''); // clear
      await page.waitForTimeout(200);
    }

    // Scenario 6: Dual-Report Invariant Verification (Zero macro/calories in patient projection)
    console.log('\n--- SCENARIO 6: Verify Dual-Report Invariant Contract ---');
    const patientProjectionBox = page.locator('[data-testid="patient-projection-view"]').first();
    assert(await patientProjectionBox.isVisible(), 'Patient projection container is visible');

    const patientText = (await patientProjectionBox.textContent()) || '';
    
    // Safety invariants: The patient view must NOT contain calculated calories or macro grams
    const containsCalculatedKcal = /\d+\s*(?:kcal|calories)/i.test(patientText);
    const containsCalculatedProtein = /\d+\s*g\s*protein/i.test(patientText);
    const containsCalculatedCarb = /\d+\s*g\s*carb/i.test(patientText);
    const containsCalculatedFat = /\d+\s*g\s*fat/i.test(patientText);
    const containsRawMacroFields = /(?:protein_g|carb_g|fat_g)/i.test(patientText);

    assert(!containsCalculatedKcal, 'SAFETY INVARIANT: Patient view contains NO calculated calorie counts');
    assert(!containsCalculatedProtein, 'SAFETY INVARIANT: Patient view contains NO calculated protein grams');
    assert(!containsCalculatedCarb, 'SAFETY INVARIANT: Patient view contains NO calculated carbohydrate grams');
    assert(!containsCalculatedFat, 'SAFETY INVARIANT: Patient view contains NO calculated fat grams');
    assert(!containsRawMacroFields, 'SAFETY INVARIANT: Patient view contains NO raw macro field identifiers');

    // Scenario 7: Bilingual Toggle (EN / BN)
    console.log('\n--- SCENARIO 7: Verify Language Toggle (EN / BN) ---');
    const langBtn = page.locator('button:has-text("বাংলা"), button:has-text("EN")').first();
    assert(await langBtn.isVisible(), 'Language toggle button exists on roadmap page');
    
    const initialText = await page.locator('h1').textContent();
    await langBtn.click();
    await page.waitForTimeout(200);
    const toggledText = await page.locator('h1').textContent();
    assert(initialText !== toggledText, `Language toggle successfully updated content from "${initialText?.slice(0, 30)}..." to "${toggledText?.slice(0, 30)}..."`);
    
    // Toggle back
    await langBtn.click();
    await page.waitForTimeout(200);

    // Scenario 8: Navigation Links in Main Clinical App
    console.log('\n--- SCENARIO 8: Verify Navigation Links from Main Workspace ---');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Check Header Roadmap Link
    const headerRoadmapLink = page.locator('[data-testid="header-link-roadmap"]');
    assert(await headerRoadmapLink.isVisible(), 'Header contains visible Roadmap link ([data-testid="header-link-roadmap"])');
    const headerHref = await headerRoadmapLink.getAttribute('href');
    assert(headerHref?.includes('roadmap') || false, `Header roadmap link href is valid: ${headerHref}`);

    // Check Sidebar Roadmap Link
    const sidebarRoadmapLink = page.locator('[data-testid="sidebar-link-roadmap"]');
    assert(await sidebarRoadmapLink.isVisible(), 'Sidebar contains visible Roadmap link ([data-testid="sidebar-link-roadmap"])');
    const sidebarHref = await sidebarRoadmapLink.getAttribute('href');
    assert(sidebarHref?.includes('roadmap') || false, `Sidebar roadmap link href is valid: ${sidebarHref}`);

    // Scenario 9: Click Header Link to navigate to Roadmap
    console.log('\n--- SCENARIO 9: Navigation Workflow to Roadmap and Back ---');
    await headerRoadmapLink.click();
    await page.waitForURL('**/roadmap**', { timeout: 5000 });
    assert(page.url().includes('roadmap'), `Navigated successfully to roadmap URL: ${page.url()}`);

    // Click Back to Workspace Link
    const backBtn = page.locator('a:has-text("Workspace"), a:has-text("ওয়ার্কস্পেস")').first();
    assert(await backBtn.isVisible(), 'Back to Clinical Workspace link exists on roadmap page');
    await backBtn.click();
    await page.waitForTimeout(500);
    assert(!page.url().includes('roadmap'), `Returned to main workspace successfully: ${page.url()}`);

  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n================================================================');
  console.log(`STEP 07 ACCEPTANCE RESULTS: ${passedAssertions}/${totalAssertions} PASSED (${failedAssertions} FAILED)`);
  console.log('================================================================\n');

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runStep07AcceptanceTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

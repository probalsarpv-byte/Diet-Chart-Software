/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION SOFTWARE
 * STEP 06: REAL STRUCTURAL REDESIGN V3 ACCEPTANCE VERIFICATION (PLAYWRIGHT)
 * 
 * Verifies real structural architecture in Google Chrome:
 * - Scenario 1: Fixed/Sticky Left Navigation Sidebar Exists & Has Proper Width
 * - Scenario 2: Main Workspace Is Adjacent & Spacious (Max Width 1720px)
 * - Scenario 3: Navigation Sidebar Buttons Function Across Tabs
 * - Scenario 4: Dashboard KPI Grid Has At Most 4 Columns (No 8-Column Tiny Cards)
 * - Scenario 5: Mobile Drawer Toggle Functionality
 * - Scenario 6: Global Command Bar & Patient Context Preservation
 * - Scenario 7: Diet Chart Studio Asymmetric 8:4 Split Layout
 * - Scenario 8: Clinical Governance & Print Preserved
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium, Browser, Page } from 'playwright';

const PORT = 4588;
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
    server.listen(PORT, () => resolve(server));
  });
}

async function runStep06Verification() {
  console.log('================================================================');
  console.log('SHUDDHO STEP 06: REAL STRUCTURAL REDESIGN V3 VERIFICATION');
  console.log('================================================================\n');

  const server = await startStaticServer();
  console.log(`[Static Server] Running at ${BASE_URL}\n`);

  const browser: Browser = await chromium.launch({
    channel: 'chrome',
    headless: true
  });

  try {
    // -------------------------------------------------------------------
    // Scenario 1: Desktop Left Sidebar Architecture & Brand
    // -------------------------------------------------------------------
    console.log('--- Scenario 1: Desktop Left Sidebar Architecture & Brand ---');
    const desktopPage: Page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await desktopPage.goto(BASE_URL, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(600);

    // Verify desktop sidebar element exists and is visible
    const sidebar = desktopPage.locator('aside').first();
    assert((await sidebar.count()) > 0, 'Left navigation sidebar element <aside> exists in DOM');
    assert(await sidebar.isVisible(), 'Desktop sidebar is visible on 1440px viewport');

    // Verify sidebar width is around 256px (w-64)
    const sidebarBox = await sidebar.boundingBox();
    assert(sidebarBox !== null && sidebarBox.width >= 240 && sidebarBox.width <= 270, `Sidebar width is ~256px expanded (actual: ${sidebarBox?.width}px)`);

    // Verify brand identity in sidebar
    const brandTitle = await sidebar.locator('text=SHUDDHO').count();
    assert(brandTitle > 0, 'Brand name "SHUDDHO" rendered in sidebar header');

    // -------------------------------------------------------------------
    // Scenario 2: Main Workspace Is Adjacent & Spacious
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 2: Main Workspace Is Adjacent & Spacious ---');
    const mainWorkspace = desktopPage.locator('main').first();
    assert(await mainWorkspace.isVisible(), 'Main workspace is rendered adjacent to sidebar');
    
    const mainBox = await mainWorkspace.boundingBox();
    assert(mainBox !== null && mainBox.width > 900, `Main workspace has wide spacious width > 900px (actual: ${mainBox?.width}px)`);

    // -------------------------------------------------------------------
    // Scenario 3: Navigation Sidebar Buttons Function Across Tabs
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 3: Navigation Sidebar Buttons Function Across Tabs ---');
    
    // Switch to Patients Tab
    const patientsBtn = sidebar.locator('[data-testid="nav-tab-patients"]').first();
    assert((await patientsBtn.count()) > 0, 'Sidebar contains nav-tab-patients button');
    await patientsBtn.click();
    await desktopPage.waitForTimeout(400);
    assert(await desktopPage.locator('text=/রোগী রেজিস্ট্রি|Patient Registry|All Patients/').count() > 0, 'Successfully navigated to Patients Registry via sidebar');

    // Switch to Assessment Tab
    const assessmentBtn = sidebar.locator('[data-testid="nav-tab-assessment"]').first();
    await assessmentBtn.click();
    await desktopPage.waitForTimeout(400);
    assert(await desktopPage.locator('text=/Adaptive Functional Nutrition Assessment|অ্যাডাপ্টিভ ফাংশনাল নিউট্রিশন/').count() > 0, 'Successfully navigated to Assessment via sidebar');

    // Switch to Diet Planner Tab
    const dietBtn = sidebar.locator('[data-testid="nav-tab-diet"]').first();
    await dietBtn.click();
    await desktopPage.waitForTimeout(600);
    assert(await desktopPage.locator('[data-testid="clinical-traceability-bar"]').count() > 0, 'Successfully navigated to Diet Studio via sidebar');

    // Return to Dashboard Tab
    const dashboardBtn = sidebar.locator('[data-testid="nav-tab-dashboard"]').first();
    await dashboardBtn.click();
    await desktopPage.waitForTimeout(600);
    assert(await desktopPage.locator('text=/ক্লিনিক্যাল প্র্যাকটিস ওভারভিউ|Clinical Practice Dashboard/').count() > 0, 'Successfully navigated back to Dashboard via sidebar');

    // -------------------------------------------------------------------
    // Scenario 4: Dashboard KPI Grid Has At Most 4 Columns
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 4: Dashboard KPI Grid Has At Most 4 Columns ---');
    const kpiGrid = desktopPage.locator('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
    assert((await kpiGrid.count()) > 0, 'Dashboard utilizes a 4-column maximum grid (lg:grid-cols-4)');

    const oldEightColGrid = desktopPage.locator('.lg\\:grid-cols-8');
    assert((await oldEightColGrid.count()) === 0, 'Eight-column tiny KPI grid (.lg:grid-cols-8) is completely removed');

    const kpiCards = kpiGrid.locator('> div');
    const kpiCount = await kpiCards.count();
    assert(kpiCount === 4, `Dashboard renders exactly 4 executive KPI cards (actual: ${kpiCount})`);

    // -------------------------------------------------------------------
    // Scenario 5: Mobile Drawer Toggle Functionality
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 5: Mobile Drawer Toggle Functionality ---');
    const mobilePage: Page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(600);

    // Desktop sidebar should be hidden in mobile view
    const mobileSidebar = mobilePage.locator('aside.hidden.lg\\:block');
    assert((await mobileSidebar.count()) > 0, 'Desktop sidebar has hidden lg:block responsive classes');

    // Mobile menu toggle button in header
    const mobileMenuBtn = mobilePage.locator('header button[aria-label="Toggle navigation menu"]');
    assert((await mobileMenuBtn.count()) > 0, 'Mobile hamburger menu button exists in header');
    await mobileMenuBtn.click();
    await mobilePage.waitForTimeout(400);

    // Drawer overlay should now be open
    const drawerOverlay = mobilePage.locator('.fixed.inset-0.bg-black\\/60');
    assert((await drawerOverlay.count()) > 0, 'Mobile navigation drawer overlay opened upon hamburger click');

    // Click a tab in drawer to navigate and close
    const drawerPatientsBtn = mobilePage.locator('.fixed.inset-0 button').filter({ hasText: /রোগী|Patients/ }).first();
    if (await drawerPatientsBtn.count() > 0) {
      await drawerPatientsBtn.click();
      await mobilePage.waitForTimeout(400);
      assert(await mobilePage.locator('text=/রোগী রেজিস্ট্রি|Patient Registry|All Patients/').count() > 0, 'Drawer navigation to Patients works cleanly on mobile');
    }

    await mobilePage.close();

    // -------------------------------------------------------------------
    // Scenario 6: Global Command Bar & Patient Context Preservation
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 6: Global Command Bar & Patient Context Preservation ---');
    // Load Demo Patient
    const loadDemoBtn = desktopPage.locator('button:has-text("ডেমো কেস লোড করুন"), button:has-text("Load Demo Patient")').first();
    if (await loadDemoBtn.count() > 0) {
      await loadDemoBtn.click();
      await desktopPage.waitForTimeout(500);
    }

    // Verify Active Patient context is visible in PersistentPatientBar and Header
    const patientBarName = desktopPage.locator('text=Mrs. Nasreen Akhter');
    assert((await patientBarName.count()) > 0, 'Active patient Mrs. Nasreen Akhter displayed in patient context bar');

    // Verify Global Top Bar patient pill
    const headerPill = desktopPage.locator('header span:has-text("Mrs. Nasreen Akhter")');
    assert((await headerPill.count()) > 0, 'Active patient pill displayed in Global Top Command Bar');

    // -------------------------------------------------------------------
    // Scenario 7: Diet Chart Studio Asymmetric 8:4 Split Layout
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 7: Diet Chart Studio Asymmetric 8:4 Split Layout ---');
    await desktopPage.locator('[data-testid="nav-tab-diet"]').click();
    await desktopPage.waitForTimeout(500);

    // Verify 8-column main meal plan column
    const mainCol8 = desktopPage.locator('.lg\\:col-span-8');
    assert((await mainCol8.count()) > 0, 'Diet Studio contains 8-column main meal workspace (.lg:col-span-8)');

    // Verify 4-column sticky inspector rail
    const inspectorRail = desktopPage.locator('.lg\\:col-span-4');
    assert((await inspectorRail.count()) > 0, 'Diet Studio contains 4-column sticky nutrition & safety inspector rail (.lg:col-span-4)');

    // Verify target vs actual energy calculations inside inspector
    const macroInspector = inspectorRail.locator('text=/ম্যাক্রো টার্গেট|Macro Targets/i');
    assert((await macroInspector.count()) > 0, 'Inspector rail renders live macronutrient analysis');

    // -------------------------------------------------------------------
    // Scenario 8: Clinical Governance & Print Preserved
    // -------------------------------------------------------------------
    console.log('\n--- Scenario 8: Clinical Governance & Print Preserved ---');
    const headerPrintBtn = desktopPage.locator('header [data-testid="btn-print"]').first();
    assert((await headerPrintBtn.count()) > 0, 'A4 Print button is present in Global Top Command Bar');

    await desktopPage.close();

    console.log('\n================================================================');
    console.log(`STEP 06 RESULTS: ${passedAssertions}/${totalAssertions} Passed, ${failedAssertions} Failed`);
    console.log('================================================================\n');

    if (failedAssertions > 0) {
      process.exit(1);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

runStep06Verification().catch(err => {
  console.error(err);
  process.exit(1);
});

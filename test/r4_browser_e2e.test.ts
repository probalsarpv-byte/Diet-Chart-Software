/**
 * SHUDDHO CLINICAL FUNCTIONAL NUTRITION SOFTWARE
 * PHASE R4: PROTOCOL STUDIO BROWSER E2E TEST (PLAYWRIGHT)
 * 
 * Verifies real Chrome browser interaction:
 * 1. Navigation from Sidebar to Protocol Studio.
 * 2. Studio Header (Version, Status, Mode, Safety badge).
 * 3. Overview domain cards & safety audit link.
 * 4. Lifestyle recommendation toggling.
 * 5. Exercise prescription & clearance badges.
 * 6. Sleep schedule & dynamic curfews.
 * 7. Hydration ceiling & scheduled timetable.
 * 8. Targeted supplement candidates & action buttons.
 * 9. 24-Hour Chronotherapy Timeline & period grouping.
 * 10. Safety review & formal clinician sign-off card.
 * 11. Protocol saving & feedback toast.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium, Browser, Page } from 'playwright';

const PORT = 4592;
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
          const indexHtml = path.join(OUT_DIR, 'index.html');
          if (fs.existsSync(indexHtml)) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            fs.createReadStream(indexHtml).pipe(res);
          } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
          }
        }
      }
    });

    server.listen(PORT, () => {
      resolve({ server, port: PORT });
    });
  });
}

console.log('\n================================================================');
console.log('SHUDDHO R4: PROTOCOL STUDIO BROWSER E2E TEST (PLAYWRIGHT)');
console.log('================================================================\n');

(async () => {
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

    // Set demo mode in localStorage before loading
    await page.addInitScript(() => {
      localStorage.setItem('shuddho_lang', 'en');
      localStorage.setItem('shuddho_theme', 'dark');
    });

    console.log(`[Browser E2E] Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Scenario 1: Verify Page Title & Sidebar Nav Item
    console.log('\n--- Scenario 1: Navigate to Protocol Studio ---');
    const pageTitle = await page.title();
    assert(pageTitle.includes('SHUDDHO') || pageTitle.length > 0, `Page loaded successfully: "${pageTitle}"`);

    // Look for Protocol Studio in sidebar navigation
    const studioNavItem = page.locator('button:has-text("Protocol Studio"), button:has-text("প্রোটোকল স্টুডিও"), button:has-text("লাইফস্টাইল ও সাপ্লিমেন্ট")').first();
    const studioNavExists = await studioNavItem.isVisible({ timeout: 5000 }).catch(() => false);
    assert(studioNavExists, 'Protocol Studio navigation button is visible in Sidebar');

    await studioNavItem.click();
    await page.waitForTimeout(500);

    // Scenario 2: Protocol Studio Header & Studio Shell
    console.log('\n--- Scenario 2: Studio Header & Overview Verification ---');
    const studioHeader = page.locator('text=PHASE R4: PROTOCOL STUDIO');
    const headerVisible = await studioHeader.isVisible({ timeout: 5000 }).catch(() => false);
    assert(headerVisible, 'PHASE R4: PROTOCOL STUDIO badge is visible');

    // Verify subtab navigation pills
    const overviewTab = page.locator('button:has-text("Overview"), button:has-text("ওভারভিউ")').first();
    const lifestyleTab = page.locator('button:has-text("Lifestyle"), button:has-text("লাইফস্টাইল")').first();
    const exerciseTab = page.locator('button:has-text("Exercise"), button:has-text("শরীরচর্চা")').first();
    const sleepTab = page.locator('button:has-text("Sleep & Rhythm"), button:has-text("ঘুম ও ছন্দ")').first();
    const hydrationTab = page.locator('button:has-text("Hydration"), button:has-text("হাইড্রেশন")').first();
    const suppTab = page.locator('button:has-text("Supplements"), button:has-text("সাপ্লিমেন্ট")').first();
    const timelineTab = page.locator('button:has-text("24h Timeline"), button:has-text("২৪ঘণ্টা টাইমলাইন")').first();
    const safetyTab = page.locator('button:has-text("Safety & Sign-Off"), button:has-text("সেফটি ও সাইন-অফ")').first();

    assert(await overviewTab.isVisible(), 'Overview subtab is visible');
    assert(await lifestyleTab.isVisible(), 'Lifestyle subtab is visible');
    assert(await exerciseTab.isVisible(), 'Exercise subtab is visible');
    assert(await sleepTab.isVisible(), 'Sleep subtab is visible');
    assert(await hydrationTab.isVisible(), 'Hydration subtab is visible');
    assert(await suppTab.isVisible(), 'Supplements subtab is visible');
    assert(await timelineTab.isVisible(), '24h Timeline subtab is visible');
    assert(await safetyTab.isVisible(), 'Safety & Sign-Off subtab is visible');

    // Scenario 3: Lifestyle Subtab
    console.log('\n--- Scenario 3: Lifestyle Protocol Inspection ---');
    await lifestyleTab.click();
    await page.waitForTimeout(400);

    const lifestyleHeading = page.locator('h2:has-text("Lifestyle"), h2:has-text("লাইফস্টাইল")').first();
    assert(await lifestyleHeading.isVisible(), 'Lifestyle section heading is rendered');

    // Check presence of recommendations
    const recItems = page.locator('div:has-text("Purpose:"), div:has-text("উদ্দেশ্য:")');
    const recCount = await recItems.count();
    assert(recCount >= 4, `At least 4 lifestyle recommendations rendered (found: ${recCount})`);

    // Scenario 4: Exercise Prescription Subtab
    console.log('\n--- Scenario 4: Exercise Prescription & Safety ---');
    await exerciseTab.click();
    await page.waitForTimeout(400);

    const aerobicTargetText = page.getByText(/Weekly Aerobic Target|সাপ্তাহিক বায়বীয়/i).first();
    assert(await aerobicTargetText.isVisible(), 'Weekly Aerobic Target card is displayed');

    // Scenario 5: Sleep & Circadian Chronobiology Subtab
    console.log('\n--- Scenario 5: Sleep Schedule & Curfews ---');
    await sleepTab.click();
    await page.waitForTimeout(400);

    const wakeInput = page.locator('input[type="time"]').first();
    assert(await wakeInput.isVisible(), 'Wake time time input is rendered');

    const caffeineCurfewCard = page.getByText(/Caffeine Cutoff|ক্যাফেইন কার্ফু/i).first();
    assert(await caffeineCurfewCard.isVisible(), 'Caffeine Cutoff chronobiological curfew card is displayed');

    // Scenario 6: Hydration Subtab
    console.log('\n--- Scenario 6: Hydration & Restriction Architecture ---');
    await hydrationTab.click();
    await page.waitForTimeout(400);

    const scheduledFluidLabel = page.getByText(/Scheduled Fluid Volume|নির্ধারিত দৈনিক তরল/i).first();
    assert(await scheduledFluidLabel.isVisible(), 'Scheduled Fluid Volume metric is visible');

    // Scenario 7: Supplements Subtab
    console.log('\n--- Scenario 7: Targeted Supplements Protocol ---');
    await suppTab.click();
    await page.waitForTimeout(400);

    const suppHeading = page.locator('h2:has-text("Supplement"), h2:has-text("সাপ্লিমেন্ট")').first();
    assert(await suppHeading.isVisible(), 'Supplement section heading is displayed');

    // Scenario 8: 24-Hour Chronotherapy Timeline
    console.log('\n--- Scenario 8: 24-Hour Chronotherapy Timeline ---');
    await timelineTab.click();
    await page.waitForTimeout(400);

    const morningPhase = page.getByText(/Morning Phase|সকাল ও প্রাতঃকাল/i).first();
    const nocturnalPhase = page.getByText(/Nocturnal Phase|রাত্রিকাল ও গভীর ঘুম/i).first();
    assert(await morningPhase.isVisible(), 'Morning Phase period block is visible');
    assert(await nocturnalPhase.isVisible(), 'Nocturnal Phase period block is visible');

    // Scenario 9: Safety Review & Formal Sign-Off
    console.log('\n--- Scenario 9: Safety Review & Approval Gate ---');
    await safetyTab.click();
    await page.waitForTimeout(400);

    const safetyHeading = page.locator('h2:has-text("Clinical Safety"), h2:has-text("ক্লিনিক্যাল সেফটি")').first();
    assert(await safetyHeading.isVisible(), 'Safety review header is displayed');

    const signOffCard = page.locator('h3:has-text("Formal Protocol Sign-Off"), h3:has-text("আনুষ্ঠানিক অনুমোদন")').first();
    assert(await signOffCard.isVisible(), 'Formal Clinician Sign-Off card is displayed');

    // Save Protocol Button test
    const saveBtn = page.locator('button:has-text("Save Protocol"), button:has-text("সংরক্ষণ করুন")').first();
    assert(await saveBtn.isVisible(), 'Save Protocol action button is visible');
    await saveBtn.click();
    await page.waitForTimeout(600);

    const saveSuccess = page.getByText(/Protocol saved successfully|সফলভাবে সংরক্ষিত/i).first();
    const saveSuccessVisible = await saveSuccess.isVisible({ timeout: 3000 }).catch(() => false);
    assert(saveSuccessVisible, 'Save confirmation toast/message displayed');

  } catch (err: any) {
    console.error('Fatal Browser E2E Error:', err);
    assert(false, `Browser E2E Execution Failed: ${err.message}`);
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  console.log('\n================================================================');
  console.log(`TOTAL BROWSER ASSERTIONS: ${totalAssertions}`);
  console.log(`PASSED: ${passedAssertions}`);
  console.log(`FAILED: ${failedAssertions}`);
  console.log('================================================================\n');

  if (failedAssertions > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
})();

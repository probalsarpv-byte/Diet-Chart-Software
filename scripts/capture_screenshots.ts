import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const PORT = 4575;
const BASE_URL = `http://localhost:${PORT}/Diet-Chart-Software/`;
const OUT_DIR = path.resolve('out');
const SCREENSHOT_DIR = path.resolve('docs/qa/screenshots/ui-v3');

const mode = process.argv[2] || 'before'; // 'before' or 'after'

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

async function capture() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const server = await startStaticServer();
  console.log(`[Static Server] Running at ${BASE_URL}`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  try {
    // 1. Desktop Dashboard
    console.log(`Capturing Desktop Dashboard (${mode})...`);
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Switch to English for standard review readability if needed, or keep current
    // Let's capture desktop dashboard
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `dashboard-desktop-${mode}.png`), fullPage: false });

    // 2. Mobile Dashboard
    console.log(`Capturing Mobile Dashboard (${mode})...`);
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, `dashboard-mobile-${mode}.png`), fullPage: false });
    await mobilePage.close();

    // Helper to click tab on desktop page
    const switchTab = async (textPattern: string | RegExp) => {
      // Find button matching text
      const tabBtn = page.locator('button').filter({ hasText: textPattern }).first();
      if (await tabBtn.count() > 0) {
        await tabBtn.click();
        await page.waitForTimeout(800);
      }
    };

    // 3. Patients Tab
    console.log(`Capturing Patients (${mode})...`);
    await switchTab(/রোগী রেজিস্ট্রি|Patients/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `patients-${mode}.png`), fullPage: false });

    // 4. Assessment Tab
    console.log(`Capturing Assessment (${mode})...`);
    await switchTab(/অ্যাসেসমেন্ট|Assessment/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `assessment-${mode}.png`), fullPage: false });

    // 5. Clinical Intelligence Tab
    console.log(`Capturing Intelligence (${mode})...`);
    await switchTab(/ইন্টেলিজেন্স|Intelligence/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `intelligence-${mode}.png`), fullPage: false });

    // 6. Diet Planner Tab
    console.log(`Capturing Diet Planner (${mode})...`);
    await switchTab(/ডায়েট|Diet/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `diet-planner-${mode}.png`), fullPage: false });

    // 7. Follow-Up Tab
    console.log(`Capturing Follow-Up (${mode})...`);
    await switchTab(/ফলো-আপ|Follow-Up/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `followup-${mode}.png`), fullPage: false });

    // 8. Reports Tab
    console.log(`Capturing Reports (${mode})...`);
    await switchTab(/রিপোর্ট|Reports/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `reports-${mode}.png`), fullPage: false });

    if (mode === 'after') {
      // 9. Dark Mode Dashboard After
      console.log(`Capturing Dark Mode Dashboard (after)...`);
      await switchTab(/ড্যাশবোর্ড|Dashboard/);
      // Toggle theme if button exists
      const themeBtn = page.locator('header button[title*="Dark"], header button[title*="Light"], button:has-text("🌙"), button:has-text("☀️"), [data-testid="btn-theme-toggle"]').first();
      if (await themeBtn.count() > 0) {
        await themeBtn.click();
        await page.waitForTimeout(500);
      } else {
        await page.evaluate(() => document.documentElement.classList.toggle('dark'));
        await page.waitForTimeout(500);
      }
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `dashboard-dark-after.png`), fullPage: false });

      // 10. DNI Screen After
      console.log(`Capturing DNI Screen (after)...`);
      // Toggle back to light if in dark
      await page.evaluate(() => document.documentElement.classList.remove('dark'));
      const dniBtn = page.locator('button').filter({ hasText: /DNI|ওষুধ/ }).first();
      if (await dniBtn.count() > 0) {
        await dniBtn.click();
        await page.waitForTimeout(800);
      }
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `dni-after.png`), fullPage: false });
    }

    await page.close();
    console.log(`[Screenshot Capture] All ${mode} screenshots saved to ${SCREENSHOT_DIR}`);
  } finally {
    await browser.close();
    server.close();
  }
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});

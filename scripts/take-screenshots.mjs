import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function takeScreenshots() {
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: null
  });

  const page = await browser.newPage();

  // Desktop screenshot (wide)
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.waitForTimeout(2000); // Wait for animations
  await page.screenshot({
    path: join(__dirname, '../public/screenshot-desktop.png'),
    fullPage: false
  });

  // Mobile screenshot (narrow)
  await page.setViewport({ width: 390, height: 844 }); // iPhone 12 Pro dimensions
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: join(__dirname, '../public/screenshot-mobile.png'),
    fullPage: false
  });

  await browser.close();
  console.log('Screenshots generated successfully!');
}

// Make sure dev server is running before taking screenshots
takeScreenshots().catch(console.error);

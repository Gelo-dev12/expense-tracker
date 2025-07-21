const puppeteer = require('puppeteer');
const path = require('path');

async function takeScreenshots() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Desktop screenshot
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000); // Wait for animations
  await page.screenshot({
    path: path.join(__dirname, '../public/screenshot-desktop.png'),
    fullPage: false
  });

  // Mobile screenshot
  await page.setViewport({ width: 750, height: 1334 });
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000); // Wait for animations
  await page.screenshot({
    path: path.join(__dirname, '../public/screenshot-mobile.png'),
    fullPage: false
  });

  await browser.close();
}

takeScreenshots().catch(console.error);

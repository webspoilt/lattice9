#!/usr/bin/env node
/**
 * render_diagrams.js — Render HTML diagram files to PNG at 2x device scale
 * Usage: node render_diagrams.js <input.html> <output.png> [width]
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function render(inputHtml, outputPng, widthPx = 1200) {
  const absIn = path.resolve(inputHtml);
  const absOut = path.resolve(outputPng);

  if (!fs.existsSync(absIn)) {
    console.error(`Error: File not found: ${absIn}`);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: widthPx, height: 800 },
      deviceScaleFactor: 2,
    });

    await page.goto('file://' + absIn, { waitUntil: 'networkidle' });

    // Measure actual content height
    const height = await page.evaluate(() => {
      return document.documentElement.scrollHeight || document.body.scrollHeight || 800;
    });

    // Set viewport to match content
    await page.setViewportSize({ width: widthPx, height: height });

    // Screenshot
    await page.screenshot({
      path: absOut,
      fullPage: true,
      type: 'png',
    });

    const stats = fs.statSync(absOut);
    console.log(`OK: ${absOut} (${(stats.size / 1024).toFixed(1)} KB, ${widthPx}x${height} @2x)`);
  } finally {
    await browser.close();
  }
}

// CLI
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node render_diagrams.js <input.html> <output.png> [width]');
  process.exit(1);
}
render(args[0], args[1], parseInt(args[2]) || 1200).catch(err => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});

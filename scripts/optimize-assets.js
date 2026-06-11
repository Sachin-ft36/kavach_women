/**
 * Kavach UI Asset Optimization Script
 * 
 * Converts heavy raw PNG/JPEG UI assets into next-generation highly compressed WEBP format.
 * This is crucial for mobile networks in rural/tier-3 areas to load the app quickly.
 * 
 * Run with: node scripts/optimize-assets.js
 * Requires: npm install sharp
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const ASSETS_DIR = path.join(process.cwd(), 'src/assets');

async function optimizeDirectory(dir) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      await optimizeDirectory(filePath);
    } else if (file.match(/\.(png|jpe?g)$/i)) {
      const ext = path.extname(file);
      const basename = path.basename(file, ext);
      const webpPath = path.join(dir, `${basename}.webp`);

      try {
        console.log(`[OPTIMIZE] Compressing: ${file} -> ${basename}.webp`);
        await sharp(filePath)
          .webp({ quality: 80, effort: 6 }) // Max compression effort
          .toFile(webpPath);
          
        console.log(`✅ Success: ${webpPath}`);
        // Optional: fs.unlinkSync(filePath) to delete original
      } catch (err) {
        console.error(`❌ Failed to compress ${file}:`, err);
      }
    }
  }
}

async function run() {
  console.log('🚀 Kavach UI Asset Optimization Pipeline Started...');
  await optimizeDirectory(PUBLIC_DIR);
  await optimizeDirectory(ASSETS_DIR);
  console.log('🎉 Optimization Complete! UI payload size reduced significantly.');
}

// execute if run directly
run();

import sharp from 'sharp';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateFavicon() {
  // Read the SVG file
  const svgBuffer = await fs.readFile(join(__dirname, '../public/favicon.svg'));

  // Generate different sizes
  const sizes = [16, 32, 48, 72, 96, 128, 256];

  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .toFile(join(__dirname, `../public/favicon-${size}.png`));
  }

  console.log('Generated all favicon sizes!');
}

generateFavicon().catch(console.error);

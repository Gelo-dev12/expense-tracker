import { createCanvas, loadImage } from 'canvas';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function resizeIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Load the base icon
  const image = await loadImage(join(__dirname, '../public/icon-base.png'));

  // Draw and resize
  ctx.drawImage(image, 0, 0, size, size);

  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(join(__dirname, `../public/icon-${size}.png`), buffer);

  console.log(`Generated ${size}x${size} icon`);
}

// Generate both sizes
Promise.all([
  resizeIcon(192),
  resizeIcon(512)
]).then(() => {
  console.log('All icons generated successfully!');
}).catch(console.error);

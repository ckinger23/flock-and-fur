const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create an SVG icon with the Flock & Fur branding
const createSvgIcon = (size) => {
  const padding = Math.round(size * 0.15);
  const innerSize = size - (padding * 2);
  const fontSize = Math.round(size * 0.35);
  const smallFontSize = Math.round(size * 0.12);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#16a34a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#15803d;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="url(#bg)"/>
      <text
        x="${size / 2}"
        y="${size / 2 - smallFontSize * 0.3}"
        font-family="Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="white"
        text-anchor="middle"
        dominant-baseline="middle"
      >F&amp;F</text>
      <text
        x="${size / 2}"
        y="${size / 2 + fontSize * 0.6}"
        font-family="Arial, sans-serif"
        font-size="${smallFontSize}"
        fill="rgba(255,255,255,0.9)"
        text-anchor="middle"
        dominant-baseline="middle"
      >CLEANUP</text>
    </svg>
  `;
};

async function generateIcons() {
  console.log('Generating PWA icons...');

  for (const size of sizes) {
    const svgBuffer = Buffer.from(createSvgIcon(size));
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

    await sharp(svgBuffer)
      .png()
      .toFile(outputPath);

    console.log(`  Created: icon-${size}x${size}.png`);
  }

  // Create favicon.ico (use 32x32)
  const favicon32 = Buffer.from(createSvgIcon(32));
  await sharp(favicon32)
    .png()
    .toFile(path.join(outputDir, '../favicon.ico'));
  console.log('  Created: favicon.ico');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);

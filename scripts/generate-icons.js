const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#000"/>
      <circle cx="${size/2}" cy="${size/2}" r="${size * 0.3125}" fill="none" stroke="#fff" stroke-width="${size * 0.04167}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${size * 0.0625}" fill="#fff"/>
      <path d="M ${size/2} ${size/2} L ${size/2 + size * 0.125} ${size/2 - size * 0.1875}" stroke="#fff" stroke-width="${size * 0.04167}" stroke-linecap="round"/>
    </svg>
  `;
  
  const outputPath = path.join(__dirname, `icon-${size}x${size}.png`);
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
  
  console.log(`✓ Generated ${outputPath}`);
}

async function main() {
  try {
    await generateIcon(192);
    await generateIcon(512);
    console.log('✓ All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

main();

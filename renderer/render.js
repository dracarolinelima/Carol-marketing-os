const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

// --- Load card definition ---
const cardPath = process.argv[2];
if (!cardPath) {
  console.error('Usage: node render.js <card-file>');
  process.exit(1);
}
const card = require(path.resolve(cardPath));

// --- Build SVG ---
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSvg(card) {
  const { width, height, background } = card.canvas;
  const textElements = [];

  for (const block of card.textBlocks) {
    for (const line of block.lines) {
      const attrs = [
        `x="${block.x}"`,
        `y="${line.y}"`,
        `font-family="${escapeXml(block.fontFamily)}"`,
        `font-weight="${block.fontWeight}"`,
        `font-size="${block.fontSize}"`,
        `fill="${block.fill}"`,
        `letter-spacing="${block.letterSpacing}"`,
      ];
      if (block.opacity !== undefined && block.opacity !== 1) {
        attrs.push(`opacity="${block.opacity}"`);
      }
      textElements.push(`  <text ${attrs.join(' ')}>${escapeXml(line.text)}</text>`);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${background}" />
${textElements.join('\n')}
</svg>`;
}

const svg = buildSvg(card);

// --- Output paths ---
const outputDir = path.join(__dirname, '..', 'generated_imgs');
const baseName = card.meta.output;
const svgPath = path.join(outputDir, `${baseName}.svg`);
const pngPath = path.join(outputDir, `${baseName}.png`);

// --- Save SVG ---
fs.writeFileSync(svgPath, svg, 'utf-8');
console.log(`SVG saved: ${svgPath}`);

// --- Render PNG ---
const fontsDir = path.join(__dirname, 'fonts');
const fontFiles = fs.readdirSync(fontsDir)
  .filter(f => f.endsWith('.ttf') || f.endsWith('.otf'))
  .map(f => path.join(fontsDir, f));

const resvg = new Resvg(svg, {
  fitTo: { mode: 'original' },
  font: {
    fontFiles: fontFiles,
    loadSystemFonts: false,
    defaultFontFamily: 'Cormorant Garamond',
  },
});

const rendered = resvg.render();
const pngBuffer = rendered.asPng();
fs.writeFileSync(pngPath, pngBuffer);

// --- Validate dimensions ---
const pngWidth = rendered.width;
const pngHeight = rendered.height;
console.log(`PNG saved: ${pngPath}`);
console.log(`Dimensions: ${pngWidth} × ${pngHeight}`);

if (pngWidth !== card.canvas.width || pngHeight !== card.canvas.height) {
  console.error(`WARNING: Expected ${card.canvas.width} × ${card.canvas.height}, got ${pngWidth} × ${pngHeight}`);
  process.exit(1);
} else {
  console.log('Dimensions validated: OK');
}

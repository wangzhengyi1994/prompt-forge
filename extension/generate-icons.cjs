/**
 * Run with: node generate-icons.js
 * Generates simple PNG icons for the extension using Canvas API (Node 20+)
 * If canvas is not available, creates placeholder SVG-based icons
 */
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];
const dir = path.join(__dirname, 'icons');

if (!fs.existsSync(dir)) fs.mkdirSync(dir);

// Generate simple colored square PNG icons (minimal valid PNG)
// Since we can't rely on node-canvas, create SVG files and a note

for (const size of sizes) {
  // Minimal 1-color PNG generator
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#7c3aed"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="bold" font-size="${size * 0.5}px">P</text>
</svg>`;

  // Write as SVG (Chrome extensions accept SVG in newer versions, but for compatibility we note PNG is needed)
  fs.writeFileSync(path.join(dir, `icon${size}.svg`), svg);

  // Create a minimal valid PNG (solid purple square)
  const png = createMinimalPNG(size);
  fs.writeFileSync(path.join(dir, `icon${size}.png`), png);
}

console.log('Icons generated in icons/');

/**
 * Create a minimal valid PNG file (solid color)
 */
function createMinimalPNG(size) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);  // width
  ihdr.writeUInt32BE(size, 4);  // height
  ihdr.writeUInt8(8, 8);        // bit depth
  ihdr.writeUInt8(2, 9);        // color type (RGB)
  ihdr.writeUInt8(0, 10);       // compression
  ihdr.writeUInt8(0, 11);       // filter
  ihdr.writeUInt8(0, 12);       // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk (raw image data, compressed with zlib)
  const zlib = require('zlib');
  const rawData = Buffer.alloc(size * (1 + size * 3)); // filter byte + RGB per pixel per row
  for (let y = 0; y < size; y++) {
    const rowOffset = y * (1 + size * 3);
    rawData[rowOffset] = 0; // no filter
    for (let x = 0; x < size; x++) {
      const px = rowOffset + 1 + x * 3;
      rawData[px] = 124;     // R (#7c)
      rawData[px + 1] = 58;  // G (#3a)
      rawData[px + 2] = 237; // B (#ed)
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData));

  return Buffer.concat([len, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

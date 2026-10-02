// Tegner app-ikonerne i public/: mønstret 4-4-3-2 ("Trappen") som skyline.
// Kør igen efter ændringer: node scripts/make-icons.mjs
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const BG = [0x26, 0x32, 0x41];
const BAR = [0x7c, 0xb3, 0xff]; // lys blå: familie 4
const BASE = [0xe8, 0xec, 0xf1];

// Koordinater i et 512 × 512-felt. Alt ligger inden for den sikre zone for maskerbare ikoner.
const BASELINE = 363;
const BARS = [4, 4, 3, 2].map((length, i) => ({ x: 106 + i * 80, w: 60, h: length * 56 }));

function render(size) {
  const s = size / 512;
  const px = new Float64Array(size * size * 3);
  for (let i = 0; i < size * size; i++) px.set(BG, i * 3);

  // Rektangel med kantudglatning: hver pixel dækkes med den andel, rektanglet dækker af den.
  function rect(x0, y0, x1, y1, color) {
    for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
      const cy = Math.min(y + 1, y1) - Math.max(y, y0);
      for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
        const a = cy * (Math.min(x + 1, x1) - Math.max(x, x0));
        const i = (y * size + x) * 3;
        for (let c = 0; c < 3; c++) px[i + c] = px[i + c] * (1 - a) + color[c] * a;
      }
    }
  }

  for (const b of BARS) rect(b.x * s, (BASELINE - b.h) * s, (b.x + b.w) * s, BASELINE * s, BAR);
  rect(90 * s, BASELINE * s, 422 * s, (BASELINE + 10) * s, BASE);
  return px;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), body.length + 4);
  return out;
}

function png(size) {
  const px = render(size);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bitdybde
  header[9] = 2; // RGB
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size * 3; x++) raw[y * (size * 3 + 1) + 1 + x] = Math.round(px[y * size * 3 + x]);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const hex = (rgb) => `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${hex(BG)}"/>
  <g fill="${hex(BAR)}">
${BARS.map((b) => `    <rect x="${b.x}" y="${BASELINE - b.h}" width="${b.w}" height="${b.h}" rx="6"/>`).join('\n')}
  </g>
  <rect x="90" y="${BASELINE}" width="332" height="10" rx="3" fill="${hex(BASE)}"/>
</svg>
`;

writeFileSync('public/pwa-192.png', png(192));
writeFileSync('public/pwa-512.png', png(512));
writeFileSync('public/pwa-maskable-512.png', png(512));
writeFileSync('public/apple-touch-icon.png', png(180));
writeFileSync('public/favicon.svg', svg);
console.log('Ikoner skrevet til public/');

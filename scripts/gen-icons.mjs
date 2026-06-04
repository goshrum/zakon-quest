#!/usr/bin/env node
// Generates the PWA PNG icons (192, 512, maskable 512) using only Node
// built-ins — a minimal PNG encoder (zlib for the IDAT deflate). The artwork is
// a simple, on-brand mark: the app's indigo background with a soft radial glow
// and a stylised white "balance scales" glyph, matching the theme color.

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../public/icons");

// ---- PNG encoder (truecolor + alpha, 8-bit) ----
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Add a filter byte (0) at the start of each scanline.
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// ---- Artwork ----
function clamp(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

function drawIcon(size, { maskable }) {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;

  // Brand palette (matches CSS tokens).
  const bg = [15, 18, 38]; // #0f1226
  const glow = [108, 140, 255]; // accent
  const glow2 = [160, 107, 255]; // accent-2
  const ink = [238, 241, 255]; // text

  // Maskable icons need their content within a safe ~80% circle; shrink glyph.
  const glyphScale = maskable ? 0.56 : 0.68;

  const set = (x, y, r, g, b, a = 255) => {
    const i = (y * size + x) * 4;
    const ia = a / 255;
    rgba[i] = clamp(rgba[i] * (1 - ia) + r * ia);
    rgba[i + 1] = clamp(rgba[i + 1] * (1 - ia) + g * ia);
    rgba[i + 2] = clamp(rgba[i + 2] * (1 - ia) + b * ia);
    rgba[i + 3] = 255;
  };

  // Background with two soft radial glows.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      rgba[i] = bg[0];
      rgba[i + 1] = bg[1];
      rgba[i + 2] = bg[2];
      rgba[i + 3] = 255;

      const d1 = Math.hypot(x - size * 0.8, y - size * 0.1) / size;
      const d2 = Math.hypot(x - size * 0.1, y - size * 1.05) / size;
      const a1 = Math.max(0, 0.5 - d1) * 0.9;
      const a2 = Math.max(0, 0.5 - d2) * 0.9;
      set(x, y, glow[0], glow[1], glow[2], a1 * 255);
      set(x, y, glow2[0], glow2[1], glow2[2], a2 * 255);
    }
  }

  // Stylised balance scales, drawn from primitives, centered.
  const u = size * glyphScale; // overall glyph height span
  const top = cy - u * 0.42;
  const bottom = cy + u * 0.42;
  const beamY = top + u * 0.18;
  const lw = Math.max(2, Math.round(size * 0.018)); // line half-width

  const hline = (y, x0, x1) => {
    for (let x = Math.round(x0); x <= Math.round(x1); x++) {
      for (let t = -lw; t <= lw; t++) set(x, Math.round(y) + t, ink[0], ink[1], ink[2]);
    }
  };
  const vline = (x, y0, y1) => {
    for (let y = Math.round(y0); y <= Math.round(y1); y++) {
      for (let t = -lw; t <= lw; t++) set(Math.round(x) + t, y, ink[0], ink[1], ink[2]);
    }
  };

  // Central post + base.
  vline(cx, top, bottom);
  hline(bottom, cx - u * 0.22, cx + u * 0.22);
  // Top knob.
  const knobR = Math.max(3, Math.round(size * 0.03));
  for (let y = -knobR; y <= knobR; y++)
    for (let x = -knobR; x <= knobR; x++)
      if (x * x + y * y <= knobR * knobR) set(Math.round(cx + x), Math.round(top + y), ink[0], ink[1], ink[2]);

  // Beam.
  const armX = u * 0.34;
  hline(beamY, cx - armX, cx + armX);

  // Two pans (arcs) hanging from the beam ends via short strings.
  const panY = beamY + u * 0.26;
  const panR = u * 0.16;
  for (const ex of [cx - armX, cx + armX]) {
    vline(ex, beamY, panY - panR * 0.2);
    // Draw a shallow bowl: lower half-circle outline.
    for (let a = 0; a <= Math.PI; a += 0.02) {
      const px = ex + Math.cos(a) * panR;
      const py = panY + Math.sin(a) * panR * 0.7;
      for (let t = -lw; t <= lw; t++) {
        set(Math.round(px), Math.round(py) + t, ink[0], ink[1], ink[2]);
        set(Math.round(px) + t, Math.round(py), ink[0], ink[1], ink[2]);
      }
    }
  }

  return encodePng(size, size, rgba);
}

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "icon-maskable-512.png", size: 512, maskable: true },
];

for (const t of targets) {
  const png = drawIcon(t.size, { maskable: t.maskable });
  writeFileSync(resolve(OUT_DIR, t.file), png);
  console.log(`wrote public/icons/${t.file} (${png.length} bytes)`);
}

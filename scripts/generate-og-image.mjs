/**
 * 生成社交分享图 public/og-image.png（1200x630）
 * 零依赖：使用 Node 内置 zlib 手写 PNG 编码。
 * 用法：node scripts/generate-og-image.mjs
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../public/og-image.png')

const W = 1200
const H = 630

// ---- CRC32 ----
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

// ---- 5x7 点阵字体 ----
const FONT = {
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  e: ['00000', '00000', '01110', '10001', '11111', '10000', '01110'],
  r: ['00000', '00000', '10110', '11001', '10000', '10000', '10000'],
  o: ['00000', '00000', '01110', '10001', '10001', '10001', '01110'],
  l: ['01100', '00100', '00100', '00100', '00100', '00100', '01110'],
  s: ['00000', '00000', '01111', '10000', '01110', '00001', '11110'],
  n: ['00000', '00000', '10110', '11001', '10001', '10001', '10001'],
  i: ['00100', '00000', '01100', '00100', '00100', '00100', '01110'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011']
}

const px = new Uint8Array(W * H * 3)

function setPixel(x, y, rgb, alpha = 1) {
  if (x < 0 || y < 0 || x >= W || y >= H) return
  const i = (y * W + x) * 3
  if (alpha >= 1) {
    px[i] = rgb[0]
    px[i + 1] = rgb[1]
    px[i + 2] = rgb[2]
    return
  }
  px[i] = Math.round(px[i] * (1 - alpha) + rgb[0] * alpha)
  px[i + 1] = Math.round(px[i + 1] * (1 - alpha) + rgb[1] * alpha)
  px[i + 2] = Math.round(px[i + 2] * (1 - alpha) + rgb[2] * alpha)
}

// 对角渐变背景 (#4f46e5 -> #06b6d4)
const from = [79, 70, 229]
const to = [6, 182, 212]
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const t = Math.min(1, Math.max(0, (x / W) * 0.72 + (y / H) * 0.28))
    setPixel(x, y, [
      Math.round(from[0] + (to[0] - from[0]) * t),
      Math.round(from[1] + (to[1] - from[1]) * t),
      Math.round(from[2] + (to[2] - from[2]) * t)
    ])
  }
}

// 圆形光斑
function blob(cx, cy, r, rgb, alpha) {
  for (let y = Math.max(0, cy - r); y < Math.min(H, cy + r); y++) {
    for (let x = Math.max(0, cx - r); x < Math.min(W, cx + r); x++) {
      const d = Math.hypot(x - cx, y - cy)
      if (d <= r) {
        const a = alpha * Math.pow(1 - d / r, 1.6)
        setPixel(x, y, rgb, a)
      }
    }
  }
}
blob(1010, 120, 300, [255, 255, 255], 0.14)
blob(150, 590, 320, [255, 255, 255], 0.1)

function drawText(text, x0, y0, scale, rgb) {
  let x = x0
  for (const ch of text) {
    const glyph = FONT[ch]
    if (!glyph) {
      x += 6 * scale
      continue
    }
    for (let gy = 0; gy < 7; gy++) {
      for (let gx = 0; gx < 5; gx++) {
        if (glyph[gy][gx] === '1') {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              setPixel(x + gx * scale + sx, y0 + gy * scale + sy, rgb)
            }
          }
        }
      }
    }
    x += 6 * scale
  }
  return x
}

function textWidth(text, scale) {
  return text.length * 6 * scale - scale
}

// 主标题 FreeTools
const title = 'FreeTools'
const titleScale = 18
drawText(title, Math.round((W - textWidth(title, titleScale)) / 2), 210, titleScale, [255, 255, 255])

// 副标题
const sub = '24+ Free Online Tools'
const subScale = 6
drawText(sub, Math.round((W - textWidth(sub, subScale)) / 2), 400, subScale, [255, 255, 255])

// ---- 编码 PNG ----
const raw = Buffer.alloc((W * 3 + 1) * H)
for (let y = 0; y < H; y++) {
  const off = y * (W * 3 + 1)
  raw[off] = 0
  Buffer.from(px.buffer, y * W * 3, W * 3).copy(raw, off + 1)
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(W, 0)
ihdr.writeUInt32BE(H, 4)
ihdr[8] = 8
ihdr[9] = 2
ihdr[10] = 0
ihdr[11] = 0
ihdr[12] = 0

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0))
])

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, png)
console.log(`og-image.png generated: ${OUT} (${(png.length / 1024).toFixed(1)} KB)`)

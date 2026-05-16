// Generates assets/icon.png — a 256x256 lime-green rounded square with "rC"
// Uses only Node.js built-ins (no npm packages needed).
// Run: node scripts/create-icon.js

const zlib = require('zlib')
const fs   = require('fs')
const path = require('path')

const W = 256, H = 256

// ── CRC32 ─────────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const tb  = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([tb, data])))
  return Buffer.concat([len, tb, data, crc])
}

// ── pixel data ────────────────────────────────────────────────────────────────
// Colours
const BG   = [163, 230, 53]   // --accent lime green
const DARK = [10,  10,  10]   // near-black for the letters
const CORN = [120, 180, 30]   // slightly darker corner for depth

// Per-pixel RGBA → 3-channel RGB for the PNG
function getPixel(x, y) {
  const cx = W / 2, cy = H / 2
  const r  = 36                 // corner radius

  // Rounded rectangle mask
  const dx = Math.max(0, Math.abs(x - cx) - (cx - r))
  const dy = Math.max(0, Math.abs(y - cy) - (cy - r))
  if (dx * dx + dy * dy > r * r) return null  // transparent → use bg colour... but PNG is RGB, so use body colour

  // Inside the rounded rect
  // Simple "rC" text via pixel regions (hand-crafted for 256px)
  const lx = x - 72, ly = y - 88   // letter origin

  // "r" — drawn as a rough pixel glyph (40×60 region)
  if (lx >= 0 && lx < 40 && ly >= 0 && ly < 60) {
    // vertical stem
    if (lx < 8) return DARK
    // top arc stub (rows 0-18, right side)
    if (ly < 18 && lx >= 8 && lx < 32 && ly < 8) return DARK
    if (ly >= 6 && ly < 20 && lx >= 28 && lx < 40) return DARK
    return BG
  }

  // "C" — drawn in the region starting at lx2/ly2
  const lx2 = x - 130, ly2 = y - 88
  if (lx2 >= 0 && lx2 < 64 && ly2 >= 0 && ly2 < 60) {
    const ccx = 32, ccy = 30, outr = 28, inr = 18
    const ddx = lx2 - ccx, ddy = ly2 - ccy
    const dist = Math.sqrt(ddx * ddx + ddy * ddy)
    // Ring between inner and outer radius
    if (dist <= outr && dist >= inr) {
      // Cut open the right side of the C (angle 330°→30° cut)
      const angle = Math.atan2(ddy, ddx) * 180 / Math.PI
      if (angle > 30 || angle < -30) return DARK   // closing gap on left
      return BG
    }
    return BG
  }

  return BG
}

// Build raw scanlines
const rows = []
for (let y = 0; y < H; y++) {
  const row = [0]   // filter byte: None
  for (let x = 0; x < W; x++) {
    const p = getPixel(x, y) || [10, 10, 10]
    row.push(p[0], p[1], p[2])
  }
  rows.push(Buffer.from(row))
}

const raw        = Buffer.concat(rows)
const compressed = zlib.deflateSync(raw, { level: 9 })

// IHDR
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(W, 0)
ihdr.writeUInt32BE(H, 4)
ihdr[8] = 8   // bit depth
ihdr[9] = 2   // colour type: RGB

const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A])
const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])

const out = path.join(__dirname, '..', 'assets', 'icon.png')
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, png)
console.log('icon created →', out)

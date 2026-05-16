// ── COLOR CONVERTER ──────────────────────────────────────────────────────────

function hexToRgb(hex) {
  hex = hex.replace(/^#/, '')
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
  const n = parseInt(hex, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s
  const l = (max + min) / 2
  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function applyColor(hex) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return
  const swatch = document.getElementById('color-swatch')
  const pick   = document.getElementById('color-pick')
  const rgb    = document.getElementById('color-rgb')
  const hsl    = document.getElementById('color-hsl')
  const css    = document.getElementById('color-css')
  if (!swatch) return
  swatch.style.background = hex
  if (pick) pick.value = hex
  const { r, g, b } = hexToRgb(hex)
  const { h, s, l } = rgbToHsl(r, g, b)
  if (rgb) rgb.textContent = `rgb(${r}, ${g}, ${b})`
  if (hsl) hsl.textContent = `hsl(${h}, ${s}%, ${l}%)`
  if (css) css.textContent = `--color: ${hex};`
}

const colorPick = document.getElementById('color-pick')
const colorHex  = document.getElementById('color-hex')

if (colorPick) {
  colorPick.addEventListener('input', e => {
    if (colorHex) colorHex.value = e.target.value
    applyColor(e.target.value)
  })
}

if (colorHex) {
  colorHex.addEventListener('input', e => {
    let v = e.target.value.trim()
    if (!v.startsWith('#')) v = '#' + v
    applyColor(v)
  })
  applyColor('#2563eb')
}

// ── BASE64 ───────────────────────────────────────────────────────────────────

let b64Mode = 'encode'

function setB64(mode) {
  b64Mode = mode
  const enc = document.getElementById('b64-enc')
  const dec = document.getElementById('b64-dec')
  if (enc) enc.classList.toggle('active', mode === 'encode')
  if (dec) dec.classList.toggle('active', mode === 'decode')
  runB64()
}

function runB64() {
  const inp = document.getElementById('b64-in')
  const out = document.getElementById('b64-out')
  if (!inp || !out) return
  const val = inp.value
  if (!val) { out.textContent = 'Result appears here'; return }
  try {
    out.textContent = b64Mode === 'encode'
      ? btoa(unescape(encodeURIComponent(val)))
      : decodeURIComponent(escape(atob(val)))
  } catch {
    out.textContent = 'Invalid input'
  }
}

// ── JSON FORMATTER ───────────────────────────────────────────────────────────

function fmtJSON(mode) {
  const inp = document.getElementById('json-in')
  const out = document.getElementById('json-out')
  const err = document.getElementById('json-err')
  if (!inp || !out) return
  if (err) err.style.display = 'none'
  try {
    const parsed = JSON.parse(inp.value)
    out.textContent = mode === 'format'
      ? JSON.stringify(parsed, null, 2)
      : JSON.stringify(parsed)
  } catch (e) {
    if (err) { err.textContent = 'JSON Error: ' + e.message; err.style.display = 'block' }
  }
}

function clearJSON() {
  const inp = document.getElementById('json-in')
  const out = document.getElementById('json-out')
  const err = document.getElementById('json-err')
  if (inp) inp.value = ''
  if (out) out.textContent = 'Result appears here'
  if (err) err.style.display = 'none'
}

function validateJSON() {
  const inp = document.getElementById('json-in')
  const err = document.getElementById('json-err')
  if (!inp || !err) return
  if (!inp.value.trim()) { err.style.display = 'none'; return }
  try { JSON.parse(inp.value); err.style.display = 'none' }
  catch (e) { err.textContent = 'Error: ' + e.message; err.style.display = 'block' }
}

// ── BOX SHADOW GENERATOR ─────────────────────────────────────────────────────

function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

function updShadow() {
  const x  = document.getElementById('sh-x')
  const y  = document.getElementById('sh-y')
  const bl = document.getElementById('sh-b')
  const sp = document.getElementById('sh-s')
  const c  = document.getElementById('sh-c')
  const op = document.getElementById('sh-o')
  if (!x) return

  document.getElementById('sh-xv').textContent = x.value  + 'px'
  document.getElementById('sh-yv').textContent = y.value  + 'px'
  document.getElementById('sh-bv').textContent = bl.value + 'px'
  document.getElementById('sh-sv').textContent = sp.value + 'px'
  document.getElementById('sh-ov').textContent = op.value + '%'

  const rgba = hexToRgba(c.value, (op.value / 100).toFixed(2))
  const val  = `${x.value}px ${y.value}px ${bl.value}px ${sp.value}px ${rgba}`
  const prev = document.getElementById('sh-prev')
  const out  = document.getElementById('sh-out')
  if (prev) prev.style.boxShadow = val
  if (out)  out.textContent = `box-shadow: ${val};`
}

if (document.getElementById('sh-x')) updShadow()

// ── LOREM IPSUM ──────────────────────────────────────────────────────────────

const LOREM_WORDS = [
  'lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do',
  'eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','enim',
  'ad','minim','veniam','quis','nostrud','exercitation','ullamco','laboris','nisi',
  'aliquip','ex','ea','commodo','consequat','duis','aute','irure','reprehenderit',
  'voluptate','velit','esse','cillum','fugiat','nulla','pariatur','excepteur','sint',
  'occaecat','cupidatat','non','proident','sunt','culpa','qui','officia','deserunt',
  'mollit','anim','id','est','laborum','vitae','porta','pellentesque','venenatis'
]

let loremMode = 'paragraphs'

function setLorem(mode) {
  loremMode = mode
  document.getElementById('lrm-p').classList.toggle('active', mode === 'paragraphs')
  document.getElementById('lrm-s').classList.toggle('active', mode === 'sentences')
  document.getElementById('lrm-w').classList.toggle('active', mode === 'words')
  genLorem()
}

function genLorem() {
  const n   = parseInt(document.getElementById('lrm-n')?.value || 3)
  const out = document.getElementById('lrm-out')
  if (!out) return

  const rw  = () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]
  const rs  = () => {
    const len   = 7 + Math.floor(Math.random() * 10)
    const words = Array.from({ length: len }, rw)
    return words[0][0].toUpperCase() + words[0].slice(1) + ' ' + words.slice(1).join(' ') + '.'
  }
  const rp  = () => Array.from({ length: 4 + Math.floor(Math.random() * 4) }, rs).join(' ')

  let result
  if      (loremMode === 'words')     result = Array.from({ length: n }, rw).join(' ')
  else if (loremMode === 'sentences') result = Array.from({ length: n }, rs).join(' ')
  else                                result = Array.from({ length: n }, rp).join('\n\n')

  out.textContent = result
}

if (document.getElementById('lrm-out')) genLorem()

// ── CSS GRADIENT GENERATOR ───────────────────────────────────────────────────

let grdType = 'linear'

function setGrdType(type) {
  grdType = type
  const linBtn = document.getElementById('grd-linear')
  const radBtn = document.getElementById('grd-radial')
  const angleGroup = document.getElementById('grd-angle-group')
  if (linBtn) linBtn.classList.toggle('active', type === 'linear')
  if (radBtn) radBtn.classList.toggle('active', type === 'radial')
  if (angleGroup) angleGroup.style.display = type === 'linear' ? '' : 'none'
  updGradient()
}

function updGradient() {
  const a    = document.getElementById('grd-a')
  const av   = document.getElementById('grd-av')
  const c1   = document.getElementById('grd-c1')
  const c2   = document.getElementById('grd-c2')
  const prev = document.getElementById('grd-prev')
  const out  = document.getElementById('grd-out')
  if (!c1 || !prev) return
  if (a && av) av.textContent = a.value + '°'
  const val = grdType === 'linear'
    ? `linear-gradient(${a ? a.value : 135}deg, ${c1.value}, ${c2.value})`
    : `radial-gradient(circle, ${c1.value}, ${c2.value})`
  prev.style.background = val
  if (out) out.textContent = `background: ${val};`
}

if (document.getElementById('grd-prev')) updGradient()

// ── COPY OUTPUT ──────────────────────────────────────────────────────────────

function copyOut(el) {
  const text = el.textContent.trim()
  if (!text || text === 'Ergebnis erscheint hier') return
  navigator.clipboard.writeText(text).then(() => {
    el.classList.add('copied')
    setTimeout(() => el.classList.remove('copied'), 1600)
  })
}

// ── ARTICLE FILTER ───────────────────────────────────────────────────────────

function filterArts(btn, cat) {
  document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
  document.querySelectorAll('#articles-grid .article-card').forEach(card => {
    card.style.display = (cat === 'all' || card.dataset.cat === cat) ? 'block' : 'none'
  })
}

// ── WORK FILTER (hire.html) ──────────────────────────────────────────────────

function filterWork(btn, type) {
  document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
  document.querySelectorAll('.work-card').forEach(card => {
    card.classList.toggle('hidden', type !== 'all' && card.dataset.type !== type)
  })
}

// ── STYLE CUSTOMISER (hire.html) ─────────────────────────────────────────────

const PALETTES = {
  blue:  { accent: '#2563eb', bg: '#eff6ff', text: '#1e3a8a', cta: '#2563eb', ctaText: '#fff' },
  green: { accent: '#16a34a', bg: '#f0fdf4', text: '#14532d', cta: '#16a34a', ctaText: '#fff' },
  rose:  { accent: '#e11d48', bg: '#fff1f2', text: '#881337', cta: '#e11d48', ctaText: '#fff' },
  amber: { accent: '#d97706', bg: '#fffbeb', text: '#78350f', cta: '#d97706', ctaText: '#fff' },
}

const STYLES = {
  minimal: { font: 'system-ui, sans-serif', weight: '400', size: '1.5rem',  radius: '8px' },
  bold:    { font: 'system-ui, sans-serif', weight: '800', size: '1.9rem',  radius: '4px' },
  elegant: { font: 'Georgia, serif',        weight: '400', size: '1.6rem',  radius: '16px' },
}

let currentStyle   = 'minimal'
let currentPalette = 'blue'

function updPreview() {
  const p = PALETTES[currentPalette]
  const s = STYLES[currentStyle]
  const inner = document.getElementById('cust-inner')
  const title = document.getElementById('cust-title')
  const sub   = document.getElementById('cust-sub')
  const cta   = document.getElementById('cust-cta')
  if (!inner) return

  inner.style.background  = p.bg
  inner.style.fontFamily  = s.font
  inner.style.borderRadius = s.radius

  title.style.color      = p.text
  title.style.fontSize   = s.size
  title.style.fontWeight = s.weight

  sub.style.color = p.accent

  cta.style.background   = p.cta
  cta.style.color        = p.ctaText
  cta.style.borderRadius = s.radius
}

function setStyle(style) {
  currentStyle = style
  document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'))
  document.querySelector(`.style-btn[onclick="setStyle('${style}')"]`)?.classList.add('active')
  updPreview()
}

function setPalette(palette) {
  currentPalette = palette
  document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'))
  document.querySelector(`.palette-btn[data-palette="${palette}"]`)?.classList.add('active')
  updPreview()
}

function sendVibe() {
  const field = document.getElementById('f-style')
  if (field) field.value = `Style: ${currentStyle} — Palette: ${currentPalette}`
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
}

if (document.getElementById('cust-inner')) updPreview()

// ── HIRE FORM (hire.html) ────────────────────────────────────────────────────

async function submitHireForm() {
  const name     = document.getElementById('f-name')?.value.trim()
  const business = document.getElementById('f-business')?.value.trim()
  const email    = document.getElementById('f-email')?.value.trim()
  const message  = document.getElementById('f-message')?.value.trim()
  const style    = document.getElementById('f-style')?.value
  const note     = document.getElementById('form-note')
  const btn      = document.querySelector('.hire-form .btn-primary')

  if (!name || !email) {
    note.textContent = 'please fill in your name and email.'
    note.style.color = '#ef4444'
    return
  }

  btn.textContent = 'sending…'
  btn.disabled = true

  try {
    const res = await fetch('https://formspree.io/f/mjglrjye', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify({ name, business, email, message, style }),
    })

    if (res.ok) {
      note.textContent = "message sent — i'll be in touch within 24 hours."
      note.style.color = '#22c55e'
      btn.textContent  = 'sent ✓'
      document.querySelectorAll('.hire-form input, .hire-form textarea').forEach(el => el.value = '')
    } else {
      throw new Error()
    }
  } catch {
    note.textContent = 'something went wrong — email me directly at hello@nissy.dev'
    note.style.color = '#ef4444'
    btn.textContent  = 'send message'
    btn.disabled     = false
  }
}

// ── PAGE FADE IN ─────────────────────────────────────────────────────────────

document.body.style.opacity = '0'
document.body.style.transition = 'opacity 0.3s ease'
window.addEventListener('load', () => { document.body.style.opacity = '1' })

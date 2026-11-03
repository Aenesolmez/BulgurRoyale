// ================= Görseller: kodla çizilen kart resimleri, bina modelleri, sprite ve emoji önbelleği =================
const MODEL = {};   // sahada çizilen bina modelleri (şeffaf tuval)
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function artBG(g, w, h, rar) {
  const cols = { common: ['#7f9ccf', '#2e3f66'], rare: ['#f0a54a', '#6b3a10'], epic: ['#b26ae6', '#3d1463'], legendary: ['#56d6cc', '#3a3aa8'] }[rar];
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const rg = g.createRadialGradient(w / 2, h * 0.42, 10, w / 2, h * 0.42, w * 0.7);
  rg.addColorStop(0, '#ffffff55'); rg.addColorStop(1, '#ffffff00'); g.fillStyle = rg; g.fillRect(0, 0, w, h);
}
function star(g, x, y, r1, r2, n = 5, rot = -Math.PI / 2) { g.beginPath(); for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1, a = rot + i * Math.PI / n; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); }
function bolt(g, x0, y0, x1, y1, jag, seg = 6) { g.beginPath(); g.moveTo(x0, y0); for (let i = 1; i < seg; i++) { const t = i / seg; g.lineTo(x0 + (x1 - x0) * t + (i % 2 ? jag : -jag), y0 + (y1 - y0) * t); } g.lineTo(x1, y1); }
function puffCloud(g, x, y, r, col, dark) {
  g.fillStyle = dark; [[-0.55, 0.15, 0.55], [0.5, 0.18, 0.55], [0, -0.2, 0.7], [-0.25, 0.3, 0.5], [0.3, 0.32, 0.5]].forEach(([dx, dy, s]) => { g.beginPath(); g.arc(x + dx * r, y + dy * r + 6, r * s, 0, 7); g.fill(); });
  g.fillStyle = col; [[-0.55, 0.1, 0.55], [0.5, 0.12, 0.55], [0, -0.25, 0.7], [-0.25, 0.25, 0.5], [0.3, 0.27, 0.5]].forEach(([dx, dy, s]) => { g.beginPath(); g.arc(x + dx * r, y + dy * r, r * s, 0, 7); g.fill(); });
}

function drawSpellIcon(kind, g, w, h) {
  const cx = w / 2, cy = h * 0.46;
  g.lineJoin = 'round'; g.lineCap = 'round';
  if (kind === 'fireball') {
    for (let i = 0; i < 7; i++) { const a = Math.PI * 0.65 + i * 0.11; g.fillStyle = i % 2 ? '#ffcf3d' : '#ff6a1f'; g.beginPath(); g.moveTo(cx + Math.cos(a - 0.5) * 50, cy + Math.sin(a - 0.5) * 50); g.quadraticCurveTo(cx + Math.cos(a) * 150, cy + Math.sin(a) * 150, cx + Math.cos(a + 0.5) * 50, cy + Math.sin(a + 0.5) * 50); g.fill(); }
    const rg = g.createRadialGradient(cx - 18, cy - 18, 6, cx, cy, 72); rg.addColorStop(0, '#fff6c2'); rg.addColorStop(0.4, '#ffb02e'); rg.addColorStop(1, '#d63a10');
    g.fillStyle = rg; g.beginPath(); g.arc(cx, cy, 70, 0, 7); g.fill();
    g.fillStyle = '#7a2a10'; g.beginPath(); g.ellipse(cx + 4, cy + 6, 34, 22, -0.4, 0, 7); g.fill();   // fasulye
    g.fillStyle = '#a84a20'; g.beginPath(); g.ellipse(cx - 2, cy, 26, 14, -0.4, 0, 7); g.fill();
    g.strokeStyle = '#ffffff88'; g.lineWidth = 5; g.beginPath(); g.arc(cx - 6, cy - 4, 14, 3.6, 4.8); g.stroke();
  } else if (kind === 'arrows') {
    for (let i = 0; i < 6; i++) {
      const x = 40 + i * 34, y = 60 + (i % 2) * 40;
      g.save(); g.translate(x, y); g.rotate(0.55);
      g.fillStyle = '#5a3a1a'; g.fillRect(-5, 0, 10, 190);
      g.fillStyle = '#f2d9a6'; g.fillRect(-3.5, 0, 7, 186);
      g.fillStyle = '#fff6dd'; g.beginPath(); g.moveTo(-5, 186); g.lineTo(0, 220); g.lineTo(5, 186); g.fill();
      g.restore();
    }
  } else if (kind === 'zap') {
    g.fillStyle = '#0c1f45aa'; g.fillRect(0, 0, w, h);
    g.shadowColor = '#8fd8ff'; g.shadowBlur = 30;
    g.fillStyle = '#ffe34a'; g.beginPath(); g.moveTo(cx + 20, 30); g.lineTo(cx - 55, cy + 15); g.lineTo(cx - 5, cy + 15); g.lineTo(cx - 30, h - 50); g.lineTo(cx + 60, cy - 25); g.lineTo(cx + 10, cy - 25); g.lineTo(cx + 45, 30); g.closePath(); g.fill();
    g.shadowBlur = 0; g.strokeStyle = '#fff'; g.lineWidth = 5; g.stroke();
    puffCloud(g, cx - 60, h - 70, 34, '#b8f07a', '#6fa83a');
  } else if (kind === 'log') {
    g.save(); g.translate(cx, cy + 10); g.rotate(-0.35);
    g.fillStyle = '#4a2c12'; g.fillRect(-120, -14, 240, 28);   // saplar
    const lg = g.createLinearGradient(0, -42, 0, 42); lg.addColorStop(0, '#e0a868'); lg.addColorStop(0.5, '#b97a3e'); lg.addColorStop(1, '#7a4a20');
    g.fillStyle = lg; g.beginPath(); g.roundRect ? g.roundRect(-85, -42, 170, 84, 20) : g.rect(-85, -42, 170, 84); g.fill();
    g.strokeStyle = '#6b3e18'; g.lineWidth = 4; for (let i = -60; i <= 60; i += 30) { g.beginPath(); g.moveTo(i, -38); g.quadraticCurveTo(i + 8, 0, i, 38); g.stroke(); }
    g.fillStyle = '#d9a35e'; g.beginPath(); g.ellipse(85, 0, 14, 42, 0, 0, 7); g.fill(); g.strokeStyle = '#8a5a2a'; g.beginPath(); g.ellipse(85, 0, 7, 22, 0, 0, 7); g.stroke();
    g.restore();
  } else if (kind === 'poison') {
    puffCloud(g, cx, cy, 90, '#9be33a', '#4f8a1c');
    g.fillStyle = '#26401a'; g.beginPath(); g.ellipse(cx - 28, cy - 10, 14, 18, 0, 0, 7); g.ellipse(cx + 28, cy - 10, 14, 18, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(cx - 30, cy + 34); g.quadraticCurveTo(cx, cy + 14, cx + 30, cy + 34); g.lineWidth = 8; g.strokeStyle = '#26401a'; g.stroke();
    g.strokeStyle = '#c8ff7a'; g.lineWidth = 6; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(cx + i * 45, 40); g.bezierCurveTo(cx + i * 45 - 14, 20, cx + i * 45 + 14, 10, cx + i * 45, -10); g.stroke(); }
  } else if (kind === 'freeze') {
    g.fillStyle = '#f4fbff'; g.strokeStyle = '#7fb6d6'; g.lineWidth = 6;
    g.beginPath(); g.roundRect ? g.roundRect(cx - 62, 50, 124, 210, 16) : g.rect(cx - 62, 50, 124, 210); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(cx - 62, 125); g.lineTo(cx + 62, 125); g.stroke();
    g.fillStyle = '#9fc6db'; g.fillRect(cx + 38, 75, 10, 34); g.fillRect(cx + 38, 140, 10, 50);
    g.strokeStyle = '#ffffff'; g.lineWidth = 5;
    [[cx - 80, 70, 22], [cx + 90, 230, 26], [cx - 75, 250, 18]].forEach(([x, y, r]) => { for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke(); } });
  }
}

function drawBuildingModel(kind, g, w, h) {
  const cx = w / 2;
  g.lineJoin = 'round';
  // taş taban
  g.fillStyle = '#00000040'; g.beginPath(); g.ellipse(cx, h * 0.86, w * 0.4, h * 0.1, 0, 0, 7); g.fill();
  g.fillStyle = '#8a7f76'; g.beginPath(); g.ellipse(cx, h * 0.8, w * 0.36, h * 0.12, 0, 0, 7); g.fill();
  g.fillStyle = '#a89d93'; g.beginPath(); g.ellipse(cx, h * 0.76, w * 0.34, h * 0.1, 0, 0, 7); g.fill();
  if (kind === 'cannon') {
    g.fillStyle = '#6b4423'; g.fillRect(cx - 60, h * 0.55, 120, 50);
    g.fillStyle = '#4a2c12'; [[-48], [48]].forEach(([dx]) => { g.beginPath(); g.arc(cx + dx, h * 0.72, 26, 0, 7); g.fill(); });
    g.fillStyle = '#8a5a2a'; [[-48], [48]].forEach(([dx]) => { g.beginPath(); g.arc(cx + dx, h * 0.72, 12, 0, 7); g.fill(); });
    const bg = g.createLinearGradient(0, h * 0.3, 0, h * 0.6); bg.addColorStop(0, '#5a5f66'); bg.addColorStop(1, '#22262b');
    g.save(); g.translate(cx, h * 0.55); g.rotate(-0.5); g.fillStyle = bg; g.fillRect(-26, -110, 52, 120); g.fillStyle = '#16191c'; g.beginPath(); g.ellipse(0, -110, 26, 10, 0, 0, 7); g.fill();
    g.fillStyle = '#7a8088'; g.fillRect(-28, -80, 56, 8); g.fillRect(-28, -20, 56, 8); g.restore();
  } else if (kind === 'mortar') {
    const bg = g.createLinearGradient(cx - 60, 0, cx + 60, 0); bg.addColorStop(0, '#3a3f46'); bg.addColorStop(0.5, '#6a7078'); bg.addColorStop(1, '#2a2e33');
    g.fillStyle = bg; g.beginPath(); g.moveTo(cx - 62, h * 0.74); g.lineTo(cx - 48, h * 0.3); g.lineTo(cx + 48, h * 0.3); g.lineTo(cx + 62, h * 0.74); g.closePath(); g.fill();
    g.fillStyle = '#16191c'; g.beginPath(); g.ellipse(cx, h * 0.3, 48, 14, 0, 0, 7); g.fill();
    g.fillStyle = '#8a6d3b'; g.fillRect(cx - 64, h * 0.42, 128, 10); g.fillRect(cx - 66, h * 0.6, 132, 10);
  } else if (kind === 'inferno') {
    const bg = g.createLinearGradient(cx - 50, 0, cx + 50, 0); bg.addColorStop(0, '#4a4f56'); bg.addColorStop(0.5, '#7a8088'); bg.addColorStop(1, '#3a3e44');
    g.fillStyle = bg; g.beginPath(); g.moveTo(cx - 55, h * 0.75); g.lineTo(cx - 34, h * 0.2); g.lineTo(cx + 34, h * 0.2); g.lineTo(cx + 55, h * 0.75); g.closePath(); g.fill();
    g.fillStyle = '#2b2f34'; for (let i = 0; i < 4; i++) g.fillRect(cx - 50 + i * 8, h * (0.35 + i * 0.1), 100 - i * 16, 6);
    const rg = g.createRadialGradient(cx, h * 0.16, 4, cx, h * 0.16, 46); rg.addColorStop(0, '#fff6c2'); rg.addColorStop(0.45, '#ff9a2e'); rg.addColorStop(1, '#ff3a1000');
    g.fillStyle = rg; g.beginPath(); g.arc(cx, h * 0.16, 46, 0, 7); g.fill();
    g.fillStyle = '#2b2f34'; g.beginPath(); g.ellipse(cx, h * 0.22, 40, 12, 0, 0, 7); g.fill();
  }
}

const ART_URL = {};
function makeExtraArt() {
  EXTRA_CARDS.forEach(c => {
    const cv = mkCanvas(256, 340), g = cv.getContext('2d');
    artBG(g, 256, 340, c.rar);
    if (c.type === 'spell') drawSpellIcon(c.art, g, 256, 340);
    else { const m = mkCanvas(256, 256); drawBuildingModel(c.art, m.getContext('2d'), 256, 256); MODEL[c.id] = m; g.drawImage(m, 0, 70, 256, 256); }
    ART_URL[c.id] = cv.toDataURL();
    const im = new Image(); im.src = ART_URL[c.id]; IMG[c.id] = im;
  });
}
makeExtraArt();
const SPELL_IMG = {};
for (const [id, file] of Object.entries(EXTRA_FILES)) {   // yeni çizimler: SVG doğrudan kart resmi (file:// altında tuvalden dataURL alınamaz)
  const im = new Image(), url = 'bulgurs/' + encodeURIComponent(file); im.src = url; ART_URL[id] = url; IMG[id].src = url;
  if (BY_ID[id].type === 'building') MODEL[id] = im;
  im.onload = () => { SPELL_IMG[id] = im; if (typeof spriteCache !== 'undefined') spriteCache.clear(); };
}
const cardImg = id => ART_URL[id] || IMG[id].src;

// --- Sprite önbelleği: SVG bir kez tuvale çizilir, sonra hızlı kopyalanır ---
const spriteCache = new Map();
function srcOf(id) { return MODEL[id] || IMG[id]; }
function rasterSprite(id, hpx, tint) {
  const key = id + '|' + hpx + '|' + (tint || '');
  let e = spriteCache.get(key); if (e) return e;
  const im = srcOf(id); if (!im) return null;
  const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
  if (!iw || !ih || im.complete === false) return null;
  const w = Math.max(1, Math.round(hpx * iw / ih));
  const c = mkCanvas(w, hpx), g = c.getContext('2d'); g.drawImage(im, 0, 0, w, hpx);
  if (tint) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = tint; g.fillRect(0, 0, w, hpx); }
  if (spriteCache.size > 600) spriteCache.clear();
  e = { c, w, h: hpx }; spriteCache.set(key, e); return e;
}
const spriteBucket = hpx => Math.max(16, Math.ceil(hpx / 16) * 16);

// --- Emoji önbelleği (yalnızca emoji baloncukları için) ---
const emoCache = new Map();
function emoImg(ch, px) {
  const b = Math.max(16, Math.ceil(px / 8) * 8), key = ch + '|' + b;
  let c = emoCache.get(key); if (c) return c;
  c = mkCanvas(Math.ceil(b * 1.4), Math.ceil(b * 1.4));
  const g = c.getContext('2d'); g.font = b + 'px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, c.width / 2, c.height / 2 + b * 0.05);
  emoCache.set(key, c); return c;
}

// ================= Çizim: eğik perspektifli arena, rigli karakterler, 3D kuleler, vektör efektler =================
const cv = $('cv'), ctx = cv.getContext('2d');
const R = { S: 24, VW: 0, VH: 0, DPR: 1, CX: 0, OY: 0, flip: false, me: 0, arena: 0, bg: null, bgKey: '', parts: [], corpses: [], rs: new Map(), shake: 0, flash: null, crownFly: [], emotes: [], freezes: [], preview: null, overlay: null, overlayKey: '' };
const PA = 0.86, PB = 0.14, PK = 0.84, UNIT_SCALE = 1.55;
const ART_DIR = -1;   // SVG çizimleri sola bakıyor: yüz yönü bu değerle çevrilir (o.flip = bakılan yön, +1 sağ)
const BOARD_K = PK * (PA * H + PB * H / 2);   // tahta yüksekliği = S * BOARD_K

// ---------- Perspektif ----------
function P(x, y) { const vx = R.flip ? W - x : x, vy = R.flip ? H - y : y, sc = PA + PB * vy / H; return [R.CX + (vx - 9) * R.S * sc, R.OY + R.S * PK * (PA * vy + PB * vy * vy / (2 * H)), sc]; }
function unP(X, Y) {
  const A = R.S * PK * PB / (2 * H), Bq = R.S * PK * PA, C = -(Y - R.OY), vy = (-Bq + Math.sqrt(Math.max(0, Bq * Bq - 4 * A * C))) / (2 * A);
  const sc = PA + PB * vy / H, vx = 9 + (X - R.CX) / (R.S * sc);
  return { x: R.flip ? W - vx : vx, y: R.flip ? H - vy : vy };
}
function quad(g, x0, y0, x1, y1) { const a = P(x0, y0), b = P(x1, y0), c = P(x1, y1), d = P(x0, y1); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath(); }
function wcircle(g, x, y, r, n = 28) { g.beginPath(); for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, p = P(x + Math.cos(a) * r, y + Math.sin(a) * r); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.closePath(); }
const hsh = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5; return s - Math.floor(s); };

function setView(S, CX, OY, flip, me) { R.S = S; R.CX = CX; R.OY = OY; R.flip = flip; R.me = me; R.bg = null; R.overlay = null; spriteCache.clear(); }
function resizeCanvas(VW, VH, DPR) { R.VW = VW; R.VH = VH; R.DPR = DPR; cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR); cv.style.width = VW + 'px'; cv.style.height = VH + 'px'; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); R.bg = null; }

// ---------- Arka plan (bir kez çizilir) ----------
function buildBG() {
  const A = arenaOf(R.arena), c = mkCanvas(Math.round(R.VW * R.DPR), Math.round(R.VH * R.DPR)), g = c.getContext('2d');
  g.setTransform(R.DPR, 0, 0, R.DPR, 0, 0);
  g.fillStyle = A.side; g.fillRect(0, 0, R.VW, R.VH);
  // uzanan çimen kareleri
  for (let y = -6; y < H + 8; y++) for (let x = -14; x < W + 14; x++) { if (x >= -1 && x < W + 1 && y >= -1 && y < H + 1) continue; g.fillStyle = (x + y) & 1 ? A.side : shade(A.side, 6); quad(g, x, y, x + 1, y + 1); g.fill(); }
  // ağaçlar ve kayalar (kenarlarda)
  const trees = [];
  for (let y = -5; y < H + 7; y += 1.6) for (let x = -13; x < W + 13; x += 1.7) {
    if (x > -2.2 && x < W + 1.2) continue;
    const h = hsh(x, y); if (h < 0.35) continue;
    trees.push([x + hsh(y, x) * 1.2, y + h]);
  }
  trees.sort((a, b) => (R.flip ? -1 : 1) * (a[1] - b[1]));
  for (const [x, y] of trees) drawTree(g, x, y, A, hsh(x * 3, y));
  // taş çerçeve + ön yüz
  g.fillStyle = shade(A.rim, -18); quad(g, -0.7, -0.7, W + 0.7, H + 0.9); g.fill();
  g.fillStyle = A.rim; quad(g, -0.6, -0.6, W + 0.6, H + 0.6); g.fill();
  // kareler
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const vy = R.flip ? H - 1 - y : y, near = vy >= 16, pal = near ? A.g : A.e;
    g.fillStyle = (x + y) & 1 ? pal[0] : pal[1]; quad(g, x, y, x + 1.02, y + 1.02); g.fill();
  }
  // yollar
  g.fillStyle = A.path;
  for (const bx of BRIDGES) { quad(g, bx - 0.75, 6.5, bx + 0.75, 25.5); g.fill(); }
  quad(g, 3.5, 5.7, 14.5, 7.3); g.fill(); quad(g, 3.5, 24.7, 14.5, 26.3); g.fill();
  g.fillStyle = shade(A.path, -12);
  for (let i = 0; i < 90; i++) { const bx = BRIDGES[i % 2], x = bx - 0.6 + hsh(i, 1) * 1.2, y = 7 + hsh(i, 2) * 18; quad(g, x, y, x + 0.15, y + 0.12); g.fill(); }
  // kule zeminleri
  for (const team of [0, 1]) for (const [x, y, king] of TOWER_POS[team]) { g.fillStyle = shade(A.path, -20); wcircle(g, x, y, king ? 2.3 : 1.8); g.fill(); g.fillStyle = shade(A.path, 6); wcircle(g, x, y, king ? 2.05 : 1.6); g.fill(); }
  // nehir
  g.fillStyle = '#5a4022'; quad(g, -0.6, RIVER_TOP - 0.18, W + 0.6, RIVER_BOT + 0.18); g.fill();
  g.fillStyle = A.water; quad(g, -0.6, RIVER_TOP, W + 0.6, RIVER_BOT); g.fill();
  g.fillStyle = shade(A.water, 18); quad(g, -0.6, RIVER_TOP + 0.55, W + 0.6, RIVER_TOP + 1.45); g.fill();
  // köprüler (tahta + korkuluk)
  for (const bx of BRIDGES) {
    g.fillStyle = '#5d3a17'; quad(g, bx - 1.2, RIVER_TOP - 0.45, bx + 1.2, RIVER_BOT + 0.45); g.fill();
    for (let k = 0; k < 7; k++) { g.fillStyle = k % 2 ? '#b07a42' : '#a26e38'; quad(g, bx - 1.05, RIVER_TOP - 0.38 + k * 0.42, bx + 1.05, RIVER_TOP - 0.38 + k * 0.42 + 0.36); g.fill(); }
    for (const sx of [-1.15, 1.05]) { g.fillStyle = '#4a2c12'; quad(g, bx + sx, RIVER_TOP - 0.5, bx + sx + 0.12, RIVER_BOT + 0.5); g.fill(); }
  }
  // tahta kenarındaki çit direkleri
  for (let y = 0; y <= H; y += 2) for (const x of [-0.45, W + 0.25]) { const p = P(x, y); g.fillStyle = '#00000030'; g.fillRect(p[0] - 2, p[1] - 2, 6 * p[2], 4); g.fillStyle = shade(A.rim, 15); g.fillRect(p[0], p[1] - 10 * p[2], 5 * p[2], 10 * p[2]); }
  // kenar karartma
  const vg = g.createRadialGradient(R.VW / 2, R.VH / 2, Math.min(R.VW, R.VH) * 0.4, R.VW / 2, R.VH / 2, Math.max(R.VW, R.VH) * 0.8);
  vg.addColorStop(0, '#00000000'); vg.addColorStop(1, '#00000088'); g.fillStyle = vg; g.fillRect(0, 0, R.VW, R.VH);
  R.bg = c;
}
function shade(hex, amt) { const n = parseInt(hex.slice(1), 16), f = v => clamp(v + amt, 0, 255); return '#' + [f(n >> 16), f(n >> 8 & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join(''); }
function drawTree(g, x, y, A, h) {
  const [X, Y, sc] = P(x, y), r = R.S * sc * (0.9 + h * 0.6);
  g.fillStyle = '#00000035'; g.beginPath(); g.ellipse(X, Y, r * 0.9, r * 0.35, 0, 0, 7); g.fill();
  g.fillStyle = '#5a3d22'; g.fillRect(X - r * 0.12, Y - r * 1.1, r * 0.24, r * 1.1);
  g.fillStyle = A.tree; g.beginPath(); g.arc(X, Y - r * 1.4, r, 0, 7); g.fill();
  g.fillStyle = A.tree2; g.beginPath(); g.arc(X - r * 0.3, Y - r * 1.65, r * 0.6, 0, 7); g.fill();
  g.fillStyle = '#ffffff14'; g.beginPath(); g.arc(X - r * 0.4, Y - r * 1.8, r * 0.3, 0, 7); g.fill();
}

// ---------- Rig: karakterin kafa/gövde/bacak parçaları ayrı hareket eder ----------
function rigOf(id) {
  const d = RIGDATA[id] || {}, f = RIG_FIX[id] || {};
  return { neck: f.neck ?? (d.neck > 0.12 ? d.neck : 0.3), hip: f.hip ?? (d.hip > 0.45 ? d.hip : 0.7), split: f.split ?? (d.split || 0.5), legs: d.legs !== false, type: RIG_TYPE[id] || 'biped' };
}
function drawChar(id, X, Y, h, pose, o = {}) {
  const e = rasterSprite(id, spriteBucket(h * R.DPR), o.tint); if (!e) return;
  const g = o.g || ctx, w = h * e.w / e.h, k = e.h / h, rg = rigOf(id), type = o.rigType || rg.type;
  g.save(); if (o.alpha !== undefined) g.globalAlpha = o.alpha;
  g.translate(X, Y + (pose.bob || 0)); if (pose.rot) g.rotate(pose.rot); g.scale((o.flip || 1) * ART_DIR * (pose.sx || 1), pose.sy || 1);
  if ((type === 'biped' || type === 'fly') && !o.flat) {
    const sNeck = Math.round(e.h * rg.neck), sHip = Math.round(e.h * rg.hip), sSplit = Math.round(e.w * rg.split);
    const neckY = -h + sNeck / k, hipY = -h + sHip / k;
    const leg = (sx0, sx1, ang) => {
      const px = -w / 2 + (sx0 + sx1) / 2 / k;
      g.save(); g.translate(px, hipY); g.rotate(ang); g.translate(-px, -hipY);
      g.drawImage(e.c, sx0, sHip - 2, sx1 - sx0, e.h - sHip + 2, -w / 2 + sx0 / k, hipY - 2 / k, (sx1 - sx0) / k, (e.h - sHip + 2) / k);
      g.restore();
    };
    if (pose.legL >= 0) { leg(sSplit, e.w, pose.legR || 0); leg(0, sSplit, pose.legL || 0); } else { leg(0, sSplit, pose.legL || 0); leg(sSplit, e.w, pose.legR || 0); }
    g.save(); g.translate(0, hipY); g.rotate((pose.lean || 0) * ART_DIR); g.translate(0, -hipY);   // öne eğilme bakılan yöne doğru
    g.drawImage(e.c, 0, sNeck - 1, e.w, sHip - sNeck + 3, -w / 2, neckY - 1 / k, w, (sHip - sNeck + 3) / k);
    g.translate(0, neckY); g.rotate((pose.head || 0) * ART_DIR); g.translate(0, -neckY);
    g.drawImage(e.c, 0, 0, e.w, sNeck + 1, -w / 2, -h, w, (sNeck + 1) / k);
    g.restore();
  } else if (type === 'hang') {
    g.translate(0, -h); g.rotate(pose.swing || 0);
    g.strokeStyle = '#ffffffcc'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -R.S * 3); g.stroke();
    g.drawImage(e.c, -w / 2, 0, w, h);
  } else g.drawImage(e.c, -w / 2, -h, w, h);
  g.restore();
}
function poseFor(e, rs, h, type) {
  const a = rs.anim, p = { legL: 0, legR: 0, lean: 0, bob: 0, head: 0, sx: 1, sy: 1, rot: 0, swing: 0 };
  if (e.freezeT > 0 || e.tsT > 0) return p;
  const legAmp = rigOf(e.card).legs ? 0.45 : 0.34;
  if (type === 'blob') {
    if (e.atkT > 0) { const q = Math.sin((1 - e.atkT / 0.3) * Math.PI); p.sx = 1 + 0.18 * q; p.sy = 1 - 0.16 * q; }
    else if (rs.moving) { const w = a * 8; p.bob = -Math.abs(Math.sin(w)) * h * 0.12; p.sy = 1 + Math.cos(w * 2) * 0.08; p.sx = 2 - p.sy; p.rot = Math.sin(w) * 0.14; }   // paytak zıplayarak
    else p.sy = 1 + Math.sin(a * 2.5) * 0.025;
    return p;
  }
  if (type === 'float' || type === 'fly') {
    p.bob = Math.sin(a * 2.2) * h * 0.05; p.rot = Math.sin(a * 1.4) * 0.05 + (rs.moving ? 0.08 * (e.diry < 0 ? 1 : 1) : 0);
    if (type === 'fly') { p.legL = 0.25 + Math.sin(a * 3) * 0.12; p.legR = 0.12 + Math.sin(a * 3 + 1) * 0.12; p.lean = rs.moving ? 0.12 : 0; }
    if (e.atkT > 0) { const q = Math.sin((1 - e.atkT / 0.3) * Math.PI); p.lean += 0.3 * q; p.sx = 1 + 0.1 * q; }
    return p;
  }
  if (type === 'hang') { p.swing = Math.sin(a * 2) * 0.25 + (e.atkT > 0 ? 0.2 : 0); return p; }
  if (type === 'none') { if (e.atkT > 0) { const q = Math.sin((1 - e.atkT / 0.3) * Math.PI); p.sx = 1 + 0.08 * q; p.sy = 1 - 0.08 * q; } return p; }
  if (e.stun > 0) { p.head = Math.sin(a * 12) * 0.14; p.lean = Math.sin(a * 7) * 0.06; return p; }
  if (e.atkT > 0) { const q = 1 - e.atkT / 0.3; p.lean = q < 0.35 ? -0.22 * q / 0.35 : 0.34 * (1 - (q - 0.35) / 0.65); p.head = p.lean * 0.5; p.legL = 0.14; p.legR = -0.14; p.bob = -Math.max(0, p.lean) * h * 0.04; return p; }
  if (rs.moving) { const w = a * (7 + (e.c && e.c.spd || 1) * 3); p.legL = Math.sin(w) * legAmp; p.legR = -Math.sin(w) * legAmp; p.bob = -Math.abs(Math.cos(w)) * h * 0.045; p.lean = 0.08 + Math.sin(w * 2) * 0.03; p.head = Math.sin(w * 2) * 0.05; p.rot = Math.sin(w) * 0.045; p.sy = 1 + Math.abs(Math.sin(w)) * 0.025; }
  else { p.bob = Math.sin(a * 2.4) * h * 0.006; p.head = Math.sin(a * 1.6) * 0.03; }
  return p;
}

// ---------- Parçacıklar (dünya koordinatında; z = yükseklik) ----------
function pfx(o) { if (R.parts.length > (R.lowFx ? 180 : 450) || (R.lowFx && Math.random() < 0.45)) return; R.parts.push(Object.assign({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, g: 0, life: 0.6, t: 0, k: 'puff', col: '#9ccc3c', r: 0.25, gr: 0.5, rot: Math.random() * 6, vr: 0 }, o)); }
function puffs(x, y, z, col, n, sz = 1, spread = 1) { for (let i = 0; i < n; i++) pfx({ x: x + rnd(-0.3, 0.3) * spread, y: y + rnd(-0.2, 0.2) * spread, z: z + rnd(0, 0.4), vx: rnd(-1, 1) * spread, vy: rnd(-0.6, 0.6) * spread, vz: rnd(0.6, 1.6), r: rnd(0.18, 0.32) * sz, gr: rnd(0.4, 0.9) * sz, life: rnd(0.45, 0.8), col }); }
function burst(x, y, z, k, col, n, sp = 3, o = {}) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = rnd(0.4, 1) * sp; pfx(Object.assign({ k, x, y, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: rnd(1, 4), g: 9, life: rnd(0.4, 0.8), col, r: rnd(0.08, 0.16), gr: 0, vr: rnd(-8, 8) }, o)); } }
function zoneFx(x, y, r, col, life = 0.35) { pfx({ k: 'zone', x, y, r, gr: 0, life, col }); }
function explosion(x, y, r, col = '#ff9a2e') {
  pfx({ k: 'flash', x, y, r: r * 0.5, gr: r * 2.2, life: 0.3, col: '#fff3c2' });
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; pfx({ k: 'flame', x, y, z: 0.3, vx: Math.cos(a) * r * 2.2, vy: Math.sin(a) * r * 1.4, vz: rnd(1, 3), life: rnd(0.35, 0.6), r: rnd(0.25, 0.4), gr: -0.3, col: i % 2 ? col : '#ffcf3d' }); }
  puffs(x, y, 0.2, '#7a6a5a', 8, 1.6, r);
  burst(x, y, 0.3, 'debris', '#5a4a3a', 6, 4);
}

function hitFx(ev) {
  const x = ev.x, y = ev.y, z = ev.tower ? 1.6 : ev.flying ? 1.5 : (ev.sz || 1.5) * 0.45, col = ev.col || '#9ccc3c', big = ev.splash || 1;
  switch (ev.fx) {
    case 'ora': pfx({ k: 'star', x, y, z: z + rnd(-0.2, 0.3), r: 0.35, gr: 0.8, life: 0.15, col: '#fff7c0' }); burst(x, y, z, 'spark', '#d1b3ff', 2, 3); break;
    case 'boom': explosion(x, y, big * 0.7, '#b07aff'); break;
    case 'shock': puffs(x, y, 0.1, '#a89c8c', 6, 1.4, 1.5); burst(x, y, 0.2, 'debris', '#7a6a5a', 5, 3); break;
    case 'pixel': burst(x, y, z, 'debris', col, 7, 3, { r: 0.14 }); break;
    case 'live': burst(x, y, z, 'coin', '#ffd447', 4, 2.5, { r: 0.14 }); break;
    case 'splash': burst(x, y, z, 'drop', '#4fc3f7', 8, 3); break;
    case 'seed': burst(x, y, z, 'drop', '#3e2723', 5, 3, { r: 0.06 }); break;
    case 'bats': for (let i = 0; i < 2; i++) pfx({ k: 'bat', x, y, z, vx: rnd(-2, 2), vy: rnd(-1, 1), vz: rnd(1.5, 3), life: 0.7, r: 0.25, col: '#3a0f1a' }); puffs(x, y, z, '#7b1f1f', 2, 0.8); break;
    case 'double': puffs(x - 0.3, y, z, col, 2); puffs(x + 0.3, y, z, '#dce775', 2); break;
    case 'geyser': burst(x, y, 0, 'drop', '#4fc3f7', 10, 1, { vz: 6 }); break;
    case 'ice': burst(x, y, z, 'shard', '#d8f4ff', 6, 3); break;
    case 'pillow': burst(x, y, z, 'feather', '#ffffff', 6, 2, { g: 1.5, life: 1 }); break;
    case 'spark': burst(x, y, z, 'spark', '#ffeb3b', 6, 4); break;
    case 'bomb': explosion(x, y, 1.4, '#8d6e63'); break;
    case 'flame': for (let i = 0; i < 6; i++) pfx({ k: 'flame', x: x + rnd(-0.4, 0.4) * big, y: y + rnd(-0.3, 0.3) * big, z, vz: rnd(1, 2.5), life: 0.5, r: 0.3, gr: -0.3, col: i % 2 ? '#ff7043' : '#ffca28' }); break;
    case 'rainbow': ['#ff4081', '#ffd740', '#40c4ff'].forEach(c => puffs(x, y, z, c, 1)); burst(x, y, z, 'star', '#fff', 2, 2, { r: 0.12, g: 0 }); break;
    case 'sparkle': burst(x, y, z, 'star', '#ffc0ee', 3, 2, { g: 0 }); break;
    case 'ghost': puffs(x, y, z, '#c6ffe0', 3, 1); break;
    default: puffs(x, y, z, col, 3);
  }
  if (big > 1.05) zoneFx(x, y, big, col, 0.22);
}

// ---------- Olaylar -> görüntü + ses ----------
function rsOf(id) { let s = R.rs.get(id); if (!s) { s = { anim: Math.random() * 6, fd: 1, px: null, py: null, moving: false, hit: 0, mvT: 0 }; R.rs.set(id, s); } return s; }
function handleEvents(B, list) {
  for (const ev of list) {
    switch (ev.e) {
      case 'play': sfx(BY_ID[ev.card].type === 'spell' ? 'cast' : 'deploy'); break;
      case 'evo': evoFx(ev.x, ev.y); break;
      case 'land': puffs(ev.x, ev.y, 0, '#b8a888', 5, ev.size / 1.5, 1.4); if (ev.size > 2.2) R.shake = Math.max(R.shake, 4); break;
      case 'atk': { const c = BY_ID[ev.card]; if (c && c.fx && Math.random() < (ev.tower ? 0.25 : 0.55)) fart(c.fx.snd, 0.22, ev.tower ? 0.12 : 0.25); break; }
      case 'hit': hitFx(ev); sfx(ev.tower ? 'hitT' : 'hit'); if (ev.shake) R.shake = Math.max(R.shake, ev.shake * 0.6); break;
      case 'dmg': rsOf(ev.id).hit = 0.12; break;
      case 'chain': pfx({ k: 'bolt', x: ev.x, y: ev.y, tx: ev.tx, ty: ev.ty, z: ev.ft ? 1.5 : 0.6, tz: ev.fe ? 1.5 : 0.6, life: 0.18, col: ev.col }); break;
      case 'death': R.corpses.push({ card: ev.card, x: ev.x, y: ev.y, size: ev.size, fly: ev.flying, face: rsOf(ev.id).fd, t: 0, max: 0.6, building: ev.building }); puffs(ev.x, ev.y, 0.3, '#c8d0b0', ev.building ? 8 : 4, ev.building ? 1.6 : 1); R.rs.delete(ev.id); break;
      case 'towerDown': towerDownFx(ev); break;
      case 'kingWake': sfx('crown'); break;
      case 'cast': break;
      case 'spellHit': spellFx(ev); break;
      case 'poison': sfx('spell'); break;
      case 'log': sfx('log'); R.shake = Math.max(R.shake, 2); break;
      case 'blast': explosion(ev.x, ev.y, ev.r * 0.8); zoneFx(ev.x, ev.y, ev.r, '#ffd740', 0.35); R.shake = Math.max(R.shake, 5); sfx('boom'); break;
      case 'pulse': pulseFx(ev); break;
      case 'zone': zoneFx(ev.x, ev.y, ev.r, ev.col, 0.4); sfx('zap'); break;
      case 'shieldBreak': burst(ev.x, ev.y, 1, 'shard', '#ffd54f', 7, 3); break;
      case 'heal': { const e = B.byId.get(ev.id); if (e) pfx({ k: 'plus', x: e.x + rnd(-0.3, 0.3), y: e.y, z: e.size * 0.9, vz: 1.2, life: 0.7, r: 0.2, gr: 0, col: '#6cf27a' }); break; }
      case 'charge': case 'dash': { const e = B.byId.get(ev.id); if (e) for (let i = 0; i < 4; i++) pfx({ k: 'spark', x: e.x, y: e.y, z: e.size * 0.4, vx: -(e.dirx || 0) * 4 + rnd(-1, 1), vy: -(e.diry || 0) * 4, life: 0.25, col: '#ffffff' }); break; }
      case 'spawnPulse': puffs(B.byId.get(ev.id)?.x || 9, B.byId.get(ev.id)?.y || 9, 1, '#7cb342', 3); break;
    }
  }
}
function evoFx(x, y) {
  R.flash = { col: '#c46bff', t: 0.35, max: 0.35 };
  pfx({ k: 'pillar', x, y, r: 1.3, gr: -1.3, life: 0.8, col: '#e0a6ff' });
  for (let i = 0; i < 14; i++) pfx({ k: 'star', x, y, z: rnd(0, 2), vx: rnd(-2.5, 2.5), vy: rnd(-1.5, 1.5), vz: rnd(2, 6), g: 6, life: rnd(0.6, 1), r: rnd(0.12, 0.22), gr: 0, col: pick(['#e0a6ff', '#fff', '#ffe14d']) });
  zoneFx(x, y, 2, '#c46bff', 0.5);
  R.shake = Math.max(R.shake, 5); sfx('evo'); fart(1.9, 0.4, 0.35);
}
function pulseFx(ev) {
  const col = ev.kind === 'time' ? '#ffe14d' : ev.kind === 'red' ? '#ff4a4a' : '#6ec6ff';
  zoneFx(ev.x, ev.y, ev.r, col, 0.55);
  if (ev.kind === 'time') { R.flash = { col: '#ffffff', t: 0.4, max: 0.4 }; pfx({ k: 'clock', x: ev.x, y: ev.y, z: 3, r: 0.8, gr: 0, life: 1.1, col }); }
  else burst(ev.x, ev.y, 0.5, ev.kind === 'red' ? 'spark' : 'shard', col, 10, 4);
  sfx('zap'); R.shake = Math.max(R.shake, 3);
}
function towerDownFx(ev) {
  explosion(ev.x, ev.y, ev.king ? 2.2 : 1.6, '#ff9a2e');
  burst(ev.x, ev.y, 2, 'debris', '#8c8178', 16, 5, { r: 0.2, life: 1 });
  puffs(ev.x, ev.y, 1, '#b0a89c', 12, 2.2, 2);
  R.shake = Math.max(R.shake, 12); R.flash = { col: '#fff3c2', t: 0.3, max: 0.3 };
  sfx('towerdown'); setTimeout(() => sfx('crown'), 350);
  const winner = 1 - ev.team, el = document.querySelector(winner === R.me ? '#crB' : '#crR');
  const [X, Y, sc] = P(ev.x, ev.y);
  if (el) { const r = el.getBoundingClientRect(); R.crownFly.push({ x0: X, y0: Y - 3 * R.S * sc, x1: r.left + r.width / 2, y1: r.top + r.height / 2, t: 0, blue: winner === R.me, el }); }
}
function spellFx(ev) {
  const x = ev.x, y = ev.y, r = ev.r;
  if (ev.kind === 'fireball') { explosion(x, y, r * 0.8); zoneFx(x, y, r, '#ff8a3d', 0.4); R.shake = Math.max(R.shake, 6); sfx('boom'); fart(0.5, 0.5, 0.4); }
  else if (ev.kind === 'arrows') { for (let i = 0; i < 10; i++) { const a = Math.random() * 6.28, d = Math.sqrt(Math.random()) * r; pfx({ k: 'stick', x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, z: 0, life: 0.7, r: 0.4, gr: 0, col: '#f2d9a6', rot: rnd(-0.4, 0.4) }); } puffs(x, y, 0, '#d9c8a0', 5, 1.2, r * 0.6); zoneFx(x, y, r, '#e8c48a', 0.25); sfx('hit'); }
  else if (ev.kind === 'zap') { for (let i = 0; i < 4; i++) { const a = Math.random() * 6.28, d = Math.random() * r; pfx({ k: 'bolt', x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, tx: x + Math.cos(a) * d, ty: y + Math.sin(a) * d, z: 8, tz: 0, life: 0.2, col: '#b6ff6a' }); } zoneFx(x, y, r, '#6fe82a', 0.3); pfx({ k: 'logo', x, y, z: 1.5, r: r * 0.9, gr: 0, life: 0.6, col: '#6fe82a' }); R.flash = { col: '#c8ff9a', t: 0.15, max: 0.15 }; sfx('zap'); }
  else if (ev.kind === 'freeze') { R.freezes.push({ x, y, r, t: ev.freeze, max: ev.freeze }); burst(x, y, 0.5, 'shard', '#e8f8ff', 16, 4); R.flash = { col: '#dff6ff', t: 0.3, max: 0.3 }; sfx('freeze'); }
  else { for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; puffs(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, 0, i % 2 ? '#d4c94a' : '#9ccc3c', 2, 1.5); } zoneFx(x, y, r, '#d4c94a', 0.35); R.shake = Math.max(R.shake, 5); sfx('spell'); fart(0.7, 0.6, 0.4); }
}

// ---------- Kuleler ----------
function drawTower(t) {
  const SK = SKIN_BY[(R.skins && R.skins[t.team]) || 'klasik'] || SKIN_BY.klasik;
  const [X, Y, sc] = P(t.x, t.y), S = R.S, r = t.rad * S * sc * 0.92, ht = (t.king ? 2.2 : 1.8) * S * sc, ry = r * 0.42;
  const team = t.team, col = team === R.me ? ['#3d8bff', '#1d4fa8'] : ['#ff4d4d', '#9a1f1f'], rs = rsOf(t.id);   // kendi kulen her zaman mavi
  if (t.hp <= 0) {   // yıkıntı
    ctx.fillStyle = '#00000040'; ctx.beginPath(); ctx.ellipse(X, Y, r * 1.1, ry * 1.2, 0, 0, 7); ctx.fill();
    for (let i = 0; i < 9; i++) { const a = i * 2.3, d = (i % 3) * 0.3; ctx.fillStyle = i % 2 ? '#7a706a' : '#5b524c'; ctx.beginPath(); ctx.ellipse(X + Math.cos(a) * r * d, Y - ry * 0.4 + Math.sin(a) * ry * d, r * 0.32, ry * 0.5, 0, 0, 7); ctx.fill(); }
    return;
  }
  ctx.fillStyle = '#00000045'; ctx.beginPath(); ctx.ellipse(X + r * 0.15, Y + ry * 0.2, r * 1.15, ry * 1.3, 0, 0, 7); ctx.fill();
  // silindir gövde
  const sg = ctx.createLinearGradient(X - r, 0, X + r, 0); sg.addColorStop(0, SK.b[0]); sg.addColorStop(0.35, SK.b[1]); sg.addColorStop(1, SK.b[2]);
  ctx.fillStyle = rs.hit > 0 ? '#ffffff' : sg;
  ctx.beginPath(); ctx.moveTo(X - r, Y - ht); ctx.lineTo(X - r, Y); ctx.ellipse(X, Y, r, ry, 0, Math.PI, 0, true); ctx.lineTo(X + r, Y - ht); ctx.ellipse(X, Y - ht, r, ry, 0, 0, Math.PI, true); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#4a423b'; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = '#5b524c88'; ctx.lineWidth = 1.5;
  for (let i = 1; i <= 4; i++) { const yy = Y - ht * i / 5; ctx.beginPath(); ctx.ellipse(X, yy, r, ry, 0, Math.PI, 0, true); ctx.stroke(); for (let j = 0; j < 4; j++) { const a = Math.PI * (0.15 + j * 0.23 + (i % 2) * 0.1), bx = X + Math.cos(a) * r; ctx.beginPath(); ctx.moveTo(bx, yy + Math.sin(a) * ry); ctx.lineTo(bx, yy + Math.sin(a) * ry + ht / 5); ctx.stroke(); } }
  if (t.hp < t.max * 0.5) { ctx.strokeStyle = '#2b2520'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X - r * 0.3, Y - ht * 0.9); ctx.lineTo(X - r * 0.1, Y - ht * 0.6); ctx.lineTo(X - r * 0.35, Y - ht * 0.35); ctx.stroke(); }
  // bayrak
  ctx.fillStyle = col[1]; ctx.fillRect(X - r * 0.32, Y - ht * 0.9, r * 0.64, ht * 0.55);
  ctx.fillStyle = col[0]; ctx.beginPath(); ctx.moveTo(X - r * 0.28, Y - ht * 0.88); ctx.lineTo(X + r * 0.28, Y - ht * 0.88); ctx.lineTo(X + r * 0.28, Y - ht * 0.4); ctx.lineTo(X, Y - ht * 0.48); ctx.lineTo(X - r * 0.28, Y - ht * 0.4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffffffcc'; ctx.beginPath(); ctx.arc(X, Y - ht * 0.68, r * 0.12, 0, 7); ctx.fill();
  // üst platform
  ctx.fillStyle = SK.top; ctx.beginPath(); ctx.ellipse(X, Y - ht, r, ry, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#4a423b'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = col[0] + '55'; ctx.beginPath(); ctx.ellipse(X, Y - ht, r * 0.7, ry * 0.7, 0, 0, 7); ctx.fill();
  const teeth = 10, tw = r * 0.26, th = S * sc * 0.32, tooth = a => { const px = X + Math.cos(a) * r * 0.9, py = Y - ht + Math.sin(a) * ry * 0.9; ctx.fillStyle = Math.sin(a) > 0 ? '#bdb2a6' : '#9a9087'; ctx.fillRect(px - tw / 2, py - th, tw, th); ctx.strokeStyle = '#4a423b'; ctx.lineWidth = 1; ctx.strokeRect(px - tw / 2, py - th, tw, th); };
  for (let i = 0; i < teeth; i++) { const a = i / teeth * 6.28; if (Math.sin(a) < 0) tooth(a); }
  // nöbetçi / kral
  const gh = t.size * S * sc * (t.king ? 1.05 : 1.15), a = t.atkT > 0 ? Math.sin((1 - t.atkT / 0.3) * Math.PI) : 0;
  const inactive = t.king && !t.active;
  const pose = inactive ? { head: 0.25 + Math.sin(rs.anim) * 0.05, lean: 0.06 } : { lean: a * 0.25, head: a * 0.12, bob: Math.sin(rs.anim * 2) * 1 };
  const flip = (t.face || 1) * (R.flip ? -1 : 1);
  drawChar(t.king ? (SK.k || 'king') : SK.g, X, Y - ht - ry * 0.2, gh, pose, { flip, tint: t.freezeT > 0 ? '#bfeaffaa' : null });
  for (let i = 0; i < teeth; i++) { const ang = i / teeth * 6.28; if (Math.sin(ang) >= 0) tooth(ang); }
  if (inactive) { ctx.fillStyle = '#fff'; ctx.font = `900 ${S * sc * 0.6}px "Lilita One",sans-serif`; ctx.textAlign = 'center'; const zz = (rs.anim * 0.8) % 1; ctx.globalAlpha = 1 - zz; ctx.fillText('z', X + r * 0.7 + zz * 10, Y - ht - gh - zz * 18); ctx.globalAlpha = 1; }
  // can barı: düşmanınki nöbetçinin başının üstünde, kendininki kulenin altında; kral barının yanında taç
  const enemy = team !== R.me, bh = Math.max(13, S * 0.55), bw = r * 2.4, by = enemy ? Y - ht - gh - bh - 6 : t.king ? Y - bh * 0.6 : Y + ry + 6;   // kendi kralın barı kulenin gövdesinde: panelin altında kalmaz
  hpBar(t, X, by, bw, bh, true);
  if (t.king) drawCrownIcon(X - bw / 2 - bh * 0.95, by + bh * 0.55, bh * 0.72, col[0]);
  if (t.owner && !t.king) { ctx.font = `${Math.round(bh * 0.85)}px "Lilita One",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const ny = enemy ? by - bh * 0.9 : by + bh * 1.7, tw = ctx.measureText(t.owner).width + 10; const nx = X + (t.x < 9 ? -1 : 1) * Math.max(0, tw / 2 - bw * 0.35); ctx.fillStyle = t.ownerMe ? '#ffd447dd' : '#000a'; roundRect(nx - tw / 2, ny - bh * 0.6, tw, bh * 1.2, bh * 0.4); ctx.fill(); ctx.fillStyle = t.ownerMe ? '#3a2600' : '#fff'; ctx.fillText(t.owner, nx, ny + 1); }
}
function drawCrownIcon(x, y, s, col) {
  ctx.fillStyle = '#ffd447'; ctx.strokeStyle = '#7a4a00'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - s, y + s * 0.5); ctx.lineTo(x - s, y - s * 0.3); ctx.lineTo(x - s * 0.5, y + s * 0.05); ctx.lineTo(x, y - s * 0.6); ctx.lineTo(x + s * 0.5, y + s * 0.05); ctx.lineTo(x + s, y - s * 0.3); ctx.lineTo(x + s, y + s * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y + s * 0.15, s * 0.18, 0, 7); ctx.fill(); }
}
function hpBar(e, X, Y, w, h, num) {
  const col = e.team === R.me ? '#3d9bff' : '#ff4a4a', k = clamp(e.hp / e.max, 0, 1);
  ctx.fillStyle = '#000000cc'; roundRect(X - w / 2 - 2, Y - 2, w + 4, h + 4, 4); ctx.fill();
  ctx.fillStyle = col; roundRect(X - w / 2, Y, w * k, h, 3); ctx.fill();
  ctx.fillStyle = '#ffffff40'; ctx.fillRect(X - w / 2, Y, w * k, h * 0.35);
  if (e.shield > 0) { ctx.fillStyle = '#ffd54f'; ctx.fillRect(X - w / 2, Y - 4, w * Math.min(1, e.shield / (e.shieldMax || e.shield)), 3); }
  if (num) { ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.round(h * 0.82)}px "Lilita One",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(Math.ceil(e.hp), X, Y + h * 0.82); ctx.fillText(Math.ceil(e.hp), X, Y + h * 0.82); }
  else if (e.L) { const s = h + 6; ctx.fillStyle = col; roundRect(X - w / 2 - s - 2, Y - 3, s, s, 3); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.round(s * 0.75)}px "Lilita One",sans-serif`; ctx.textAlign = 'center'; ctx.fillText(e.L, X - w / 2 - s / 2 - 2, Y + s * 0.62); }
}
function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

// ---------- Birimler ----------
function drawUnit(e, B) {
  const art = e.card === 'mafya' && e.evo && e.atkT > 0 ? 'mafya_pose' : (e.img || e.card);   // evrimli Jojo: ORA ORA anında Jojo pozu
  const rs = rsOf(e.id), [X, Y, sc] = P(e.x, e.y), S = R.S, h = e.size * S * UNIT_SCALE * sc, type = rigOf(e.img || e.card).type;
  let z = e.flying ? 1.6 : (e.jz || 0);
  if (e.deployT > 0) { const k = e.deployT / (e.deployMax || 1); z += k * k * 5; }
  const zp = z * S * sc;
  ctx.fillStyle = '#00000050'; ctx.beginPath(); ctx.ellipse(X, Y, e.rad * S * sc * 1.25 * (z > 0.5 ? 0.7 : 1), e.rad * S * sc * 0.5 * (z > 0.5 ? 0.7 : 1), 0, 0, 7); ctx.fill();
  ctx.strokeStyle = e.team === R.me ? '#3d9bffaa' : '#ff4a4aaa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(X, Y, e.rad * S * sc * 1.25, e.rad * S * sc * 0.5, 0, 0, 7); ctx.stroke();
  if (e.building && e.kind === 'building') { drawBuilding(e, rs, X, Y, sc, B); return; }
  const pose = poseFor(e, rs, h, type), flip = rs.fd * (R.flip ? -1 : 1), base = Y - zp;
  const tint = rs.hit > 0 ? '#ffffffb0' : e.freezeT > 0 ? '#bfeaffb0' : e.tsT > 0 ? '#9e9e9ecc' : e.stun > 0 ? '#ffffff40' : e.slowT > 0 ? '#4fc3f755' : null;
  if (e.champ) { const pul = 0.45 + Math.sin(rs.anim * 4) * 0.15 + (e.rageT > 0 ? 0.25 : 0); drawChar(e.img, X, base, h * 1.1, pose, { flip, tint: e.rageT > 0 ? '#ff9a1f' : '#ffd447', alpha: pul }); }
  else if (e.evo) drawChar(art, X, base, h * 1.08, pose, { flip, tint: '#c46bff', alpha: 0.55 });
  else drawChar(e.img || e.card, X, base, h * 1.05, pose, { flip, tint: e.team === R.me ? '#3d9bff' : '#ff3b3b', alpha: 0.42 });   // takım rengi ışıması: kim kimin, kalabalıkta bile belli
  if (e.c && e.c.stand && !(e.deployT > 0)) {
    const atk = e.atkT > 0, off = (atk ? 0.42 : -0.3) * h * flip, jit = atk ? Math.sin(rs.anim * 45) * 3 : Math.sin(rs.anim * 3) * 3;
    drawChar(e.img || e.card, X + off, base + jit - (atk ? 0 : h * 0.05), h * (e.evo ? 1.28 : 1.15), atk ? { lean: 0.2 } : {}, { flip, tint: e.evo ? '#7c3aed' : '#8e5bd6', alpha: 0.55 });
    if (atk) for (let i = 0; i < 2; i++) { const fx = X + flip * h * (0.55 + Math.sin(rs.anim * 60 + i * 3) * 0.08), fy = base - h * (0.5 + i * 0.12) + Math.sin(rs.anim * 50 + i) * h * 0.1; ctx.fillStyle = e.evo ? '#ffe14d' : '#d1b3ff'; ctx.beginPath(); ctx.arc(fx, fy, h * 0.08, 0, 7); ctx.fill(); ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx - flip * h * 0.25, fy); ctx.lineTo(fx - flip * h * 0.12, fy); ctx.stroke(); }
  }
  drawChar(art, X, base, h * (art === 'mafya_pose' ? 1.08 : 1), pose, { flip, tint, alpha: e.deployT > 0 ? 0.6 + 0.4 * (1 - e.deployT / (e.deployMax || 1)) : 1 });
  const top = base - h * (type === 'hang' ? 0 : 1) + (pose.bob || 0);
  if (e.stun > 0 && !(e.freezeT > 0) && !(e.tsT > 0)) for (let i = 0; i < 3; i++) { const a = rs.anim * 5 + i * 2.1; ctx.fillStyle = '#ffe14d'; star(ctx, X + Math.cos(a) * h * 0.25, top - 4 + Math.sin(a) * h * 0.06, h * 0.07, h * 0.03); ctx.fill(); }
  if (e.tsT > 0) { ctx.fillStyle = '#ffe14d'; ctx.fillRect(X - 7, top - 18, 5, 14); ctx.fillRect(X + 2, top - 18, 5, 14); }
  if (e.charged) { ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(X - flip * h * 0.5, base - h * (0.3 + i * 0.2)); ctx.lineTo(X - flip * h * 0.85, base - h * (0.3 + i * 0.2)); ctx.stroke(); } }
  if (e.hp < e.max || e.shield > 0) hpBar(e, X, top - 12, Math.max(34, e.rad * S * sc * 3), 7, false);
  if (e.evo) { const gy = top - (e.hp < e.max ? 26 : 12); ctx.fillStyle = '#c46bff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X, gy - 7); ctx.lineTo(X + 6, gy); ctx.lineTo(X, gy + 7); ctx.lineTo(X - 6, gy); ctx.closePath(); ctx.fill(); ctx.stroke(); }
}
// kapaklı kazanlar: gövde + ayrı kapak; ateş ederken kapak fırlar, içinden patlama çıkar
const LID = { mortar: { f: 0.25, drop: 0, hinge: -0.42, col: '#ff9a2e', bean: true }, inferno: { f: 0.12, drop: 0.03, hinge: 0.38, col: '#6fe82a' } };
function drawLidded(e, rs, X, Y, h, tint) {
  const L = LID[e.card], sp = rasterSprite(e.card, spriteBucket(h * (R.DPR || 1)), tint); if (!sp) return false;
  const w = h * sp.w / sp.h, top = Y + h * 0.12 - h, cut = Math.round(sp.h * L.f), k = h / sp.h;
  const want = e.card === 'inferno' ? (e.target && e.atkT > 0 ? 1 : 0) : (e.atkT > 0 ? Math.sin((1 - e.atkT / 0.3) * Math.PI) : 0);
  rs.lid = (rs.lid || 0) + (want - (rs.lid || 0)) * Math.min(1, R.dt * 14 || 0.3);
  const o = rs.lid, bob = o > 0.05 ? Math.sin(rs.anim * (e.card === 'inferno' ? 9 : 5)) * h * 0.01 * o : 0;
  // gövde (titrer)
  ctx.save(); ctx.translate(X, top + h); ctx.scale(1 + o * 0.04, 1 - o * 0.05); ctx.drawImage(sp.c, 0, cut, sp.w, sp.h - cut, -w / 2, -h + cut * k, w, (sp.h - cut) * k); ctx.restore();
  // içten parıltı ve patlama
  if (o > 0.05) {
    const my = top + cut * k + h * 0.02, gr = ctx.createRadialGradient(X, my, 2, X, my, w * 0.45 * (0.6 + o));
    gr.addColorStop(0, '#fffbe0'); gr.addColorStop(0.35, L.col); gr.addColorStop(1, L.col + '00');
    ctx.globalAlpha = Math.min(1, o * 1.4); ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(X, my - h * 0.08 * o, w * 0.45 * (0.6 + o), h * 0.22 * (0.5 + o), 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    if (Math.random() < o * 0.6) pfx({ x: e.x + rnd(-0.3, 0.3), y: e.y, z: e.size * 1.1, vz: 2.5, vx: rnd(-0.6, 0.6), r: 0.18, gr: 0.5, life: 0.5, col: L.col });
    if (L.bean && Math.random() < o * 0.35) pfx({ k: 'drop', x: e.x + rnd(-0.3, 0.3), y: e.y, z: e.size * 1.1, vz: 3.5, vx: rnd(-1, 1), r: 0.12, gr: 0, life: 0.6, col: '#7a2e12' });
  } else if (Math.random() < 0.02) pfx({ x: e.x + rnd(-0.2, 0.2), y: e.y, z: e.size * 1.15, vz: 0.8, r: 0.08, gr: 0.3, life: 0.8, col: '#ffffffaa' });   // boşta buhar
  // kapak: menteşe etrafında açılır ve havaya kalkar
  const hx = X + L.hinge * w, ly = top + cut * k + h * L.drop * (1 - Math.min(1, o * 2)) + bob;
  ctx.save(); ctx.translate(hx, ly - o * h * 0.16); ctx.rotate(-Math.sign(L.hinge || 1) * o * 0.7); ctx.drawImage(sp.c, 0, 0, sp.w, cut, -w / 2 - (hx - X), -cut * k, w, cut * k); ctx.restore();
  return true;
}
function drawBuilding(e, rs, X, Y, sc, B) {
  const S = R.S, h = e.size * S * 1.25 * sc, a = e.atkT > 0 ? Math.sin((1 - e.atkT / 0.3) * Math.PI) : 0;
  const tint = rs.hit > 0 ? '#ffffffa0' : e.freezeT > 0 ? '#bfeaffb0' : null;
  if (!(LID[e.card] && SPELL_IMG[e.card] && drawLidded(e, rs, X, Y, h, tint))) drawChar(e.card, X, Y + h * 0.12, h, { sx: 1 + a * 0.06, sy: 1 - a * 0.06 }, { flat: true, flip: e.card === 'cannon' && e.target && B.byId.get(e.target) && B.byId.get(e.target).x > e.x !== !!R.flip ? -1 : 1, tint, alpha: e.deployT > 0 ? 0.6 : 1 });
  if (e.shot === 'beam' && e.target && !(e.deployT > 0)) {   // gaz kulesi ışını: hasar arttıkça kalınlaşır
    const t = B.byId.get(e.target);
    if (t && t.hp > 0) {
      const [tx, ty, ts] = P(t.x, t.y), tz = (t.flying ? 1.6 : t.kind === 'tower' ? 1.8 : t.size * 0.5) * S * ts, w = 2 + (e.rampMul || 1) * 0.8;
      const sx = X, sy = Y - h * 0.86, ex = tx, ey = ty - tz, dx = ex - sx, dy = ey - sy, L2 = Math.hypot(dx, dy) || 1, nx = -dy / L2, ny = dx / L2, heat = clamp(((e.rampMul || 1) - 1) / 11, 0, 1);
      const wave = (amp, ph) => { ctx.beginPath(); for (let i = 0; i <= 14; i++) { const t = i / 14, o = Math.sin(t * 9 + R.time * 22 + ph) * amp * Math.sin(t * Math.PI); ctx.lineTo(sx + dx * t + nx * o, sy + dy * t + ny * o); } };
      ctx.lineCap = 'round'; ctx.globalAlpha = 0.35; ctx.strokeStyle = heat > 0.6 ? '#ffe14d' : '#4fd61f'; ctx.lineWidth = w * 3 + 6; wave(3, 0); ctx.stroke();
      ctx.globalAlpha = 0.9; ctx.strokeStyle = heat > 0.6 ? '#ff9a1f' : '#6fe82a'; ctx.lineWidth = w + 2; wave(4 + heat * 3, 1.3); ctx.stroke();
      ctx.globalAlpha = 1; ctx.strokeStyle = '#f4ffd8'; ctx.lineWidth = Math.max(1.5, w * 0.45); wave(2, 2.6); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = '#e8ffc0'; ctx.beginPath(); ctx.arc(ex, ey, 3 + w * 0.8 + Math.sin(R.time * 30) * 1.5, 0, 7); ctx.fill();
      if (Math.random() < 0.4) pfx({ x: t.x + rnd(-0.2, 0.2), y: t.y, z: tz / (S * ts), vz: 1.2, r: 0.12, gr: 0.3, life: 0.35, col: heat > 0.6 ? '#ffb04a' : '#8cf25a' });
    }
  }
  hpBar(e, X, Y - h - 6, Math.max(40, e.rad * S * sc * 2.6), 7, false);
}

// ---------- Mermiler, büyüler, alanlar ----------
function drawProj(p) {
  const [X, Y, sc] = P(p.x, p.y), r = R.S * sc * 0.28, Z = Y - p.z * R.S * sc;
  ctx.fillStyle = '#00000040'; ctx.beginPath(); ctx.ellipse(X, Y, r * 0.8, r * 0.35, 0, 0, 7); ctx.fill();
  switch (p.shot) {
    case 'pear': { ctx.save(); ctx.translate(X, Z); ctx.rotate(R.time * 7); const s = r * 1.1; ctx.fillStyle = '#c8d84a'; ctx.beginPath(); ctx.ellipse(0, s * 0.35, s * 0.75, s * 0.7, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -s * 0.35, s * 0.45, s * 0.55, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#e8f08a'; ctx.beginPath(); ctx.ellipse(-s * 0.25, s * 0.2, s * 0.22, s * 0.3, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-1, -s * 1.05, 2.5, s * 0.35); ctx.fillStyle = '#4a9a2a'; ctx.beginPath(); ctx.ellipse(s * 0.25, -s * 0.9, s * 0.25, s * 0.1, 0.5, 0, 7); ctx.fill(); ctx.restore(); break; }
    case 'heart': ctx.fillStyle = '#ff5fb8'; heartPath(X, Z, r * 1.2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); break;
    case 'note': ctx.fillStyle = '#ffd740'; ctx.beginPath(); ctx.ellipse(X - r * 0.3, Z + r * 0.4, r * 0.45, r * 0.32, -0.4, 0, 7); ctx.fill(); ctx.fillRect(X + r * 0.08, Z - r * 0.9, r * 0.16, r * 1.3); ctx.beginPath(); ctx.moveTo(X + r * 0.24, Z - r * 0.9); ctx.quadraticCurveTo(X + r * 0.9, Z - r * 0.6, X + r * 0.6, Z - r * 0.1); ctx.lineWidth = 3; ctx.strokeStyle = '#ffd740'; ctx.stroke(); break;
    case 'bolt': ctx.strokeStyle = '#bfeaff'; ctx.lineWidth = 3; bolt(ctx, X - r, Z - r, X + r, Z + r, r * 0.4, 4); ctx.stroke(); break;
    case 'web': ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X, Z, r, 0, 7); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; ctx.moveTo(X - Math.cos(a) * r, Z - Math.sin(a) * r); ctx.lineTo(X + Math.cos(a) * r, Z + Math.sin(a) * r); } ctx.stroke(); break;
    case 'orb': { const g = ctx.createRadialGradient(X, Z, 1, X, Z, r * 1.8); g.addColorStop(0, '#fff'); g.addColorStop(0.4, '#a35bff'); g.addColorStop(1, '#a35bff00'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Z, r * 1.8, 0, 7); ctx.fill(); break; }
    case 'disco': ['#ff4081', '#ffd740', '#69f0ae', '#40c4ff'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(X, Z); ctx.arc(X, Z, r * 1.1, i * 1.57 + R.time * 8, (i + 1) * 1.57 + R.time * 8); ctx.fill(); }); break;
    case 'ball': case 'lob': { const k2 = p.shot === 'lob' ? 1.5 : 1.1; ctx.save(); ctx.translate(X, Z); ctx.rotate(R.time * 9); ctx.fillStyle = '#7a2e12'; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05 * k2, r * 0.7 * k2, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#b4532a'; ctx.beginPath(); ctx.ellipse(-r * 0.15 * k2, -r * 0.18 * k2, r * 0.6 * k2, r * 0.28 * k2, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#f3e6c8'; ctx.beginPath(); ctx.ellipse(r * 0.35 * k2, r * 0.1 * k2, r * 0.18 * k2, r * 0.1 * k2, 0.4, 0, 7); ctx.fill(); ctx.restore(); break; }
    case 'ball_old': ctx.fillStyle = '#2b2f34'; ctx.beginPath(); ctx.arc(X, Z, r * 0.9, 0, 7); ctx.fill(); ctx.fillStyle = '#ffffff55'; ctx.beginPath(); ctx.arc(X - r * 0.3, Z - r * 0.3, r * 0.3, 0, 7); ctx.fill(); break;
    case 'lob_old': ctx.fillStyle = '#5d4037'; ctx.beginPath(); ctx.ellipse(X, Z, r * 1.2, r * 0.8, R.time * 6, 0, 7); ctx.fill(); ctx.fillStyle = '#8d6e63'; ctx.beginPath(); ctx.ellipse(X - r * 0.2, Z - r * 0.2, r * 0.5, r * 0.3, 0, 0, 7); ctx.fill(); break;
    case 'bullet': ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(X, Z, r * 0.7, 0, 7); ctx.fill(); ctx.fillStyle = '#e8ffb0'; ctx.beginPath(); ctx.arc(X - r * 0.2, Z - r * 0.2, r * 0.25, 0, 7); ctx.fill(); break;
    default: ctx.fillStyle = p.col || '#9ccc3c'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(X + Math.cos(R.time * 9 + i * 2) * r * 0.45, Z + Math.sin(R.time * 9 + i * 2) * r * 0.45, r * 0.75, 0, 7); ctx.fill(); }
  }
  if (Math.random() < 0.5) pfx({ x: p.x, y: p.y, z: p.z, r: 0.1, gr: 0.3, life: 0.3, col: p.col || '#9ccc3c' });
}
function heartPath(x, y, s) { ctx.beginPath(); ctx.moveTo(x, y + s * 0.6); ctx.bezierCurveTo(x - s * 1.2, y - s * 0.2, x - s * 0.5, y - s * 1, x, y - s * 0.35); ctx.bezierCurveTo(x + s * 0.5, y - s * 1, x + s * 1.2, y - s * 0.2, x, y + s * 0.6); ctx.closePath(); }
function drawSpellFlight(s) {
  if (s.kind === 'fireball' || s.kind === 'arrows') {
    const k = clamp(s.t / (s.dur || 1), 0, 1), x = lerp(s.sx, s.x, k), y = lerp(s.sy, s.y, k), z = 3 * (1 - k) + Math.sin(k * Math.PI) * 6;
    const [X, Y, sc] = P(x, y), Z = Y - z * R.S * sc;
    if (k < 1) {
      ctx.fillStyle = '#00000035'; ctx.beginPath(); ctx.ellipse(X, Y, R.S * sc * 0.6, R.S * sc * 0.25, 0, 0, 7); ctx.fill();
      if (s.kind === 'fireball') { const bs = R.S * sc * 0.32; for (let i = 0; i < 4; i++) { const an = R.time * 8 + i * 1.57, bx = X + Math.cos(an) * bs * 0.9, by = Z + Math.sin(an) * bs * 0.6; ctx.save(); ctx.translate(bx, by); ctx.rotate(an); ctx.fillStyle = '#7a2e12'; ctx.beginPath(); ctx.ellipse(0, 0, bs, bs * 0.62, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#c0602e'; ctx.beginPath(); ctx.ellipse(-bs * 0.2, -bs * 0.18, bs * 0.5, bs * 0.22, 0, 0, 7); ctx.fill(); ctx.restore(); } }
      if (s.kind === 'fireball' && SPELL_IMG.fireball) { const im = SPELL_IMG.fireball, sz = R.S * sc * 1.9; ctx.save(); ctx.translate(X, Z); ctx.rotate(R.time * 7); ctx.drawImage(im, -sz / 2, -sz / 2 * im.naturalHeight / im.naturalWidth, sz, sz * im.naturalHeight / im.naturalWidth); ctx.restore(); }
      if (s.kind === 'fireball') { const g = ctx.createRadialGradient(X, Z, 2, X, Z, R.S * sc * 0.9); g.addColorStop(0, '#fff6c2'); g.addColorStop(0.45, '#ff9a2e'); g.addColorStop(1, '#ff3a1000'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Z, R.S * sc * 0.9, 0, 7); ctx.fill(); pfx({ k: 'flame', x, y, z, r: 0.3, gr: -0.4, life: 0.35, col: Math.random() < 0.5 ? '#ff7043' : '#ffca28' }); }
      else { ctx.strokeStyle = '#f2d9a6'; ctx.lineWidth = 2.5; for (let i = 0; i < 9; i++) { const ox = (hsh(i, 3) - 0.5) * R.S * sc * 2.2, oy = (hsh(i, 7) - 0.5) * R.S * sc * 1.2; ctx.beginPath(); ctx.moveTo(X + ox, Z + oy); ctx.lineTo(X + ox + 6, Z + oy + 10); ctx.stroke(); } }
    }
    if (s.kind === 'arrows' && s.t >= s.dur) for (let w = 1; w < 4; w++) { const wt = s.t - s.dur - (w - 1) * 0.28; if (wt < 0 || wt > 0.28) continue; const [X2, Y2, sc2] = P(s.x, s.y); ctx.strokeStyle = '#f2d9a6'; ctx.lineWidth = 2; for (let i = 0; i < 10; i++) { const ox = (hsh(i, w) - 0.5) * s.r * 2 * R.S * sc2, oy = (hsh(w, i) - 0.5) * s.r * R.S * sc2, zz = (1 - wt / 0.28) * 6 * R.S * sc2; ctx.beginPath(); ctx.moveTo(X2 + ox, Y2 + oy - zz - 12); ctx.lineTo(X2 + ox, Y2 + oy - zz); ctx.stroke(); } }
  } else if (s.kind === 'rain') {
    const k = clamp(s.t / (s.dur || 1), 0, 1);
    ctx.strokeStyle = '#ffe14d'; ctx.setLineDash([6, 5]); ctx.lineWidth = 2; wcircle(ctx, s.x, s.y, s.r); ctx.stroke(); ctx.setLineDash([]);
    for (let i = 0; i < 6; i++) { const a = i * 1.1, d = i ? s.r * 0.6 : 0, [X, Y, sc] = P(s.x + Math.cos(a) * d, s.y + Math.sin(a) * d), Z = Y - (1 - k) * 8 * R.S * sc; const im = IMG.ayva; if (im && im.complete && im.naturalWidth) { const w = R.S * sc * 1.3, h2 = w * im.naturalHeight / im.naturalWidth; ctx.save(); ctx.translate(X, Z); ctx.rotate(k * 6 + i); ctx.drawImage(im, -w / 2, -h2 / 2, w, h2); ctx.restore(); } else { ctx.fillStyle = '#c8d84a'; ctx.beginPath(); ctx.ellipse(X, Z, R.S * sc * 0.32, R.S * sc * 0.42, 0, 0, 7); ctx.fill(); } }
  }
}
function drawAreas(B) {
  for (const a of B.areas) {
    const k = Math.min(1, a.t / 0.5), col = a.kind === 'poison' ? '#9be33a' : a.kind === 'burn' ? '#ff7a2e' : '#4fc3f7';
    ctx.globalAlpha = 0.28 * k; ctx.fillStyle = col; wcircle(ctx, a.x, a.y, a.r); ctx.fill();
    ctx.globalAlpha = 0.7 * k; ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke(); ctx.globalAlpha = 1;
    if (Math.random() < 0.35) pfx({ x: a.x + rnd(-a.r, a.r) * 0.7, y: a.y + rnd(-a.r, a.r) * 0.7, z: 0, vz: 0.8, r: 0.12, gr: 0.25, life: 0.7, col });
  }
  for (const f of R.freezes) { const k = Math.min(1, f.t / 0.4); ctx.globalAlpha = 0.35 * k; ctx.fillStyle = '#dff6ff'; wcircle(ctx, f.x, f.y, f.r); ctx.fill(); ctx.globalAlpha = 0.9 * k; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1; }
  for (const r of B.rollers) {   // oklava
    const [X0, Y0, sc] = P(r.x - r.r, r.y), [X1] = P(r.x + r.r, r.y), hh = R.S * sc * 0.75;
    const lg = ctx.createLinearGradient(0, Y0 - hh, 0, Y0); lg.addColorStop(0, '#e0a868'); lg.addColorStop(1, '#7a4a20');
    ctx.fillStyle = '#00000040'; ctx.fillRect(Math.min(X0, X1), Y0 - 3, Math.abs(X1 - X0), 6);
    if (SPELL_IMG.log) { const im = SPELL_IMG.log, w = Math.abs(X1 - X0) * 1.08, h2 = Math.max(hh, w * im.naturalHeight / im.naturalWidth * 1.6); ctx.save(); ctx.translate((X0 + X1) / 2, Y0 - h2 / 2); ctx.scale(1, 1 + Math.sin(R.time * 20) * 0.04); ctx.drawImage(im, -w / 2, -h2 / 2, w, h2); ctx.restore(); }
    else { ctx.fillStyle = lg; roundRect(Math.min(X0, X1), Y0 - hh, Math.abs(X1 - X0), hh, hh / 2); ctx.fill(); }
    ctx.strokeStyle = '#6b3e18'; ctx.lineWidth = 2; for (let i = 0; i < 5; i++) { const xx = Math.min(X0, X1) + ((i / 5 + r.y * 0.4) % 1) * Math.abs(X1 - X0); ctx.beginPath(); ctx.moveTo(xx, Y0 - hh); ctx.lineTo(xx, Y0); ctx.stroke(); }
    if (Math.random() < 0.6) puffs(r.x + rnd(-r.r, r.r), r.y, 0, '#c8b890', 1, 0.8);
  }
}

// ---------- Parçacık çizimi ----------
function drawParts(dt) {
  for (const f of R.parts) {
    f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; f.z = Math.max(0, f.z + f.vz * dt); f.vz -= f.g * dt; f.r = Math.max(0.01, f.r + f.gr * dt); f.rot += f.vr * dt;
    if (f.k === 'puff') { f.vx *= 0.95; f.vy *= 0.95; f.vz *= 0.95; }
    const k = 1 - f.t / f.life; if (k <= 0) continue;
    const [X, Y, sc] = P(f.x, f.y), Z = Y - f.z * R.S * sc, s = f.r * R.S * sc;
    ctx.globalAlpha = Math.min(1, k * 1.8);
    switch (f.k) {
      case 'puff': ctx.globalAlpha *= 0.75; ctx.fillStyle = f.col; ctx.beginPath(); ctx.arc(X, Z, s, 0, 7); ctx.fill(); ctx.fillStyle = '#ffffff40'; ctx.beginPath(); ctx.arc(X - s * 0.3, Z - s * 0.3, s * 0.45, 0, 7); ctx.fill(); break;
      case 'flash': { const g = ctx.createRadialGradient(X, Y, 1, X, Y, s); g.addColorStop(0, f.col); g.addColorStop(1, f.col + '00'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(X, Y, s, s * 0.5, 0, 0, 7); ctx.fill(); break; }
      case 'flame': ctx.fillStyle = f.col; ctx.beginPath(); ctx.moveTo(X, Z - s * 1.6); ctx.quadraticCurveTo(X + s, Z - s * 0.2, X, Z + s * 0.6); ctx.quadraticCurveTo(X - s, Z - s * 0.2, X, Z - s * 1.6); ctx.fill(); break;
      case 'spark': ctx.strokeStyle = f.col; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(X, Z); ctx.lineTo(X - f.vx * R.S * sc * 0.05, Z - (f.vy * 0.5 - f.vz) * R.S * sc * 0.05); ctx.stroke(); break;
      case 'debris': ctx.save(); ctx.translate(X, Z); ctx.rotate(f.rot); ctx.fillStyle = f.col; ctx.fillRect(-s, -s * 0.7, s * 2, s * 1.4); ctx.restore(); break;
      case 'shard': ctx.save(); ctx.translate(X, Z); ctx.rotate(f.rot); ctx.fillStyle = f.col; ctx.beginPath(); ctx.moveTo(0, -s * 1.6); ctx.lineTo(s * 0.6, 0); ctx.lineTo(0, s * 0.8); ctx.lineTo(-s * 0.6, 0); ctx.closePath(); ctx.fill(); ctx.restore(); break;
      case 'star': ctx.fillStyle = f.col; star(ctx, X, Z, s, s * 0.45, 5, f.rot); ctx.fill(); break;
      case 'coin': ctx.fillStyle = '#ffd447'; ctx.beginPath(); ctx.ellipse(X, Z, s * Math.abs(Math.cos(f.rot)), s, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 1.5; ctx.stroke(); break;
      case 'drop': ctx.fillStyle = f.col; ctx.beginPath(); ctx.arc(X, Z, s * 0.7, 0, 7); ctx.fill(); break;
      case 'feather': ctx.save(); ctx.translate(X, Z); ctx.rotate(Math.sin(f.t * 6) * 0.8); ctx.fillStyle = f.col; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.35, s * 1.1, 0, 0, 7); ctx.fill(); ctx.restore(); break;
      case 'bat': ctx.fillStyle = f.col; ctx.beginPath(); ctx.moveTo(X, Z); const fl = Math.sin(f.t * 30) * s * 0.6; ctx.quadraticCurveTo(X - s, Z - s - fl, X - s * 1.6, Z + fl * 0.3); ctx.quadraticCurveTo(X - s * 0.7, Z - s * 0.2, X, Z + s * 0.3); ctx.quadraticCurveTo(X + s * 0.7, Z - s * 0.2, X + s * 1.6, Z + fl * 0.3); ctx.quadraticCurveTo(X + s, Z - s - fl, X, Z); ctx.fill(); break;
      case 'plus': ctx.fillStyle = f.col; ctx.fillRect(X - s * 0.25, Z - s, s * 0.5, s * 2); ctx.fillRect(X - s, Z - s * 0.25, s * 2, s * 0.5); break;
      case 'zone': ctx.globalAlpha = k * 0.32; ctx.fillStyle = f.col; wcircle(ctx, f.x, f.y, f.r); ctx.fill(); ctx.globalAlpha = k * 0.9; ctx.strokeStyle = f.col; ctx.lineWidth = 3; ctx.stroke(); break;
      case 'stick': ctx.strokeStyle = f.col; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(X, Z); ctx.lineTo(X + Math.sin(f.rot) * s, Z - Math.cos(f.rot) * s); ctx.stroke(); break;
      case 'bolt': { const [X2, Y2, s2] = P(f.tx, f.ty); ctx.strokeStyle = f.col; ctx.lineWidth = 3.5; bolt(ctx, X, Y - f.z * R.S * sc, X2, Y2 - f.tz * R.S * s2, 7, 7); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke(); break; }
      case 'pillar': { const w = Math.max(2, s * 2), g = ctx.createLinearGradient(0, 0, 0, Y); g.addColorStop(0, f.col + '00'); g.addColorStop(1, f.col + 'dd'); ctx.fillStyle = g; ctx.fillRect(X - w / 2, 0, w, Y); ctx.fillStyle = '#fff'; ctx.globalAlpha *= 0.7; ctx.fillRect(X - w / 6, 0, w / 3, Y); break; }
      case 'logo': if (SPELL_IMG.zap) { const im = SPELL_IMG.zap, kk = f.t / f.life, sz = s * 2 * (0.6 + Math.min(1, kk * 4) * 0.5), h2 = sz * im.naturalHeight / im.naturalWidth; ctx.save(); ctx.translate(X, Z); ctx.rotate(Math.sin(f.t * 40) * 0.12); ctx.drawImage(im, -sz / 2, -h2 / 2, sz, h2); ctx.restore(); } break;
      case 'clock': ctx.fillStyle = '#fff8e0'; ctx.strokeStyle = '#7a4a00'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X, Z, s, 0, 7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(X, Z); ctx.lineTo(X, Z - s * 0.75); ctx.moveTo(X, Z); ctx.lineTo(X + s * 0.5, Z); ctx.stroke(); break;
    }
  }
  ctx.globalAlpha = 1;
  R.parts = R.parts.filter(f => f.t < f.life);
}

// ---------- Yerleştirme önizlemesi ----------
function buildOverlay(B, team, c) {
  const key = c.type + '|' + pockets(B, team).join() + '|' + R.S + '|' + R.flip;
  if (R.overlayKey === key && R.overlay) return R.overlay;
  const o = mkCanvas(Math.round(R.VW * R.DPR), Math.round(R.VH * R.DPR)), g = o.getContext('2d'); g.setTransform(R.DPR, 0, 0, R.DPR, 0, 0);
  if (c.type !== 'spell') {
    g.fillStyle = '#ff2a2a40';
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!canPlace({ ents: [], tm: B.tm }, team, c, x + 0.5, y + 0.5)) { quad(g, x, y, x + 1, y + 1); g.fill(); }
    g.strokeStyle = '#ffffff22'; g.lineWidth = 1;
    for (let y = 0; y <= H; y++) { const a = P(0, y), b = P(W, y); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    for (let x = 0; x <= W; x++) { const a = P(x, 0), b = P(x, H); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  }
  R.overlay = o; R.overlayKey = key; return o;
}
function drawPreview(B) {
  const pv = R.preview; if (!pv) return;
  const c = BY_ID[pv.card], team = R.me;
  ctx.drawImage(buildOverlay(B, team, c), 0, 0, R.VW, R.VH);
  if (!pv.inBoard) return;
  { const [X, Y, sc] = P(pv.x, pv.y), nm = (pv.evo && c.evo ? '🌟 ' : '') + c.name, fs2 = Math.round(R.S * 0.75); ctx.font = fs2 + 'px "Lilita One",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';   // kartın adı, konacağı yerin üstünde
    const ty = Y - R.S * sc * (c.type === 'spell' ? (c.radius || 2) * 0.55 + 0.8 : (c.size || 1.5) * 1.15 + 0.9), tw = ctx.measureText(nm).width + fs2; ctx.fillStyle = pv.ok ? '#0b2357dd' : '#7a0000dd'; roundRect(X - tw / 2, ty - fs2 * 0.75, tw, fs2 * 1.5, fs2 * 0.5); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillText(nm, X, ty + 1); }
  if (c.type === 'spell') {
    const r = (c.radius || 2) + (pv.evo && c.evo.radius || 0);
    if (c.spell === 'log') { ctx.fillStyle = pv.ok ? '#ffffff35' : '#ff000035'; quad(ctx, pv.x - r, pv.y, pv.x + r, pv.y + (team === 0 ? -c.range : c.range)); ctx.fill(); }
    else { ctx.fillStyle = pv.ok ? '#ffffff38' : '#ff000038'; wcircle(ctx, pv.x, pv.y, r); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); }
    return;
  }
  const n = (c.count || 1) + (pv.evo && c.evo.countAdd || 0), f = FORM[n] || FORM[4], fl = team === 0 ? 1 : -1;
  ctx.fillStyle = pv.ok ? (team === 0 ? '#3d9bff55' : '#ff4a4a55') : '#ff000055'; quad(ctx, pv.x - 0.5, pv.y - 0.5, pv.x + 0.5, pv.y + 0.5); ctx.fill();
  if ((c.range || 0) >= 3) { ctx.strokeStyle = '#ffffff70'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); wcircle(ctx, pv.x, pv.y, c.range + (pv.evo && c.evo.range || 0)); ctx.stroke(); ctx.setLineDash([]); }
  for (let i = 0; i < n; i++) {
    const o = f[i] || [0, 0], [X, Y, sc] = P(pv.x + o[0], pv.y + o[1] * fl), hh = (c.size || 1.5) * R.S * (c.type === 'building' ? 1.25 : UNIT_SCALE) * sc;
    drawChar(c.id, X, Y, hh, {}, { flip: 1, alpha: pv.ok ? 0.6 : 0.25, flat: c.type === 'building', tint: pv.evo ? '#e0a6ff55' : null });
  }
}

// Kafa: SVG'nin boyun çizgisine kadar olan kısmı (bazı karakterlerde elle ayarlı)
const EMO_HEAD = { davuk: 0.42, bowser: 0.33, jahrein: 0.36, omni: 0.3, hayalet: 0.5, skibidi: 0.32 };
const headNeck = id => EMO_HEAD[id] || Math.min(0.45, rigOf(id).neck + 0.03);
function drawHead(g, id, cx, bottom, hh, tint) {
  const nk = headNeck(id), fullH = hh / nk, e = rasterSprite(id, spriteBucket(fullH * R.DPR), tint); if (!e) return;
  const w = fullH * e.w / e.h, sh = Math.round(e.h * nk);
  g.drawImage(e.c, 0, 0, e.w, sh, cx - w / 2, bottom - hh, w, hh);
}
// ---------- Emoji "canlı kafa": çene ayrı oynar (konuşur/güler), ezilip uzar, efekt katmanı ----------
function drawHeadJaw(g, id, cx, bottom, hh, tint) { drawHead(g, id, cx, bottom, hh, tint); }   // kafa tek parça (bölme/ağız yok)
const easeB = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };   // hafif taşan giriş
function emoteFrame(g, em, a, hh, x0, y0) {
  const beat = (f, ph = 0) => Math.max(0, Math.sin((a * f + ph) * Math.PI * 2));
  let ox = 0, oy = 0, rot = 0, sx = 1, sy = 1, tint = null, alpha = 1, jaw = 0;
  const intro = Math.min(1, a / 0.35), ant = a < 0.18 ? Math.sin(a / 0.18 * Math.PI) : 0;   // hazırlanma: önce ezilir
  sy *= 1 - ant * 0.12; sx *= 1 + ant * 0.1;
  switch (em.anim) {
    case 'laugh': { const b = beat(3.2); oy -= b * hh * 0.07; rot = Math.sin(a * 20) * 0.1 - 0.12; jaw = 0.55 + b * 0.6; sy *= 1 + b * 0.05; sx *= 1 - b * 0.03; break; }
    case 'bounce': { const b = Math.abs(Math.sin(a * 8)); oy -= b * hh * 0.18; sy *= 0.9 + b * 0.16; sx *= 1.1 - b * 0.14; jaw = b * 0.7; break; }
    case 'shake': ox = Math.sin(a * 48) * hh * 0.035; rot = Math.sin(a * 24) * 0.04; tint = Math.sin(a * 9) > 0 ? '#ff2a2a55' : '#ff2a2a22'; jaw = 0.25 + Math.abs(Math.sin(a * 30)) * 0.2; sy *= 1 + Math.sin(a * 12) * 0.03; break;
    case 'spin': { const sp = Math.min(1, a / 0.9); sx *= Math.cos(sp * Math.PI * 4); jaw = 0.5; oy -= Math.sin(sp * Math.PI) * hh * 0.12; break; }
    case 'jump': { const j = (a * 1.8) % 1, air = Math.sin(j * Math.PI); oy -= air * hh * 0.36; const land = j < 0.12 || j > 0.9; sy *= land ? 0.82 : 1 + air * 0.08; sx *= land ? 1.16 : 1 - air * 0.05; rot = (j - 0.5) * 0.25; jaw = air * 0.9; break; }
    case 'cry': { const s = beat(1.6); rot = Math.sin(a * 3) * 0.06; oy += hh * 0.04 + s * hh * 0.03; sy *= 0.97 + s * 0.04; jaw = 0.35 + s * 0.45; tint = '#3060ff18'; break; }
    case 'punch': { const p = beat(2.4); ox = -hh * 0.06 + p * hh * 0.16; rot = -0.12 + p * 0.22; sx *= 1 + p * 0.08; jaw = 0.2 + p * 0.7; break; }
    case 'float': oy += Math.sin(a * 3) * hh * 0.07 - hh * 0.04; rot = Math.sin(a * 2) * 0.14; alpha = 0.8 + Math.sin(a * 5) * 0.12; jaw = 0.4 + Math.sin(a * 6) * 0.3; break;
    case 'freeze': { const f = Math.min(1, a / 0.6); tint = 'rgba(160,220,255,' + (0.25 + f * 0.25) + ')'; ox = Math.sin(a * 60) * hh * 0.012 * f; sy *= 1 - f * 0.04; jaw = 0.35 * f; break; }
    case 'bow': { const b = Math.min(1, a * 1.4) * (a < 1.5 ? 1 : Math.max(0, 1 - (a - 1.5) * 2)); rot = b * 0.42; oy += b * hh * 0.12; jaw = a > 1.5 ? 0.5 : 0.1; break; }
  }
  if (a < 0.35) { const z = 0.3 + 0.7 * easeB(intro); sx *= z; sy *= z; }
  g.save(); g.translate(x0, y0);
  // yer gölgesi
  g.fillStyle = '#0003'; g.beginPath(); g.ellipse(0, hh * 0.04, hh * 0.32 * (1 + oy / hh * 0.8), hh * 0.06, 0, 0, 7); g.fill();
  g.save(); g.translate(ox, oy); g.rotate(rot); g.scale(Math.abs(sx) < 0.05 ? 0.05 : sx, sy); g.globalAlpha = alpha;
  drawHeadJaw(g, em.img, 0, 0, hh, tint, jaw);
  g.restore(); g.globalAlpha = 1;
  // efekt katmanı (kafayla birlikte hareket eder)
  const ex = ox, ey = oy - hh * 0.55;
  if (em.anim === 'cry') for (let i = 0; i < 2; i++) for (let k = 0; k < 4; k++) { const tt = (a * 1.8 + k / 4) % 1, sd = i ? 1 : -1; g.globalAlpha = 1 - tt * 0.6; g.fillStyle = '#5fb8ff'; g.beginPath(); g.ellipse(ex + sd * (hh * 0.2 + tt * hh * 0.25), ey + tt * hh * 0.7, hh * 0.035, hh * 0.05, 0, 0, 7); g.fill(); g.globalAlpha = 1; }
  if (em.anim === 'laugh') for (let i = 0; i < 2; i++) { const tt = (a * 2.4 + i * 0.5) % 1, sd = i ? 1 : -1; g.fillStyle = '#7fd0ff'; g.beginPath(); g.arc(ex + sd * (hh * 0.28 + tt * hh * 0.4), ey - Math.sin(tt * Math.PI) * hh * 0.2, hh * 0.04, 0, 7); g.fill(); }
  if (em.anim === 'laugh' || em.anim === 'bounce') { g.fillStyle = '#ffffffcc'; g.font = Math.round(hh * 0.18) + 'px "Lilita One",sans-serif'; g.textAlign = 'center'; const tt = (a * 1.5) % 1; g.globalAlpha = 1 - tt; g.fillText(em.anim === 'laugh' ? 'HA' : '♪', ex + hh * 0.5, ey - hh * 0.3 - tt * hh * 0.3); g.fillText(em.anim === 'laugh' ? 'HA' : '♫', ex - hh * 0.5, ey - hh * 0.15 - ((tt + 0.5) % 1) * hh * 0.3); g.globalAlpha = 1; }
  if (em.anim === 'shake') {
    const vx = ox + hh * 0.3, vy = oy - hh * 0.85, s = hh * 0.09, p = 1 + Math.sin(a * 14) * 0.15; g.strokeStyle = '#e8202a'; g.lineWidth = Math.max(2, hh * 0.03);
    for (let i = 0; i < 4; i++) { const ang = i * Math.PI / 2 + 0.78; g.beginPath(); g.arc(vx + Math.cos(ang) * s * p, vy + Math.sin(ang) * s * p, s * 0.8 * p, ang + 2.4, ang + 3.9); g.stroke(); }
    for (let i = 0; i < 3; i++) { const tt = (a * 1.6 + i / 3) % 1; g.globalAlpha = (1 - tt) * 0.9; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(ox + (i - 1) * hh * 0.25, oy - hh - tt * hh * 0.45, hh * (0.05 + tt * 0.08), 0, 7); g.fill(); g.globalAlpha = 1; }
  }
  if (em.anim === 'freeze') { g.fillStyle = '#e8f8ffdd'; for (let i = 0; i < 5; i++) { const ang = i * 1.26 + 0.3, rr = hh * 0.58, s = hh * 0.06 * Math.min(1, a * 2); g.save(); g.translate(ox + Math.cos(ang) * rr, oy - hh * 0.5 + Math.sin(ang) * rr * 0.8); g.rotate(ang + a); g.beginPath(); g.moveTo(0, -s * 1.5); g.lineTo(s * 0.6, 0); g.lineTo(0, s * 1.2); g.lineTo(-s * 0.6, 0); g.closePath(); g.fill(); g.restore(); } }
  if (em.anim === 'punch') { const p = beat(2.4); g.strokeStyle = '#ffffffcc'; g.lineWidth = Math.max(2, hh * 0.025); for (let i = 0; i < 3; i++) { const yy = oy - hh * (0.25 + i * 0.25); g.beginPath(); g.moveTo(ox - hh * 0.55, yy); g.lineTo(ox - hh * (0.75 + p * 0.25), yy); g.stroke(); } if (p > 0.85) { g.fillStyle = '#ffe14d'; star(g, ox + hh * 0.62, oy - hh * 0.5, hh * 0.14, hh * 0.06); g.fill(); } }
  if (em.anim === 'float' || em.anim === 'spin' || em.anim === 'bow') { g.fillStyle = em.anim === 'bow' ? '#ffe14d' : '#ffffffcc'; for (let i = 0; i < 4; i++) { const tt = (a * 0.8 + i / 4) % 1; star(g, ox + Math.cos(i * 1.6 + a * 1.5) * hh * 0.62, oy - hh * 0.5 + Math.sin(i * 1.6 + a * 1.5) * hh * 0.45, hh * 0.06 * (1 - tt) + 2, hh * 0.025); g.fill(); } }
  if (em.anim === 'jump') { const j = (a * 1.8) % 1; if (j < 0.15 || j > 0.88) { g.fillStyle = '#ffffffaa'; for (let i = -1; i <= 1; i += 2) { g.beginPath(); g.arc(i * hh * (0.3 + (j < 0.5 ? j : 1 - j) * 1.5), hh * 0.02, hh * 0.05, 0, 7); g.fill(); } } }
  // simge: başın yanında zıplayarak belirir
  const sp = Math.min(1, Math.max(0, (a - 0.15) / 0.3)), ss = hh * 0.34 * (sp < 1 ? easeB(sp) : 1 + Math.sin(a * 7) * 0.06);
  if (sp > 0 && em.e) { const ec = emoImg(em.e, ss * (R.DPR || 1)), es = ss; g.save(); g.translate(hh * 0.48, -hh * 0.95 + Math.sin(a * 5) * hh * 0.03); g.rotate(Math.sin(a * 4) * 0.2); g.drawImage(ec, -es / 2, -es / 2, es, es); g.restore(); }
  g.restore();
}
// ---------- Emoji baloncukları (her emojinin kendi animasyonu; hazır sözler yazılı baloncukta) ----------
function drawEmotes(dt) {
  for (const m of R.emotes) {
    m.t -= dt;
    const dur = m.ph ? 2.2 : 2.4, age = dur - m.t, pop = Math.min(1, age / 0.18) * Math.min(1, m.t / 0.25);
    const wy = m.team === 0 ? 29.6 : 2.6, sxw = (m.side === 0 ? 5.6 : 12.4), wx = R.flip ? 18 - sxw : sxw, [cx, cy, sc] = P(wx, wy), up = m.team === R.me ? 1 : -1, col = m.team === R.me ? '#2a73e0' : '#d63a3a';
    ctx.save(); ctx.translate(cx, cy - R.S * 2 * sc); const z = 0.55 + 0.45 * (1 - Math.pow(1 - pop, 3)) + (age < 0.25 ? Math.sin(age / 0.25 * Math.PI) * 0.12 : 0); ctx.scale(z, z); ctx.globalAlpha = Math.min(1, pop * 1.6);
    if (m.ph) {   // yazılı söz baloncuğu
      ctx.font = `${Math.round(R.S * 0.95)}px "Lilita One",sans-serif`; const tw = ctx.measureText(m.ph).width, bw = tw + R.S * 1.6, bh = R.S * 1.9;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = col; ctx.lineWidth = 4; roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-R.S * 0.4, up * (bh / 2 - 2)); ctx.lineTo(0, up * (bh / 2 + R.S * 0.6)); ctx.lineTo(R.S * 0.4, up * (bh / 2 - 2)); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1b2a4a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(m.ph, 0, 2);
      ctx.restore(); continue;
    }
    const em = EMOTE_BY[m.em]; if (!em) { ctx.restore(); continue; }
    const bw = R.S * 4.6 * sc, bh = R.S * 4 * sc;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = col; ctx.lineWidth = 5;
    roundRect(-bw / 2, -bh / 2, bw, bh, R.S * 0.7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-R.S * 0.6, up * (bh / 2 - 2)); ctx.lineTo(0, up * (bh / 2 + R.S * 0.9)); ctx.lineTo(R.S * 0.6, up * (bh / 2 - 2)); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.save(); roundRect(-bw / 2 + 3, -bh / 2 + 3, bw - 6, bh - 6, R.S * 0.6); ctx.clip();
    if (m.side === 0) { ctx.save(); ctx.scale(-1, 1); emoteFrame(ctx, em, age, bh * 0.6, 0, bh * 0.4); ctx.restore(); }   // soldaki ortaya bakar
    else emoteFrame(ctx, em, age, bh * 0.6, 0, bh * 0.4);
    ctx.restore();
    ctx.restore();
  }
  R.emotes = R.emotes.filter(m => m.t > 0);
}

// ---------- Ana çizim ----------
R.time = 0;
function renderFrame(B, dt) {
  R.time += dt; R.dt = dt;
  if (dt > 0) { R.fa = (R.fa || 0.016) * 0.97 + dt * 0.03; if (R.fa > 0.026) R.lowFx = true; else if (R.fa < 0.018) R.lowFx = false; }   // yavaş cihazda efektleri otomatik azalt R.skins = B.p && B.p.map(p => p.skin);
  if (!R.bg) buildBG();
  ctx.clearRect(0, 0, R.VW, R.VH);
  ctx.save();
  if (R.shake > 0.3) ctx.translate(rnd(-R.shake, R.shake), rnd(-R.shake, R.shake));
  R.shake *= Math.pow(0.004, dt);
  ctx.drawImage(R.bg, 0, 0, R.VW, R.VH);
  // nehir dalgaları
  ctx.strokeStyle = '#ffffff40'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 12; i++) { const x = (i * 1.7 + R.time * 0.7) % (W + 1) - 0.5, y = RIVER_TOP + 0.3 + (i % 4) * 0.42, a = P(x, y), b = P(x + 0.7, y); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  drawAreas(B);
  for (const f of R.freezes) f.t -= dt; R.freezes = R.freezes.filter(f => f.t > 0);
  if (R.preview) drawPreview(B);
  // birim durumları (yürüyor mu, yöne dönüş)
  for (const e of B.ents) {
    const rs = rsOf(e.id); rs.anim += dt; if (rs.hit > 0) rs.hit -= dt;
    if (rs.px !== null) { const d = Math.hypot(e.x - rs.px, e.y - rs.py); rs.mvT = d > 0.004 ? 0.12 : rs.mvT - dt; rs.moving = e.moving !== undefined ? (e.moving || rs.mvT > 0) && !(e.atkT > 0) : rs.mvT > 0; }
    rs.px = e.x; rs.py = e.y; rs.fd += ((e.face || 1) - rs.fd) * Math.min(1, dt * 14);
  }
  const vy = e => R.flip ? -e.y : e.y;
  const list = B.ents.filter(e => e.kind === 'tower' || !e.flying).concat(R.corpses.filter(c => !c.fly).map(c => ({ corpse: c, y: c.y }))).sort((a, b) => vy(a) - vy(b));
  for (const e of list) e.corpse ? drawCorpse(e.corpse, dt) : e.kind === 'tower' ? drawTower(e) : drawUnit(e, B);
  for (const c of R.corpses) if (c.fly) drawCorpse(c, dt);
  for (const e of B.ents.filter(e => e.flying && e.kind !== 'tower').sort((a, b) => vy(a) - vy(b))) drawUnit(e, B);
  R.corpses = R.corpses.filter(c => c.t < c.max);
  for (const p of B.projs) drawProj(p);
  for (const s of B.spells) drawSpellFlight(s);
  drawParts(dt);
  drawEmotes(dt);
  if (R.flash && R.flash.t > 0) { R.flash.t -= dt; ctx.globalAlpha = clamp(R.flash.t / R.flash.max, 0, 1) * 0.45; ctx.fillStyle = R.flash.col; ctx.fillRect(-20, -20, R.VW + 40, R.VH + 40); ctx.globalAlpha = 1; }
  ctx.restore();
  // yıkılan kuleden sayaca uçan taç
  for (const c of R.crownFly) {
    c.t += dt; const k = Math.min(1, c.t / 0.9), e = 1 - Math.pow(1 - k, 3), x = lerp(c.x0, c.x1, e), y = lerp(c.y0, c.y1, e) - Math.sin(k * Math.PI) * 80;
    drawCrownIcon(x, y, 18 + Math.sin(k * Math.PI) * 14, c.blue ? '#3d8bff' : '#ff4d4d');
    if (k >= 1 && !c.done) { c.done = true; c.el.classList.remove('pop'); void c.el.offsetWidth; c.el.classList.add('pop'); }
  }
  R.crownFly = R.crownFly.filter(c => c.t < 1);
}
function drawCorpse(c, dt) {
  c.t += dt; const k = c.t / c.max, [X, Y, sc] = P(c.x, c.y), h = c.size * R.S * (c.building ? 1.25 : UNIT_SCALE) * sc;
  ctx.save(); ctx.globalAlpha = Math.max(0, 1 - k);
  if (c.building) drawChar(c.card, X, Y + h * 0.12 + k * h * 0.3, h * (1 - k * 0.3), {}, { flat: true, tint: '#3a3a3a88' });
  else { ctx.translate(X, Y - (c.fly ? 1.6 * R.S * sc * (1 - k) : 0)); ctx.rotate(-c.face * k * 1.3); drawChar(c.card, 0, 0, h, { sy: 1 - k * 0.2 }, { flip: c.face * (R.flip ? -1 : 1), tint: '#ffffff88' }); }
  ctx.restore();
}

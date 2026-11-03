// ================= Savaş simülasyonu =================
// Çizimden bağımsızdır. Tek oyunculu modda ve çevrimiçi modda ev sahibi çalıştırır; misafir yalnızca anlık görüntü çizer.
// Görsel/işitsel her şey B.ev olay listesiyle render.js'e iletilir.
const W = 18, H = 32, RIVER_TOP = 15, RIVER_BOT = 17, BRIDGES = [3.5, 14.5];
const TOWER_POS = [[[3.5, 25.5, false], [14.5, 25.5, false], [9, 29, true]], [[3.5, 6.5, false], [14.5, 6.5, false], [9, 3, true]]];
const side = (team, y) => team === 0 ? y : H - y;     // takımın kendi bakışından y (büyük = kendi kalesi)
const FORM = { 1: [[0, 0]], 2: [[-0.5, 0], [0.5, 0]], 3: [[0, -0.55], [-0.6, 0.4], [0.6, 0.4]], 4: [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]] };
const TOWER_FX2 = { shot: 'puff', hit: 'cloud', col: '#9ccc3c', snd: 1 };

function emit(B, e, d = {}) { d.e = e; B.ev.push(d); }

function createBattle(o) {
  const rng = mulberry32(o.seed || (Math.random() * 1e9 | 0));
  const B = { x2: !!o.x2, t: 180, ot: false, over: false, winner: -1, ents: [], projs: [], spells: [], areas: [], rollers: [], ev: [], nid: 1, rng, time: 0, tm: [[], []], byId: new Map() };
  const mkP = (team, D, nm, lv, kl, sk) => {
    const deck = D.slice(), order = shuffle(deck, rng), evoIds = deck.slice(0, 2), evoCharge = {};
    evoIds.forEach(id => { evoCharge[id] = evoCycles(id); });   // maça evrim hazır başlar
    return { team, name: nm, deck, hand: order.slice(0, 4), queue: order.slice(4), elixir: 5, crowns: 0, evoIds, evoCharge,
      champId: isChamp(deck[2]) ? deck[2] : null, levels: lv || {}, kl: kl || 1, skin: sk || 'klasik', used: 0, leaked: 0 };
  };
  B.p = [0, 1].map(t => mkP(t, o.decks[t], o.names[t], o.levels[t], o.kl[t], o.skins && o.skins[t]));
  B.px = (o.extra || []).map(x => mkP(x.team, x.deck, x.name, x.levels, x.kl, null));   // 2v2: takım arkadaşları (kendi eli ve iksiri)
  const duo = B.px.length > 0;
  for (let team = 0; team < 2; team++) for (const [x, y, king] of TOWER_POS[team]) {
    // 2v2 (Clash Royale gibi): ortada her oyuncunun kendi kral kulesi, tüm kuleler daha dayanıklı
    for (const kx of king && duo ? [6.6, 11.4] : [x]) {
      const t = addEnt(B, makeTower(B, team, kx, y, king));
      if (duo) {
        t.hp = t.max = Math.round(t.max * (king ? 1.25 : 1.6)); if (king) { t.rad = 1.6; t.size = 2.3; }
        const ally = B.px.find(p => p.team === team); t.owner = kx < 9 ? B.p[team].name : ally ? ally.name : ''; t.ownerMe = team === 0 && kx < 9;
      }
    }
  }
  refresh(B);
  return B;
}
function addEnt(B, e) { B.ents.push(e); B.byId.set(e.id, e); return e; }
function refresh(B) { B.tm = [[], []]; for (const e of B.ents) if (e.hp > 0) B.tm[e.team].push(e); }

function makeTower(B, team, x, y, king) {
  const m = levelMul(B.p[team].kl), hp = Math.round((king ? 2400 : 1400) * m);
  return { id: B.nid++, kind: 'tower', building: true, team, x, y, king, rad: king ? 2 : 1.5, hp, max: hp, dmg: 58 * m, hs: king ? 1 : 0.8, range: king ? 7 : 7.5,
    air: true, cd: 0, active: !king, card: king ? 'king' : 'bulgur', fx: TOWER_FX2, shot: 'puff', target: 0, face: team === 0 ? 1 : -1, atkT: 0, lane: x < 9 ? 0 : 1,
    mass: 999, stun: 0, freezeT: 0, size: king ? 2.6 : 2.1, sight: 7.5 };
}

// Kartın seviye ve evrime göre değerleri
function unitStats(B, team, c, evo) {
  const e = evo && c.evo ? c.evo : null, L = B.p[team].levels[c.id] || 1, m = levelMul(L);
  const mul = k => (e && e[k]) || 1, v = k => e && e[k] !== undefined ? e[k] : c[k];
  const fx = e && e.fx ? Object.assign({}, c.fx, e.fx) : c.fx;
  const sc = o => o ? Object.assign({}, o, o.dmg !== undefined ? { dmg: o.dmg * m } : {}, o.dps !== undefined ? { dps: o.dps * m } : {}) : o;
  return {
    L, hp: Math.round(c.hp * mul('hpm') * m), dmg: (c.dmg || 0) * mul('dmgm') * m, hs: (c.hs || 1) * mul('hsm'), spd: (c.spd || 0) * mul('spdm'),
    range: (c.range || 0) + (e && e.range || 0), minRange: c.minRange || 0, splash: (c.splash || 0) + (e && e.splash || 0),
    air: !!v('air'), flying: !!c.flying, fx, shot: fx.shot || null, shield: Math.round((v('shield') || 0) * m),
    stunHit: v('stunHit') || 0, slowHit: v('slowHit') || 0, chain: v('chain') || 0, burst: v('burst') || 0, lifesteal: v('lifesteal') || 0,
    deathSpawn: v('deathSpawn'), deathBlast: sc(v('deathBlast')), trail: sc(v('trail')), pulse: sc(v('pulse')), slowAura: v('slowAura'),
    heal: (v('heal') || 0) * m, healR: v('healR') || 0, deployStun: v('deployStun'), every: v('every'), spawnN: v('spawnN') || 1, life: v('life'),
    charge: v('charge'), ramp: v('ramp') || 0, rampMax: v('rampMax') || 1, firstStun: v('firstStun') || 0, knockHit: v('knockHit') || 0, dash: v('dash') || 0, leap: sc(v('leap')),
    impactSpawn: v('impactSpawn'),
  };
}
const massOf = c => c.type === 'building' ? 999 : c.hp >= 2200 ? 8 : c.hp >= 1100 ? 3 : 1;

function spawnUnit(B, team, c, x, y, evo, quick) {
  const s = unitStats(B, team, c, evo), bld = c.type === 'building';
  const u = Object.assign({ id: B.nid++, kind: bld ? 'building' : 'troop', building: bld, card: c.id, c, team, x, y, evo: !!(evo && c.evo),
    max: s.hp, rad: (c.rad || 0.45) * (evo ? 1.08 : 1), mass: massOf(c), size: (c.size || 1.5) * (evo ? 1.12 : 1), sight: Math.max(5.5, s.range + 1),
    cd: 0, target: 0, deployT: quick ? 0.35 : 1, deployMax: quick ? 0.35 : 1, stun: 0, slowT: 0, slowF: 1, freezeT: 0, tsT: 0, kx: 0, ky: 0,
    face: team === 0 ? 1 : -1, lane: x < 9 ? 0 : 1, moving: false, dirx: 0, diry: team === 0 ? -1 : 1, atkT: 0, retT: 0,
    lifeMax: s.life, spawnT: 1, pulseT: s.pulse ? s.pulse.every * 0.6 : 0, healT: 0, puddleT: 0, runD: 0, charged: false, rampT: 0, rampMul: 1, hitIds: [], dashCd: 0, bx: null }, s);
  u.shieldMax = u.shield;
  addEnt(B, u);
  emit(B, 'spawn', { id: u.id, x, y, card: c.id, team, evo: u.evo, quick: !!quick });
  return u;
}

// ---------- Kart oynama ----------
function snap(v) { return Math.floor(v) + 0.5; }
function pockets(B, team) {
  const foe = B.tm[1 - team];
  return [!foe.some(e => e.kind === 'tower' && !e.king && e.x < 9), !foe.some(e => e.kind === 'tower' && !e.king && e.x > 9)];
}
function canPlace(B, team, c, x, y) {
  if (x < 0.2 || x > W - 0.2 || y < 0.2 || y > H - 0.2) return false;
  if (c.type === 'spell') return true;
  const sy = side(team, y);
  if (sy > RIVER_TOP - 0.01 && sy < RIVER_BOT) return false;
  let ok = sy >= RIVER_BOT;
  if (!ok) { const pk = pockets(B, team); ok = sy >= 11 && ((x < 9 && pk[0]) || (x >= 9 && pk[1])); }
  if (!ok) return false;
  for (const e of B.ents) {
    if (e.hp <= 0) continue;
    if (e.kind === 'tower' && Math.hypot(e.x - x, e.y - y) < e.rad + 0.3) return false;
    if (c.type === 'building' && e.building && Math.hypot(e.x - x, e.y - y) < e.rad + (c.rad || 0.9)) return false;
  }
  return true;
}
function evoReady(P, id) { return P.evoIds.includes(id) && P.evoCharge[id] >= evoCycles(id); }

function playCard(B, team, idx, x, y, PP) {
  if (B.over) return false;
  const P = PP || B.p[team], id = P.hand[idx], c = BY_ID[id];
  if (!c || P.elixir < c.cost) return false;
  if (c.type !== 'spell') { x = snap(x); y = snap(y); }
  if (!canPlace(B, team, c, x, y)) return false;
  if (id === P.champId && champOf(B, team)) return false;   // aynı anda tek şampiyon
  P.elixir -= c.cost; P.used += c.cost;
  let evo = false;
  if (P.evoIds.includes(id)) { if (evoReady(P, id)) { evo = true; P.evoCharge[id] = 0; } else P.evoCharge[id]++; }
  P.queue.push(id); P.hand[idx] = P.queue.shift();
  deploy(B, team, c, x, y, evo, id === P.champId);
  emit(B, 'play', { team, card: id, x, y, evo });
  return true;
}

function champOf(B, team) { return B.ents.find(e => e.champ && e.team === team && e.hp > 0); }
function makeChamp(B, u) {
  const C = u.c.champ; u.champ = true; u.img = C.img; u.max = u.hp = Math.round(u.max * C.hpm); u.dmg *= C.dmgm; u.size *= 1.1; u.abCd = 2; u.rageT = 0;
  emit(B, 'champ', { x: u.x, y: u.y, team: u.team, name: C.name });
}
// şampiyon ultisi: iksir harcar, bekleme süresi var
function useChamp(B, team) {
  const u = champOf(B, team), P = B.p[team]; if (!u || B.over || u.deployT > 0) return false;
  const A = u.c.champ.abil; if (u.abCd > 0 || P.elixir < A.cost) return false;
  P.elixir -= A.cost; u.abCd = A.cd; const m = levelMul(u.L || 1);
  for (const e of B.tm[1 - team]) if (e.hp > 0 && Math.hypot(e.x - u.x, e.y - u.y) <= A.r + e.rad) {
    damage(B, e, (e.kind === 'tower' ? 0.35 : 1) * A.dmg * m, null);
    if (e.kind !== 'tower') { e.stun = Math.max(e.stun, A.stun); if (e.kind === 'troop' && e.mass < 8) { const a = Math.atan2(e.y - u.y, e.x - u.x); e.kx += Math.cos(a) * 6; e.ky += Math.sin(a) * 6; } }
  }
  if (!(u.rageT > 0)) { u.hs *= 0.6; u.spd *= 1.45; } u.rageT = A.rage;
  emit(B, 'blast', { x: u.x, y: u.y, r: A.r }); emit(B, 'zone', { x: u.x, y: u.y, r: A.r, col: '#ffd447', kind: 'time' }); emit(B, 'ulti', { id: u.id, x: u.x, y: u.y, team });
  return true;
}
function deploy(B, team, c, x, y, evo, champ) {
  if (evo) emit(B, 'evo', { x, y, team, name: c.evo.name, card: c.id });
  if (c.type === 'spell') { castSpell(B, team, c, x, y, evo); return; }
  const n = (c.count || 1) + (evo && c.evo.countAdd || 0), f = FORM[n] || FORM[4], fl = team === 0 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const o = f[i] || [Math.cos(i) * 0.7, Math.sin(i) * 0.7];
    const u = spawnUnit(B, team, c, clamp(x + o[0], 0.5, W - 0.5), y + o[1] * fl, evo, false); if (champ && i === 0) makeChamp(B, u);
  }
}

// ---------- Büyüler ----------
function kingOf(B, team) { return B.ents.find(e => e.kind === 'tower' && e.king && e.team === team) || { x: 9, y: team === 0 ? 29 : 3 }; }
function castSpell(B, team, c, x, y, evo) {
  const e = evo ? c.evo : null, m = levelMul(B.p[team].levels[c.id] || 1), add = k => (c[k] || 0) + (e && e[k] || 0), pick2 = k => e && e[k] !== undefined ? e[k] : c[k];
  const s = { id: B.nid++, team, card: c.id, kind: c.spell || 'rain', x, y, r: add('radius'), dmg: (c.dmg || 0) * m * (e && e.dmgm || 1), towerPct: c.towerPct || 0.35, evo: !!e,
    knock: pick2('knock') || 0, puddle: e && e.puddle ? { dps: e.puddle.dps * m, t: e.puddle.t } : null, t: 0 };
  if (s.kind === 'fireball' || s.kind === 'arrows') {
    const k = kingOf(B, team); s.sx = k.x; s.sy = k.y; s.dur = Math.max(0.35, Math.hypot(x - k.x, y - k.y) / c.speed);
    s.waves = pick2('waves') || 1; s.wave = 0;
    emit(B, 'cast', { card: c.id, sx: s.sx, sy: s.sy, x, y, dur: s.dur, team });
  } else if (s.kind === 'zap') { s.dur = 0.08; s.stun = pick2('stun'); }
  else if (s.kind === 'freeze') { s.dur = 0.15; s.freeze = pick2('freeze'); }
  else if (s.kind === 'poison') { s.dur = 0; s.dps = c.dps * m; s.life = pick2('dur'); s.slow = c.slow; }
  else if (s.kind === 'log') {
    s.dur = 0; B.rollers.push({ id: s.id, team, card: c.id, x, y, y0: y, dir: team === 0 ? -1 : 1, left: c.range, r: s.r, spd: c.speed, dmg: s.dmg, knock: s.knock, towerPct: s.towerPct, hit: [] });
    emit(B, 'log', { x, y, team }); return;
  } else { s.dur = c.delay || 0.8; }   // ayva yağmuru
  B.spells.push(s);
}
function spellLand(B, s) {
  const foes = B.tm[1 - s.team], hitTower = (e, dmg) => damage(B, e, e.kind === 'tower' ? dmg * s.towerPct : dmg, null);
  if (s.kind === 'poison') { B.areas.push({ kind: 'poison', team: s.team, x: s.x, y: s.y, r: s.r, t: s.life, tmax: s.life, dps: s.dps, slow: s.slow, tick: 0, towerPct: s.towerPct, evo: s.evo }); emit(B, 'poison', { x: s.x, y: s.y, r: s.r, t: s.life }); return; }
  for (const e of foes) {
    if (Math.hypot(e.x - s.x, e.y - s.y) > s.r + e.rad) continue;
    if (s.dmg) hitTower(e, s.dmg);
    if (s.stun && e.kind !== 'tower') { e.stun = Math.max(e.stun, s.stun); e.rampT = 0; }
    if (s.freeze) e.freezeT = Math.max(e.freezeT || 0, s.freeze);
    if (s.knock && e.kind === 'troop' && e.mass < 8) { const d = Math.hypot(e.x - s.x, e.y - s.y) || 1; e.kx += (e.x - s.x) / d * s.knock * 5; e.ky += (e.y - s.y) / d * s.knock * 5; }
  }
  if (s.puddle) B.areas.push({ kind: 'burn', team: s.team, x: s.x, y: s.y, r: s.r * 0.8, t: s.puddle.t, tmax: s.puddle.t, dps: s.puddle.dps, slow: 0, tick: 0, towerPct: s.towerPct });
  emit(B, 'spellHit', { kind: s.kind, card: s.card, x: s.x, y: s.y, r: s.r, evo: s.evo, freeze: s.freeze || 0 });
}
function updateSpells(B, dt) {
  for (const s of B.spells) {
    s.t += dt;
    if (s.kind === 'arrows') {
      while (s.wave < s.waves && s.t >= s.dur + s.wave * 0.28) { s.wave++; spellLand(B, s); }
      if (s.wave >= s.waves) s.done = true;
    } else if (s.t >= s.dur) { spellLand(B, s); s.done = true; }
  }
  B.spells = B.spells.filter(s => !s.done);
  for (const a of B.areas) {
    a.t -= dt; a.tick -= dt;
    for (const e of B.tm[1 - a.team]) if (e.kind === 'troop' && a.slow && Math.hypot(e.x - a.x, e.y - a.y) <= a.r + e.rad) { e.slowT = Math.max(e.slowT, 0.3); e.slowF = Math.min(e.slowF, 1 - a.slow); }
    if (a.tick <= 0) {
      a.tick = 0.5;
      for (const e of B.tm[1 - a.team]) if (!e.flying && Math.hypot(e.x - a.x, e.y - a.y) <= a.r + e.rad) damage(B, e, a.dps * 0.5 * (e.kind === 'tower' ? a.towerPct : 1), null);
    }
  }
  B.areas = B.areas.filter(a => a.t > 0);
  for (const r of B.rollers) {
    const step = r.spd * dt; r.y += r.dir * step; r.left -= step;
    for (const e of B.tm[1 - r.team]) {
      if (e.flying || r.hit.includes(e.id)) continue;
      if (Math.abs(e.x - r.x) <= r.r + e.rad && Math.abs(e.y - r.y) <= 0.6 + e.rad) {
        r.hit.push(e.id); damage(B, e, e.kind === 'tower' ? r.dmg * r.towerPct : r.dmg, null);
        if (e.kind === 'troop' && e.mass < 8) e.ky += r.dir * r.knock * 6;
      }
    }
    if (r.left <= 0) r.done = true;
  }
  B.rollers = B.rollers.filter(r => !r.done);
}

// ---------- Hasar ----------
function damage(B, t, amt, from) {
  if (t.hp <= 0 || amt <= 0) return;
  let a = amt;
  if (t.shield > 0) { const s = Math.min(t.shield, a); t.shield -= s; a -= s; if (t.shield <= 0) emit(B, 'shieldBreak', { x: t.x, y: t.y, id: t.id }); }
  t.hp -= a;
  emit(B, 'dmg', { id: t.id, tower: t.kind === 'tower' });
  if (t.kind === 'tower' && t.king && !t.active) { for (const k of B.ents) if (k.kind === 'tower' && k.king && k.team === t.team) k.active = true; emit(B, 'kingWake', { team: t.team }); }   // 2v2: iki kral birlikte uyanır
  if (from && from.lifesteal) { const s = B.byId.get(from.src); if (s && s.hp > 0) { s.hp = Math.min(s.max, s.hp + amt * from.lifesteal); emit(B, 'heal', { id: s.id }); } }
}
function canHit(a, e) {
  if (!e || e.hp <= 0) return false;
  if (a.buildingsOnly && !e.building) return false;
  if (e.flying && !a.air) return false;
  return true;
}
// Saldırı paketi: mermi uçarken saldıran ölse bile değerleri saklanır
function atkPacket(u, t) {
  let dmg = u.dmg;
  if (u.ramp) { dmg *= u.rampMul; }
  if (u.charged) { dmg *= u.charge.mult; }
  return { team: u.team, src: u.id, card: u.card, dmg, splash: u.splash, air: u.air, buildingsOnly: !!(u.c && u.c.target === 'buildings'), stunHit: u.stunHit, slowHit: u.slowHit,
    chain: u.chain, lifesteal: u.lifesteal, fx: u.fx, impactSpawn: u.impactSpawn, evo: u.evo, firstStun: u.firstStun && !u.hitIds.includes(t.id) ? u.firstStun : 0, knockHit: u.knockHit, L: u.L };
}
function applyHit(B, a, t, x, y) {
  const foes = B.tm[1 - a.team], hits = [];
  if (a.splash) { for (const e of foes) if (canHit(a, e) && Math.hypot(e.x - x, e.y - y) <= a.splash + e.rad) hits.push(e); }
  else if (t && t.hp > 0) hits.push(t);
  for (const e of hits) {
    damage(B, e, a.dmg, a);
    if (e.kind !== 'tower') {
      if (a.stunHit) { e.stun = Math.max(e.stun, a.stunHit); e.rampT = 0; }
      if (a.firstStun && e === t) { e.stun = Math.max(e.stun, a.firstStun); }
      if (a.slowHit) { e.slowT = Math.max(e.slowT, a.slowHit); e.slowF = Math.min(e.slowF, 0.6); }
      if (a.knockHit && e.mass < 8) { const d = Math.hypot(e.x - x, e.y - y) || 1, src = B.byId.get(a.src); if (src) { const dd = Math.hypot(e.x - src.x, e.y - src.y) || 1; e.kx += (e.x - src.x) / dd * a.knockHit * 5; e.ky += (e.y - src.y) / dd * a.knockHit * 5; } }
    }
  }
  emit(B, 'hit', { x, y, card: a.card, fx: a.fx.hit, col: a.fx.col, splash: a.splash, tower: !!(t && t.kind === 'tower'), tid: t ? t.id : 0, flying: !!(t && t.flying), sz: t ? t.size || 2 : 1, shake: a.fx.shake || 0, evo: a.evo });
  if (a.chain && t) {
    const near = foes.filter(e => e !== t && canHit(a, e) && Math.hypot(e.x - t.x, e.y - t.y) <= 3.2).sort((p, q) => Math.hypot(p.x - t.x, p.y - t.y) - Math.hypot(q.x - t.x, q.y - t.y)).slice(0, a.chain);
    for (const e of near) { damage(B, e, a.dmg * 0.6, a); emit(B, 'chain', { x: t.x, y: t.y, tx: e.x, ty: e.y, col: a.fx.col, ft: !!t.flying, fe: !!e.flying }); }
  }
  if (a.impactSpawn) spawnUnit(B, a.team, BY_ID[a.impactSpawn], clamp(x, 0.5, W - 0.5), clamp(y, 0.5, H - 0.5), false, true);
}

// ---------- Hedef seçimi ----------
function validFor(u, e) {
  if (!canHit({ air: u.air, buildingsOnly: !!(u.c && u.c.target === 'buildings') }, e)) return false;
  if (u.minRange && Math.hypot(e.x - u.x, e.y - u.y) - e.rad < u.minRange) return false;
  return true;
}
function acquire(B, u) {
  let best = null, bd = 1e9;
  const bOnly = u.c && u.c.target === 'buildings', mobile = u.kind === 'troop';
  for (const e of B.tm[1 - u.team]) {
    if (!validFor(u, e)) continue;
    const d = Math.hypot(e.x - u.x, e.y - u.y) - e.rad;
    if (!mobile) { if (d <= u.range && d < bd) { bd = d; best = e; } continue; }   // binalar menzilindekine bakar
    if (e.building) { const dd = d + (e.kind === 'tower' && !e.king && e.lane !== u.lane ? 6 : 0); if (dd < bd) { bd = dd; best = e; } }
    else if (!bOnly && d <= u.sight && d - 4 < bd) { bd = d - 4; best = e; }
  }
  return best;
}
const edge = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) - a.rad - b.rad;

// ---------- Hareket: köprü + engel etrafından dolaşma ----------
function pathGoal(u, tx, ty) {
  if (u.flying) return [tx, ty];
  const uS = u.y > 16 ? 1 : 0, tS = ty > 16 ? 1 : 0, inRiver = u.y > RIVER_TOP - 0.3 && u.y < RIVER_BOT + 0.3;
  if (!inRiver && uS === tS) { u.bx = null; u.brC = false; return [tx, ty]; }
  const exitY = tS ? RIVER_BOT + 0.9 : RIVER_TOP - 0.9;
  if (inRiver) return [BRIDGES.reduce((b, c) => Math.abs(u.x - c) < Math.abs(u.x - b) ? c : b), exitY];
  if (u.bx == null) { const tl = tx < 9 ? 0 : 1; u.bx = (tl === u.lane || Math.abs(tx - 9) < 2.5) ? BRIDGES[u.lane] : BRIDGES.reduce((b, c) => (Math.abs(u.x - c) + Math.abs(tx - c) < Math.abs(u.x - b) + Math.abs(tx - b) ? c : b)); }
  const entryY = uS ? RIVER_BOT + 0.8 : RIVER_TOP - 0.8;
  if (!u.brC && (Math.abs(u.x - u.bx) < 0.85 || (Math.abs(u.x - u.bx) < 1.6 && Math.abs(u.y - entryY) < 1.2))) u.brC = true;   // bir kez köprüye yönelince geri dönme (kalabalıkta itilip gidip gelmesin)
  return u.brC ? [clamp(u.x, u.bx - 0.6, u.bx + 0.6), exitY] : [u.bx, entryY];
}
function moveToward(B, u, t, dt) {
  const [gx, gy] = pathGoal(u, t.x, t.y);
  let dx = gx - u.x, dy = gy - u.y, d = Math.hypot(dx, dy);
  if (d < 0.01) return;
  dx /= d; dy /= d;
  if (!u.flying) {   // kule/bina önündeyse yanından dolaş
    for (const o of B.ents) {
      if (!o.building || o.hp <= 0 || o === t) continue;
      const ox = o.x - u.x, oy = o.y - u.y, od = Math.hypot(ox, oy), R = o.rad + u.rad + 0.25;
      if (od > R + 2.2) continue;
      const ahead = ox * dx + oy * dy; if (ahead < 0) continue;
      const perp = Math.abs(ox * dy - oy * dx); if (perp > R) continue;
      let px = -dy, py = dx; if (px * ox + py * oy > 0) { px = -px; py = -py; }
      const w = (R + 2.2 - od) / (R + 2.2) * 2.2; dx += px * w; dy += py * w;
      const n = Math.hypot(dx, dy); dx /= n; dy /= n;
    }
  }
  let sp = u.spd * (u.slowT > 0 ? u.slowF : 1);
  if (u.charged) sp *= u.charge.spd;
  if (u.dashing) sp = 9;
  const s = Math.min(d, sp * dt);
  u.x += dx * s; u.y += dy * s; u.moving = true; u.dirx = dx; u.diry = dy;
  if (Math.abs(dx) > 0.25) u.face = dx > 0 ? 1 : -1; else if (Math.abs(t.x - u.x) > 0.5) u.face = t.x > u.x ? 1 : -1;
  if (u.charge && !u.charged) { u.runD += s; if (u.runD >= u.charge.dist) { u.charged = true; emit(B, 'charge', { id: u.id }); } }
}

// ---------- Birim güncelleme ----------
function attack(B, u, t) {
  if (Math.abs(t.x - u.x) > 0.2) u.face = t.x > u.x ? 1 : -1;
  u.atkT = 0.3;
  if (u.ramp) { if (u.rampTgt !== t.id) { u.rampTgt = t.id; u.rampT = 0; } u.rampT += u.hs; u.rampMul = 1 + (u.rampMax - 1) * Math.min(1, u.rampT / u.ramp); }
  const a = atkPacket(u, t);
  if (u.firstStun && !u.hitIds.includes(t.id)) u.hitIds.push(t.id);
  if (u.charged) { u.charged = false; u.runD = 0; }
  if (u.dashing) u.dashing = false;
  emit(B, 'atk', { id: u.id, card: u.card, shot: u.shot, tower: u.kind === 'tower' });
  if (u.shot === 'beam') { emit(B, 'beam', { id: u.id, tid: t.id }); applyHit(B, a, t, t.x, t.y); }
  else if (u.shot) {
    for (let i = 0; i < (u.burst || 1); i++) {
      const lob = u.shot === 'lob', z0 = u.kind === 'tower' ? (u.king ? 3 : 2.6) : u.flying ? 1.4 : u.size * 0.45;
      const dd = Math.hypot(t.x - u.x, t.y - u.y);
      B.projs.push({ id: B.nid++, a, team: u.team, shot: u.shot, col: u.fx.col, x: u.x, y: u.y, z: z0, z0, sx: u.x, sy: u.y, tid: t.id, tx: t.x, ty: t.y, homing: !lob,
        spd: lob ? 6 : u.kind === 'tower' ? 14 : 11, delay: i * 0.16, t: 0, dur: lob ? Math.max(1.2, dd / 6) : 0, src: u.id });
    }
  } else applyHit(B, a, t, t.x, t.y);
}

function updateUnit(B, u, dt) {
  if (u.atkT > 0) u.atkT -= dt;
  if (u.slowT > 0) { u.slowT -= dt; if (u.slowT <= 0) u.slowF = 1; }
  if (u.tsT > 0) u.tsT -= dt;
  if (u.dashCd > 0) u.dashCd -= dt;
  if (u.champ) { if (u.abCd > 0) u.abCd -= dt; if (u.rageT > 0) { u.rageT -= dt; if (u.rageT <= 0) { u.hs /= 0.6; u.spd /= 1.45; } } }
  if (u.kx || u.ky) { u.x += u.kx * dt; u.y += u.ky * dt; const f = Math.exp(-9 * dt); u.kx *= f; u.ky *= f; if (Math.abs(u.kx) + Math.abs(u.ky) < 0.05) u.kx = u.ky = 0; }
  u.moving = false;
  if (u.deployT > 0) {
    u.deployT -= dt;
    if (u.deployT <= 0) {
      emit(B, 'land', { id: u.id, x: u.x, y: u.y, size: u.size, card: u.card });
      if (u.deployStun) { emit(B, 'zone', { x: u.x, y: u.y, r: u.deployStun.r, col: '#80d8ff', kind: 'stun' }); for (const e of B.tm[1 - u.team]) if (e.kind !== 'tower' && Math.hypot(e.x - u.x, e.y - u.y) <= u.deployStun.r + e.rad) { e.stun = Math.max(e.stun, u.deployStun.t); if (u.deployStun.dmg) damage(B, e, u.deployStun.dmg * (u.L ? levelMul(u.L) : 1), null); } }
    }
    return;
  }
  if (u.freezeT > 0) { u.freezeT -= dt; return; }
  if (u.leapF) {   // dev zıplama: havada süzülür, inince alan hasarı
    const L = u.leapF; L.t += dt; const k = Math.min(1, L.t / L.dur); u.x = lerp(L.x0, L.x1, k); u.y = lerp(L.y0, L.y1, k); u.jz = Math.sin(k * Math.PI) * 3.2; u.moving = true;
    if (k >= 1) { u.leapF = null; u.jz = 0; u.leapCd = 3.5; u.cd = Math.min(u.cd, 0.4); for (const e of B.tm[1 - u.team]) if (e.hp > 0 && !e.flying && Math.hypot(e.x - u.x, e.y - u.y) <= u.leap.r + e.rad) { damage(B, e, e.kind === 'tower' ? u.leap.dmg * 0.4 : u.leap.dmg, null); if (e.kind === 'troop' && e.mass < 8) { const a = Math.atan2(e.y - u.y, e.x - u.x); e.kx += Math.cos(a) * 4; e.ky += Math.sin(a) * 4; } } emit(B, 'blast', { x: u.x, y: u.y, r: u.leap.r }); emit(B, 'land', { id: u.id, x: u.x, y: u.y, size: u.size * 1.4, card: u.card }); }
    return;
  }
  if (u.leapCd > 0) u.leapCd -= dt;
  if (u.stun > 0) { u.stun -= dt; u.charged = false; u.runD = 0; return; }
  u.cd -= u.slowT > 0 ? dt * u.slowF : dt;

  if (u.kind === 'building') {
    u.hp -= u.max / u.life * dt;
    if (u.c.spawn) {
      u.spawnT -= dt;
      if (u.spawnT <= 0) { u.spawnT = u.every; for (let i = 0; i < u.spawnN; i++) spawnUnit(B, u.team, BY_ID[u.c.spawn], clamp(u.x + (i - (u.spawnN - 1) / 2) * 1.1, 0.5, W - 0.5), u.y + (u.team === 0 ? -1.4 : 1.4), false, true); u.atkT = 0.3; emit(B, 'spawnPulse', { id: u.id }); }
      return;
    }
  }
  if (u.heal) { u.healT -= dt; for (const f of B.tm[u.team]) if (f !== u && f.kind === 'troop' && Math.hypot(f.x - u.x, f.y - u.y) <= u.healR && f.hp < f.max) { f.hp = Math.min(f.max, f.hp + u.heal * dt); if (u.healT <= 0) emit(B, 'heal', { id: f.id }); } if (u.healT <= 0) u.healT = 0.8; }
  if (u.slowAura) for (const e of B.tm[1 - u.team]) if (e.kind === 'troop' && Math.hypot(e.x - u.x, e.y - u.y) <= u.slowAura.r) { e.slowT = Math.max(e.slowT, 0.3); e.slowF = Math.min(e.slowF, 0.6); }
  if (u.pulse) { u.pulseT -= dt; if (u.pulseT <= 0) { u.pulseT = u.pulse.every; pulseFire(B, u); } }
  if (u.trail && u.moving) { u.puddleT -= dt; if (u.puddleT <= 0) { u.puddleT = 0.8; B.areas.push({ kind: 'trail', team: u.team, x: u.x, y: u.y, r: 1, t: u.trail.t, tmax: u.trail.t, dps: u.trail.dps, slow: 0.3, tick: 0, towerPct: 0.35 }); } }

  // hedef: saldırırken kilitli kalır; yürürken yakında daha iyisi çıkarsa değiştirir
  let t = u.target ? B.byId.get(u.target) : null;
  if (!t || !validFor(u, t) || (u.kind !== 'troop' && edge(u, t) > u.range + 0.1)) { const n = acquire(B, u); if (n !== t) { t = n; u.target = t ? t.id : 0; u.cd = Math.max(u.cd, u.hs * 0.45); u.rampT = 0; u.rampMul = 1; } }
  else if (edge(u, t) > u.range + 0.05) { u.retT -= dt; if (u.retT <= 0) { u.retT = 0.3; const n = acquire(B, u); if (n && n !== t) { t = n; u.target = n.id; u.cd = Math.max(u.cd, u.hs * 0.45); } } }
  if (!t) return;
  const d = edge(u, t);
  if (d <= u.range + 0.05) { if (u.cd <= 0) { u.cd = u.hs; attack(B, u, t); } }
  else if (u.kind === 'troop') {
    if (u.dash && u.dashCd <= 0 && d < 3.5 && !t.flying) { u.dashing = true; u.dashCd = 3; emit(B, 'dash', { id: u.id }); }
    if (u.leap && !(u.leapCd > 0) && d > 2.2 && d < 5.5 && !t.flying && Math.abs(u.y - 16) > 2.2 === Math.abs(t.y - 16) > 2.2 && (u.y > 16) === (t.y > 16)) { const a = Math.atan2(t.y - u.y, t.x - u.x), dd = Math.max(0, d - 0.2); u.leapF = { x0: u.x, y0: u.y, x1: u.x + Math.cos(a) * (dd + u.rad), y1: u.y + Math.sin(a) * (dd + u.rad), t: 0, dur: 0.8 }; emit(B, 'dash', { id: u.id }); return; }
    moveToward(B, u, t, dt);
  }
}

function pulseFire(B, u) {
  const p = u.pulse;
  emit(B, 'pulse', { x: u.x, y: u.y, r: p.r, kind: p.time ? 'time' : u.card === 'b456' ? 'red' : 'ice', dmg: !!p.dmg, id: u.id });
  for (const e of B.tm[1 - u.team]) if (e.kind !== 'tower' && Math.hypot(e.x - u.x, e.y - u.y) <= p.r + e.rad) {
    e.stun = Math.max(e.stun, p.stun); if (p.time) e.tsT = p.stun;
    if (p.dmg) damage(B, e, p.dmg, null);
  }
}

function updateTower(B, tw, dt) {
  if (tw.atkT > 0) tw.atkT -= dt;
  if (tw.freezeT > 0) { tw.freezeT -= dt; return; }
  tw.cd -= dt;
  if (!tw.active) return;
  let t = tw.target ? B.byId.get(tw.target) : null;
  if (!t || t.hp <= 0 || edge(tw, t) > tw.range) { t = null; let bd = 1e9; for (const e of B.tm[1 - tw.team]) { const d = edge(tw, e); if (d <= tw.range && d < bd) { bd = d; t = e; } } tw.target = t ? t.id : 0; }
  if (t && tw.cd <= 0) { tw.cd = tw.hs; attack(B, tw, t); }
}

function separate(B) {
  const us = B.ents.filter(e => e.kind === 'troop' && e.hp > 0);
  for (let i = 0; i < us.length; i++) for (let j = i + 1; j < us.length; j++) {
    const a = us[i], b = us[j];
    if (a.flying !== b.flying) continue;
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = a.rad + b.rad;
    if (d < m && d > 0.0001) {
      const p = m - d, wa = b.mass / (a.mass + b.mass), wb = a.mass / (a.mass + b.mass), nx = dx / d, ny = dy / d;
      a.x -= nx * p * wa; a.y -= ny * p * wa; b.x += nx * p * wb; b.y += ny * p * wb;
    }
  }
  for (const u of us) {
    if (!u.flying) {
      for (const b of B.ents) { if (!b.building || b.hp <= 0) continue; const d = Math.hypot(u.x - b.x, u.y - b.y), m = u.rad + b.rad * 0.92; if (d < m && d > 0.0001) { u.x = b.x + (u.x - b.x) / d * m; u.y = b.y + (u.y - b.y) / d * m; } }
      if (u.y > RIVER_TOP && u.y < RIVER_BOT) { const bx = BRIDGES.reduce((p, c) => Math.abs(u.x - c) < Math.abs(u.x - p) ? c : p); u.x = clamp(u.x, bx - 0.95, bx + 0.95); }
    }
    u.x = clamp(u.x, 0.4, W - 0.4); u.y = clamp(u.y, 0.4, H - 0.4);
  }
}

function updateProjs(B, dt) {
  for (const p of B.projs) {
    if (p.delay > 0) { p.delay -= dt; const s = B.byId.get(p.src); if (s) { p.x = p.sx = s.x; p.y = p.sy = s.y; } continue; }
    const t = B.byId.get(p.tid);
    if (p.homing) {
      if (t && t.hp > 0) { p.tx = t.x; p.ty = t.y; }
      const tz = t ? (t.flying ? 1.4 : (t.kind === 'tower' ? 1.6 : t.size * 0.4)) : 0.5;
      const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy), s = p.spd * dt;
      if (d <= s) { if (t && t.hp > 0) applyHit(B, p.a, t, t.x, t.y); else if (p.a.splash) applyHit(B, p.a, null, p.tx, p.ty); p.done = true; continue; }
      p.x += dx / d * s; p.y += dy / d * s; p.z += (tz - p.z) * Math.min(1, s / d);
    } else {   // havan: hedef noktaya kavisli atış
      p.t += dt; const k = Math.min(1, p.t / p.dur);
      p.x = lerp(p.sx, p.tx, k); p.y = lerp(p.sy, p.ty, k); p.z = lerp(p.z0, 0, k) + Math.sin(k * Math.PI) * 4;
      if (k >= 1) { applyHit(B, p.a, null, p.tx, p.ty); p.done = true; }
    }
  }
  B.projs = B.projs.filter(p => !p.done);
}

function cleanup(B) {
  for (const e of B.ents) {
    if (e.hp > 0 || e.dead) continue;
    e.dead = true;
    if (e.kind !== 'tower') {
      emit(B, 'death', { id: e.id, x: e.x, y: e.y, card: e.card, size: e.size, flying: e.flying, team: e.team, face: e.face, building: e.building });
      if (e.deathBlast) { const b = e.deathBlast; for (const f of B.tm[1 - e.team]) if (f.hp > 0 && Math.hypot(f.x - e.x, f.y - e.y) <= b.r + f.rad) damage(B, f, f.kind === 'tower' ? b.dmg * 0.5 : b.dmg, null); emit(B, 'blast', { x: e.x, y: e.y, r: b.r }); }
      if (e.deathSpawn) for (let i = 0; i < e.deathSpawn.n; i++) spawnUnit(B, e.team, BY_ID[e.deathSpawn.id], clamp(e.x + (B.rng() - 0.5) * 1.4, 0.5, W - 0.5), clamp(e.y + (B.rng() - 0.5) * 1.4, 0.5, H - 0.5), false, true);
    } else {
      const foe = B.p[1 - e.team];
      foe.crowns = e.king ? 3 : Math.min(3, foe.crowns + 1);
      emit(B, 'towerDown', { team: e.team, x: e.x, y: e.y, king: e.king, crowns: foe.crowns });
      for (const k of B.ents) if (k.kind === 'tower' && k.king && k.team === e.team && !k.active && k.hp > 0) { k.active = true; emit(B, 'kingWake', { team: e.team }); }
      if (e.king) { for (const t of B.ents) if (t.kind === 'tower' && t.team === e.team) t.hp = Math.min(t.hp, 0); endBattle(B, 1 - e.team); }
      else if (B.ot) endBattle(B, 1 - e.team);
    }
  }
  B.ents = B.ents.filter(e => !(e.dead && e.kind !== 'tower'));
  for (const [id, e] of B.byId) if (e.dead && e.kind !== 'tower') B.byId.delete(id);
  refresh(B);
}

function endBattle(B, winner) {
  if (B.over) return;
  B.over = true; B.winner = winner;
  if (winner >= 0) { const P = B.p[winner]; if (P.crowns === 0) P.crowns = 1; }
  emit(B, 'end', { winner });
}
// Uzatma da berabere biterse: en düşük canlı kulesi daha zayıf olan kaybeder
function tiebreak(B) {
  const low = team => Math.min(...B.ents.filter(e => e.kind === 'tower' && e.team === team).map(e => Math.max(0, e.hp) / e.max));
  const a = low(0), b = low(1);
  endBattle(B, Math.abs(a - b) < 0.001 ? -1 : a > b ? 0 : 1);
}

function elixirRate(B) { return Math.max(B.x2 ? 2 : 1, B.ot ? 3 : B.t <= 60 ? 2 : 1); }
function stepBattle(B, dt) {
  if (B.over) return;
  B.time += dt;
  const prev = B.t; B.t -= dt;
  if (!B.ot && prev > 60 && B.t <= 60) emit(B, 'double');
  const rate = elixirRate(B);
  for (const P of B.px ? B.p.concat(B.px) : B.p) { const add = dt / 2.8 * rate; if (P.elixir >= 10) P.leaked += add; P.elixir = Math.min(10, P.elixir + add); }
  if (B.t <= 0) {
    if (!B.ot) { if (B.p[0].crowns === B.p[1].crowns) { B.ot = true; B.t = 60; emit(B, 'overtime'); } else return endBattle(B, B.p[0].crowns > B.p[1].crowns ? 0 : 1); }
    else return tiebreak(B);
  }
  refresh(B);
  for (const e of B.ents) { if (e.hp <= 0) continue; e.kind === 'tower' ? updateTower(B, e, dt) : updateUnit(B, e, dt); }
  separate(B); updateSpells(B, dt); updateProjs(B, dt); cleanup(B);
}

// ---------- Ağ için anlık görüntü (ev sahibi -> misafir) ----------
const NET_FIELDS = ['id', 'kind', 'card', 'team', 'x', 'y', 'hp', 'max', 'shield', 'shieldMax', 'rad', 'size', 'flying', 'evo', 'L', 'face', 'atkT', 'stun', 'slowT', 'freezeT', 'tsT', 'deployT', 'deployMax', 'king', 'active', 'building', 'life', 'lifeMax', 'rampMul', 'target', 'charged', 'shot', 'moving', 'dirx', 'diry', 'champ', 'img', 'abCd', 'rageT'];
function snapshot(B) {
  const r2 = v => typeof v === 'number' ? Math.round(v * 100) / 100 : v;
  return { t: r2(B.t), ot: B.ot, over: B.over, w: B.winner,
    p: B.p.map(P => ({ el: r2(P.elixir), cr: P.crowns, hand: P.hand, next: P.queue[0], evoIds: P.evoIds, evoCharge: P.evoCharge, name: P.name, kl: P.kl, levels: P.levels, sk: P.skin, ch: P.champId })),
    e: B.ents.map(e => NET_FIELDS.map(k => r2(e[k]))),
    j: B.projs.filter(p => !(p.delay > 0)).map(p => [r2(p.x), r2(p.y), r2(p.z), p.shot, p.col, p.team]),
    s: B.spells.map(s => [s.kind, s.card, r2(s.x), r2(s.y), r2(s.r), r2(s.t), r2(s.dur || 0), s.sx, s.sy, s.team, s.evo]),
    a: B.areas.map(a => [a.kind, r2(a.x), r2(a.y), r2(a.r), r2(a.t), a.tmax, a.team]),
    r: B.rollers.map(r => [r2(r.x), r2(r.y), r.r, r.dir, r.team]) };
}
// Misafir: anlık görüntüyü çizilebilir bir "savaş" nesnesine çevir
function fromSnapshot(S, prevB) {
  const B = prevB || { ev: [], byId: new Map(), tm: [[], []] };
  B.t = S.t; B.ot = S.ot; B.over = S.over; B.winner = S.w;
  B.p = S.p.map(P => ({ elixir: P.el, crowns: P.cr, hand: P.hand, queue: [P.next], evoIds: P.evoIds, evoCharge: P.evoCharge, name: P.name, kl: P.kl, levels: P.levels, skin: P.sk, champId: P.ch }));
  B.ents = S.e.map(a => { const o = {}; NET_FIELDS.forEach((k, i) => { o[k] = a[i]; }); o.c = BY_ID[o.card]; return o; });
  B.byId = new Map(B.ents.map(e => [e.id, e])); B.tm = [B.ents.filter(e => e.team === 0 && e.hp > 0), B.ents.filter(e => e.team === 1 && e.hp > 0)];
  B.projs = S.j.map(a => ({ x: a[0], y: a[1], z: a[2], shot: a[3], col: a[4], team: a[5] }));
  B.spells = S.s.map(a => ({ kind: a[0], card: a[1], x: a[2], y: a[3], r: a[4], t: a[5], dur: a[6], sx: a[7], sy: a[8], team: a[9], evo: a[10] }));
  B.areas = S.a.map(a => ({ kind: a[0], x: a[1], y: a[2], r: a[3], t: a[4], tmax: a[5], team: a[6] }));
  B.rollers = S.r.map(a => ({ x: a[0], y: a[1], r: a[2], dir: a[3], team: a[4] }));
  return B;
}

// ================= Yapay zekâ rakip =================
// Zorluk: 0 Kolay, 1 Normal, 2 Zor. Tepki süresi, hata payı ve gaz israfı zorluğa göre değişir.
const AI_CFG = [
  { react: 1.4, rd: 1.5, mistake: 0.3, push: 9.8, spellVal: 2.2, counterPush: false },
  { react: 0.9, rd: 1.05, mistake: 0.12, push: 8.5, spellVal: 1.6, counterPush: true },
  { react: 0.6, rd: 0.75, mistake: 0.05, push: 7, spellVal: 1.2, counterPush: true },
  { react: 0.32, rd: 0.4, mistake: 0.02, push: 7.5, spellVal: 0.9, counterPush: true, pro: true },   // Esporcu: kusursuz, analiz eden
];
// insan gibi: yeni bir tehdidi ancak bir süre sonra 'fark eder' (her seferinde biraz farklı)
function noticed(A, B, e) { const m = A.seenT || (A.seenT = new Map()); if (!m.has(e.id)) m.set(e.id, B.time + A.cfg.rd * (0.6 + Math.random() * 0.8)); return B.time >= m.get(e.id); }
function aiCreate(team, diff, P, lane) { return { fixLane: lane, P, seen: new Set(), laneHit: [0, 0], team, diff, cfg: AI_CFG[diff], t: 1.5, lane: Math.random() < 0.5 ? 0 : 1, lastDef: null, pushT: 0 }; }

// Bir kartın belirli bir tehdide karşı ne kadar işe yaradığı
function counterScore(c, th) {
  const r = cardRole(c);
  if (c.type === 'spell') return -1;
  const air = c.type === 'building' ? !!c.air : !!c.air;
  if (th.flying && !air) return -1;
  let s = 1;
  if (th.swarm && (c.splash || r === 'splash')) s += 3;
  if (th.tank && (c.ramp || (c.dmg / (c.hs || 1)) > 150 || (c.count || 1) >= 3)) s += 3;
  if (th.bOnly && (c.type === 'building' || (c.count || 1) >= 2)) s += 3;
  if (th.ranged && (c.spd >= 1.4 || c.flying)) s += 1.5;
  if (r === 'wincon') s -= 3;               // kule koşucuyu savunmada harcama
  if (c.type === 'building' && !th.bOnly && !th.tank) s -= 1;
  return s - c.cost * 0.25;
}
function threatInfo(B, team, e) {
  const near = B.tm[1 - team].filter(o => o.kind === 'troop' && Math.hypot(o.x - e.x, o.y - e.y) < 3);
  const hp = near.reduce((s, o) => s + o.hp, 0);
  return { e, x: e.x, y: e.y, flying: near.some(o => o.flying), swarm: near.length >= 3 && hp / near.length < 500, tank: hp >= 1800, bOnly: !!(e.c && e.c.target === 'buildings'), ranged: (e.range || 0) >= 3, hp, n: near.length };
}
// Büyü için en değerli nokta: alandaki düşman can toplamı
function bestSpellSpot(B, team, c) {
  const r = (c.radius || 2.5), foes = B.tm[1 - team];
  let best = null, bv = 0;
  for (const e of foes) {
    if (e.kind === 'tower' && c.spell === 'log') continue;
    let v = 0;
    for (const o of foes) {
      if (Math.hypot(o.x - e.x, o.y - e.y) > r + o.rad) continue;
      if (c.spell === 'log' && o.flying) continue;
      const dmg = (c.dmg || c.dps * (c.dur || 4) * 0.6 || 100) * (c.waves || 1);
      v += o.kind === 'tower' ? Math.min(o.hp, dmg * 0.35) * 0.6 : Math.min(o.hp, dmg);
    }
    if (v > bv) { bv = v; best = e; }
  }
  return best ? { x: best.x, y: best.y + (best.diry || 0) * 0.6, v: bv } : null;
}

function aiThink(B, A, dt) {
  A.t -= dt; if (A.t > 0 || B.over) return;
  const cfg = A.cfg; A.t = cfg.react * (0.6 + Math.random() * 0.8) + (Math.random() < 0.12 ? rnd(0.5, 1.4) : 0);
  { const cu = B.ents.find(e => e.champ && e.team === A.team && e.hp > 0);   // şampiyon ultisi: yakında 2+ düşman ya da kuleye dayanınca
    if (cu && !(cu.abCd > 0) && Math.random() > cfg.mistake) { const near = B.tm[1 - A.team].filter(e => Math.hypot(e.x - cu.x, e.y - cu.y) < 3.2); if (near.length >= 2 || near.some(e => e.kind === 'tower') || cu.hp < cu.max * 0.35 && near.length) useChamp(B, A.team); } }
  const team = A.team, P = A.P || B.p[team], my = y => team === 0 ? y : H - y, mis = () => Math.random() < cfg.mistake;
  let hand = P.hand.map((id, i) => ({ c: BY_ID[id], i })).filter(o => o.c.cost <= P.elixir);
  if (cfg.pro && proThink(B, A, P, hand)) return;
  if (!hand.length) return;
  const foes = B.tm[1 - team].filter(e => e.kind === 'troop' || (e.kind === 'building'));
  const myTowers = B.tm[team].filter(e => e.kind === 'tower');

  // 1) Kule bitirme: düşük canlı kuleye büyü
  for (const o of hand) if (o.c.type === 'spell' && o.c.dmg) {
    const tw = B.tm[1 - team].filter(e => e.kind === 'tower').find(t => t.hp <= o.c.dmg * levelMul(P.levels[o.c.id] || 1) * (o.c.waves || 1) * 0.35);
    if (tw) { playCard(B, team, o.i, tw.x, tw.y, A.P); return; }
  }
  // 2) Savunma: kendi yarımıza yaklaşan tehdit
  const threats = foes.filter(e => side(team, e.y) > 12.5 && noticed(A, B, e) && (A.fixLane === undefined || (e.x < 9 ? 0 : 1) === A.fixLane)).sort((a, b) => side(team, b.y) - side(team, a.y));
  if (threats.length) {
    const th = threatInfo(B, team, threats[0]);
    const spell = hand.filter(o => o.c.type === 'spell').map(o => ({ o, s: bestSpellSpot(B, team, o.c) })).filter(z => z.s && z.s.v >= z.o.c.cost * 100 * cfg.spellVal).sort((a, b) => b.s.v - a.s.v)[0];
    if (spell && (th.swarm || th.n >= 2)) { playCard(B, team, spell.o.i, spell.s.x, spell.s.y, A.P); return; }
    const opts = hand.filter(o => o.c.type !== 'spell').map(o => ({ o, s: counterScore(o.c, th) })).filter(z => z.s > 0).sort((a, b) => b.s - a.s);
    if (opts.length) {
      const o = (mis() ? pick(opts) : opts[0]).o, c = o.c;
      let x, y;
      if (c.type === 'building') { x = 9 + (th.x < 9 ? -0.5 : 0.5); y = my(22.5); }                       // ortaya koy: kule koşucularını çek
      else if ((c.range || 0) >= 3) { x = clamp(th.x, 2, 16); y = my(27.5); }                             // menzilli: kulenin arkasına
      else if (th.bOnly) { x = 9 + (th.x < 9 ? -1.5 : 1.5); y = my(21); }                                // kuleye koşanı ortaya çek
      else { x = clamp(th.x + (Math.random() - 0.5), 1, 17); y = my(clamp(side(team, th.y) + 2.5, RIVER_BOT + 0.6, 30.5)); }
      if (mis()) { x += (Math.random() - 0.5) * 4; }
      if (playCard(B, team, o.i, clamp(x, 0.6, W - 0.6), y, A.P)) { A.lastDef = { x, t: B.time }; return; }
    }
  }
  // 3) Değerli büyü (savunma dışı)
  for (const o of hand) if (o.c.type === 'spell') { const s = bestSpellSpot(B, team, o.c); if (s && s.v >= o.c.cost * 100 * cfg.spellVal * 1.3) { playCard(B, team, o.i, s.x, s.y, A.P); return; } }
  // 4) Saldırı: tank arkadan, destek arkasından; savunmadan sonra karşı saldırı
  const counter = cfg.counterPush && A.lastDef && B.time - A.lastDef.t < 6;
  const rate = elixirRate(B), threshold = rate > 1 ? cfg.push - 2 : cfg.push;
  if (P.elixir >= threshold || counter || P.elixir >= 9.8) {
    const own = B.tm[team].filter(e => e.kind === 'troop');
    const lane = counter ? (A.lastDef.x < 9 ? 0 : 1) : weakLane(B, team, A);
    const lx = BRIDGES[lane];
    const pushing = own.filter(e => Math.abs(e.x - lx) < 4 && side(team, e.y) < 22);
    const cands = hand.filter(o => o.c.type !== 'spell' && o.c.type !== 'building');
    if (!cands.length) return;
    let o;
    if (pushing.length) o = cands.find(z => ['ranged', 'splash', 'swarm'].includes(cardRole(z.c))) || cands[0];   // destek
    else o = cands.find(z => ['tank', 'wincon'].includes(cardRole(z.c))) || cands.sort((a, b) => b.c.cost - a.c.cost)[0];
    const r = cardRole(o.c);
    let y = r === 'tank' && !counter ? 29.5 : r === 'wincon' ? 18.5 : pushing.length ? clamp(side(team, pushing[0].y) + 2, 17.6, 30) : 23;
    playCard(B, team, o.i, clamp(lx + (Math.random() - 0.5) * 1.5, 0.6, W - 0.6), my(y), A.P);
  }
}
function weakLane(B, team, A) {
  if (A.fixLane !== undefined) return A.fixLane;
  const tw = B.tm[1 - team].filter(e => e.kind === 'tower' && !e.king);
  if (tw.length === 2) { const [a, b] = tw; if (Math.abs(a.hp / a.max - b.hp / b.max) > 0.1) return (a.hp / a.max < b.hp / b.max ? a : b).lane; return A.lane; }
  if (tw.length === 1) return 1 - tw[0].lane;   // yıkık tarafa bas
  return A.lane;
}

// ---------- Esporcu beyni: oyuncuyu izler, iksir sayar, değişim kazanır, sızdırmaz, cezalandırır ----------
function proThink(B, A, P, hand) {
  const pc = (i, x, y) => playCard(B, team, i, clamp(x + rnd(-0.3, 0.3), 0.6, W - 0.6), y + rnd(-0.25, 0.25), A.P);   // kusursuz değil: el biraz kayar
  const team = A.team, my = y => team === 0 ? y : H - y, O = B.p[1 - team];
  for (const e of B.tm[1 - team]) if (e.kind !== 'tower' && e.card) { A.seen.add(e.card); if (side(team, e.y) > 14) A.laneHit[e.x < 9 ? 0 : 1] += 0.02; }
  const oppSpells = O.hand.map(id => BY_ID[id]).filter(c => c.type === 'spell' && (c.radius || 0) >= 2);   // rakibin elinde alan büyüsü var mı
  const foes = B.tm[1 - team].filter(e => e.kind === 'troop' || e.kind === 'building');
  const threats = foes.filter(e => side(team, e.y) > 12.5 && noticed(A, B, e));
  // 1) savunma: en ucuz yeterli karşılık (pozitif iksir değişimi), tehdit köprüyü geçince
  if (threats.length) {
    const th = threatInfo(B, team, threats.sort((a, b) => side(team, b.y) - side(team, a.y))[0]);
    const thCost = threats.reduce((s, e) => s + (e.c ? e.c.cost / (e.c.count || 1) : 0), 0);
    const spell = hand.filter(o => o.c.type === 'spell').map(o => ({ o, s: bestSpellSpot(B, team, o.c) })).filter(z => z.s && z.s.v >= z.o.c.cost * 95).sort((a, b) => b.s.v / b.o.c.cost - a.s.v / a.o.c.cost)[0];
    if (spell && (th.swarm || th.n >= 2)) { pc(spell.o.i, spell.s.x, spell.s.y); return true; }
    const opts = hand.filter(o => o.c.type !== 'spell').map(o => ({ o, s: counterScore(o.c, th) - o.c.cost * 0.35 - ((o.c.count || 1) >= 3 && oppSpells.length ? 2 : 0) })).filter(z => z.s > 0).sort((a, b) => b.s - a.s);
    if (opts.length) {
      if (side(team, th.y) < 15.5 && !th.bOnly) return true;   // köprüyü geçmesini bekle: kule de vursun
      const c = opts[0].o.c; let x, y;
      if (c.type === 'building') { x = 9 + (th.x < 9 ? -0.5 : 0.5); y = my(22.5); }
      else if ((c.range || 0) >= 3) { x = clamp(th.x + (th.x < 9 ? 1 : -1), 2, 16); y = my(28); }
      else if (th.bOnly) { x = 9 + (th.x < 9 ? -1.2 : 1.2); y = my(22); }
      else { x = clamp(th.x, 1, 17); y = my(clamp(side(team, th.y) + 1.8, RIVER_BOT + 0.6, 30.5)); }
      if (pc(opts[0].o.i, clamp(x, 0.6, W - 0.6), y)) { A.lastDef = { x, t: B.time }; return true; }
    }
    if (thCost >= 3 && P.elixir < 4) return true;   // iksir topla, savunacak
  }
  // 2) kule bitir
  for (const o of hand) if (o.c.type === 'spell' && o.c.dmg) { const tw = B.tm[1 - team].find(t => t.kind === 'tower' && t.hp <= o.c.dmg * levelMul(P.levels[o.c.id] || 1) * (o.c.waves || 1) * 0.35); if (tw) { pc(o.i, tw.x, tw.y); return true; } }
  // 3) cezalandır: rakip iksiri düşük ve sahası boş -> zayıf koridora kule koşucu
  const myPush = B.tm[team].filter(e => e.kind === 'troop' && side(team, e.y) < 18);
  const lane = A.laneHit[0] > A.laneHit[1] + 0.5 ? 1 : A.laneHit[1] > A.laneHit[0] + 0.5 ? 0 : weakLane(B, team, A);   // rakibin saldırdığı koridorun tersine bas
  if (O.elixir <= 3.5 && P.elixir >= 4 && !threats.length) {
    const wc = hand.find(o => ['wincon', 'tank'].includes(cardRole(o.c)) && o.c.type !== 'spell') || hand.find(o => o.c.type === 'troop' && o.c.cost >= 3);
    if (wc) { pc(wc.i, BRIDGES[lane], my(cardRole(wc.c) === 'wincon' ? 18.2 : 20)); return true; }
  }
  // 4) destekle: önde birlik varsa arkasına destek
  if (myPush.length && P.elixir >= 3) {
    const lead = myPush[0], sup = hand.find(o => ['ranged', 'splash', 'swarm'].includes(cardRole(o.c)) && o.c.type === 'troop' && !(oppSpells.length && (o.c.count || 1) >= 3));
    if (sup) { pc(sup.i, clamp(lead.x, 1, 17), my(clamp(side(team, lead.y) + 2.2, 17.6, 30))); return true; }
  }
  // 5) rakip çok iksirliyse sabırlı ol; değilse 2x'te büyük itiş
  const rate = elixirRate(B), thr = O.elixir >= 8 ? 9.5 : rate > 1 ? 6.5 : 8;
  if (P.elixir >= thr && !threats.length) {
    const tank = hand.find(o => cardRole(o.c) === 'tank' && o.c.type === 'troop');
    if (tank) { pc(tank.i, BRIDGES[lane] + (lane ? 1 : -1), my(30)); return true; }   // arkadan başlat
    const wc = hand.find(o => cardRole(o.c) === 'wincon');
    if (wc) { pc(wc.i, BRIDGES[lane], my(18.2)); return true; }
  }
  // 6) sızdırma: 9.6+ iksirde en ucuz kartı kral kulesinin arkasına döngüle
  if (P.elixir >= 9.6) { const cyc = hand.filter(o => o.c.type === 'troop').sort((a, b) => a.c.cost - b.c.cost)[0]; if (cyc) { pc(cyc.i, 9 + (lane ? 1.5 : -1.5), my(30.6)); return true; } }
  return P.elixir < 7;   // iksir azken bekler; doluysa normal saldırı mantığına geçer
}
// Esporcu destesi: dengeli yapı (kazanma koşulu + tank + alan + hava + bina + 2 büyü + döngü)
function proDeck(ar) {
  const pool = CARDS.filter(c => CARD_ARENA[c.id] <= ar), by = r => shuffle(pool.filter(c => cardRole(c) === r).map(c => c.id));
  const out = new Set(), add = (ids, n) => { for (const id of ids) { if (n <= 0) break; if (!out.has(id)) { out.add(id); n--; } } };
  add(by('wincon'), 1); add(by('tank'), 1); add(by('splash'), 1); add(shuffle(pool.filter(c => c.air && c.type === 'troop').map(c => c.id)), 1);
  add(shuffle(pool.filter(c => c.type === 'building').map(c => c.id)), 1); add(shuffle(pool.filter(c => c.type === 'spell').sort((a, b) => b.cost - a.cost).map(c => c.id)), 2);
  add(shuffle(pool.filter(c => c.cost <= 3).map(c => c.id)), 8 - out.size);
  add(shuffle(pool.map(c => c.id)), 8 - out.size);
  return [...out].slice(0, 8);
}

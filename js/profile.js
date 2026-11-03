// ================= Oyuncu profili ve ilerleme (tarayıcıda kayıtlı) =================
const PROFILE_KEY = 'bulgurProfile3';
const FREE_EVERY = 10 * 60 * 1000, SHOP_EVERY = 30 * 60 * 1000;

function newProfile() {
  const cards = {};
  CARDS.forEach(c => { if (CARD_ARENA[c.id] === 0) cards[c.id] = { lvl: 1, n: 0 }; });
  const deck = ['minecraft', 'mafya', 'bulgur', 'zombi', 'turgut', 'keko', 'arrows', 'cannon'];
  return { v: 3, name: 'Bulgurcu' + (1000 + Math.random() * 9000 | 0), trophies: 0, best: 0, gold: 150, gems: 100, kl: 1, kxp: 0, cards,
    decks: [deck.slice(), deck.slice(), deck.slice()], cur: 0, chests: [{ type: 'wood', state: 'locked', end: 0 }, null, null, null], cycle: 0,
    emotes: EMOTE_LIST.filter(e => !e.price && !e.pass).map(e => e.id), emoDeck: EMOTE_LIST.filter(e => !e.price && !e.pass).map(e => e.id),
    crowns: 0, freeAt: Date.now(), road: [], roadV: 2, stats: { w: 0, l: 0, d: 0, three: 0 }, diff: 1, shop: null, newCards: [] };
}
let PF = store.get(PROFILE_KEY, null);
if (!PF || PF.v !== 3) PF = newProfile();
// Eski kayıtları yeni sisteme taşı: emoji koleksiyonu + basamaklı kupa yolu
const DEFAULT_EMOTES = EMOTE_LIST.filter(e => !e.price && !e.pass).map(e => e.id);
if (!PF.emotes) PF.emotes = DEFAULT_EMOTES.slice();
if (!PF.emoDeck || PF.emoDeck.length !== 8) PF.emoDeck = DEFAULT_EMOTES.slice();
const seasonId = () => { const d = new Date(); return d.getFullYear() * 12 + d.getMonth(); };   // her ay yeni sezon
const newPass = () => ({ season: seasonId(), crowns: 0, prem: false, f: [], p: [], loop: 0 });
if (!PF.pass || PF.pass.season !== seasonId()) PF.pass = newPass();
if (!PF.skins) PF.skins = ['klasik'];
if (!SKIN_BY[PF.skin]) PF.skin = 'klasik';
if (PF.roadV !== 2) { PF.road = []; PF.roadV = 2; }
function buyEmote(id) { const e = EMOTE_BY[id]; if (!e || PF.emotes.includes(id) || PF.gems < e.price) return false; PF.gems -= e.price; PF.emotes.push(id); saveP(); return true; }
// ---------- Pass Royale ----------
const passTier = () => Math.min(PASS_TIERS, Math.floor(PF.pass.crowns / PASS_CROWNS));
const passLoopN = () => Math.max(0, Math.floor((PF.pass.crowns - PASS_TIERS * PASS_CROWNS) / PASS_LOOP)) - PF.pass.loop;   // bekleyen şanslı döngü sandıkları
function passClaimable(t, prem) { return t <= passTier() && !(prem ? PF.pass.p : PF.pass.f).includes(t) && (!prem || PF.pass.prem); }
function grantReward(R0) {   // ortak ödül uygulayıcı: altın/elmas/sandık/kart/emoji/kule
  let r = { gold: R0.gold || 0, gems: R0.gems || 0, cards: [] };
  if (R0.chest) { const c = rollChest(R0.chest); r = { type: R0.chest, gold: c.gold, gems: c.gems, cards: c.cards }; }
  if (R0.cards) { const pool = CARDS.filter(c => owned(c.id) && c.rar === R0.cards), any = CARDS.filter(c => owned(c.id)), c = pick(pool.length ? pool : any); r.cards = [{ id: c.id, n: R0.n }]; r.type = 'silver'; }
  if (R0.emote && !PF.emotes.includes(R0.emote)) { PF.emotes.push(R0.emote); r.emote = R0.emote; }
  if (R0.skin && !PF.skins.includes(R0.skin)) { PF.skins.push(R0.skin); r.skin = R0.skin; }
  applyReward(r); return r;
}
function claimPass(t, prem) { if (!passClaimable(t, prem)) return null; (prem ? PF.pass.p : PF.pass.f).push(t); const T = PASS[t - 1]; return grantReward(prem ? T.prem : T.free); }
function claimLoop() { if (passLoopN() <= 0) return null; PF.pass.loop++; return grantReward({ chest: PF.pass.prem ? 'gold' : 'silver' }); }
function buyPass() { if (PF.pass.prem || PF.gems < PASS_PRICE) return false; PF.gems -= PASS_PRICE; PF.pass.prem = true; saveP(); return true; }
function buySkin(id) { const s = SKIN_BY[id]; if (!s || !s.price || PF.skins.includes(id) || PF.gems < s.price) return false; PF.gems -= s.price; PF.skins.push(id); PF.skin = id; saveP(); return true; }
function saveP() { store.set(PROFILE_KEY, PF); }
saveP();

const arenaIdx = (tr = PF.trophies) => ARENAS.reduce((i, a, k) => tr >= a.tr ? k : i, 0);
const owned = id => !!PF.cards[id];
const cardLvl = id => PF.cards[id] ? PF.cards[id].lvl : 1;
const curDeck = () => PF.decks[PF.cur];
function deckLevels(deck) { const o = {}; deck.forEach(id => { o[id] = cardLvl(id); }); return o; }
const avgCost = deck => deck.reduce((s, id) => s + BY_ID[id].cost, 0) / deck.length;

function upgradeInfo(id) {
  const c = BY_ID[id], o = PF.cards[id]; if (!o) return null;
  if (o.lvl >= MAX_LVL) return { max: true, n: o.n };
  const r = RAR[c.rar], need = r.need[o.lvl - 1], gold = r.gold[o.lvl - 1];
  return { need, gold, n: o.n, ready: o.n >= need, ok: o.n >= need && PF.gold >= gold };
}
function doUpgrade(id) {
  const u = upgradeInfo(id); if (!u || !u.ok) return false;
  const o = PF.cards[id]; o.n -= u.need; PF.gold -= u.gold; o.lvl++;
  addKxp(Math.round(4 * o.lvl * RAR[BY_ID[id].rar].f)); saveP(); return true;
}
function addKxp(x) {
  PF.kxp += x; let up = false;
  while (PF.kl < 10 && PF.kxp >= KING_NEED[PF.kl - 1]) { PF.kxp -= KING_NEED[PF.kl - 1]; PF.kl++; up = true; }
  if (up) toast('👑 Kral seviyesi ' + PF.kl + '! Kulelerin güçlendi.');
}

// ---------- Sandıklar ----------
function grantChest(type) { const i = PF.chests.indexOf(null); if (i < 0) return -1; PF.chests[i] = { type, state: 'locked', end: 0 }; saveP(); return i; }
const unlocking = () => PF.chests.find(c => c && c.state === 'unlocking' && Date.now() < c.end);
function chestState(ch) { if (!ch) return 'empty'; if (ch.state === 'unlocking') return Date.now() >= ch.end ? 'ready' : 'unlocking'; return CHESTS[ch.type].time === 0 ? 'ready' : 'locked'; }
function startUnlock(i) { const ch = PF.chests[i]; if (!ch || chestState(ch) !== 'locked' || unlocking()) return false; ch.state = 'unlocking'; ch.end = Date.now() + CHESTS[ch.type].time * 1000; saveP(); return true; }
function gemCost(ch) { const rem = ch.state === 'unlocking' ? ch.end - Date.now() : CHESTS[ch.type].time * 1000; return Math.max(1, Math.ceil(rem / 60000) * 3); }

function rollChest(type) {
  const C = CHESTS[type], ar = arenaIdx();
  const pool = CARDS.filter(c => CARD_ARENA[c.id] <= ar), byR = r => pool.filter(c => c.rar === r);
  const out = [], used = new Set();
  const take = (rar, n) => { const list = byR(rar).filter(c => !used.has(c.id)); if (!list.length || n <= 0) return 0; const c = pick(list); used.add(c.id); out.push({ id: c.id, n }); return n; };
  let left = C.cards;
  if (C.legend) left -= take('legendary', C.legend);
  if (C.epic) left -= take('epic', C.epic);
  for (let s = out.length; s < C.stacks && left > 0; s++) {
    const roll = Math.random(), rar = roll < 0.012 * (1 + ar * 0.3) ? 'legendary' : roll < 0.08 ? 'epic' : roll < 0.3 ? 'rare' : 'common';
    const n = rar === 'common' ? Math.ceil(left * 0.6) : rar === 'rare' ? Math.max(1, Math.ceil(left * 0.25)) : 1;
    left -= take(rar, Math.min(n, left)) || take('common', Math.min(n, left));
  }
  if (left > 0 && out.length) out[0].n += left;
  return { type, gold: Math.round(C.gold[0] + Math.random() * (C.gold[1] - C.gold[0])) * (1 + ar * 0.15) | 0, cards: out.sort((a, b) => rarOrder(BY_ID[a.id].rar) - rarOrder(BY_ID[b.id].rar)), gems: type === 'magic' || type === 'legend' ? 10 : 0 };
}
const rarOrder = r => ['common', 'rare', 'epic', 'legendary'].indexOf(r);
function applyReward(r) {
  PF.gold += r.gold || 0; PF.gems += r.gems || 0;
  (r.cards || []).forEach(o => {
    if (!PF.cards[o.id]) { PF.cards[o.id] = { lvl: 1, n: o.n - 1 }; o.isNew = true; PF.newCards.push(o.id); }
    else PF.cards[o.id].n += o.n;
  });
  saveP();
}
function openChestAt(i) { const ch = PF.chests[i]; if (!ch || chestState(ch) !== 'ready') return null; PF.chests[i] = null; const r = rollChest(ch.type); applyReward(r); return r; }
function speedUp(i) { const ch = PF.chests[i]; if (!ch) return null; const g = gemCost(ch); if (PF.gems < g) return null; PF.gems -= g; ch.state = 'unlocking'; ch.end = Date.now() - 1; saveP(); return openChestAt(i); }
const freeReady = () => Date.now() >= PF.freeAt;
function openFree() { if (!freeReady()) return null; PF.freeAt = Date.now() + FREE_EVERY; const r = rollChest('free'); applyReward(r); return r; }
function openCrown() { if (PF.crowns < 10) return null; PF.crowns -= 10; const r = rollChest('crown'); r.gems = 5; applyReward(r); return r; }

// ---------- Mağaza ----------
function shopOffers() {
  if (!PF.shop || Date.now() >= PF.shop.until || new Set(PF.shop.offers.map(o => o.id)).size !== PF.shop.offers.length) {   // aynı kart iki kez çıkmasın
    const ar = arenaIdx(), pool = CARDS.filter(c => CARD_ARENA[c.id] <= ar && owned(c.id));
    const used = new Set(), mk = r => { const l = pool.filter(c => c.rar === r && !used.has(c.id)); if (!l.length) return null; const c = pick(l); used.add(c.id); const amt = { common: 20, rare: 5, epic: 1, legendary: 1 }[r], cost = { common: 60, rare: 120, epic: 500, legendary: 2500 }[r]; return { id: c.id, n: amt, cost, sold: false }; };
    PF.shop = { until: Date.now() + SHOP_EVERY, offers: [mk('common'), mk('rare'), mk(Math.random() < 0.6 ? 'epic' : 'legendary') || mk('rare')].filter(Boolean), gemsTaken: false };
    saveP();
  }
  return PF.shop;
}
function buyOffer(k) { const o = PF.shop.offers[k]; if (!o || o.sold || PF.gold < o.cost) return false; PF.gold -= o.cost; o.sold = true; applyReward({ cards: [{ id: o.id, n: o.n }] }); return true; }
const CHEST_PRICES = { gold: 60, magic: 180, legend: 500 };
function buyChest(type) { if (PF.gems < CHEST_PRICES[type]) return null; PF.gems -= CHEST_PRICES[type]; const r = rollChest(type); applyReward(r); return r; }

// ---------- Maç sonucu ----------
function battleReward(win, myCrowns, oppTr) {
  const before = PF.trophies, ar = arenaIdx();
  let dt = 0;
  if (win === 1) dt = Math.round(clamp(30 + (oppTr - PF.trophies) / 12, 22, 38));
  else if (win === 0) dt = -Math.round(clamp(28 - (oppTr - PF.trophies) / 12, 18, 34));
  PF.trophies = Math.max(ar >= 1 ? ARENAS[ar].tr : 0, PF.trophies + dt);   // arena tabanının altına düşmez
  dt = PF.trophies - before;
  PF.best = Math.max(PF.best, PF.trophies);
  const gold = win === 1 ? 10 + ar * 6 + myCrowns * 2 : 0;
  PF.gold += gold;
  let chest = null;
  if (win === 1) { const type = CHEST_CYCLE[PF.cycle % CHEST_CYCLE.length]; if (grantChest(type) >= 0) { chest = type; PF.cycle++; } }
  PF.crowns = Math.min(10, PF.crowns + myCrowns);
  const tierBefore = passTier(); PF.pass.crowns += myCrowns; const passUp = passTier() > tierBefore;
  if (win === 1) PF.stats.w++; else if (win === 0) PF.stats.l++; else PF.stats.d++;
  if (win === 1 && myCrowns === 3) PF.stats.three++;
  const newArena = arenaIdx() > ar;
  saveP();
  return { dt, gold, chest, newArena, arena: arenaIdx(), passCr: myCrowns, passUp };
}
function roadClaimable(k) { return PF.best >= ROAD[k].tr && !PF.road.includes(k); }
function claimRoad(k) {
  if (!roadClaimable(k)) return null; const R = ROAD[k]; PF.road.push(k);
  let r = { gold: R.gold || 0, gems: R.gems || 0, cards: [] };
  if (R.chest) { const c = rollChest(R.chest); r = { type: R.chest, gold: c.gold, gems: c.gems, cards: c.cards }; }
  if (R.cards) { const pool = CARDS.filter(c => owned(c.id) && c.rar === R.cards), any = CARDS.filter(c => owned(c.id)), c = pick(pool.length ? pool : any); r.cards = [{ id: c.id, n: R.n }]; r.type = 'silver'; }
  if (R.emote && !PF.emotes.includes(R.emote)) { PF.emotes.push(R.emote); r.emote = R.emote; }
  applyReward(r); return r;
}
// Bot rakibin destesi: arenasındaki kartlardan, oyuncunun seviyesine yakın
function botDeck(ar) {
  const pool = CARDS.filter(c => CARD_ARENA[c.id] <= ar);
  for (let tries = 0; tries < 40; tries++) {
    const d = shuffle(pool.map(c => c.id)).slice(0, 8);
    const roles = d.map(id => cardRole(BY_ID[id]));
    const spells = roles.filter(r => r === 'spell').length, air = d.some(id => BY_ID[id].air || (BY_ID[id].type === 'spell')), win = roles.includes('wincon') || roles.includes('tank');
    if (spells >= 1 && spells <= 2 && air && win) return d;
  }
  return shuffle(pool.map(c => c.id)).slice(0, 8);
}

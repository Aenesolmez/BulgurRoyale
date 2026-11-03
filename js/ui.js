// ================= Arayüz: ana sayfa sekmeleri, kart detay, sandık açma, mağaza, kupa yolu, arkadaş =================
let TAB = 'battle', SWAP = null;
function toast(msg, ms = 2200) { const t = $('toast'); t.innerHTML = msg; t.classList.remove('on'); void t.offsetWidth; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), ms); }
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  document.body.classList.toggle('ingame', id === 'game');
  if (id === 'hub') playMusic('menu');
  layoutAll();
}
function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }

// ---------- Kart görünümü ----------
function cardHTML(id, o = {}) {
  const c = BY_ID[id], lv = o.lvl ?? (owned(id) ? cardLvl(id) : 0);
  const gem = o.gem ? `<div class="gem ${o.gem}"></div>` : '';
  const pips = o.pips ? `<div class="evoPips">${Array.from({ length: o.pips[1] }, (_, i) => `<i class="${i < o.pips[0] ? 'on' : ''}"></i>`).join('')}</div>` : '';
  const ch = o.champ && c.champ;
  return `<div class="card ${c.rar} ${o.cls || ''} ${ch ? 'chCard' : ''}" data-id="${id}"><img src="${cardImg(ch ? c.champ.img : id)}">${ch ? '<div class="chCrown">👑</div>' : ''}<div class="cost"><span class="ts">${c.cost}</span></div>${gem}${pips}${o.isNew ? '<div class="new ts">YENİ</div>' : ''}${lv ? `<div class="lvl ts">Seviye ${lv}</div>` : ''}</div>`;
}
function progHTML(id) {
  const u = upgradeInfo(id); if (!u) return '';
  if (u.max) return `<div class="prog up"><i style="width:100%"></i><span class="ts">MAKS</span></div>`;
  return `<div class="prog ${u.ready ? 'up' : ''}"><i style="width:${Math.min(100, u.n / u.need * 100)}%"></i><span class="ts">${u.n}/${u.need}${u.ready ? ' ⬆' : ''}</span></div>`;
}

// ---------- Üst çubuk ----------
function refreshTop() {
  $('klNum').textContent = PF.kl; $('pName').textContent = PF.name;
  const need = KING_NEED[PF.kl - 1]; $('xpFill').style.width = need ? Math.min(100, PF.kxp / need * 100) + '%' : '100%'; $('xpTxt').textContent = need ? `${PF.kxp}/${need}` : 'MAKS';
  $('goldTxt').textContent = fmtNum(PF.gold); $('gemTxt').textContent = fmtNum(PF.gems);
  const upg = PF.decks[PF.cur].some(id => upgradeInfo(id)?.ok) || PF.newCards.length, nb = document.querySelector('#nav [data-t="cards"]');
  nb.querySelector('.dot')?.remove(); if (upg) nb.insertAdjacentHTML('afterbegin', '<span class="dot"></span>');
  const rb = document.querySelector('#nav [data-t="road"]'); rb.querySelector('.dot')?.remove(); if (ROAD.some((r, k) => roadClaimable(k))) rb.insertAdjacentHTML('afterbegin', '<span class="dot"></span>');
}
function setTab(t) {
  TAB = t; SWAP = null;
  document.querySelectorAll('#nav b').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  document.querySelectorAll('.tab').forEach(d => d.classList.toggle('active', d.id === 'tab-' + t));
  renderTab(); sfx('click');
}
document.querySelectorAll('#nav b').forEach(b => { b.onclick = () => setTab(b.dataset.t); });
document.querySelectorAll('[data-go]').forEach(b => { b.onclick = () => setTab(b.dataset.go); });
function renderTab() { refreshTop(); ({ battle: renderBattle, cards: renderCards, shop: renderShop, social: renderSocial, road: renderRoad })[TAB](); }

// ---------- Savaş sekmesi (Clash Royale lobisi düzeni) ----------
function chestIco(type) { const C = CHESTS[type]; return `<div class="chestIco" style="--c1:${C.col};--c2:${C.col2}"><i></i></div>`; }
function renderBattle() {
  const T = $('tab-battle'), ar = arenaIdx(), A = ARENAS[ar], nx = ARENAS[ar + 1], d0 = curDeck()[0];
  const prog = nx ? clamp((PF.trophies - A.tr) / (nx.tr - A.tr), 0, 1) : 1;
  T.innerHTML = `
    <div class="bBanner ts"><div class="bAv"><img src="${cardImg(KING_IMG)}"></div><div class="bInfo"><div class="bName">${PF.name}</div><div class="bSub">${curMode().id === 'ladder' ? 'Arena ' + (ar + 1) + ': ' + A.name : '🎉 Parti Arenası'}</div></div><div class="bTr"><i class="cup">🏆</i>${PF.trophies}</div></div>
    <div class="passBar ts" id="passGo"><div class="pbCrown">👑</div><div class="pbIn"><b>Pass Royale${PF.pass.prem ? ' <i class="pbP">PREMIUM</i>' : ''}</b><div class="apBar"><i style="width:${passTier() >= PASS_TIERS ? 100 : (PF.pass.crowns % PASS_CROWNS) / PASS_CROWNS * 100}%"></i><span>${passTier() >= PASS_TIERS ? 'Şanslı Döngü' : (PF.pass.crowns % PASS_CROWNS) + ' / ' + PASS_CROWNS + ' 👑'}</span></div></div><div class="pbTier">${passTier()}</div>${passAny() ? '<span class="dot"></span>' : ''}</div>
    <div class="bMid">
      <div class="sideCol"><div class="rbtn ts" id="btnTrain"><span>🎯</span><i>Antrenman</i></div><div class="rbtn ts" id="btnDiff"><span>${['😊', '😐', '😈', '🧠'][PF.diff]}</span><i>${['Kolay', 'Normal', 'Zor', 'Esporcu'][PF.diff]}</i></div></div>
      <div class="arenaStage"><canvas id="arenaPrev"></canvas></div>
      <div class="sideCol"><div class="rbtn ts" id="freeBox"><span>🎁</span><i id="freeTxt"></i></div><div class="rbtn ts" id="crownBox"><span>👑</span><i>${PF.crowns}/10</i></div></div>
    </div>
    <div class="arenaProg ts"><i class="cup">🏆</i><div class="apBar"><i style="width:${prog * 100}%"></i><span>${nx ? PF.trophies + ' / ' + nx.tr : 'MAKS'}</span></div>${nx ? `<span class="apNext">Arena ${ar + 2}</span>` : ''}</div>
    <div class="chestTray"><div class="chests" id="chestSlots"></div></div>
    <div class="battleBar">
      <div class="deckBtn" id="btnDeckGo">${cardHTML(d0, { lvl: 0 })}<b class="ts">${PF.cur + 1}</b></div>
      <div class="battleMid"><div class="modePick ts ${curMode().id === 'ladder' ? '' : 'party'}" id="modePick">${curMode().i} ${curMode().n} <b>▾</b></div><button class="btn bigBtn" id="btnBattle">SAVAŞ<small>${curMode().id === 'ladder' ? '🏆 Kupa maçı' : '🎉 Parti Arenası'}</small></button></div>
      <div class="roadBtn" id="btnRoadGo"><i class="cup">🏆</i></div>
    </div>`;
  const MD = curMode(); drawArenaPreview($('arenaPrev'), MD.id === 'ladder' ? ar : 'party');
  $('btnBattle').onclick = () => { sfx('click'); if (curMode().id === 'ladder') startLadder(); else startMode(curMode().id); };
  $('modePick').onclick = () => { sfx('click'); modesScreen(); };
  $('passGo').onclick = () => { sfx('click'); passScreen(); };
  $('btnTrain').onclick = () => { sfx('click'); startTraining(); };
  $('btnDiff').onclick = () => { PF.diff = (PF.diff + 1) % 4; if (PF.diff === 3) toast('🧠 Esporcu: kusursuz oynar, seni analiz eder. Bol şans!'); saveP(); renderBattle(); sfx('click'); };
  $('btnDeckGo').onclick = () => setTab('cards');
  $('btnRoadGo').onclick = () => setTab('road');
  $('freeBox').onclick = () => { const r = openFree(); if (r) chestOpen(r); else { sfx('nope'); toast('Bedava sandık ' + fmtTime(PF.freeAt - Date.now()) + ' sonra hazır'); } };
  $('crownBox').onclick = () => { const r = openCrown(); if (r) chestOpen(r); else { sfx('nope'); toast('Taç sandığı için 10 taç topla (' + PF.crowns + '/10)'); } };
  renderSlots(); refreshTimers();
}
// Arena dioraması: havada duran taş platform, üstünde kuleler ve hazine
function drawArenaPreview(c, ar) {
  const A = arenaOf(ar), d = Math.min(2, devicePixelRatio || 1), w = c.clientWidth || 300, h = c.clientHeight || 220;
  c.width = w * d; c.height = h * d; const g = c.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
  const cx = w / 2, top = h * 0.1, pw = Math.min(w * 0.92, h * 1.05), ph = h * 0.6, dep = h * 0.09;
  const P2 = (u, v) => [cx + (u - 0.5) * pw * (0.74 + 0.26 * v), top + v * ph];
  const poly = (pts, fill) => { g.fillStyle = fill; g.beginPath(); pts.forEach((p, i) => { const q = P2(p[0], p[1]); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); g.fill(); };
  // gölge ve parıltı
  const glow = g.createRadialGradient(cx, top + ph * 0.6, 10, cx, top + ph * 0.6, pw * 0.75); glow.addColorStop(0, '#ffffff35'); glow.addColorStop(1, '#ffffff00'); g.fillStyle = glow; g.fillRect(0, 0, w, h);
  g.fillStyle = '#00000045'; g.beginPath(); g.ellipse(cx, top + ph + dep + 10, pw * 0.55, 14, 0, 0, 7); g.fill();
  // platformun ön ve yan yüzü (taş)
  const [lx, ly] = P2(0, 1), [rx, ry] = P2(1, 1), [lx0, ly0] = P2(0, 0), [rx0, ry0] = P2(1, 0);
  const sg = g.createLinearGradient(0, ly, 0, ly + dep); sg.addColorStop(0, shade(A.rim, 25)); sg.addColorStop(1, shade(A.rim, -25));
  g.fillStyle = sg; g.beginPath(); g.moveTo(lx, ly); g.lineTo(rx, ry); g.lineTo(rx, ry + dep); g.lineTo(lx, ly + dep); g.closePath(); g.fill();
  g.fillStyle = shade(A.rim, -10); g.beginPath(); g.moveTo(lx0, ly0); g.lineTo(lx, ly); g.lineTo(lx, ly + dep); g.lineTo(lx0, ly0 + dep * 0.4); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(rx0, ry0); g.lineTo(rx, ry); g.lineTo(rx, ry + dep); g.lineTo(rx0, ry0 + dep * 0.4); g.closePath(); g.fill();
  g.strokeStyle = '#00000040'; g.lineWidth = 1.5; for (let i = 1; i < 6; i++) { const x = lerp(lx, rx, i / 6); g.beginPath(); g.moveTo(x, ly); g.lineTo(x, ly + dep); g.stroke(); }
  // üst yüz: çimen, yollar, nehir, köprüler
  poly([[-0.02, -0.02], [1.02, -0.02], [1.02, 1.02], [-0.02, 1.02]], shade(A.rim, 10));
  for (let i = 0; i < 9; i++) for (let j = 0; j < 12; j++) poly([[i / 9, j / 12], [(i + 1) / 9, j / 12], [(i + 1) / 9, (j + 1) / 12], [i / 9, (j + 1) / 12]], (i + j) % 2 ? A.g[0] : A.g[1]);
  [0.2, 0.8].forEach(x => poly([[x - 0.045, 0.16], [x + 0.045, 0.16], [x + 0.045, 0.84], [x - 0.045, 0.84]], A.path));
  poly([[0.2, 0.15], [0.8, 0.15], [0.8, 0.2], [0.2, 0.2]], A.path); poly([[0.2, 0.8], [0.8, 0.8], [0.8, 0.85], [0.2, 0.85]], A.path);
  poly([[0, 0.46], [1, 0.46], [1, 0.54], [0, 0.54]], A.water); poly([[0, 0.48], [1, 0.48], [1, 0.5], [0, 0.5]], shade(A.water, 25));
  [0.2, 0.8].forEach(x => poly([[x - 0.065, 0.44], [x + 0.065, 0.44], [x + 0.065, 0.56], [x - 0.065, 0.56]], '#a8743d'));
  // kuleler
  const tower = (u, v, s, col, king) => {
    const [X, Y] = P2(u, v), k = (0.74 + 0.26 * v) * s * pw / 300, r = 15 * k, ht = (king ? 30 : 24) * k;
    g.fillStyle = '#0005'; g.beginPath(); g.ellipse(X, Y + 3, r * 1.2, r * 0.45, 0, 0, 7); g.fill();
    const tg = g.createLinearGradient(X - r, 0, X + r, 0); tg.addColorStop(0, '#7d7369'); tg.addColorStop(0.4, '#c8beb3'); tg.addColorStop(1, '#6b6158');
    g.fillStyle = tg; g.fillRect(X - r, Y - ht, r * 2, ht); g.beginPath(); g.ellipse(X, Y, r, r * 0.4, 0, 0, Math.PI); g.fill();
    g.fillStyle = col; g.fillRect(X - r * 0.35, Y - ht * 0.85, r * 0.7, ht * 0.5);
    g.fillStyle = '#ddd3c7'; g.beginPath(); g.ellipse(X, Y - ht, r, r * 0.4, 0, 0, 7); g.fill();
    g.fillStyle = '#9a9087'; for (let i = 0; i < 6; i++) { const a = Math.PI + i * Math.PI / 5; g.fillRect(X + Math.cos(a) * r * 0.85 - 2.5 * k, Y - ht - 5 * k + Math.sin(a) * r * 0.3, 5 * k, 5 * k); }
    if (king) { g.fillStyle = '#ffd447'; g.beginPath(); g.moveTo(X - 7 * k, Y - ht - 6 * k); g.lineTo(X - 7 * k, Y - ht - 14 * k); g.lineTo(X - 3 * k, Y - ht - 10 * k); g.lineTo(X, Y - ht - 16 * k); g.lineTo(X + 3 * k, Y - ht - 10 * k); g.lineTo(X + 7 * k, Y - ht - 14 * k); g.lineTo(X + 7 * k, Y - ht - 6 * k); g.closePath(); g.fill(); }
  };
  tower(0.5, 0.06, 1.2, '#d63a3a', true); tower(0.2, 0.2, 1, '#d63a3a'); tower(0.8, 0.2, 1, '#d63a3a');
  tower(0.2, 0.8, 1, '#2a73e0'); tower(0.8, 0.8, 1, '#2a73e0'); tower(0.5, 0.95, 1.2, '#2a73e0', true);
  // ön kenarda altın ve elmas yığını
  for (let i = 0; i < 26; i++) { const u = hsh(i, 1) * 0.9 + 0.05, x = lerp(lx, rx, u), y = ly + dep * 0.25 + hsh(i, 2) * dep * 0.5, gem = i % 7 === 0;
    g.fillStyle = gem ? '#3fe05a' : '#ffc21f'; g.strokeStyle = gem ? '#0e7a1c' : '#8a5a00'; g.lineWidth = 1.2; g.beginPath(); gem ? (g.moveTo(x, y - 5), g.lineTo(x + 4, y), g.lineTo(x, y + 5), g.lineTo(x - 4, y)) : g.ellipse(x, y, 5, 3.5, 0, 0, 7); g.closePath(); g.fill(); g.stroke(); }
}

// ---------- Kartlar: dokun -> 2 düğme (Yükselt/Bilgi + Seç), basılı tutup sürükle -> yer değiştir ----------
let SWAP_FROM = -1, CDRAG = null;
function closeActions() { document.querySelectorAll('.cardAct').forEach(p => p.remove()); document.querySelectorAll('.cw.act').forEach(c => c.classList.remove('act')); }
function deckSwap(fromSlot, fromId, toSlot) {
  const dk = curDeck();
  if (fromSlot >= 0) { const t = dk[toSlot]; dk[toSlot] = dk[fromSlot]; dk[fromSlot] = t; }
  else { const j = dk.indexOf(fromId); if (j >= 0) dk[j] = dk[toSlot]; dk[toSlot] = fromId; }
  saveP(); sfx('upgrade');
}
function cardActions(el, id, slot) {
  const T = $('tab-cards'), open = el.classList.contains('act');
  closeActions(); if (open) return;
  const own = owned(id), u = own ? upgradeInfo(id) : null, canUp = u && !u.max && u.ready;
  el.classList.add('act');
  const pop = document.createElement('div'); pop.className = 'cardAct';
  pop.innerHTML = `<div class="caName ts">${BY_ID[id].name}</div><button class="btn ${canUp ? 'green' : 'blue'} sm" data-a="info">${canUp ? '⬆ Yükselt' : 'ℹ Bilgi'}</button>${own ? `<button class="btn sm" data-a="use">${slot >= 0 ? '⇄ Taşı' : '✚ Seç'}</button>` : ''}`;
  const r = el.getBoundingClientRect(), tr = T.getBoundingClientRect();
  pop.style.left = Math.max(4, Math.min(r.left - tr.left, tr.width - 150)) + 'px'; pop.style.top = (r.bottom - tr.top + T.scrollTop - 4) + 'px';
  T.appendChild(pop);
  pop.querySelector('[data-a="info"]').onclick = ev => { ev.stopPropagation(); closeActions(); sfx('click'); cardModal(id, slot, 0); };
  const use = pop.querySelector('[data-a="use"]'); if (use) use.onclick = ev => { ev.stopPropagation(); SWAP = id; SWAP_FROM = slot; closeActions(); sfx('click'); renderCards(); };
  sfx('card');
}
function cardTap(el, id, slot) {
  if (PF.newCards.includes(id)) { PF.newCards = PF.newCards.filter(x => x !== id); saveP(); }
  if (SWAP) {
    if (slot >= 0) { deckSwap(SWAP_FROM, SWAP, slot); SWAP = null; SWAP_FROM = -1; renderCards(); return; }
    if (SWAP_FROM >= 0 && owned(id)) { deckSwap(-1, id, SWAP_FROM); SWAP = null; SWAP_FROM = -1; renderCards(); return; }
    if (owned(id)) { SWAP = id; SWAP_FROM = -1; renderCards(); return; }
  }
  cardActions(el, id, slot);
}
function bindCardInteractions(T) {
  T.querySelectorAll('.deckGrid .cw, .coll .cw').forEach(el => {
    const slot = el.dataset.slot !== undefined ? +el.dataset.slot : -1, id = slot >= 0 ? curDeck()[slot] : el.dataset.id;
    el.addEventListener('pointerdown', ev => {
      if (ev.button > 0) return;
      CDRAG = { el, id, slot, x: ev.clientX, y: ev.clientY, ghost: null, timer: setTimeout(() => { if (CDRAG && !CDRAG.ghost && owned(id)) beginCardDrag(CDRAG.x, CDRAG.y); }, 320) };
    });
  });
  T.onclick = ev => { if (!ev.target.closest('.cw') && !ev.target.closest('.cardAct')) closeActions(); };
}
function beginCardDrag(x, y) {
  const g = CDRAG.el.querySelector('.card').cloneNode(true); g.classList.add('dragGhost'); g.style.width = CDRAG.el.offsetWidth + 'px';
  document.body.appendChild(g); document.body.classList.add('cdrag'); CDRAG.ghost = g; moveGhost(x, y); closeActions(); CDRAG.el.classList.add('dragSrc'); sfx('card');
}
function moveGhost(x, y) {
  const g = CDRAG.ghost; g.style.left = x + 'px'; g.style.top = y + 'px';
  document.querySelectorAll('.deckGrid .cw.dropT').forEach(c => c.classList.remove('dropT'));
  g.style.display = 'none'; const t = document.elementFromPoint(x, y); g.style.display = '';
  const cw = t && t.closest('.deckGrid .cw'); if (cw) cw.classList.add('dropT');
}
addEventListener('pointermove', ev => {
  if (!CDRAG) return;
  if (!CDRAG.ghost) {
    if (Math.hypot(ev.clientX - CDRAG.x, ev.clientY - CDRAG.y) < 10) return;
    if ((ev.pointerType === 'mouse' || CDRAG.slot >= 0) && owned(CDRAG.id)) beginCardDrag(ev.clientX, ev.clientY);
    else { clearTimeout(CDRAG.timer); CDRAG = null; return; }   // dokunmatikte koleksiyonda kaydırma
  }
  moveGhost(ev.clientX, ev.clientY);
});
addEventListener('pointerup', ev => {
  if (!CDRAG) return;
  clearTimeout(CDRAG.timer); const d = CDRAG; CDRAG = null; document.body.classList.remove('cdrag');
  if (d.ghost) {
    d.ghost.style.display = 'none'; const t = document.elementFromPoint(ev.clientX, ev.clientY); d.ghost.remove();
    const cw = t && t.closest('.deckGrid .cw');
    if (cw && +cw.dataset.slot !== d.slot) deckSwap(d.slot, d.id, +cw.dataset.slot);
    renderCards(); return;
  }
  cardTap(d.el, d.id, d.slot);
});
document.addEventListener('touchmove', e => { if (CDRAG && (CDRAG.ghost || CDRAG.slot >= 0)) e.preventDefault(); }, { passive: false });   // kart sürüklenirken sayfa kaymasın
addEventListener('pointercancel', () => { document.body.classList.remove('cdrag'); if (CDRAG) { clearTimeout(CDRAG.timer); if (CDRAG.ghost) { CDRAG.ghost.remove(); renderCards(); } CDRAG = null; } });

function renderSlots() {
  const box = $('chestSlots'); if (!box) return;
  box.innerHTML = '';
  PF.chests.forEach((ch, i) => {
    const st = chestState(ch), d = el(`<div class="slot ${ch ? 'full' : ''} ${st === 'ready' ? 'ready' : ''} ts">${ch ? chestIco(ch.type) : '<span class="muted">Boş yuva</span>'}<div class="st" data-i="${i}"></div></div>`);
    d.onclick = () => chestSlotClick(i);
    box.appendChild(d);
  });
  refreshTimers();
}
function refreshTimers() {
  document.querySelectorAll('#chestSlots .st').forEach(s => {
    const ch = PF.chests[+s.dataset.i], st = chestState(ch);
    s.textContent = !ch ? '' : st === 'ready' ? 'AÇ!' : st === 'unlocking' ? fmtTime(ch.end - Date.now()) : (CHESTS[ch.type].n.split(' ')[0] + ' · ' + fmtTime(CHESTS[ch.type].time * 1000));
    if (st === 'ready' && !s.parentNode.classList.contains('ready')) s.parentNode.classList.add('ready');
  });
  const ft = $('freeTxt'); if (ft) ft.textContent = freeReady() ? 'HAZIR! Dokun' : fmtTime(PF.freeAt - Date.now());
}
setInterval(() => { if ($('hub').classList.contains('active') && TAB === 'battle') refreshTimers(); if (TAB === 'shop' && $('hub').classList.contains('active')) { const s = $('shopT'); if (s && PF.shop) s.textContent = fmtTime(PF.shop.until - Date.now()); } }, 1000);
function chestSlotClick(i) {
  const ch = PF.chests[i]; if (!ch) return;
  const st = chestState(ch);
  if (st === 'ready') { const r = openChestAt(i); if (r) chestOpen(r); return; }
  const C = CHESTS[ch.type], g = gemCost(ch);
  modal(`<div class="ts" style="text-align:center"><div class="ttl">${C.n}</div><div style="display:flex;justify-content:center;margin:10px 0"><div style="width:130px;height:105px">${chestIco(ch.type)}</div></div>
    <div class="muted">~${C.cards} kart · ${C.gold[0]}-${C.gold[1]} altın${C.epic ? ' · en az ' + C.epic + ' destansı' : ''}${C.legend ? ' · 1 efsanevi' : ''}</div><br>
    <div class="mbtns">${st === 'locked' ? `<button class="btn green" id="mUnlock" ${unlocking() ? 'disabled' : ''}>Aç: ${fmtTime(C.time * 1000)}</button>` : ''}<button class="btn" id="mGem"><i class="gemI"></i> ${g} ile hemen aç</button></div>
    ${unlocking() && st === 'locked' ? '<div class="muted" style="margin-top:8px">Aynı anda tek sandık açılabilir.</div>' : ''}</div>`);
  const u = $('mUnlock'); if (u) u.onclick = () => { if (startUnlock(i)) { sfx('click'); closeModal(); renderSlots(); } };
  $('mGem').onclick = () => { const r = speedUp(i); if (r) { closeModal(); chestOpen(r); } else { sfx('nope'); toast('Yeterli elmas yok'); } };
}
// ---------- Kartlar sekmesi: alt sekmeler + emoji destesi ----------
let CSUB = 'cards', EMO_SEL = -1;
function subTabsHTML() { return `<div class="subTabs">${[['cards', '🃏 Kartlar'], ['emo', '😂 Emojiler'], ['tower', '🏰 Kule']].map(([k, t]) => `<b class="ts ${CSUB === k ? 'on' : ''}" data-s="${k}">${t}</b>`).join('')}</div>`; }
function bindSubTabs(T) { T.querySelectorAll('.subTabs b').forEach(b => { b.onclick = () => { CSUB = b.dataset.s; EMO_SEL = -1; SWAP = null; sfx('click'); renderCards(); }; }); }
function emoTileHTML(id, o = {}) { const em = EMOTE_BY[id], own = PF.emotes.includes(id); return `<div class="emoTile ${own ? '' : 'locked'} ${o.sel ? 'sel' : ''}" data-e="${id}"><img class="head" src="${cardImg(em.img)}" style="height:${Math.round(60 / headNeck(em.img))}%"><span>${em.e}</span>${own ? `<div class="nm2 ts">${em.name}</div>` : `<div class="pr ts">${em.price ? '<i class="gemI"></i> ' + em.price : em.pass ? '👑 Pass' : '🏆 Yol'}</div>`}</div>`; }
function previewEmoSound(id) { const em = EMOTE_BY[id]; if (em) em.s.forEach(([d, p, du]) => setTimeout(() => { sndBudget = 3; lastFart = 0; fart(p, du, 0.4); }, d)); }
function buyEmoteModal(id) {
  const em = EMOTE_BY[id];
  modal(`<div class="ts" style="text-align:center"><div class="ttl">${em.name}</div><div style="display:flex;justify-content:center"><div style="width:120px">${emoTileHTML(id)}</div></div><br>
    <div class="mbtns">${em.price ? `<button class="btn green" id="eBuy"><i class="gemI"></i> ${em.price} Satın al</button>` : '<div class="muted">Kupa yolundan kazanılır</div>'}</div></div>`);
  const b = $('eBuy'); if (b) b.onclick = () => { if (buyEmote(id)) { sfx('upgrade'); toast(`😂 Yeni emoji: ${em.name}`); closeModal(); renderTab(); } else { sfx('nope'); toast('Yeterli elmas yok'); } };
}
function renderEmoTab() {
  const T = $('tab-cards');
  T.innerHTML = `${subTabsHTML()}<div class="panel ts"><div class="ttl">Emoji destem</div><div class="muted">Bir slota dokun, sonra aşağıdan emoji seç. Savaşta 😂 düğmesi (ya da E) ile at.</div>
      <div class="emoDeck">${PF.emoDeck.map((id, i) => `<div data-slot="${i}">${emoTileHTML(id, { sel: EMO_SEL === i })}</div>`).join('')}</div></div>
    <div class="ttl ts">Koleksiyon (${PF.emotes.length}/${EMOTE_LIST.length})</div><div class="emoCol">${EMOTE_LIST.map(e => emoTileHTML(e.id)).join('')}</div>`;
  bindSubTabs(T);
  T.querySelectorAll('.emoDeck [data-slot]').forEach(d => { d.onclick = () => { const i = +d.dataset.slot; EMO_SEL = EMO_SEL === i ? -1 : i; previewEmoSound(PF.emoDeck[i]); renderEmoTab(); }; });
  T.querySelectorAll('.emoCol .emoTile').forEach(d => { d.onclick = () => {
    const id = d.dataset.e; previewEmoSound(id);
    if (!PF.emotes.includes(id)) return buyEmoteModal(id);
    if (EMO_SEL < 0) { toast('Önce yukarıdan bir slot seç'); return; }
    const j = PF.emoDeck.indexOf(id); if (j >= 0) PF.emoDeck[j] = PF.emoDeck[EMO_SEL]; PF.emoDeck[EMO_SEL] = id; EMO_SEL = -1; saveP(); sfx('upgrade'); renderEmoTab();
  }; });
}

// ---------- Kartlar sekmesi (deste + koleksiyon) ----------
function renderCards() {
  const T = $('tab-cards'), deck = curDeck();
  const cw = (id, i) => `<div class="cw" style="grid-column:${i % 4 + 1};grid-row:${(i / 4 | 0) + 1}" data-slot="${i}">${cardHTML(id, { champ: i === 2, gem: i < 2 ? 'evo on' : 'norm', cls: (i < 2 ? 'evo ' : i === 2 ? 'champS ' + (isChamp(id) ? 'isCh ' : '') : '') + (SWAP ? 'swapT' : '') })}${progHTML(id)}</div>`;
  const ar = arenaIdx(), coll = CARDS.filter(c => !deck.includes(c.id)).sort((a, b) => (owned(b.id) - owned(a.id)) || a.cost - b.cost || rarOrder(a.rar) - rarOrder(b.rar));
  if (CSUB === 'emo') return renderEmoTab();
  if (CSUB === 'tower') return renderSkinTab();
  T.innerHTML = `${subTabsHTML()}
    ${SWAP ? `<div class="swapBar">Desteye koymak için bir karta dokun: <b>${BY_ID[SWAP].name}</b><button class="btn red sm" id="swapX">İptal</button></div>` : ''}
    <div class="panel"><div class="deckTabs">${[0, 1, 2].map(k => `<b class="ts ${k === PF.cur ? 'on' : ''}" data-d="${k}">Deste ${k + 1}</b>`).join('')}</div>
      <div class="deckGrid"><div class="evoZone ts"></div><div class="champZone ts"></div>${deck.map(cw).join('')}</div>
      <div class="deckBar ts"><span>💧 Ort. maliyet: ${avgCost(deck).toFixed(1)}</span><span class="muted">1-2: evrim · 3: şampiyon</span></div></div>
    <div class="ttl ts">Koleksiyon (${Object.keys(PF.cards).length}/${CARDS.length})</div>
    <div class="coll">${coll.map(c => `<div class="cw" data-id="${c.id}">${cardHTML(c.id, { cls: owned(c.id) ? '' : 'locked', isNew: PF.newCards.includes(c.id) })}${owned(c.id) ? progHTML(c.id) : `<div class="muted" style="text-align:center;font-size:calc(var(--u)*10)">Arena ${CARD_ARENA[c.id] + 1}</div>`}</div>`).join('')}</div>`;
  bindSubTabs(T);
  T.querySelectorAll('.deckTabs b').forEach(b => { b.onclick = () => { PF.cur = +b.dataset.d; saveP(); sfx('click'); renderCards(); }; });
  bindCardInteractions(T);

  const sx = $('swapX'); if (sx) sx.onclick = () => { SWAP = null; renderCards(); };
  refreshTop();
}

// ---------- Kart detay penceresi ----------
function statRows(id, lvl, evo) {
  const c = BY_ID[id], m = levelMul(lvl), e = evo ? c.evo : null, mul = k => (e && e[k]) || 1, rows = [];
  const f = v => Math.round(v);
  if (c.type === 'spell') {
    if (c.dmg) rows.push(['Hasar', f(c.dmg * m * (c.waves || 1)) + (c.waves ? ` (${c.waves}x)` : ''), f(c.dmg * levelMul(lvl + 1) * (c.waves || 1))]);
    if (c.dps) rows.push(['Saniyede hasar', f(c.dps * m), f(c.dps * levelMul(lvl + 1))]);
    rows.push(['Kule hasarı', f((c.dmg || c.dps || 0) * m * (c.towerPct || 0.35) * (c.waves || 1))]);
    rows.push(['Alan', (c.radius || 0) + (e && e.radius || 0)]);
    if (c.stun) rows.push(['Sersemletme', (e && e.stun || c.stun) + ' sn']); if (c.freeze) rows.push(['Dondurma', (e && e.freeze || c.freeze) + ' sn']); if (c.dur) rows.push(['Süre', c.dur + ' sn']);
    return rows;
  }
  rows.push(['Can', f(c.hp * mul('hpm') * m), f(c.hp * mul('hpm') * levelMul(lvl + 1))]);
  if (c.dmg) { rows.push(['Hasar', f(c.dmg * mul('dmgm') * m), f(c.dmg * mul('dmgm') * levelMul(lvl + 1))]); rows.push(['Saldırı hızı', (c.hs * mul('hsm')).toFixed(1) + ' sn']); rows.push(['Saniyede hasar', f(c.dmg * mul('dmgm') * m / (c.hs * mul('hsm')))]); }
  if (c.type === 'troop') rows.push(['Hız', c.spd >= 1.7 ? 'Çok hızlı' : c.spd >= 1.3 ? 'Hızlı' : c.spd >= 0.95 ? 'Orta' : 'Yavaş']);
  if (c.dmg) rows.push(['Menzil', c.range < 1.2 ? 'Yakın dövüş' : c.range]);
  rows.push(['Hedef', c.target === 'buildings' ? 'Binalar' : c.air ? 'Hava ve yer' : 'Yer']);
  if (c.count) rows.push(['Sayı', 'x' + c.count]); if (c.splash) rows.push(['Alan hasarı', 'Var']); if (c.life) rows.push(['Ömür', c.life + ' sn']); if (c.flying) rows.push(['Tür', 'Uçan']);
  return rows;
}
// Kartın güçlü (yeşil) ve zayıf (kırmızı) yanları
const ROLE_TR = { spell: 'Büyü', defense: 'Savunma binası', spawner: 'Üretici bina', wincon: 'Kule koşucusu', tank: 'Tank', splash: 'Alan hasarı', swarm: 'Sürü', ranged: 'Menzilli', melee: 'Yakın dövüş' };
function proTags(c) {
  const t = [], good = s => t.push(`<span style="background:#a6ec5a">${s}</span>`), bad = s => t.push(`<span style="background:#ff9a8a">${s}</span>`), r = cardRole(c);
  good(ROLE_TR[r]);
  if (c.flying) good('Uçar'); if (c.air && c.type !== 'spell') good('Havayı vurur'); if (c.splash && r !== 'splash') good('Alan hasarı');
  if (c.spd >= 1.4) good('Hızlı'); if (c.ramp) good('Tank avcısı'); if (c.knock || c.spell === 'log') good('Geri iter'); if (c.stun || c.freeze || c.deployStun) good('Durdurur');
  if (c.type === 'troop' && !c.air && c.target !== 'buildings') bad('Uçanları vuramaz');
  if (c.type === 'building' && c.dmg && !c.air) bad('Uçanları vuramaz');
  if ((c.count || 1) >= 2 && c.hp < 500) bad('Büyülere zayıf');
  if (c.type === 'troop' && c.hp * (c.count || 1) < 400) bad('Kırılgan');
  if (c.spd && c.spd < 0.8) bad('Yavaş'); if (c.minRange) bad('Dibini vuramaz'); if (c.spell === 'log') bad('Uçanlara dokunmaz');
  if (c.towerPct) bad('Kuleye az hasar');
  return t.join('');
}
// Bu karta karşı iyi gelen kartlar (büyüler için: iyi gittiği kartlar)
function counterCards(id) {
  const c = BY_ID[id];
  if (c.type === 'spell') return CARDS.filter(x => x.id !== id && ['wincon', 'tank'].includes(cardRole(x))).sort((a, b) => a.cost - b.cost).slice(0, 4).map(x => x.id);
  const th = { flying: !!c.flying, swarm: (c.count || 1) >= 2 && c.hp < 500, tank: c.hp * (c.count || 1) >= 1800 || (c.type === 'building' && c.hp >= 1200), bOnly: c.target === 'buildings', ranged: (c.range || 0) >= 3 };
  const sc = x => {
    if (x.type === 'spell') { if (x.spell === 'log' && th.flying) return -1; return th.swarm ? 4 - x.cost * 0.3 : (c.hp * (c.count || 1) < 700 && x.dmg >= 200) ? 2.5 - x.cost * 0.2 : -1; }
    return counterScore(x, th);
  };
  return CARDS.filter(x => x.id !== id).map(x => ({ id: x.id, s: sc(x) })).filter(o => o.s > 0).sort((a, b) => b.s - a.s).slice(0, 4).map(o => o.id);
}
// Kartın canlı oynanış önizlemesi: karakter kuklaya yürür ve saldırır; evo=true ise evrimli hali (mor ışıma + evrim etkisi)
// Kartın canlı oynanış önizlemesi: oyunun GERÇEK simülasyonu küçük bir sahnede çalışır, böylece her kart kendi işlevini gösterir
// (kule koşucusu kuleye koşar, alan hasarı kümeyi vurur, bina gelen kuklayı vurur, büyü gerçek uçuşuyla düşer, evrim etkileri görünür)
function previewScene(id, evo, champ) {
  const c = BY_ID[id], B = createBattle({ decks: [Array(8).fill('bulgur'), Array(8).fill('bulgur')], levels: [{}, {}], kl: [1, 1], names: ['A', 'B'] });
  B.ents = []; B.byId = new Map(); B.tm = [[], []];
  const sc = { B, t: 0, endT: 0, castT: 0.6, killAt: 0, c, evo };
  const dummy = (x, y, hpMul = 1, walk = false) => { const u = spawnUnit(B, 1, BY_ID.bulgur, x, y, false, true); u.deployT = 0; u.dmg = 0; u.hp = u.max = 520 * hpMul; u.dummy = true; if (!walk) u.spd = 0; return u; };
  const cluster = (hp = 1) => [[8.3, 21.2], [9, 20.5], [9.7, 21.4]].forEach(([x, y]) => dummy(x, y, hp));
  if (c.type === 'spell') { cluster(c.spell === 'poison' ? 1.6 : 1.2); sc.castAt = [9, 21]; }
  else if (c.type === 'building') {
    const b = spawnUnit(B, 0, c, 9, 27.6, evo, true); b.deployT = 0; b.life = 1e9; b.hp = b.max = 1e6; b.show = true;
    if (c.spawn) cluster(1.6); else { const d = dummy(9, 18.5, c.ramp ? 5 : 2.2, true); d.spd = 0.85; }
  } else {
    const bOnly = c.target === 'buildings', n = (c.count || 1) + (evo && c.evo.countAdd || 0), f = FORM[n] || FORM[4];
    const sy = c.deployStun ? 22.8 : 25.6;
    for (let i = 0; i < n; i++) { const o = f[i] || [0, 0], u = spawnUnit(B, 0, c, 9 + o[0], sy + o[1], evo, true); u.deployT = c.deployStun ? 0.6 : 0; u.deployMax = 0.6; u.hp = u.max = Math.max(u.max, 1) * 50; u.shown = u.max; if (champ && i === 0) { makeChamp(B, u); u.abCd = 0; } }
    if (bOnly) { const t = makeTower(B, 1, 9, 19.2, false); t.dmg = 0; addEnt(B, t); dummy(7.6, 23.2, 2); dummy(10.4, 23.4, 2); }
    else if (c.splash || c.chain || (evo && (c.evo.chain || c.evo.pulse)) || c.pulse || c.slowAura) cluster(c.splash ? 1.3 : 1.6);
    else dummy(9, 21, c.dmg >= 250 ? 1.6 : 1.1);
    if (c.heal || (evo && c.evo.heal)) { const a = spawnUnit(B, 0, BY_ID.bulgur, 9.9, 27.6, false, true); a.deployT = 0; a.dmg = 0; a.spd = 0; a.hp = a.max * 0.3; }
    if (evo && (c.evo.deathBlast || c.evo.deathSpawn)) sc.killAt = 3.4;   // ölüm etkisini göstermek için saldıran düşer
  }
  refresh(B);
  return sc;
}
function startCardPreview(cv, id, evo, champ) {
  if (!cv) return;
  const c = BY_ID[id], d = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth || 340, h = cv.clientHeight || 150;
  cv.width = w * d; cv.height = h * d; const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
  const A = ARENAS[Math.min(5, CARD_ARENA[id] || 0)], kx = w / 12.6, X = y => (30.4 - y) * kx, Y = x => h * 0.8 + (x - 9) * h * 0.05, zk = h * 0.11;
  let sc = previewScene(id, evo, champ), last = performance.now(), parts = [];
  const rsm = new Map(), rsO = id2 => { let s = rsm.get(id2); if (!s) { s = { anim: Math.random() * 6, px: null, py: null, moving: false, mvT: 0 }; rsm.set(id2, s); } return s; };
  const pf = (x, y, col, n = 4, o = {}) => { for (let i = 0; i < n; i++) parts.push(Object.assign({ x, y, vx: rnd(-40, 40), vy: rnd(-70, -15), r: rnd(3, 7), t: 0, life: rnd(0.35, 0.65), col, k: 'puff' }, o)); };
  const events = evs => {
    for (const ev of evs) {
      const ex = ev.y !== undefined ? X(ev.y) : 0, ey = ev.x !== undefined ? Y(ev.x) : 0;
      if (ev.e === 'hit') { pf(ex, ey - h * (ev.flying ? 0.35 : 0.2), ev.col || '#9ccc3c', 5); if (ev.splash > 1) parts.push({ k: 'ring', x: ex, y: ey, r: ev.splash * kx, t: 0, life: 0.3, col: ev.col || '#fff' }); }
      else if (ev.e === 'chain') parts.push({ k: 'bolt', x: X(ev.y), y: Y(ev.x) - h * 0.2, x2: X(ev.ty), y2: Y(ev.tx) - h * 0.2, t: 0, life: 0.2, col: ev.col || '#bfeaff' });
      else if (ev.e === 'death') pf(ex, ey - h * 0.15, '#d8d0c0', 8);
      else if (ev.e === 'spellHit' || ev.e === 'blast') { parts.push({ k: 'ring', x: ex, y: ey, r: (ev.r || 2) * kx, t: 0, life: 0.45, col: ev.kind === 'freeze' ? '#dff6ff' : ev.kind === 'zap' ? '#6fe82a' : '#ffb04a' }); pf(ex, ey - 10, ev.kind === 'freeze' ? '#e8f8ff' : '#ffcf3d', 10); }
      else if (ev.e === 'pulse' || ev.e === 'zone') parts.push({ k: 'ring', x: ex, y: ey, r: (ev.r || 2) * kx, t: 0, life: 0.55, col: ev.kind === 'time' ? '#ffe14d' : ev.kind === 'red' ? '#ff4a4a' : '#6ec6ff' });
      else if (ev.e === 'heal') { const u = sc.B.byId.get(ev.id); if (u) parts.push({ k: 'plus', x: X(u.y) + rnd(-6, 6), y: Y(u.x) - h * 0.45, vy: -30, vx: 0, t: 0, life: 0.7, r: 6, col: '#6cf27a' }); }
      else if (ev.e === 'shieldBreak') pf(ex, ey - h * 0.3, '#ffd54f', 6);
      else if (ev.e === 'land') pf(ex, ey, '#c8b890', 6);
    }
  };
  const loop = now => {
    if (!cv.isConnected) return;
    if (!$('modal').classList.contains('on')) { cv.remove(); return; }   // modal kapandı: önizleme durur (arka planda CPU yemesin)
    const pg = cv.closest('.page'), tr = pg && pg.parentElement; if (tr && [...tr.children].indexOf(pg) !== Math.round(-(parseFloat((tr.style.transform.match(/-?[\d.]+/) || [0])[0]) || 0) / 100)) { last = now; requestAnimationFrame(loop); return; }   // görünmeyen sayfa çizilmez
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const B = sc.B; sc.t += dt;
    // sahne olayları: büyü at, ölüm etkisi için saldıranı düşür, bitince baştan başlat
    if (c.type === 'spell') { sc.castT -= dt; if (sc.castT <= 0) { sc.castT = 99; castSpell(B, 0, c, sc.castAt[0], sc.castAt[1], evo); } }
    if (champ && !sc.ult) { const cu = B.ents.find(e => e.champ && e.hp > 0), near = cu && B.tm[1].some(e => Math.hypot(e.x - cu.x, e.y - cu.y) < 2.6); if (near) { B.p[0].elixir = 10; sc.ult = useChamp(B, 0); } }
    if (sc.killAt && sc.t >= sc.killAt) { sc.killAt = 0; B.ents.filter(e => e.team === 0 && e.card === id).forEach(e => { e.hp = 0; }); }
    stepBattle(B, dt); const evs = B.ev; B.ev = []; events(evs);
    for (const e of B.ents) if (e.dummy && e.kind === 'troop') e.dmg = 0;
    const foes = B.ents.filter(e => e.team === 1 && e.hp > 0), mine = B.ents.filter(e => e.team === 0 && e.hp > 0 && e.card === id);
    if (!sc.endT && (foes.length === 0 || sc.t > 9 || (c.type === 'spell' && sc.castT > 50 && ((!B.spells.length && !B.areas.length && !B.rollers.length) || sc.t > 4.5)) || (c.type !== 'spell' && c.type !== 'building' && !mine.length && sc.t > 5))) sc.endT = sc.t;
    if (sc.endT && sc.t - sc.endT > 1.1) { sc = previewScene(id, evo, champ); rsm.clear(); parts = []; }
    // zemin
    for (let i = 0; i < w / 22 + 1; i++) for (let j = 0; j < h / 22 + 1; j++) { g.fillStyle = (i + j) % 2 ? A.g[0] : A.g[1]; g.fillRect(i * 22, j * 22, 22, 22); }
    g.fillStyle = A.path; g.fillRect(0, h * 0.68, w, h * 0.24);
    for (const a of B.areas) { g.globalAlpha = 0.35 * Math.min(1, a.t / 0.5); g.fillStyle = a.kind === 'poison' ? '#9be33a' : a.kind === 'burn' ? '#ff7a2e' : '#4fc3f7'; g.beginPath(); g.ellipse(X(a.y), Y(a.x), a.r * kx, a.r * kx * 0.28, 0, 0, 7); g.fill(); g.globalAlpha = 1; }
    for (const r of B.rollers) { const x0 = X(r.y), y0 = Y(9); if (SPELL_IMG.log) { g.save(); g.translate(x0, y0 - h * 0.1); g.rotate(Math.PI / 2); g.drawImage(SPELL_IMG.log, -h * 0.45, -kx * 0.4, h * 0.9, kx * 0.8); g.restore(); continue; } g.fillStyle = '#8a5a2a'; roundRectG(g, x0 - kx * 0.45, y0 - h * 0.2, kx * 0.9, h * 0.2, 8); g.fill(); g.fillStyle = '#d9a35e'; g.fillRect(x0 - 3, y0 - h * 0.2, 6, h * 0.2); }
    // varlıklar (derinliğe göre)
    const list = B.ents.filter(e => e.hp > 0 || e.kind === 'tower').sort((a, b) => a.x - b.x);
    for (const e of list) {
      const ex = X(e.y), ey = Y(e.x), rs = rsO(e.id);
      rs.anim += dt; if (rs.px !== null) { const dd = Math.hypot(e.x - rs.px, e.y - rs.py); rs.mvT = dd > 0.003 ? 0.12 : rs.mvT - dt; rs.moving = rs.mvT > 0 && !(e.atkT > 0); } rs.px = e.x; rs.py = e.y;
      if (e.kind === 'tower') {
        if (e.hp <= 0) { g.fillStyle = '#6b625a'; g.beginPath(); g.ellipse(ex, ey, kx * 0.9, kx * 0.3, 0, 0, 7); g.fill(); continue; }
        const tr = kx * 0.85, th = h * 0.42; g.fillStyle = '#0004'; g.beginPath(); g.ellipse(ex, ey + 2, tr * 1.1, tr * 0.32, 0, 0, 7); g.fill();
        const tg = g.createLinearGradient(ex - tr, 0, ex + tr, 0); tg.addColorStop(0, '#7d7369'); tg.addColorStop(0.4, '#c8beb3'); tg.addColorStop(1, '#6b6158');
        g.fillStyle = tg; g.fillRect(ex - tr, ey - th, tr * 2, th); g.fillStyle = '#d63a3a'; g.fillRect(ex - tr * 0.35, ey - th * 0.85, tr * 0.7, th * 0.45);
        g.fillStyle = '#ddd3c7'; g.beginPath(); g.ellipse(ex, ey - th, tr, tr * 0.32, 0, 0, 7); g.fill();
        const bw = tr * 2; g.fillStyle = '#000c'; g.fillRect(ex - bw / 2, ey - th - 12, bw, 7); g.fillStyle = '#ff4a4a'; g.fillRect(ex - bw / 2 + 1, ey - th - 11, (bw - 2) * Math.max(0, e.hp / e.max), 5);
        continue;
      }
      const mineU = e.team === 0, hh = e.size * h * (e.building ? 0.3 : 0.25), z = e.flying ? h * 0.2 : 0, flip = mineU ? 1 : -1;
      g.fillStyle = '#0005'; g.beginPath(); g.ellipse(ex, ey, hh * 0.24, hh * 0.07, 0, 0, 7); g.fill();
      const tint = e.freezeT > 0 ? '#bfeaffb0' : e.tsT > 0 ? '#9e9e9ecc' : e.stun > 0 ? '#ffffff60' : e.slowT > 0 ? '#4fc3f770' : e.dummy ? '#ff3b3b50' : null;
      if (e.building) {
        drawChar(e.img || e.card, ex, ey + hh * 0.1, hh, { sx: 1 + (e.atkT > 0 ? 0.06 : 0) }, { g, flat: true, flip: e.card === 'cannon' ? -1 : 1 });
        if (e.c && e.c.ramp && e.target) { const t = B.byId.get(e.target); if (t && t.hp > 0) { const tx2 = X(t.y), ty2 = Y(t.x) - (t.flying ? h * 0.35 : h * 0.18), heat = clamp(((e.rampMul || 1) - 1) / 11, 0, 1), sx2 = ex, sy2 = ey - hh * 0.78;
          g.lineCap = 'round'; [[10, 0.35, heat > 0.6 ? '#ffe14d' : '#4fd61f'], [4, 0.9, heat > 0.6 ? '#ff9a1f' : '#6fe82a'], [1.6, 1, '#f4ffd8']].forEach(([lw, al, col], j) => { g.globalAlpha = al; g.strokeStyle = col; g.lineWidth = lw + heat * 3; g.beginPath(); for (let i = 0; i <= 12; i++) { const k = i / 12, o = Math.sin(k * 9 + sc.t * 22 + j) * 3 * Math.sin(k * Math.PI); g.lineTo(sx2 + (tx2 - sx2) * k, sy2 + (ty2 - sy2) * k + o); } g.stroke(); }); g.globalAlpha = 1; g.lineCap = 'butt'; } }
      }
      else {
        const pose = poseFor(e, rs, hh, rigOf(e.img || e.card).type);
        if (e.champ) drawChar(e.img, ex, ey - z, hh * 1.1, pose, { g, flip, tint: e.rageT > 0 ? '#ff9a1f' : '#ffd447', alpha: 0.55 });
        else if (e.evo) drawChar(e.img || e.card, ex, ey - z, hh * 1.08, pose, { g, flip, tint: '#c46bff', alpha: 0.55 });
        if (e.c && e.c.stand && mineU) drawChar(e.img || e.card, ex + (e.atkT > 0 ? hh * 0.4 : -hh * 0.3), ey - z - (e.atkT > 0 ? 0 : hh * 0.05), hh * (e.evo ? 1.25 : 1.12), e.atkT > 0 ? { lean: 0.2 } : {}, { g, flip, tint: e.evo ? '#7c3aed' : '#8e5bd6', alpha: 0.55 });
        drawChar(e.card === 'mafya' && e.evo && e.atkT > 0 ? 'mafya_pose' : (e.img || e.card), ex, ey - z, hh, pose, { g, flip, tint, alpha: e.deployT > 0 ? 0.5 : 1 });
      }
      const top = ey - z - hh;
      if (e.stun > 0 && !(e.freezeT > 0)) { g.fillStyle = '#ffe14d'; for (let i = 0; i < 3; i++) { const a = rs.anim * 6 + i * 2.1; star(g, ex + Math.cos(a) * hh * 0.22, top - 4 + Math.sin(a) * 3, 5, 2); g.fill(); } }
      if (e.dummy || (!mineU)) { const bw = Math.max(22, hh * 0.45); g.fillStyle = '#000c'; g.fillRect(ex - bw / 2, top - 9, bw, 6); g.fillStyle = '#ff4a4a'; g.fillRect(ex - bw / 2 + 1, top - 8, (bw - 2) * Math.max(0, e.hp / e.max), 4); }
      else if (e.shield > 0) { const bw = Math.max(22, hh * 0.45); g.fillStyle = '#ffd54f'; g.fillRect(ex - bw / 2, top - 8, bw * Math.min(1, e.shield / (e.shieldMax || e.shield)), 4); }
      else if (!e.dummy && e.card !== id && mineU) { const bw = Math.max(22, hh * 0.45); g.fillStyle = '#000c'; g.fillRect(ex - bw / 2, top - 9, bw, 6); g.fillStyle = '#3d9bff'; g.fillRect(ex - bw / 2 + 1, top - 8, (bw - 2) * Math.max(0, e.hp / e.max), 4); }
    }
    // mermiler ve uçan büyüler
    for (const p of B.projs) { if (p.delay > 0) continue; g.fillStyle = p.shot === 'heart' ? '#ff5fb8' : p.col || '#9ccc3c'; g.beginPath(); g.arc(X(p.y), Y(p.x) - p.z * zk, p.shot === 'lob' || p.shot === 'orb' ? 7 : 5, 0, 7); g.fill(); g.strokeStyle = '#fff8'; g.lineWidth = 1.5; g.stroke(); }
    for (const s of B.spells) {
      if (s.kind === 'fireball' || s.kind === 'arrows') { const k = clamp(s.t / (s.dur || 1), 0, 1); if (k >= 1) continue; const x = X(lerp(s.sy, s.y, k)), y = Y(lerp(s.sx, s.x, k)) - Math.sin(k * Math.PI) * h * 0.55 - (1 - k) * h * 0.1;
        if (s.kind === 'fireball' && SPELL_IMG.fireball) { const im = SPELL_IMG.fireball; g.save(); g.translate(x, y); g.rotate(sc.t * 7); g.drawImage(im, -14, -15, 28, 31); g.restore(); }
        if (s.kind === 'fireball') { const gr = g.createRadialGradient(x, y, 1, x, y, 12); gr.addColorStop(0, '#fff6c2'); gr.addColorStop(0.5, '#ff9a2e'); gr.addColorStop(1, '#ff3a1000'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); pf(x, y, '#ff7043', 1, { vy: 10 }); }
        else { g.strokeStyle = '#f2d9a6'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(x + i * 5 - 12, y + (i % 2) * 5); g.lineTo(x + i * 5 - 6, y + (i % 2) * 5 + 8); g.stroke(); } } }
      else if (s.kind === 'rain') { const k = clamp(s.t / (s.dur || 1), 0, 1); for (let i = 0; i < 4; i++) { g.fillStyle = '#c8d84a'; g.beginPath(); g.ellipse(X(s.y) + (i - 1.5) * 14, Y(s.x) - (1 - k) * h * 0.7, 6, 8, 0, 0, 7); g.fill(); } }
    }
    // parçacıklar
    for (const q of parts) {
      q.t += dt; const k = 1 - q.t / q.life; if (k <= 0) continue; g.globalAlpha = Math.min(1, k * 1.6);
      if (q.k === 'ring') { g.strokeStyle = q.col; g.lineWidth = 3; g.beginPath(); g.ellipse(q.x, q.y, q.r * (1.1 - k * 0.3), q.r * 0.3 * (1.1 - k * 0.3), 0, 0, 7); g.stroke(); g.globalAlpha *= 0.3; g.fillStyle = q.col; g.fill(); }
      else if (q.k === 'bolt') { g.strokeStyle = q.col; g.lineWidth = 3; bolt(g, q.x, q.y, q.x2, q.y2, 5, 5); g.stroke(); }
      else if (q.k === 'plus') { q.y += q.vy * dt; g.fillStyle = q.col; g.fillRect(q.x - 2, q.y - 6, 4, 12); g.fillRect(q.x - 6, q.y - 2, 12, 4); }
      else { q.x += q.vx * dt; q.y += q.vy * dt; g.fillStyle = q.col; g.beginPath(); g.arc(q.x, q.y, q.r * (1.6 - k * 0.6), 0, 7); g.fill(); }
    }
    g.globalAlpha = 1; parts = parts.filter(q => q.t < q.life);
    if (evo) { g.fillStyle = '#4a1d9ae0'; roundRectG(g, 6, 6, 94, 22, 8); g.fill(); g.fillStyle = '#fff'; g.font = '14px "Lilita One",sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('🌟 EVRİMLİ', 12, 17); }
    if (champ) { g.fillStyle = '#a86a00e8'; roundRectG(g, 6, 6, 116, 22, 8); g.fill(); g.fillStyle = '#fff'; g.font = '14px "Lilita One",sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('👑 ŞAMPİYON', 12, 17); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
function roundRectG(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

// Kart detayı: yana kaydırılan 3 sayfa (Bilgi / Nasıl Oynanır / Evrim)
function cardModal(id, slot, page = 0) {
  const c = BY_ID[id], own = owned(id), lvl = own ? cardLvl(id) : 1, u = own ? upgradeInfo(id) : null, R0 = RAR[c.rar], ctr = counterCards(id);
  const statsHTML = statRows(id, lvl).map(r => `<div><span>${r[0]}</span><b>${r[1]}${r[2] !== undefined && u && !u.max ? ` <i>+${r[2] - parseInt(r[1])}</i>` : ''}</b></div>`).join('');
  modal(`<div class="mhead">${cardHTML(id, { champ: slot === 2, gem: slot >= 0 && slot < 2 ? 'evo on' : '', lvl: own ? lvl : 0 })}<div><div class="ttl ts" style="margin:0">${c.name}</div>
      <span class="rarTag" style="background:${R0.col}">${R0.n}</span> <span class="ts">${own ? 'Seviye ' + lvl : '🔒 Açılmadı'}</span>${own ? progHTML(id) : ''}</div></div>
    <div class="ptabs ts"><b data-p="0">📊 Bilgi</b><b data-p="1">🎮 Nasıl Oynanır</b><b data-p="2">🌟 Evrim</b>${c.champ ? '<b data-p="3">👑 Şampiyon</b>' : ''}</div>
    <div class="pager" id="pager"><div class="ptrack" id="ptrack">
      <div class="page">
        ${own ? '' : `<div class="lockNote ts">🔒 Arena ${CARD_ARENA[id] + 1}: ${ARENAS[CARD_ARENA[id]].name} (🏆 ${ARENAS[CARD_ARENA[id]].tr}) sandıklarından çıkar.</div>`}
        <div class="desc">${c.tema}</div>
        <div class="desc" style="margin-top:6px">⚔️ ${c.silah}</div>
        <div class="stats ts">${statsHTML}</div>
      </div>
      <div class="page">
        <canvas class="prevCv" id="prevCv"></canvas>
        <div class="about ts"><div class="desc">${TIPS[id] || c.silah}</div><div class="pros">${proTags(c)}</div>
          ${ctr.length ? `<div class="desc" style="margin-top:8px">${c.type === 'spell' ? 'İyi gittiği kartlar:' : 'Buna karşı iyi kartlar:'}</div><div class="ctrs">${ctr.map(k => cardHTML(k, { lvl: 0 })).join('')}</div>` : ''}</div>
      </div>
      <div class="page">
        <canvas class="prevCv" id="prevEvo"></canvas>
        <div class="evoBox ts">🌟 <b>${c.evo.name}</b><div class="desc" style="color:#f0dcff">${c.evo.desc}</div></div>
      </div>
      ${c.champ ? `<div class="page">
        <canvas class="prevCv" id="prevCh"></canvas>
        <div class="champInfo ts">👑 <b>${c.champ.name}</b><img src="${cardImg(c.champ.img)}"><div class="desc">${c.champ.desc}</div></div>
      </div>` : ''}
    </div></div>
    <div class="pdots"><i></i><i></i><i></i>${c.champ ? '<i></i>' : ''}</div>
    <div class="mbtns">${u && !u.max ? `<button class="btn green ${u.ok ? '' : 'off'}" id="mUp">⬆ Yükselt <i class="coin"></i>${fmtNum(u.gold)}</button>` : ''}${own && slot < 0 ? `<button class="btn blue" id="mUse">Kullan</button>` : ''}</div>`);
  const pager = $('pager'), track = $('ptrack'), tabs = [...$('mbox').querySelectorAll('.ptabs b')], dots = [...$('mbox').querySelectorAll('.pdots i')];
  let cur = 0; const NP = track.children.length;
  const setH = () => { const pg = track.children[cur]; if (pg) pager.style.height = pg.offsetHeight + 'px'; };
  const go = (k, anim = true) => { cur = clamp(k, 0, NP - 1); track.classList.toggle('drag', !anim); track.style.transform = `translateX(${-cur * 100}%)`; tabs.forEach((b, i) => b.classList.toggle('on', i === cur)); dots.forEach((b, i) => b.classList.toggle('on', i === cur)); setH(); };
  tabs.forEach((b, i) => { b.onclick = () => { sfx('click'); go(i); }; });
  dots.forEach((b, i) => { b.onclick = () => go(i); });
  // fare ve parmakla sürükleyerek sayfa değiştir (sürükleme sonrası tıklama yutulur, modal kapanmaz)
  let drag = null;
  pager.onpointerdown = ev => { if (ev.button > 0) return; drag = { x: ev.clientX, y: ev.clientY, id: ev.pointerId, on: false }; };
  pager.onpointermove = ev => {
    if (!drag || ev.pointerId !== drag.id) return; const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
    if (!drag.on) { if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; } if (Math.abs(dx) < 8) return; drag.on = true; pager.setPointerCapture(ev.pointerId); track.classList.add('drag'); }
    const edge = (cur === 0 && dx > 0) || (cur === NP - 1 && dx < 0) ? 0.35 : 1;
    track.style.transform = `translateX(calc(${-cur * 100}% + ${dx * edge}px))`; ev.preventDefault();
  };
  pager.onpointerup = pager.onpointercancel = ev => {
    if (!drag) return; const d = drag; drag = null; if (!d.on) return;
    const dx = ev.clientX - d.x, w = pager.clientWidth; go(dx < -w * 0.18 ? cur + 1 : dx > w * 0.18 ? cur - 1 : cur);
    MODAL_EAT = true; setTimeout(() => { MODAL_EAT = false; }, 0);
  };
  requestAnimationFrame(setH);
  go(page, false);
  const up = $('mUp'); if (up) up.onclick = () => { if (doUpgrade(id)) { sfx('upgrade'); toast(`⬆ ${c.name} seviye ${cardLvl(id)}!`); cardModal(id, slot, cur); renderTab(); } else { sfx('nope'); toast(u.ready ? 'Yeterli altın yok' : `${u.need - u.n} kart daha gerekli`); } };
  const us = $('mUse'); if (us) us.onclick = () => { SWAP = id; closeModal(); renderCards(); sfx('click'); };
  $('mbox').querySelectorAll('.ctrs .card').forEach(el2 => { el2.onclick = () => cardModal(el2.dataset.id, -1, 1); });
  startCardPreview($('prevCv'), id, false);
  startCardPreview($('prevEvo'), id, true);
  if (c.champ) startCardPreview($('prevCh'), id, false, true);
}
function modal(html) { $('mbox').innerHTML = `<b class="mclose ts" id="mX">✖</b>` + html; $('modal').classList.add('on'); $('mX').onclick = closeModal; }
function closeModal() { $('modal').classList.remove('on'); }
let MODAL_EAT = false, MODAL_DOWN = false;
$('modal').addEventListener('pointerdown', e => { MODAL_DOWN = e.target.id === 'modal'; });
$('modal').addEventListener('click', e => { if (MODAL_EAT) { e.stopPropagation(); e.preventDefault(); MODAL_EAT = false; return; } if (e.target.id === 'modal' && MODAL_DOWN) closeModal(); }, true);
// emojiye tıklayınca kafa animasyonu oynar
document.addEventListener('click', e => { const t = e.target.closest && e.target.closest('.emoTile'); if (t) playEmoTile(t); }, true);
function playEmoTile(t) {
  const em = EMOTE_BY[t.dataset.e]; if (!em) return;
  let cv = t.querySelector('canvas.emoLive'); if (cv && cv._raf) cancelAnimationFrame(cv._raf);
  if (!cv) { cv = document.createElement('canvas'); cv.className = 'emoLive'; t.appendChild(cv); }
  const d = Math.min(2, devicePixelRatio || 1), w = t.clientWidth, h = t.clientHeight; cv.width = w * d; cv.height = h * d;
  const g = cv.getContext('2d'), t0 = performance.now(); t.classList.add('live');
  const step = now => {
    const a = (now - t0) / 1000; if (a > 2.4 || !cv.isConnected) { t.classList.remove('live'); cv.remove(); return; }
    g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h); emoteFrame(g, em, a, h * 0.62, w * 0.47, h * 0.93); cv._raf = requestAnimationFrame(step);
  };
  cv._raf = requestAnimationFrame(step);
}
// lobide yana kaydırarak sekme değiştir: sayfa parmağı takip eder, bırakınca kayarak yerine oturur
(() => {
  let sw = null; const hub = $('hub'), order = () => [...document.querySelectorAll('#nav b')].map(b => b.dataset.t);
  const tabEl = () => $('tab-' + TAB);
  hub.addEventListener('pointerdown', e => { if (e.button > 0 || $('modal').classList.contains('on') || e.target.closest('input,.pager,#nav,.deckGrid,#chestOv,.dOpt')) return; sw = { x: e.clientX, y: e.clientY, t: performance.now(), on: false }; });
  addEventListener('pointermove', e => {
    if (!sw) return; if (CDRAG && CDRAG.ghost) { sw = null; return; }
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    if (!sw.on) { if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) { sw = null; return; } if (Math.abs(dx) < 12) return; sw.on = true; sw.el = tabEl(); sw.el.style.transition = 'none'; }
    const o = order(), i = o.indexOf(TAB), edge = (i === 0 && dx > 0) || (i === o.length - 1 && dx < 0) ? 0.3 : 1, w = hub.clientWidth;
    sw.dx = dx * edge; sw.el.style.transform = `translateX(${sw.dx}px) rotate(${sw.dx / w * 2}deg)`; sw.el.style.opacity = String(1 - Math.min(0.5, Math.abs(sw.dx) / w));
  });
  const end = e => {
    if (!sw) return; const s = sw; sw = null; if (!s.on) return;
    const el = s.el, w = hub.clientWidth, dt = performance.now() - s.t, dx = s.dx || 0, o = order(), i = o.indexOf(TAB);
    const go = Math.abs(dx) > w * 0.22 || (Math.abs(dx) > 40 && Math.abs(dx) / dt > 0.5), n = go ? o[i + (dx < 0 ? 1 : -1)] : null;
    el.style.transition = 'transform .16s ease-in, opacity .16s';
    if (!n) { el.style.transform = ''; el.style.opacity = ''; setTimeout(() => { el.style.transition = ''; }, 170); return; }
    el.style.transform = `translateX(${dx < 0 ? -w : w}px)`; el.style.opacity = '0';
    setTimeout(() => {
      el.style.transition = ''; el.style.transform = ''; el.style.opacity = ''; setTab(n);
      const tb = $('tab-' + n); tb.style.transition = 'none'; tb.style.transform = `translateX(${dx < 0 ? w * 0.6 : -w * 0.6}px)`; tb.style.opacity = '0.3'; void tb.offsetWidth;
      tb.style.transition = 'transform .24s cubic-bezier(.2,.9,.3,1.1), opacity .2s'; tb.style.transform = ''; tb.style.opacity = '';
      setTimeout(() => { tb.style.transition = ''; }, 260);
    }, 150);
    MODAL_EAT = true; setTimeout(() => { MODAL_EAT = false; }, 0);
  };
  addEventListener('pointerup', end); addEventListener('pointercancel', end);
})();

// ---------- Sandık açma ----------
function chestOpen(r) {
  const ov = $('chestOv'), C = CHESTS[r.type] || CHESTS.silver;
  let step = -1; r.cards = (r.cards || []).slice().sort((a, b) => rarOrder(BY_ID[a.id].rar) - rarOrder(BY_ID[b.id].rar));   // en iyi kart en sona
  ov.innerHTML = `<div class="ttl ts">${C.n}</div><div class="bigChest" id="bigC">${chestIco(r.type || 'silver')}</div><div class="tapHint ts">Açmak için dokun</div>`;
  ov.classList.add('on'); sfx('chest');
  ov.onclick = () => {
    step++;
    if (step === 0) { $('bigC')?.classList.add('open'); }
    if (step < r.cards.length) {
      const o = r.cards[step], c = BY_ID[o.id], leg = c.rar === 'legendary' || c.rar === 'epic';
      ov.innerHTML = `<div class="reveal ts">${cardHTML(o.id, { isNew: o.isNew })}<div class="cnt">x${o.n}</div><div>${c.name}</div><span class="rarTag" style="background:${RAR[c.rar].col}">${RAR[c.rar].n}</span>${o.isNew ? '<div style="color:#ffd447">YENİ KART!</div>' : progHTML(o.id)}</div><div class="tapHint ts">${r.cards.length - step - 1} kart kaldı</div>`;
      sfx('paper'); if (leg) setTimeout(() => sfx('legend'), 120);
    } else if (step === r.cards.length) {
      ov.innerHTML = `<div class="reveal ts"><div class="ttl">Toplam</div><div class="rewards">${r.gold ? `<span><i class="coin"></i> +${r.gold}</span>` : ''}${r.gems ? `<span><i class="gemI"></i> +${r.gems}</span>` : ''}</div><div class="sumGrid">${r.cards.map((o, i) => `<div class="sumC" style="animation-delay:${i * 0.07}s">${cardHTML(o.id, { isNew: o.isNew })}<div class="ts">x${o.n}</div></div>`).join('')}</div></div><div class="tapHint ts">Kapatmak için dokun</div>`;
      sfx('crown'); r.cards.forEach((o, i) => setTimeout(() => sfx('paper'), i * 70));
    } else { ov.classList.remove('on'); ov.onclick = null; renderTab(); }
  };
}

// ---------- Mağaza ----------
function renderShop() {
  const S0 = shopOffers(), T = $('tab-shop');
  T.innerHTML = `<div class="panel"><div class="ttl ts">Günlük Teklifler <span class="muted">yenilenme: <span id="shopT">${fmtTime(S0.until - Date.now())}</span></span></div>
    <div class="offers">${S0.offers.map((o, k) => `<div class="offer">${cardHTML(o.id, { cls: o.sold ? 'locked' : '' })}<div class="ts" style="text-align:center">x${o.n}</div><button class="btn ${o.sold ? 'off' : ''}" data-k="${k}">${o.sold ? 'Alındı' : '<i class="coin"></i> ' + o.cost}</button></div>`).join('')}</div></div>
    <div class="panel"><div class="ttl ts">Sandıklar</div>${Object.entries(CHEST_PRICES).map(([t, p]) => `<div class="row"><div style="width:64px;height:52px">${chestIco(t)}</div><div class="grow ts">${CHESTS[t].n}<div class="muted">~${CHESTS[t].cards} kart</div></div><button class="btn blue sm" data-c="${t}"><i class="gemI"></i> ${p}</button></div>`).join('')}</div>
    <div class="panel passAd ts" id="shopPass"><div class="pbCrown">👑</div><div class="grow"><b>Pass Royale</b><div class="muted">${PF.pass.prem ? 'Premium aktif! Ödüllerini topla.' : 'Özel emojiler, kule görünümleri, bol sandık'}</div></div><button class="btn ${PF.pass.prem ? 'blue' : 'gold'} sm">${PF.pass.prem ? 'Aç' : '<i class="gemI"></i> ' + PASS_PRICE}</button></div>
    <div class="panel"><div class="ttl ts">🏰 Kule Görünümleri</div><div class="skinGrid">${TOWER_SKINS.filter(s => s.price).map(skinTileHTML).join('')}</div></div>
    <div class="panel"><div class="ttl ts">😂 Emojiler</div><div class="emoCol">${EMOTE_LIST.filter(e => e.price && !PF.emotes.includes(e.id)).map(e => emoTileHTML(e.id)).join('') || '<div class="muted">Hepsi sende!</div>'}</div></div>
    <div class="panel"><div class="row"><div class="grow ts">🎁 Günün elması<div class="muted">Her yenilemede 10 bedava elmas</div></div><button class="btn green sm" id="freeGems" ${S0.gemsTaken ? 'disabled' : ''}>${S0.gemsTaken ? 'Alındı' : '<i class="gemI"></i> 10 Al'}</button></div></div>`;
  T.querySelectorAll('[data-k]').forEach(b => { b.onclick = () => { if (buyOffer(+b.dataset.k)) { sfx('upgrade'); toast('Satın alındı!'); renderShop(); refreshTop(); } else { sfx('nope'); toast('Yeterli altın yok'); } }; });
  T.querySelectorAll('[data-c]').forEach(b => { b.onclick = () => { const r = buyChest(b.dataset.c); if (r) chestOpen(r); else { sfx('nope'); toast('Yeterli elmas yok'); } refreshTop(); }; });
  T.querySelectorAll('.emoCol .emoTile').forEach(d => { d.onclick = () => { previewEmoSound(d.dataset.e); buyEmoteModal(d.dataset.e); }; });
  $('shopPass').onclick = () => { sfx('click'); passScreen(); };
  bindSkinTiles(T, renderShop);
  const fg = $('freeGems'); if (fg) fg.onclick = () => { if (!PF.shop.gemsTaken) { PF.shop.gemsTaken = true; PF.gems += 10; saveP(); sfx('crown'); renderShop(); refreshTop(); } };
}

// ---------- Kule görünümleri ----------
function skinTileHTML(s) {
  const own = PF.skins.includes(s.id), on = PF.skin === s.id;
  return `<div class="skinTile ts ${on ? 'on' : ''} ${own ? '' : 'locked'}" data-sk="${s.id}"><canvas class="skinCv" data-skc="${s.id}"></canvas><div class="sn">${s.name}</div><div class="sp">${on ? '✔ Kullanılıyor' : own ? 'Seç' : s.price ? '<i class="gemI"></i> ' + s.price : '👑 Pass'}</div></div>`;
}
function drawSkinPreview(cv, id) {
  const S = SKIN_BY[id], d = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth || 90, h = cv.clientHeight || 100;
  cv.width = w * d; cv.height = h * d; const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
  const tower = (X, Y, r, ht, king) => {
    const ry = r * 0.42;
    g.fillStyle = '#0005'; g.beginPath(); g.ellipse(X + r * 0.1, Y + ry * 0.2, r * 1.15, ry * 1.3, 0, 0, 7); g.fill();
    const gr = g.createLinearGradient(X - r, 0, X + r, 0); gr.addColorStop(0, S.b[0]); gr.addColorStop(0.35, S.b[1]); gr.addColorStop(1, S.b[2]);
    g.fillStyle = gr; g.beginPath(); g.moveTo(X - r, Y - ht); g.lineTo(X - r, Y); g.ellipse(X, Y, r, ry, 0, Math.PI, 0, true); g.lineTo(X + r, Y - ht); g.ellipse(X, Y - ht, r, ry, 0, 0, Math.PI, true); g.closePath(); g.fill();
    g.strokeStyle = '#0009'; g.lineWidth = 1.5; g.stroke();
    g.strokeStyle = '#0003'; g.lineWidth = 1;
    for (let i = 1; i <= 4; i++) { const yy = Y - ht * i / 5; g.beginPath(); g.ellipse(X, yy, r, ry, 0, Math.PI, 0, true); g.stroke(); for (let j = 0; j < 4; j++) { const a = Math.PI * (0.15 + j * 0.23 + (i % 2) * 0.1), bx = X + Math.cos(a) * r; g.beginPath(); g.moveTo(bx, yy + Math.sin(a) * ry); g.lineTo(bx, yy + Math.sin(a) * ry + ht / 5); g.stroke(); } }
    g.fillStyle = '#1d4fa8'; g.fillRect(X - r * 0.32, Y - ht * 0.9, r * 0.64, ht * 0.55);
    g.fillStyle = '#3d8bff'; g.beginPath(); g.moveTo(X - r * 0.28, Y - ht * 0.88); g.lineTo(X + r * 0.28, Y - ht * 0.88); g.lineTo(X + r * 0.28, Y - ht * 0.4); g.lineTo(X, Y - ht * 0.48); g.lineTo(X - r * 0.28, Y - ht * 0.4); g.closePath(); g.fill();
    g.fillStyle = S.top; g.beginPath(); g.ellipse(X, Y - ht, r, ry, 0, 0, 7); g.fill(); g.strokeStyle = '#0009'; g.lineWidth = 1.5; g.stroke();
    const tooth = a => { const px = X + Math.cos(a) * r * 0.9, py = Y - ht + Math.sin(a) * ry * 0.9, tw = r * 0.26, th = r * 0.3; g.fillStyle = S.b[Math.sin(a) > 0 ? 1 : 0]; g.fillRect(px - tw / 2, py - th, tw, th); g.strokeStyle = '#0008'; g.lineWidth = 1; g.strokeRect(px - tw / 2, py - th, tw, th); };
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; if (Math.sin(a) < 0) tooth(a); }
    drawChar(king ? (S.k || 'king') : S.g, X, Y - ht - ry * 0.2, Math.min(r * (king ? 2.1 : 2.3), (Y - ht) * 0.92), {}, { g, flip: 1 });
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; if (Math.sin(a) >= 0) tooth(a); }
  };
  const big = w > 140;
  if (big) { tower(w * 0.25, h * 0.92, w * 0.11, h * 0.26, false); tower(w * 0.75, h * 0.92, w * 0.11, h * 0.26, false); tower(w * 0.5, h * 0.84, w * 0.15, h * 0.3, true); }
  else tower(w / 2, h * 0.92, w * 0.24, h * 0.27, false);
}
function bindSkinTiles(T, rerender) {
  T.querySelectorAll('[data-skc]').forEach(c => drawSkinPreview(c, c.dataset.skc));
  T.querySelectorAll('.skinTile').forEach(el => { el.onclick = () => {
    const id = el.dataset.sk, S = SKIN_BY[id];
    if (PF.skins.includes(id)) { PF.skin = id; saveP(); sfx('click'); toast('🏰 ' + S.name + ' seçildi'); rerender(); return; }
    if (S.pass) { sfx('nope'); toast('👑 Bu görünüm Pass Royale premium yolunda'); return; }
    modal(`<div class="ts" style="text-align:center"><div class="ttl">${S.name}</div><canvas class="skinCv big" id="skBig"></canvas><div class="muted">Sadece görünüş: kulelerin ve nöbetçin değişir.</div><br><button class="btn gold" id="skBuy"><i class="gemI"></i> ${S.price} Satın Al</button></div>`);
    drawSkinPreview($('skBig'), id);
    $('skBuy').onclick = () => { if (buySkin(id)) { sfx('upgrade'); toast('🏰 ' + S.name + ' senin!'); closeModal(); refreshTop(); rerender(); } else { sfx('nope'); toast('Yeterli elmas yok'); } };
  }; });
}
function renderSkinTab() {
  const T = $('tab-cards');
  T.innerHTML = `${subTabsHTML()}<div class="panel"><div class="ttl ts">🏰 Kule Görünümü</div><div class="muted ts" style="margin-bottom:8px">Seçtiğin görünüm maçlarda senin kulelerinde görünür.</div><div class="skinGrid">${TOWER_SKINS.map(skinTileHTML).join('')}</div></div>`;
  bindSubTabs(T); bindSkinTiles(T, renderSkinTab);
}

// ---------- Parti modları ----------
const LADDER_MODE = { id: 'ladder', n: 'Kupa Maçı', i: '🏆', d: 'Kupa kazan, arena atla' };
const curMode = () => MODES.find(m => m.id === PF.mode) || LADDER_MODE;
function modesScreen() {
  modal(`<div class="modesScr ts"><div class="modeBan"><b>⚔️ Mod Seç</b><i>Parti modları kupasızdır, Parti Arenası'nda oynanır</i></div>
    ${[LADDER_MODE].concat(MODES).map(o => `<div class="modeRow ${o.id === curMode().id ? 'on' : ''} ${o.id === 'ladder' ? '' : 'pm'}" data-m="${o.id}"><span class="mi">${o.i}</span><div class="grow"><b>${o.n}</b><div class="muted">${o.d}</div></div>${o.id === curMode().id ? '<b class="mOk">✔</b>' : ''}</div>`).join('')}
    <div class="muted" style="text-align:center">Rakip zorluğu: ${['Kolay', 'Normal', 'Zor', '🧠 Esporcu'][PF.diff]}</div></div>`);
  $('mbox').querySelectorAll('.modeRow').forEach(r => { r.onclick = () => { sfx('click'); PF.mode = r.dataset.m; saveP(); closeModal(); renderBattle(); }; });
}
// ---------- Pass Royale ekranı ----------
const passAny = () => PASS.some(p => passClaimable(p.t, false) || passClaimable(p.t, true)) || passLoopN() > 0;
function passIco(r) {
  if (r.skin) return `<canvas class="skinCv" data-skc="${r.skin}"></canvas>`;
  if (r.emote) return `<div class="pEmo">${emoTileHTML(r.emote)}<b class="pTag">EMOJİ</b></div>`;
  if (r.chest) return `<div class="pChest">${chestIco(r.chest)}</div>`;
  if (r.cards) return `<div class="pCards" style="--rc:${RAR[r.cards].col}">🃏</div>`;
  return r.gold ? '<i class="coin pBig"></i>' : '<i class="gemI pBig"></i>';
}
function passLbl(r) { return r.skin ? '🏰 ' + SKIN_BY[r.skin].name : r.emote ? EMOTE_BY[r.emote].e + ' ' + EMOTE_BY[r.emote].name : r.chest ? CHESTS[r.chest].n : r.cards ? `${r.n} ${RAR[r.cards].n}` : r.gold ? r.gold : r.gems; }
function passScreen() {
  const tier = passTier(), days = Math.max(1, Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1) - Date.now()) / 864e5));
  const cell = (p, prem) => { const r = prem ? p.prem : p.free, got = (prem ? PF.pass.p : PF.pass.f).includes(p.t), can = passClaimable(p.t, prem), lock = p.t > tier || (prem && !PF.pass.prem);
    return `<div class="pCell ${prem ? 'prem' : ''} ${got ? 'got' : ''} ${can ? 'can' : ''} ${lock ? 'lock' : ''}" data-t="${p.t}" data-p="${prem ? 1 : 0}">${passIco(r)}<div class="pl ts">${passLbl(r)}</div>${got ? '<b class="pOk">✔</b>' : can ? '<b class="pTap ts">AL</b>' : lock && prem && !PF.pass.prem ? '<b class="pLock">🔒</b>' : ''}</div>`; };
  modal(`<div class="passScr">
    <div class="pHead ts"><div class="pInfo"><div class="pPill">⏱ ${days} gün</div><div class="pPill"><span class="pDia">${tier}</span>👑 ${tier >= PASS_TIERS ? 'MAKS' : (PF.pass.crowns % PASS_CROWNS) + '/' + PASS_CROWNS}</div></div>
      <div class="pBan ${PF.pass.prem ? 'on' : ''}"><div class="pCr">👑</div><b>Pass Royale</b><i>${PF.pass.prem ? 'Premium!' : 'Ücretsiz'}</i></div></div>
    <div class="pCols ts"><span>Ücretsiz</span><span>Premium</span></div>
    <div class="pList" id="pList">${PASS.map(p => `<div class="pRow ${p.t <= tier ? 'done' : ''}">${cell(p, false)}<div class="pDia big ${p.t <= tier ? 'on' : ''}">${p.t}</div>${cell(p, true)}</div>`).join('')}</div>
    <div class="pLoop ts" id="pLoop"><div class="pDia">∞</div><div class="grow"><b>Şanslı Döngü</b><div class="muted">${tier >= PASS_TIERS ? `Her ${PASS_LOOP} taçta bir sandık` : 'Son kademeden sonra açılır'}</div></div>${passLoopN() > 0 ? `<button class="btn green sm" id="loopGo">Al (${passLoopN()})</button>` : ''}</div>
    ${PF.pass.prem ? '' : `<button class="btn gold pBuy" id="passBuy">👑 Premium'u Aç <i class="gemI"></i> ${PASS_PRICE}</button>`}
  </div>`);
  const L = $('pList'); L.querySelectorAll('[data-skc]').forEach(c => drawSkinPreview(c, c.dataset.skc));
  const row = L.children[Math.min(PASS_TIERS - 1, tier)]; if (row) L.scrollTop = row.offsetTop - L.clientHeight / 2;
  L.querySelectorAll('.pCell').forEach(c => { c.onclick = () => {
    const t = +c.dataset.t, prem = c.dataset.p === '1';
    if (prem && !PF.pass.prem) { sfx('nope'); toast('👑 Premium yol kilitli'); return; }
    const r = claimPass(t, prem); if (!r) { sfx('nope'); toast(t > tier ? `Kademe ${t} için ${t * PASS_CROWNS - PF.pass.crowns} taç daha` : 'Zaten alındı'); return; }
    const keep = L.scrollTop;
    if (r.cards && r.cards.length) { closeModal(); chestOpen(r); } else { sfx('crown'); toast(r.skin ? '🏰 Yeni kule: ' + SKIN_BY[r.skin].name + '!' : r.emote ? '😂 Yeni emoji: ' + EMOTE_BY[r.emote].name + '!' : `${r.gold ? '<i class="coin"></i> +' + r.gold : ''} ${r.gems ? '<i class="gemI"></i> +' + r.gems : ''}`); passScreen(); $('pList').scrollTop = keep; }
    refreshTop(); if (TAB === 'battle') renderBattle();
  }; });
  const lg = $('loopGo'); if (lg) lg.onclick = () => { const r = claimLoop(); if (r) { closeModal(); chestOpen(r); refreshTop(); } };
  const pb = $('passBuy'); if (pb) pb.onclick = () => { if (buyPass()) { sfx('upgrade'); toast('👑 Pass Royale Premium açıldı!'); passScreen(); refreshTop(); if (TAB === 'battle') renderBattle(); } else { sfx('nope'); toast('Yeterli elmas yok'); } };
}

// ---------- Kupa yolu (Clash Royale tarzı basamaklar + arena başlıkları) ----------
function roadIco(r) { return r.chest ? `<div style="width:calc(var(--u)*44);height:calc(var(--u)*36)">${chestIco(r.chest)}</div>` : r.gold ? '<i class="coin"></i>' : r.gems ? '<i class="gemI"></i>' : r.cards ? '🃏' : r.emote ? `<img src="${cardImg(EMOTE_BY[r.emote].img)}" style="height:calc(var(--u)*38)">` : ''; }
function roadLbl(r) { return r.chest ? CHESTS[r.chest].n : r.gold ? `${r.gold} altın` : r.gems ? `${r.gems} elmas` : r.cards ? `${r.n} ${RAR[r.cards].n} kart` : r.emote ? `Emoji: ${EMOTE_BY[r.emote].name} ${EMOTE_BY[r.emote].e}` : ''; }
function renderRoad() {
  const T = $('tab-road'), ar = arenaIdx(), nodes = [];
  ARENAS.forEach((A, k) => nodes.push({ tr: A.tr, arena: k }));
  ROAD.forEach((r, k) => nodes.push({ tr: r.tr, road: k }));
  nodes.sort((a, b) => b.tr - a.tr || (a.arena !== undefined ? 1 : -1));   // CR gibi: aşağıdan yukarı ilerler
  let html = `<div class="panel ts rhead"><div class="ttl" style="margin:0">🏆 ${PF.trophies} <span class="muted">en yüksek ${PF.best}</span></div><div class="muted">Galibiyet ${PF.stats.w} · Mağlubiyet ${PF.stats.l} · 3 taç ${PF.stats.three}</div></div><div class="rpath" id="rpath"><div class="rfill" id="rfill"></div>`;
  for (const n of nodes) {
    if (n.arena !== undefined) {
      const A = ARENAS[n.arena], cards = CARDS.filter(c => CARD_ARENA[c.id] === n.arena);
      html += `<div class="rarena ts" data-tr="${n.tr}"><canvas id="ap${n.arena}"></canvas><div class="an">Arena ${n.arena + 1}: ${A.name}</div><div class="at">🏆 ${A.tr}</div>${n.arena > ar ? '<div class="lock">🔒</div>' : ''}
        <div class="muted" style="padding:6px 8px 0">Bu arenada açılan kartlar:</div><div class="cards">${cards.map(c => cardHTML(c.id, { lvl: 0, cls: owned(c.id) ? '' : 'locked' })).join('')}</div></div>`;
    } else {
      const r = ROAD[n.road], done = PF.road.includes(n.road), can = roadClaimable(n.road), got = PF.best >= r.tr;
      html += `<div class="rstep ts ${got ? 'got' : ''} ${done ? 'done' : ''} ${can ? 'can' : ''}" data-tr="${r.tr}"><span class="trb">🏆 ${r.tr}</span><div class="ico">${roadIco(r)}</div><div class="lbl">${roadLbl(r)}${r.big ? ' <span style="color:#ffd447">★ Arena ödülü</span>' : ''}</div>${done ? '✔' : can ? `<button class="btn green sm" data-r="${n.road}">Al</button>` : '🔒'}</div>`;
    }
  }
  T.innerHTML = html + '</div>';
  ARENAS.forEach((A, k) => { const c = $('ap' + k); if (c) drawArenaPreview(c, k); });
  // ilerleme çizgisi ve "buradasın" işareti
  const path = $('rpath'), items = [...path.querySelectorAll('[data-tr]')];
  let mark = items[items.length - 1];
  for (const it of items) if (+it.dataset.tr <= PF.trophies) { mark = it; break; }
  if (mark) {
    const y = mark.offsetTop + mark.offsetHeight / 2, f = $('rfill'); f.style.top = y + 'px'; f.style.bottom = '0';
    path.insertAdjacentHTML('beforeend', `<div class="youHere ts" style="top:${y}px"><img src="${cardImg('bulgur')}"><b>🏆${PF.trophies}</b></div>`);
    setTimeout(() => { T.scrollTop = Math.max(0, y - T.clientHeight * 0.4); }, 0);
  }
  T.querySelectorAll('[data-r]').forEach(b => { b.onclick = () => {
    const r = claimRoad(+b.dataset.r); if (!r) { sfx('nope'); return; }
    if (r.cards && r.cards.length) chestOpen(r); else { toast(r.emote ? `😂 Yeni emoji: ${EMOTE_BY[r.emote].name}!` : `${r.gold ? '<i class="coin"></i> +' + r.gold : ''} ${r.gems ? '<i class="gemI"></i> +' + r.gems : ''}`); sfx('crown'); }
    renderRoad(); refreshTop();
  }; });
  T.querySelectorAll('.rarena .card').forEach(c => { c.onclick = () => cardModal(c.dataset.id, -1); });
}

// ---------- Arkadaşla oyna ----------
function renderSocial() {
  const T = $('tab-social');
  T.innerHTML = `<div class="panel ts"><div class="ttl">👥 Arkadaşla Oyna</div><div class="muted">Sunucu yok: kodu kopyalayıp arkadaşına (WhatsApp vb.) gönder, onun verdiği kodu buraya yapıştır. Kupa değişmez.</div></div>
    <div class="panel ts"><div class="ttl">1) Oda kur</div><button class="btn green sm" id="nHost">Oda Kur</button>
      <div id="hostBox" style="display:none;margin-top:8px"><div class="muted">Bu kodu arkadaşına gönder:</div><textarea id="hostCode" readonly></textarea><button class="btn blue sm" id="copyHost">Kopyala</button>
      <div class="muted" style="margin-top:8px">Arkadaşının cevap kodu:</div><textarea id="ansCode"></textarea><button class="btn sm" id="nAccept">Bağlan</button></div></div>
    <div class="panel ts"><div class="ttl">2) Odaya katıl</div><div class="muted">Arkadaşının oda kodu:</div><textarea id="joinCode"></textarea><button class="btn green sm" id="nJoin">Katıl</button>
      <div id="joinBox" style="display:none;margin-top:8px"><div class="muted">Bu cevap kodunu arkadaşına gönder:</div><textarea id="replyCode" readonly></textarea><button class="btn blue sm" id="copyReply">Kopyala</button></div></div>
    <div class="panel ts"><div class="ttl">Durum: <span id="netSt">${NET.open ? 'Bağlı ✔' : 'Bağlı değil'}</span></div><div id="netInfo" class="muted"></div><button class="btn sm ${NET.open && NET.role === 'host' && NET.peer ? '' : 'off'}" id="nStart">⚔️ Maçı Başlat</button></div>`;
  const busy = (b, t) => { b.disabled = true; b.textContent = t; };
  $('nHost').onclick = async () => { busy($('nHost'), 'Hazırlanıyor...'); try { const code = await netHost(); $('hostCode').value = code; $('hostBox').style.display = ''; $('nHost').textContent = 'Oda hazır'; } catch (e) { toast('Oda kurulamadı: ' + e.message); } };
  $('copyHost').onclick = () => copyText($('hostCode').value);
  $('nAccept').onclick = async () => { try { await netHostAccept($('ansCode').value); $('netSt').textContent = 'Bağlanıyor...'; } catch (e) { toast('Kod hatalı: ' + e.message); } };
  $('nJoin').onclick = async () => { busy($('nJoin'), 'Hazırlanıyor...'); try { const code = await netJoin($('joinCode').value); $('replyCode').value = code; $('joinBox').style.display = ''; $('nJoin').textContent = 'Cevap hazır'; } catch (e) { $('nJoin').disabled = false; $('nJoin').textContent = 'Katıl'; toast('Kod hatalı: ' + e.message); } };
  $('copyReply').onclick = () => copyText($('replyCode').value);
  $('nStart').onclick = () => { if (NET.open && NET.role === 'host' && NET.peer) hostStartOnline(); else { sfx('nope'); toast('Önce bağlantı kurun'); } };
  if (NET.peer) $('netInfo').textContent = `Rakip: ${NET.peer.name} · 🏆 ${NET.peer.tr} · Kral ${NET.peer.kl}`;
}
function copyText(t) { try { navigator.clipboard.writeText(t).then(() => toast('Kopyalandı')); } catch (e) { toast('Kopyalanamadı, elle seç'); } }

// ---------- Ayarlar ----------
$('btnSet').onclick = function openSet() {
  modal(`<div class="ttl ts">⚙️ Ayarlar</div><div class="muted">Oyuncu adı</div><input id="nmIn" maxlength="16" value="${PF.name}" style="width:100%;font:16px var(--f);padding:8px;border-radius:8px;border:2px solid #000;margin:6px 0 12px">
    ${sysRowHTML()}<div class="mbtns"><button class="btn green" id="nmOk">Kaydet</button><button class="btn red" id="rst">İlerlemeyi sıfırla</button></div>
    <div class="cheatBox"><div class="ttl ts" style="font-size:calc(var(--u)*15)">🧪 Hile</div><div class="cheats"><button class="btn sm" data-ch="tr">🏆 +500</button><button class="btn sm" data-ch="gold">🪙 +10000</button><button class="btn sm" data-ch="gems">💎 +5000</button><button class="btn sm" data-ch="cr">👑 +30 taç</button></div></div>
    <div class="muted" style="margin-top:12px">Kısayollar: 1-4 kart seç · E emoji · F tam ekran · Esc teslim ol</div>`);
  bindSysRow(openSet);
  document.querySelectorAll('[data-ch]').forEach(b => { b.onclick = () => { const k = b.dataset.ch;
    if (k === 'tr') { PF.trophies += 500; PF.best = Math.max(PF.best, PF.trophies); } else if (k === 'gold') PF.gold += 10000; else if (k === 'gems') PF.gems += 5000; else PF.pass.crowns += 30;
    saveP(); sfx('crown'); refreshTop(); renderTab(); toast('🧪 ' + b.textContent); }; });
  $('nmOk').onclick = () => { PF.name = ($('nmIn').value || PF.name).slice(0, 16); saveP(); closeModal(); refreshTop(); };
  $('rst').onclick = () => { if (confirm('Tüm ilerleme silinsin mi?')) { PF = newProfile(); saveP(); closeModal(); renderTab(); } };
};

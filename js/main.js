// ================= Oyun kontrolü: maç akışı, sürükle-bırak, döngü, emojiler, çevrimiçi =================
let GAME = null, last = 0;


// ---------- Yerleşim ----------
function layoutAll() {
  const VW = innerWidth, VH = innerHeight, DPR = Math.min(2, devicePixelRatio || 1);
  const inGame = $('game').classList.contains('active');
  if (!inGame) { const cw = Math.min(VW, Math.max(320, VH * 0.56)); $('app').style.setProperty('--u', cw / 400 + 'px'); document.body.classList.toggle('wide', VW - cw > 170); return; }
  // Üst bilgi arenanın üstüne biner; kral kulesi ve can barı için yukarıda KTOP kare yer ayrılır
  const KTOP = 3;
  let S = Math.min(VW / 18.6, (VH - 240) / (BOARD_K + KTOP));
  for (let i = 0; i < 5; i++) {
    S = Math.floor(S * DPR) / DPR;
    const uw = Math.min(VW, W * S * 1.15);
    $('app').style.setProperty('--u', uw / 400 + 'px');
    const gc = $('gcol'); gc.style.width = uw + 'px'; gc.style.left = Math.round((VW - uw) / 2) + 'px';
    const ns = Math.min(VW / 18.6, (VH - $('gpanel').offsetHeight - 10) / (BOARD_K + KTOP));
    if (Math.abs(ns - S) < 0.3) { S = Math.floor(ns * DPR) / DPR; break; }
    S = ns;
  }
  const ph = $('gpanel').offsetHeight, uw = Math.min(VW, W * S * 1.15);
  document.body.classList.toggle('wide', VW - uw > 170);
  resizeCanvas(VW, VH, DPR);
  setView(S, Math.round(VW / 2), Math.round(KTOP * S + (VH - ph - 10 - S * (BOARD_K + KTOP)) / 2), GAME ? GAME.me === 1 : false, GAME ? GAME.me : 0);
  R.arena = GAME ? GAME.arena : arenaIdx();
  if (GAME && GAME.B) renderFrame(GAME.B, 0);
}
addEventListener('resize', layoutAll);

// ---------- Maç başlatma ----------
function startLadder() { const ar = arenaIdx(); startBot({ diff: ar < 1 ? 0 : ar < 3 ? 1 : 2, ladder: true }); }
function startTraining() { startBot({ diff: PF.diff, ladder: false }); }
// ---------- Parti modları (kupasız, Parti Arenası) ----------
function startMode(id) {
  const ar = arenaIdx(), lvAll = {}; CARDS.forEach(c => { lvAll[c.id] = clamp(PF.kl, 1, MAX_LVL); });
  const diff = PF.diff, bdeck = () => diff === 3 ? proDeck(5) : botDeck(Math.max(ar, 3)), oppName = pick(BOT_NAMES);
  const go = (myDeck, oppDeck, extra, x2, lv) => vsScreen(PF.name, '🎉', PF.kl, myDeck[0], extra ? oppName + ' & ' + pick(BOT_NAMES) : oppName, '🎉', PF.kl, oppDeck[0], () => {
    const L = lv || deckLevels(myDeck), bl = {}; oppDeck.forEach(k => { bl[k] = lv ? lv[k] : clamp(Math.round(Object.values(L).reduce((s, v) => s + v, 0) / 8), 1, MAX_LVL); });
    const B = createBattle({ decks: [myDeck, oppDeck], levels: [L, bl], kl: [PF.kl, PF.kl], names: [PF.name, oppName], skins: [PF.skin, 'klasik'], x2, extra });
    const ais = []; if (extra) { ais.push(aiCreate(0, Math.max(2, diff), B.px[0], 1), aiCreate(1, diff, B.px[1], 1)); }
    beginGame({ mode: 'party', B, me: 0, ai: aiCreate(1, diff, undefined, extra ? 0 : undefined), ais, arena: 'party', duo: !!extra });
    if (extra) setTimeout(() => toast('👥 Takım arkadaşın: ' + B.px[0].name), 600);
  });
  if (id === 'duel') go(curDeck(), bdeck());
  else if (id === 'x2') go(curDeck(), bdeck(), null, true);
  else if (id === 'duo') { const a = botDeck(Math.max(ar, 2)), e2 = bdeck(); go(curDeck(), bdeck(), [{ team: 0, deck: a, name: pick(BOT_NAMES), levels: deckLevels(curDeck()) }, { team: 1, deck: e2, name: 'Rakip 2' }]); }
  else {   // çekiliş: arenada, savaş müziğiyle başlar; bitince aynı ekranda maç başlar
    const ph = createBattle({ decks: [curDeck(), curDeck()], levels: [{}, {}], kl: [PF.kl, PF.kl], names: [PF.name, oppName], skins: [PF.skin, 'klasik'] });
    beginGame({ mode: 'party', B: ph, me: 0, arena: 'party', draft: true }); layoutAll();
    arenaDraft(id, oppName, (mine, theirs) => {
      const B = createBattle({ decks: [mine, theirs], levels: [lvAll, lvAll], kl: [PF.kl, PF.kl], names: [PF.name, oppName], skins: [PF.skin, 'klasik'] });
      GAME.B = B; GAME.ai = aiCreate(1, diff); GAME.draft = false; GAME.handKey = ''; renderHand(); layoutAll(); banner('SAVAŞ!'); sfx('vs');
    });
  }
}
function draftScreen(kind, done) {
  const pool = shuffle(CARDS.map(c => c.id)), mine = [], theirs = []; let k = 0;
  const take = () => pool.splice(0, 1)[0];
  const round = () => {
    if (mine.length >= 8) { closeModal(); done(mine, theirs.slice(0, 8)); return; }
    const opts = kind === 'mega' ? [[take(), take()], [take(), take()]] : [[take()], [take()], [take()]];
    modal(`<div class="ts draftBox"><div class="ttl">${kind === 'mega' ? '🃏 Mega Çekiliş' : '🎴 Üçlü Çekiliş'}</div><div class="muted">${mine.length}/8 · ${kind === 'mega' ? 'Bir çift seç, diğeri rakibe gider' : 'Birini seç, rakip kalanlardan alır'}</div>
      <div class="draftOpts ${kind}">${opts.map((g, i) => `<div class="dOpt" data-o="${i}">${g.map(id => cardHTML(id, { lvl: 0 })).join('')}</div>`).join('')}</div>
      <div class="draftMine">${Array.from({ length: 8 }, (_, i) => mine[i] ? cardHTML(mine[i], { lvl: 0 }) : '<div class="dEmpty"></div>').join('')}</div></div>`);
    $('mX').style.display = 'none';
    $('mbox').querySelectorAll('.dOpt').forEach(d => { d.onclick = () => {
      const i = +d.dataset.o, rest = opts.filter((_, j) => j !== i); sfx('paper');
      mine.push(...opts[i]); if (kind === 'mega') theirs.push(...rest[0]); else theirs.push(rest[Math.random() * rest.length | 0][0]);
      if (mine.length > 8) mine.length = 8; round();
    }; });
  };
  round();
}
function startBot(o) {
  const ar = arenaIdx(), deck = curDeck(), lv = deckLevels(deck), avg = Math.round(deck.reduce((s, id) => s + lv[id], 0) / 8);
  const bd = o.diff === 3 ? proDeck(ar) : botDeck(ar), blv = {}; bd.forEach(id => { blv[id] = clamp(o.diff === 3 ? avg + 1 : avg + (Math.random() < 0.3 ? 1 : Math.random() < 0.3 ? -1 : 0), 1, MAX_LVL); });
  const oppTr = Math.max(0, PF.trophies + Math.round(rnd(-60, 60))), oppName = pick(BOT_NAMES);
  vsScreen(PF.name, PF.trophies, PF.kl, deck[0], oppName, oppTr, PF.kl, bd[0], () => {
    const B = createBattle({ decks: [deck, bd], levels: [lv, blv], kl: [PF.kl, PF.kl], names: [PF.name, oppName], skins: [PF.skin, ar >= 2 && Math.random() < 0.5 ? pick(TOWER_SKINS).id : 'klasik'] });
    beginGame({ mode: o.ladder ? 'ladder' : 'train', B, me: 0, ai: aiCreate(1, o.diff), oppTr, arena: ar });
  });
}
function vsScreen(n0, tr0, kl0, c0, n1, tr1, kl1, c1, cb) {
  $('vsNameB').textContent = n0; $('vsSubB').textContent = `🏆 ${tr0} · Kral ${kl0}`; $('vsImgB').src = cardImg(c0);
  $('vsNameT').textContent = n1; $('vsSubT').textContent = `🏆 ${tr1} · Kral ${kl1}`; $('vsImgT').src = cardImg(c1);
  const v = $('vs'); v.querySelectorAll('.vsHalf,.vsTxt').forEach(x => { x.style.animation = 'none'; void x.offsetWidth; x.style.animation = ''; });
  show('vs'); sfx('vs'); playMusic('');
  setTimeout(cb, 2300);
}
function beginGame(g) {
  GAME = Object.assign({ sel: -1, drag: null, ended: false, handKey: '', hud: {}, snapT: 0, evq: [], aiEmoT: 0 }, g);
  R.parts = []; R.corpses = []; R.rs.clear(); R.emotes = []; R.freezes = []; R.crownFly = []; R.preview = null; R.flash = null; R.shake = 0;
  if (GAME.B) { const P = GAME.B.p, opp = P[1 - GAME.me]; $('oppName').textContent = opp.name; $('oppKl').textContent = opp.kl; $('myName').textContent = P[GAME.me].name; }
  $('emoMenu').classList.remove('on'); $('hand').innerHTML = ''; $('next').innerHTML = '';
  ['crRn', 'crBn'].forEach(k => { $(k).textContent = '0'; });
  show('game'); if (GAME.B) { renderHand(); layoutAll(); } playMusic('battle');   // kartlar çizildikten sonra panel yüksekliği doğru ölçülür
  if (GAME.ai && Math.random() < 0.6) setTimeout(() => GAME && !GAME.ended && botEmote('start'), 2500 + Math.random() * 2000);
  if (!PF.tut && GAME.mode !== 'guest' && GAME.mode !== 'host') { PF.tut = 1; saveP(); [[600, '👇 Bir kartı sürükle ve kendi yarına bırak'], [5000, '💧 Kartlar iksir harcar; iksir zamanla dolar'], [10500, '🏰 Prenses kulelerini yık, sonra kral kulesine saldır!'], [16500, '😂 Sağdaki düğmeyle emoji atabilirsin']].forEach(([d, t]) => setTimeout(() => GAME && !GAME.ended && toast(t, 3600), d)); }
  last = performance.now(); requestAnimationFrame(frame);
}

// ---------- El (kartlar) ----------
function handState() { const P = GAME.B.p[GAME.me]; return P; }
function renderHand() {
  const P = handState(), hand = $('hand'); hand.innerHTML = '';
  P.hand.forEach((id, i) => {
    const evoS = P.evoIds && P.evoIds.includes(id), cyc = evoCycles(id), ch = evoS ? Math.min(P.evoCharge[id], cyc) : 0, ready = evoS && ch >= cyc;
    const d = el(cardHTML(id, { lvl: 0, champ: id === P.champId, gem: evoS ? (ready ? 'evo on' : 'evo') : '', cls: (ready ? 'evo ' : '') + (GAME.sel === i ? 'sel ' : '') + (P.elixir < BY_ID[id].cost ? 'cant' : ''), pips: evoS && !ready ? [ch, cyc] : null }));
    d.dataset.i = i;
    d.addEventListener('pointerdown', e => startDrag(e, i));
    hand.appendChild(d);
  });
  const nid = P.queue[0]; $('next').innerHTML = nid ? cardHTML(nid, { lvl: 0, champ: nid === P.champId }) : '';
  GAME.handKey = P.hand.join() + JSON.stringify(P.evoCharge || {}) + GAME.sel;
}
function refreshHand() {
  const P = handState(), key = P.hand.join() + JSON.stringify(P.evoCharge || {}) + GAME.sel;
  if (key !== GAME.handKey) return renderHand();
  [...$('hand').children].forEach((d, i) => { const c = BY_ID[P.hand[i]].cost, k = clamp(P.elixir / c, 0, 1); d.classList.toggle('cant', k < 1); d.style.setProperty('--fill', (k * 100).toFixed(1) + '%'); });
}

// ---------- Sürükle-bırak / dokun-yerleştir ----------
function boardPoint(cx, cy) { const p = unP(cx, cy), pr = $('gpanel').getBoundingClientRect(); return Object.assign(p, { inBoard: cy < pr.top - 4 && p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H }); }
function updatePreview(idx, cx, cy) {
  const P = handState(), id = P.hand[idx], c = BY_ID[id], p = boardPoint(cx, cy);
  let x = p.x, y = p.y; if (c.type !== 'spell') { x = Math.floor(x) + 0.5; y = Math.floor(y) + 0.5; }
  const evo = P.evoIds.includes(id) && P.evoCharge[id] >= evoCycles(id);
  let ok = p.inBoard && canPlace(GAME.B, GAME.me, c, x, y);
  // Clash Royale gibi: kırmızı (yasak) bölgeye sürüklenen kart en yakın konulabilir kareye kayar
  if (p.inBoard && !ok && c.type !== 'spell') {
    let best = null, bd = 1e9;
    for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
      const cx2 = tx + 0.5, cy2 = ty + 0.5, d = (cx2 - p.x) ** 2 + (cy2 - p.y) ** 2;
      if (d < bd && canPlace(GAME.B, GAME.me, c, cx2, cy2)) { bd = d; best = [cx2, cy2]; }
    }
    if (best) { [x, y] = best; ok = true; }
  }
  R.preview = { card: id, x, y, inBoard: p.inBoard, ok, evo };
  return R.preview;
}
function tryPlay(idx, cx, cy) {
  const pv = updatePreview(idx, cx, cy), P = handState(), c = BY_ID[P.hand[idx]];
  if (!pv.inBoard) return false;
  if (P.elixir < c.cost) { sfx('nope'); flashGas(); return false; }
  if (!pv.ok) { sfx('nope'); return false; }
  if (GAME.mode === 'guest') { netSend({ t: 'play', idx, x: pv.x, y: pv.y }); GAME.sel = -1; R.preview = null; sfx('card'); return true; }
  const ok = playCard(GAME.B, GAME.me, idx, pv.x, pv.y);
  if (ok) { GAME.sel = -1; R.preview = null; renderHand(); }
  return ok;
}
function flashGas() { const g = $('gasTrack'); g.style.outline = '3px solid #ff3b3b'; setTimeout(() => { g.style.outline = ''; }, 250); }
function startDrag(e, i) {
  if (!GAME || GAME.ended) return;
  e.preventDefault(); unlockAudio();
  GAME.drag = { i, x0: e.clientX, y0: e.clientY, moved: false };
  const dc = $('dragCard'); dc.innerHTML = cardHTML(handState().hand[i], { lvl: 0 });
  sfx('card');
}
addEventListener('pointermove', e => {
  if (!GAME || GAME.ended) return;
  const d = GAME.drag;
  if (d) {
    if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 10) d.moved = true;
    if (!d.moved) return;
    const pv = updatePreview(d.i, e.clientX, e.clientY), dc = $('dragCard');
    dc.style.display = pv.inBoard ? 'none' : 'block'; dc.style.left = e.clientX + 'px'; dc.style.top = e.clientY + 'px';
  } else if (GAME.sel >= 0) updatePreview(GAME.sel, e.clientX, e.clientY);
});
addEventListener('pointerup', e => {
  if (!GAME) return;
  const d = GAME.drag; GAME.drag = null; $('dragCard').style.display = 'none';
  if (!d) return;
  if (d.moved) { if (!tryPlay(d.i, e.clientX, e.clientY)) R.preview = GAME.sel >= 0 ? R.preview : null; }
  else { GAME.sel = GAME.sel === d.i ? -1 : d.i; if (GAME.sel < 0) R.preview = null; renderHand(); }
});
cv.addEventListener('pointerdown', e => { if (!GAME || GAME.ended || GAME.sel < 0) return; unlockAudio(); tryPlay(GAME.sel, e.clientX, e.clientY); });
addEventListener('keydown', e => {
  if (e.key === 'f' || e.key === 'F') return toggleFull();
  if (!GAME || GAME.ended || !$('game').classList.contains('active')) return;
  if ('1234'.includes(e.key)) { GAME.sel = +e.key - 1; renderHand(); }
  if (e.key === 'e' || e.key === 'E') $('emoMenu').classList.toggle('on');
  if (e.key === 'Escape') surrender();
});
function musicFilesHTML() { return `<div class="muted" style="font-size:12px">🎵 Müzik dosyaları (muzik/ klasörü): ${Object.entries(MUSIC_FILES).map(([m, n]) => `${hasFile(m) ? '✔' : '✖'} ${n}`).join(' · ')}</div>`; }
function volRowHTML() { return [['main', '🔊 Genel ses'], ['music', '🎵 Müzik'], ['sfx', '💥 Efektler']].map(([k, t]) => `<div class="volRow ts"><span>${t}</span><input type="range" min="0" max="100" step="1" value="${Math.round(VOL[k] * 100)}" data-vol="${k}"><b>${Math.round(VOL[k] * 100)}</b></div>`).join(''); }
function sysRowHTML() { return volRowHTML() + musicFilesHTML() + `<div class="sysRow"><button class="btn blue" id="sMus">🎵 Müzik: ${musicOn ? 'Açık' : 'Kapalı'}</button><button class="btn blue" id="sSnd">${muted ? '🔇 Ses: Kapalı' : '🔊 Ses: Açık'}</button></div><div class="sysRow"><button class="btn blue" id="sFull">⛶ Tam ekran</button></div>`; }
function bindSysRow(again) {
  $('sMus').onclick = () => { setMusicOn(!musicOn); again(); };
  $('sSnd').onclick = () => { muted = !muted; try { localStorage.setItem('bulgurSnd', muted ? '0' : '1'); } catch (e) {} refreshSys(); again(); };
  $('sFull').onclick = () => { toggleFull(); closeModal(); };
  document.querySelectorAll('[data-vol]').forEach(inp => {
    inp.oninput = () => { setVol(inp.dataset.vol, inp.value / 100); inp.nextElementSibling.textContent = inp.value; };
    inp.onchange = () => { if (inp.dataset.vol !== 'music') { sndBudget = 3; lastFart = 0; fart(1.2, 0.25, 0.35); sfx('click'); } };   // deneme sesi
  });
}
function gameMenu() {
  modal(`<div class="ttl ts" style="text-align:center">Menü</div>${sysRowHTML()}<div class="mbtns"><button class="btn red" id="gSur">🏳 Teslim ol</button><button class="btn green" id="gBack">Devam</button></div>`);
  bindSysRow(gameMenu); $('gBack').onclick = closeModal; $('gSur').onclick = () => { closeModal(); surrender(); };
}
$('gGear').onclick = () => { if (GAME && !GAME.ended) gameMenu(); };
function surrender() {
  modal(`<div class="ttl ts" style="text-align:center">Teslim olunsun mu?</div><div class="muted" style="text-align:center;margin-bottom:12px">${GAME.mode === 'ladder' ? 'Kupa kaybedersin.' : ''}</div><div class="mbtns"><button class="btn red" id="sYes">Teslim ol</button><button class="btn blue" id="sNo">Devam</button></div>`);
  $('sNo').onclick = closeModal;
  $('sYes').onclick = () => { closeModal(); if (!GAME) return; if (GAME.mode === 'guest') { netSend({ t: 'surrender' }); return; } endBattle(GAME.B, 1 - GAME.me); };
}

// ---------- Emojiler (Clash Royale tarzı tepsi: hazır sözler + 8 emoji + rakibi sustur) ----------
// key: { p: söz sırası } ya da { e: emoji kimliği }
function buildEmoMenu() {
  const m = $('emoMenu'); m.innerHTML = '';
  const ph = el(`<div class="emoPh">${PHRASES.map((t, i) => `<b class="ts" data-p="${i}">${t}</b>`).join('')}</div>`);
  ph.querySelectorAll('b').forEach(b => { b.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); sendEmote({ p: +b.dataset.p }); m.classList.remove('on'); }; });
  m.appendChild(ph);
  const grid = el('<div class="emoGrid"></div>');
  PF.emoDeck.forEach(id => { const em = EMOTE_BY[id]; if (!em) return; const d = el(`<div class="emoTile"><img class="head" src="${cardImg(em.img)}" style="height:${Math.round(60 / headNeck(em.img))}%"><span>${em.e}</span></div>`); d.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); sendEmote({ e: id }); m.classList.remove('on'); }; grid.appendChild(d); });
  m.appendChild(grid);
  const mute = el(`<b class="emoMute ts">${GAME && GAME.muteOpp ? '🔇 Rakip susturuldu' : '🔈 Rakibi sustur'}</b>`);
  mute.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); if (GAME) { GAME.muteOpp = !GAME.muteOpp; R.emotes = R.emotes.filter(x => x.team === GAME.me); } buildEmoMenu(); };
  m.appendChild(mute);
}
$('emoBtn').onpointerdown = e => { e.preventDefault(); buildEmoMenu(); $('emoMenu').classList.toggle('on'); };
function showEmote(team, key, side = 1) {   // side: ekranda 0 sol, 1 sağ (2v2: soldaki oyuncu solda)
  if (GAME && GAME.muteOpp && team !== GAME.me) return;
  if (GAME && GAME.duo && team === GAME.me && side === 1 && key.own) side = 0;
  if (R.emotes.some(m => m.team === team && m.side === side && m.t > 1.2)) return;
  R.emotes = R.emotes.filter(m => !(m.team === team && m.side === side));
  if (key.p !== undefined) { R.emotes.push({ team, side, ph: PHRASES[key.p], t: 2.2 }); sfx('reveal'); return; }
  const em = EMOTE_BY[key.e]; if (!em) return;
  R.emotes.push({ team, side, em: key.e, t: 2.4 });
  em.s.forEach(([d, p, du]) => setTimeout(() => { sndBudget = 3; lastFart = 0; fart(p, du, 0.45); }, d));
}
function sendEmote(key) {
  if (!GAME || GAME.ended) return;
  showEmote(GAME.me, key, GAME.duo ? 0 : 1);
  if (GAME.mode === 'host' || GAME.mode === 'guest') netSend({ t: 'emo', k: key });
  else if (Math.random() < 0.5) setTimeout(() => GAME && !GAME.ended && botEmote(key.p !== undefined ? 'reply' : 'troll'), 1100 + Math.random() * 900);
}
// Bot da trol: emojiyle ya da sözle cevap verir
function botEmote(kind) {
  const opts = { reply: [{ p: 4 }, { p: 3 }, { e: 'bulgur_e' }], troll: [{ e: 'bulgur_e' }, { e: 'gojo_e' }, { e: 'zombi_e' }, { p: 5 }], win: [{ e: 'bulgur_e' }, { e: 'gojo_e' }, { e: 'mafya_e' }], lose: [{ e: 'omni_e' }, { e: 'japon_e' }, { p: 5 }], start: [{ p: 0 }, { p: 1 }], end: [{ p: 2 }] }[kind];
  showEmote(1, pick(opts), GAME && GAME.duo ? (Math.random() < 0.5 ? 0 : 1) : 1);
  if (GAME && GAME.duo && Math.random() < 0.35) setTimeout(() => GAME && !GAME.ended && showEmote(GAME.me, pick([{ e: 'bulgur_e' }, { p: 3 }, { e: 'gojo_e' }]), 1), 900);   // takım arkadaşı da tepki verir
}


// ---------- Döngü ----------
function frame(now) {
  if (!GAME) return;
  const dt = clamp((now - last) / 1000, 0, 0.05); last = Math.max(last, now);
  const B = GAME.mode === 'guest' ? guestView(now) : GAME.B;
  if (GAME.mode !== 'guest' && !GAME.ended && !GAME.draft) {
    stepBattle(B, dt);
    if (GAME.ai) aiThink(B, GAME.ai, dt);
    if (GAME.ai2) aiThink(B, GAME.ai2, dt);
    if (GAME.ais) for (const a of GAME.ais) aiThink(B, a, dt);
    const evs = B.ev; B.ev = [];
    handleEvents(B, evs); gameEvents(evs);
    if (GAME.mode === 'host') { GAME.evq.push(...evs.filter(e => e.e !== 'atk' || Math.random() < 0.5)); GAME.snapT -= dt; if (GAME.snapT <= 0) { GAME.snapT = 1 / 15; netSend({ t: 's', s: snapshot(B), ev: GAME.evq }); GAME.evq = []; } }
  }
  if (B) { renderFrame(B, dt); updateHud(B); }
  if (B && B.over && !GAME.ended) finishGame(B);
  requestAnimationFrame(frame);
}
function gameEvents(evs) {
  for (const ev of evs) {
    if (ev.e === 'double') { banner('2x GAZ!', 'pink'); playMusic('battle2x'); }
    if (ev.e === 'overtime') { banner('UZATMA! 3x GAZ', 'red'); playMusic('battle2x'); }
    if (ev.e === 'drain') { banner('KULELER ERİYOR!', 'red'); sfx('vs'); }
    if (ev.e === 'towerDown' && GAME.ai && !GAME.ended) setTimeout(() => GAME && botEmote(ev.team === GAME.me ? 'win' : 'lose'), 900);
  }
}
function banner(t, cls = '') { const b = $('banner'); b.textContent = t; b.className = 'on ' + cls; clearTimeout(banner.h); banner.h = setTimeout(() => { b.className = ''; }, 1600); }
$('champBtn').onpointerdown = e => { e.stopPropagation(); if (!GAME || !GAME.B) return;
  if (GAME.mode === 'guest') { netSend({ t: 'champ' }); sfx('click'); return; }
  if (useChamp(GAME.B, GAME.me)) sfx('evo'); else sfx('nope'); };
function updateHud(B) {
  const P = B.p[GAME.me], O = B.p[1 - GAME.me], h = GAME.hud;
  { const cu = B.ents.find(e => e.champ && e.team === GAME.me && e.hp > 0), cb = $('champBtn');   // şampiyon sahadaysa ulti butonu
    if (!!cu !== h.ch) { h.ch = !!cu; cb.style.display = cu ? '' : 'none'; if (cu) { $('champImg').src = cardImg(cu.img); $('champCost').textContent = cu.c.champ.abil.cost; } }
    if (cu) { const A = cu.c.champ.abil, k = cu.abCd > 0 ? cu.abCd / A.cd : 0; $('champCd').style.height = (k * 100) + '%'; cb.classList.toggle('ready', k <= 0 && P.elixir >= A.cost); cb.classList.toggle('rage', cu.rageT > 0); } }
  $('gasBar').style.transform = `scaleX(${clamp(P.elixir / 10, 0, 1)})`;
  const gi = Math.floor(P.elixir); if (h.gas !== gi) { h.gas = gi; $('gasTxt').textContent = gi; }
  const rate = B.drain ? 0 : elixirRate(B); if (h.rate !== rate) { const gm = $('gasMul'); gm.textContent = rate ? '💧 x' + rate : '⏸'; gm.className = 'ts r' + rate; gm.classList.remove('pop'); void gm.offsetWidth; gm.classList.add('pop'); h.rate = rate; $('gasTrack').classList.toggle('x2', rate > 1); $('tbox').className = 'tbox ts' + (B.ot ? ' ot' : rate > 1 ? ' x2' : ''); $('tlabel').textContent = B.ot ? 'Uzatma' : rate > 1 ? '2x Gaz' : 'Kalan süre'; }
  const m30 = B.t <= 30; if (h.m30 !== m30) { const was = h.m30; h.m30 = m30; if (m30 && was === false && !B.over) playMusic('battle30'); }   // son 30 sn müziği
  { const n = !B.over && !B.ot && B.t <= 10 && B.t > 0 ? Math.ceil(B.t) : 0;   // son 10 saniye: dev geri sayım + ses
    if (n !== h.cd) { if (n === 10 || (n && !h.cd)) playCountdown(); h.cd = n; const cd = $('cdNum'); cd.textContent = n || ''; cd.classList.remove('go'); if (n) { void cd.offsetWidth; cd.classList.add('go'); } } }
  const tt = Math.max(0, Math.ceil(B.t)); if (h.t !== tt) { h.t = tt; $('timer').textContent = Math.floor(tt / 60) + ':' + String(tt % 60).padStart(2, '0'); }
  if (h.cb !== P.crowns) { h.cb = P.crowns; $('crBn').textContent = P.crowns; }
  if (h.cr !== O.crowns) { h.cr = O.crowns; $('crRn').textContent = O.crowns; }
  refreshHand();
}
function finishGame(B) {
  stopCountdown(); $('cdNum').textContent = '';
  GAME.ended = true; R.preview = null; GAME.sel = -1;
  if (GAME.ai && Math.random() < 0.7) showEmote(1, { p: 2 });   // "İyi oyundu!"
  const me = GAME.me, win = B.winner === me ? 1 : B.winner < 0 ? -1 : 0, P = B.p[me], O = B.p[1 - me];
  banner(win === 1 ? 'ZAFER!' : win === 0 ? 'YENİLGİ' : 'BERABERE', win === 0 ? 'red' : '');
  playMusic(win === 1 ? 'win' : win === 0 ? 'lose' : 'menu');
  if (GAME.mode === 'host') netSend({ t: 's', s: snapshot(B), ev: GAME.evq });
  let rw = null;
  if (GAME.mode === 'ladder') rw = battleReward(win === 1 ? 1 : win === 0 ? 0 : -1, P.crowns, GAME.oppTr);
  setTimeout(() => showResult(win, P, O, rw), 2200);
}
function showResult(win, P, O, rw) {
  const crowns = n => [0, 1, 2].map(i => `<span class="${i < n ? '' : 'off'}">👑</span>`).join('');
  $('resNameR').textContent = O.name; $('resNameB').textContent = P.name;
  $('resCrR').innerHTML = crowns(O.crowns); $('resCrB').innerHTML = crowns(P.crowns);
  $('tagR').style.display = win === 0 ? '' : 'none'; $('tagB').style.display = win === 1 ? '' : 'none';
  $('resRew').innerHTML = rw ? `<span>🏆 ${rw.dt >= 0 ? '+' : ''}${rw.dt}</span>${rw.gold ? `<span><i class="coin"></i> +${rw.gold}</span>` : ''}${rw.passCr ? `<span>👑 +${rw.passCr} Pass</span>` : ''}${rw.chest ? `<span>${CHESTS[rw.chest].n}!</span>` : win === 1 ? '<span class="muted">Sandık yuvaları dolu</span>' : ''}` : '<span class="muted">Dostluk maçı</span>';
  show('result');
  if (rw && rw.passUp) setTimeout(() => toast(`👑 Pass Royale: Kademe ${passTier()}! Ödülünü al.`, 3000), 900);
  if (rw && rw.newArena) setTimeout(() => toast(`🎉 Yeni arena: ${ARENAS[rw.arena].name}! Yeni kartlar açıldı.`, 3500), 500);
}
$('btnResOk').onclick = () => { GAME = null; sfx('click'); show('hub'); setTab('battle'); };

// ---------- Çevrimiçi ----------
NET.on = m => {
  if (m.t === '_open') { netSend({ t: 'hello', name: PF.name, deck: curDeck(), levels: deckLevels(curDeck()), kl: PF.kl, tr: PF.trophies, skin: PF.skin }); toast('Bağlantı kuruldu!'); if (TAB === 'social') renderSocial(); return; }
  if (m.t === '_close') { toast('Bağlantı koptu'); NET.peer = null; if (GAME && (GAME.mode === 'host' || GAME.mode === 'guest') && !GAME.ended) { GAME.ended = true; setTimeout(() => { GAME = null; show('hub'); setTab('social'); }, 1500); } return; }
  if (m.t === 'hello') { NET.peer = m; if (TAB === 'social') renderSocial(); toast(`Rakip: ${m.name}`); return; }
  if (m.t === 'start' && NET.role === 'guest') {
    vsScreen(PF.name, PF.trophies, PF.kl, curDeck()[0], m.names[0], m.tr0, m.kl0, m.deck0, () => {
      beginGame({ mode: 'guest', B: null, me: 1, arena: m.arena, snaps: [], opp: m });
      $('oppName').textContent = m.names[0]; $('oppKl').textContent = m.kl0; $('myName').textContent = PF.name;
    });
    return;
  }
  if (!GAME) return;
  if (m.t === 's' && GAME.mode === 'guest') { const now = performance.now(); GAME.snaps.push({ time: now, B: fromSnapshot(m.s) }); if (GAME.snaps.length > 2) GAME.snaps.shift(); GAME.pendingEv = (GAME.pendingEv || []).concat(m.ev || []); return; }
  if (m.t === 'play' && GAME.mode === 'host') { playCard(GAME.B, 1, m.idx, m.x, m.y); return; }
  if (m.t === 'emo') { showEmote(GAME.mode === 'host' ? 1 : 0, m.k || {}); return; }
  if (m.t === 'champ' && GAME.mode === 'host') { useChamp(GAME.B, 1); return; }
  if (m.t === 'surrender' && GAME.mode === 'host') endBattle(GAME.B, 0);
};
function hostStartOnline() {
  const ar = arenaIdx(), p = NET.peer;
  netSend({ t: 'start', names: [PF.name, p.name], arena: ar, tr0: PF.trophies, kl0: PF.kl, deck0: curDeck()[0] });
  vsScreen(PF.name, PF.trophies, PF.kl, curDeck()[0], p.name, p.tr, p.kl, p.deck[0], () => {
    const B = createBattle({ decks: [curDeck(), p.deck], levels: [deckLevels(curDeck()), p.levels], kl: [PF.kl, p.kl], names: [PF.name, p.name], skins: [PF.skin, p.skin || 'klasik'] });
    beginGame({ mode: 'host', B, me: 0, arena: ar });
  });
}
// Misafir: iki anlık görüntü arasında yumuşak geçiş
function guestView(now) {
  const s = GAME.snaps; if (!s.length) return null;
  const cur = s[s.length - 1], prev = s.length > 1 ? s[0] : null, a = prev ? clamp((now - cur.time) / Math.max(30, cur.time - prev.time), 0, 1) : 1;
  const B = cur.B;
  if (!GAME.viewB) GAME.viewB = { ev: [] };
  const V = Object.assign(GAME.viewB, { t: B.t, ot: B.ot, over: B.over, winner: B.winner, p: B.p, projs: B.projs, spells: B.spells, areas: B.areas, rollers: B.rollers });
  V.ents = B.ents.map(e => { const pe = prev && prev.B.byId.get(e.id); return pe ? Object.assign({}, e, { x: lerp(pe.x, e.x, a), y: lerp(pe.y, e.y, a) }) : e; });
  V.byId = new Map(V.ents.map(e => [e.id, e])); V.tm = B.tm;
  GAME.B = V;
  if (GAME.pendingEv && GAME.pendingEv.length) { const evs = GAME.pendingEv; GAME.pendingEv = []; handleEvents(V, evs); gameEvents(evs); }
  if (!GAME.handKey) { renderHand(); $('oppName').textContent = V.p[0].name; $('oppKl').textContent = V.p[0].kl; layoutAll(); }
  return V;
}

// ---------- Tam ekran ----------
function toggleFull() {
  const d = document.documentElement;
  try {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) Promise.resolve((d.requestFullscreen || d.webkitRequestFullscreen).call(d)).catch(() => {});
    else Promise.resolve((document.exitFullscreen || document.webkitExitFullscreen).call(document)).catch(() => {});
  } catch (e) {}
}
function onFull() { document.querySelectorAll('.btnFull').forEach(b => { b.textContent = (document.fullscreenElement || document.webkitFullscreenElement) ? '🗗' : '⛶'; }); layoutAll(); setTimeout(layoutAll, 200); }
document.querySelectorAll('.btnFull').forEach(b => { b.onclick = toggleFull; });
document.querySelectorAll('.btnMus').forEach(b => { b.onclick = () => setMusicOn(!musicOn); });
document.querySelectorAll('.btnSnd').forEach(b => { b.onclick = () => { muted = !muted; try { localStorage.setItem('bulgurSnd', muted ? '0' : '1'); } catch (e) {} refreshSys(); }; });
document.addEventListener('fullscreenchange', onFull);
document.addEventListener('webkitfullscreenchange', onFull);
refreshSys();

// ---------- Açılış ----------
layoutAll();
show('hub'); setTab('battle');
if (location.hash === '#auto') { const B = createBattle({ decks: [botDeck(5), botDeck(5)], levels: [{}, {}], kl: [1, 1], names: ['Bot A', 'Bot B'] }); beginGame({ mode: 'train', B, me: 0, ai: aiCreate(1, 2), arena: 0 }); GAME.ai2 = aiCreate(0, 2); }

// seçilen kart, yay çizerek hedef slota uçar
function flyCard(src, dst, cb) {
  const c = src && src.querySelector('.card'); if (!c || !dst) { cb && cb(); return; }
  const a = c.getBoundingClientRect(), b = dst.getBoundingClientRect(), g = c.cloneNode(true);
  Object.assign(g.style, { position: 'fixed', left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', margin: 0, zIndex: 999, pointerEvents: 'none', transformOrigin: '0 0' });
  document.body.appendChild(g); sfx('whoosh');
  const sx = b.width / a.width, dx = b.left - a.left, dy = b.top - a.top, lift = -Math.min(120, Math.abs(dy) * 0.5) - 30;
  const an = g.animate([
    { transform: 'translate(0,0) scale(1) rotate(0deg)' },
    { transform: `translate(${dx * 0.5}px,${dy * 0.5 + lift}px) scale(${(1 + sx) / 2 * 1.1}) rotate(${dx > 0 ? 12 : -12}deg)`, offset: 0.5 },
    { transform: `translate(${dx}px,${dy}px) scale(${sx}) rotate(0deg)` }], { duration: 520, easing: 'cubic-bezier(.4,0,.2,1)' });
  an.onfinish = () => { g.remove(); dst.classList.add('landed'); sfx('paper'); cb && cb(); };
}
// ---------- Arena içi çekiliş ----------
// Üçlü: her turda 3 kart, birini al, rakip kalanlardan birini alır. Mega: tüm kartlar dizilir, sırayla (yılan düzeni) seçilir, iki taraf da birbirinin seçimini görür.
function arenaDraft(kind, oppName, done) {
  let ov = $('draftOv'); if (!ov) { ov = document.createElement('div'); ov.id = 'draftOv'; $('game').appendChild(ov); }
  ov.classList.add('on'); $('gpanel').classList.add('drafting');
  const mine = [], theirs = [], val = id => { const c = BY_ID[id]; return rarOrder(c.rar) * 1.2 + (cardRole(c) === 'wincon' ? 2 : 0) + (c.type === 'spell' ? 1 : 0) + Math.random(); };
  const botPick = list => { const need = r => !theirs.some(id => cardRole(BY_ID[id]) === r); return list.slice().sort((a, b) => (val(b) + (need(cardRole(BY_ID[b])) ? 1.5 : 0)) - (val(a) + (need(cardRole(BY_ID[a])) ? 1.5 : 0)))[0]; };
  const rows = () => `<div class="dRow opp"><span class="ts">🔴 ${oppName}</span>${Array.from({ length: 8 }, (_, i) => theirs[i] ? cardHTML(theirs[i], { lvl: 0 }) : '<div class="dEmpty"></div>').join('')}</div>`;
  const meRow = () => `<div class="dRow me"><span class="ts">🔵 Sen</span>${Array.from({ length: 8 }, (_, i) => mine[i] ? cardHTML(mine[i], { lvl: 0 }) : '<div class="dEmpty"></div>').join('')}</div>`;
  const finish = () => { ov.classList.remove('on'); ov.innerHTML = ''; $('gpanel').classList.remove('drafting'); done(mine, theirs); };
  if (kind === 'triple') {
    const pool = shuffle(CARDS.map(c => c.id));
    const round = () => {
      if (mine.length >= 8) return setTimeout(finish, 500);
      const opts = pool.splice(0, 3);
      ov.innerHTML = `<div class="dHead ts">🎴 Üçlü Çekiliş <i>${mine.length + 1}/8</i></div>${rows()}<div class="dOpts">${opts.map(id => `<div class="dOpt" data-id="${id}">${cardHTML(id, { lvl: 0 })}</div>`).join('')}</div><div class="dHint ts">Bir kart seç</div>${meRow()}`;
      ov.querySelectorAll('.dOpt').forEach(d => { d.onclick = () => {
        ov.querySelectorAll('.dOpt').forEach(x => { x.onclick = null; });
        const id = d.dataset.id, rest = opts.filter(x => x !== id), bp = botPick(rest), bd = ov.querySelector(`.dOpt[data-id="${bp}"]`);
        d.classList.add('picked');
        flyCard(d, ov.querySelector('.dRow.me .dEmpty'), () => { mine.push(id); d.style.visibility = 'hidden'; });
        setTimeout(() => { bd && bd.classList.add('oppPick'); flyCard(bd, ov.querySelector('.dRow.opp .dEmpty'), () => { theirs.push(bp); if (bd) bd.style.visibility = 'hidden'; setTimeout(round, 250); }); }, 380);
      }; });
    };
    round();
  } else {
    const pool = shuffle(CARDS.map(c => c.id)).slice(0, 20), owner = {};
    const order = []; for (let r = 0; order.length < 16; r++) order.push(...(r % 2 ? [1, 1] : [0, 0])); order[0] = 0; order.splice(1, 0); // yılan: S, R R, S S, R R ...
    const seq = [0]; while (seq.length < 16) { const last = seq[seq.length - 1]; seq.push(1 - last); if (seq.length < 16) seq.push(1 - last); }
    let k = 0;
    const draw = () => {
      const turn = seq[k];
      ov.innerHTML = `<div class="dHead ts">🃏 Mega Çekiliş <i>${k < 16 ? (turn === 0 ? 'Senin sıran!' : oppName + ' seçiyor...') : 'Hazır!'}</i></div>${rows()}
        <div class="dGrid">${pool.map(id => `<div class="dCell ${owner[id] === 0 ? 'mineP' : owner[id] === 1 ? 'oppP' : ''} ${turn === 0 && owner[id] === undefined && k < 16 ? 'can' : ''}" data-id="${id}">${cardHTML(id, { lvl: 0 })}${owner[id] !== undefined ? `<b class="dTag">${owner[id] === 0 ? 'SEN' : 'RAKİP'}</b>` : ''}</div>`).join('')}</div>${meRow()}`;
      if (k >= 16) return setTimeout(finish, 700);
      if (turn === 1) { setTimeout(() => { const free = pool.filter(id => owner[id] === undefined), id = botPick(free), cell = ov.querySelector(`.dCell[data-id="${id}"]`); if (cell) cell.classList.add('flying'); flyCard(cell, ov.querySelector('.dRow.opp .dEmpty'), () => { owner[id] = 1; theirs.push(id); k++; draw(); }); }, 650); return; }
      ov.querySelectorAll('.dCell.can').forEach(d => { d.onclick = () => { ov.querySelectorAll('.dCell.can').forEach(x => { x.onclick = null; }); const id = d.dataset.id; d.classList.add('flying'); flyCard(d, ov.querySelector('.dRow.me .dEmpty'), () => { owner[id] = 0; mine.push(id); k++; draw(); }); }; });
    };
    draw();
  }
}

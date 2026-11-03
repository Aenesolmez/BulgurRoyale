// ================= Ses: osuruk sesleri, kodla üretilen müzik ve olay sesleri =================
let AC = null, master = null, muted = false, sndBudget = 3, lastFart = 0;
try { const A = window.AudioContext || window.webkitAudioContext; if (A) { AC = new A(); master = AC.createGain(); master.gain.value = 0.8; const comp = AC.createDynamicsCompressor(); master.connect(comp); comp.connect(AC.destination); } } catch (e) {}
let noiseBuf = null;
function fart(pitch = 1, dur = 0.25, vol = 0.35) {
  if (!AC || muted || sndBudget <= 0 || AC.state !== 'running') return;
  const now = performance.now(); if (now - lastFart < 60) return; lastFart = now;
  sndBudget--;
  const t = AC.currentTime, p = pitch * (0.85 + Math.random() * 0.3);
  dur *= 0.8 + Math.random() * 0.5;
  const o = AC.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(110 * p, t); o.frequency.exponentialRampToValueAtTime(48 * p, t + dur);
  const lfo = AC.createOscillator(), lg = AC.createGain();
  lfo.frequency.value = 18 + Math.random() * 25; lg.gain.value = 40 * p; lfo.connect(lg); lg.connect(o.frequency);
  const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500 + 400 * p; f.Q.value = 6;
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f); f.connect(g); g.connect(sfxBus || master);
  if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.5, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const n = AC.createBufferSource(); n.buffer = noiseBuf;
  const nf = AC.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 300 * p; nf.Q.value = 1;
  const ng = AC.createGain(); ng.gain.setValueAtTime(vol * 0.5, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(nf); nf.connect(ng); ng.connect(sfxBus || master);
  o.start(t); lfo.start(t); n.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05); n.stop(t + dur + 0.05);
}
const unlockAudio = () => { if (AC && AC.state !== 'running') AC.resume(); };
addEventListener('pointerdown', unlockAudio);
addEventListener('keydown', unlockAudio);

// ---------- Müzik + ses efektleri (hepsi kodla üretilir, dosya yok) ----------
let musicBus = null, musicOn = true, wantMusic = '', musicMode = '', mTimer = null, mStep = 0, mNext = 0;
const sfxT = {};
try { musicOn = localStorage.getItem('bulgurMusic') !== '0'; muted = localStorage.getItem('bulgurSnd') === '0'; } catch (e) {}
const MUSIC_VOL = 1.3;
if (AC) { musicBus = AC.createGain(); musicBus.gain.value = musicOn ? MUSIC_VOL : 0; musicBus.connect(master); }
const mf = m => 440 * Math.pow(2, (m - 69) / 12);
function getNoise() { if (!noiseBuf && AC) { noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.5, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return noiseBuf; }
function mTone(t, midi, dur, type, vol, o = {}) {
  const osc = AC.createOscillator(), g = AC.createGain(); osc.type = type;
  osc.frequency.setValueAtTime(mf(midi), t);
  if (o.slide) osc.frequency.exponentialRampToValueAtTime(mf(midi) * o.slide, t + dur);
  let out = osc;
  if (o.lp) { const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.Q.value = 2; osc.connect(f); out = f; }
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  out.connect(g); g.connect(musicBus); osc.start(t); osc.stop(t + dur + 0.05);
}
function mKick(t, v = 0.8) { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.2); }
function mNoise(t, f, type, dur, v) { const n = AC.createBufferSource(); n.buffer = getNoise(); const fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.value = f; const g = AC.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.connect(fl); fl.connect(g); g.connect(musicBus); n.start(t); n.stop(t + dur + 0.02); }
// Osuruk sesi: testere dalgası + titreşim (LFO) + aşağı kayma = "pıııt"
function mFart(t, midi, dur, vol) {
  const o = AC.createOscillator(), lfo = AC.createOscillator(), lg = AC.createGain(), f = AC.createBiquadFilter(), g = AC.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(mf(midi), t); o.frequency.exponentialRampToValueAtTime(mf(midi) * 0.55, t + dur);
  lfo.frequency.value = 22 + Math.random() * 16; lg.gain.value = mf(midi) * 0.18; lfo.connect(lg); lg.connect(o.frequency);
  f.type = 'lowpass'; f.frequency.value = 800; f.Q.value = 5;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f); f.connect(g); g.connect(musicBus); o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
}
// Melodi sesi: kazu gibi vızıldayan, hafif aşağı kayan osuruklu ses (trol)
function mLead(t, midi, dur, vol) {
  const o = AC.createOscillator(), lfo = AC.createOscillator(), lg = AC.createGain(), f = AC.createBiquadFilter(), g = AC.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(mf(midi), t); o.frequency.exponentialRampToValueAtTime(mf(midi) * 0.93, t + dur);
  lfo.frequency.value = 26; lg.gain.value = mf(midi) * 0.035; lfo.connect(lg); lg.connect(o.frequency);
  f.type = 'lowpass'; f.frequency.value = 2400; f.Q.value = 3;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f); f.connect(g); g.connect(musicBus); o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
}
// ---------- Müzik v2: savaşta orta çağ marşı (bando + timpani + trampet), menüde neşeli meyhane havası; arada trol osuruklar ----------
function mBrass(t, midi, dur, vol) {   // bando trompeti: iki akortsuz testere + açılıp kapanan filtre
  const f0 = mf(midi), g = AC.createGain(), lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2;
  lp.frequency.setValueAtTime(500, t); lp.frequency.exponentialRampToValueAtTime(2600, t + 0.05); lp.frequency.exponentialRampToValueAtTime(900, t + dur);
  [0, 8].forEach(d => { const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f0; o.detune.value = d; o.connect(lp); o.start(t); o.stop(t + dur + 0.05); });
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.03); g.gain.setValueAtTime(vol * 0.8, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  lp.connect(g); g.connect(musicBus);
}
function mPluck(t, midi, dur, vol) { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(mf(midi) * 1.02, t); o.frequency.exponentialRampToValueAtTime(mf(midi), t + 0.03); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + dur + 0.05); }
function mTimp(t, midi, vol) { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(mf(midi) * 1.5, t); o.frequency.exponentialRampToValueAtTime(mf(midi), t + 0.08); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.65); }
function mPad(t, notes, dur, vol) { notes.forEach(n => { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o.frequency.value = mf(n); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.25); g.gain.linearRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + dur + 0.05); }); }
// Savaş: Re minör (Dm - Bb - F - C). Menü: Do majör (C - Am - F - G).
const BAT = { ch: [{ r: 38, t: [62, 65, 69] }, { r: 34, t: [58, 62, 65] }, { r: 41, t: [65, 69, 72] }, { r: 36, t: [60, 64, 67] }],
  mel: [[74, 0, 0, 74, 72, 0, 69, 0, 70, 0, 69, 0, 67, 0, 65, 0], [70, 0, 0, 70, 69, 0, 65, 0, 67, 0, 65, 0, 62, 0, 0, 0], [72, 0, 0, 72, 74, 0, 72, 0, 69, 0, 67, 0, 65, 0, 67, 0], [69, 0, 72, 0, 74, 0, 0, 0, 76, 0, 74, 0, 72, 0, 0, 0]] };
const MEN = { ch: [{ r: 36, t: [60, 64, 67] }, { r: 33, t: [57, 60, 64] }, { r: 41, t: [65, 69, 72] }, { r: 43, t: [67, 71, 74] }],
  mel: [[72, 0, 76, 0, 79, 0, 76, 0, 77, 0, 76, 0, 74, 0, 72, 0], [69, 0, 72, 0, 76, 0, 72, 0, 74, 0, 72, 0, 71, 0, 69, 0], [65, 0, 69, 0, 72, 0, 77, 0, 76, 0, 74, 0, 72, 0, 69, 0], [67, 0, 71, 0, 74, 0, 79, 0, 77, 0, 76, 0, 74, 0, 71, 0]] };
function playStep(mode, step, t) {
  const bar = Math.floor(step / 16) % 4, s = step % 16, loop = Math.floor(step / 64);
  if (mode === 'menu') {
    const C = MEN.ch[bar], m = MEN.mel[bar][s];
    if (s === 0 || s === 8) mPluck(t, C.r, 0.4, 0.5);            // pizzikato bas
    if (s === 4 || s === 12) mPluck(t, C.r + 7, 0.3, 0.4);
    if (s === 0) mPad(t, C.t, 1.8, 0.05);
    if (m) mPluck(t, m, 0.32, 0.32);
    if (s % 4 === 2) mNoise(t, 8000, 'highpass', 0.05, 0.13);     // tef
    if (s === 14 && bar === 3 && loop % 2 === 1) mFart(t, 50, 0.3, 0.5);   // trol osuruk
  } else {
    const fast = mode === 'battle2x', C = BAT.ch[bar], m = BAT.mel[bar][s];
    if (s === 0 || s === 8) mTimp(t, C.r + 12, 0.75);
    if (s % 4 === 0) mKick(t, 0.9);
    if (s === 4 || s === 12) mNoise(t, 1900, 'bandpass', 0.12, 0.45);
    if ((s === 14 || s === 15) && bar === 3) mNoise(t, 2200, 'bandpass', 0.06, 0.38);   // trampet kesmesi
    if (fast && s % 2 === 1) mNoise(t, 2000, 'bandpass', 0.04, 0.2);
    if (s % 2 === 0) mPluck(t, C.r + (s % 4 === 2 ? 12 : 0), 0.18, 0.42);              // marş basları
    if (s === 0) mPad(t, C.t.map(n => n - 12), 1.6, 0.05);
    if (m) mBrass(t, m, 0.22, fast ? 0.22 : 0.18);
    if (fast && m) mBrass(t, m - 4, 0.22, 0.1);                                         // 2x gazda armoni
    if (s === 6 && bar === 1 && loop % 2 === 0) mFart(t, 45, 0.35, 0.55);               // trol osuruk
  }
}
function stinger(kind) {
  const t = AC.currentTime + 0.05;
  if (kind === 'win') { [[62, 0], [66, 0.15], [69, 0.3], [74, 0.45]].forEach(([m, d]) => mBrass(t + d, m, 0.3, 0.3)); mBrass(t + 0.7, 74, 0.9, 0.32); mTimp(t + 0.7, 50, 0.9); mFart(t + 1.5, 48, 0.5, 0.6); }
  else { [[70, 0], [69, 0.4], [68, 0.8]].forEach(([m, d]) => mBrass(t + d, m - 12, 0.38, 0.3)); mBrass(t + 1.2, 55, 1.2, 0.3); mFart(t + 1.3, 40, 1.1, 0.8); }
}
function synthStop() { clearInterval(mTimer); mTimer = null; }
function mTick() {
  if (!AC || AC.state !== 'running') return;
  if (mNext < AC.currentTime - 0.3) mNext = AC.currentTime + 0.05;   // sekme uyuduysa birikmiş notaları çalma
  const spb = 60 / (musicMode === 'menu' ? 108 : musicMode === 'battle' ? 132 : 152) / 4;
  while (mNext < AC.currentTime + 0.15) { playStep(musicMode, mStep, mNext); mNext += spb; mStep++; }
}
function synthSetMusic(mode) {
  if (mode === musicMode && mTimer) return;
  musicMode = mode; stopMusic();
  if (!AC || AC.state !== 'running' || !mode || !musicOn) return;
  if (mode === 'win' || mode === 'lose') { stinger(mode); return; }
  mStep = 0; mNext = AC.currentTime + 0.08; mTimer = setInterval(mTick, 25);
}
function playMusic(mode) { wantMusic = mode; setMusic(mode); }
function setMusicOn(v) {
  musicOn = v; try { localStorage.setItem('bulgurMusic', v ? '1' : '0'); } catch (e) {}
  applyVolumes();
  if (v) { musicMode = ''; setMusic(wantMusic); } else stopMusic();
  refreshSys();
}
function refreshSys() {
  document.querySelectorAll('.btnMus').forEach(b => { b.textContent = '🎵'; b.style.opacity = musicOn ? 1 : 0.35; });
  document.querySelectorAll('.btnSnd').forEach(b => { b.textContent = muted ? '🔇' : '🔊'; });
}
// ilk dokunuşta sesi açar; kısa jingle'ları (zafer/yenilgi) ve çalan müziği tekrar başlatmaz
function audioKick() { if (!AC) return; const was = AC.state; AC.resume().then(() => { if (musicOn && wantMusic && wantMusic !== 'win' && wantMusic !== 'lose') { if (was !== 'running') musicMode = ''; setMusic(wantMusic); } }).catch(() => {}); }
addEventListener('pointerdown', audioKick); addEventListener('keydown', audioKick);
document.addEventListener('visibilitychange', () => { if (document.hidden) stopMusic(); else if (musicOn) { musicMode = ''; setMusic(wantMusic); } });

// Savaştaki olaylar için kısa ses efektleri: vuruş, kule vuruşu, giriş, evrim, şok, büyü, kule yıkımı, taç
function sfx(name) {
  if (!AC || muted || AC.state !== 'running') return;
  const now = performance.now(), cd = { hit: 80, hitT: 100, deploy: 60, zap: 120 }[name] || 0;
  if (cd && now - (sfxT[name] || 0) < cd) return; sfxT[name] = now;
  const t = AC.currentTime;
  const tone = (type, f0, f1, dur, vol, dl = 0) => {
    const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t + dl);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dl + dur);
    g.gain.setValueAtTime(0.0001, t + dl); g.gain.exponentialRampToValueAtTime(vol, t + dl + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dl + dur);
    o.connect(g); g.connect(sfxBus || master); o.start(t + dl); o.stop(t + dl + dur + 0.05);
  };
  const nz = (f, dur, vol, type, dl = 0, f1 = 0) => {
    const n = AC.createBufferSource(); n.buffer = getNoise(); const fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t + dl);
    if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dl + dur);
    const g = AC.createGain(); g.gain.setValueAtTime(vol, t + dl); g.gain.exponentialRampToValueAtTime(0.0001, t + dl + dur);
    n.connect(fl); fl.connect(g); g.connect(sfxBus || master); n.start(t + dl); n.stop(t + dl + dur + 0.05);
  };
  switch (name) {
    case 'hit': nz(900, 0.07, 0.2, 'lowpass'); tone('sine', 180, 70, 0.08, 0.22); break;
    case 'hitT': nz(500, 0.1, 0.28, 'lowpass'); tone('sine', 120, 50, 0.12, 0.28); break;
    case 'deploy': tone('sine', 280, 560, 0.1, 0.2); break;
    case 'evo': tone('sawtooth', 180, 1400, 0.35, 0.1); [660, 880, 1320].forEach((f, i) => tone('triangle', f, 0, 0.35, 0.16, 0.25 + i * 0.08)); break;
    case 'zap': tone('square', 900, 180, 0.14, 0.1); break;
    case 'spell': nz(300, 0.4, 0.28, 'bandpass', 0, 1800); break;
    case 'towerdown': nz(400, 0.8, 0.4, 'lowpass', 0, 80); tone('sine', 90, 28, 0.8, 0.45); break;
    case 'crown': [523, 659, 784].forEach((f, i) => tone('square', f, 0, 0.2, 0.12, i * 0.1)); break;
    case 'click': tone('triangle', 520, 380, 0.06, 0.18); break;
    case 'card': tone('sine', 700, 900, 0.05, 0.14); break;
    case 'vs': nz(200, 0.6, 0.4, 'lowpass', 0, 2000); tone('sawtooth', 110, 55, 0.6, 0.25); [392, 523].forEach((f, i) => tone('square', f, 0, 0.25, 0.14, 0.35 + i * 0.12)); break;
    case 'cast': nz(600, 0.25, 0.18, 'bandpass', 0, 2400); break;
    case 'boom': nz(700, 0.5, 0.45, 'lowpass', 0, 90); tone('sine', 140, 40, 0.45, 0.45); break;
    case 'freeze': tone('triangle', 1800, 900, 0.35, 0.12); tone('sine', 2600, 1800, 0.25, 0.08, 0.05); break;
    case 'log': nz(250, 0.6, 0.3, 'lowpass', 0, 120); tone('sine', 70, 50, 0.6, 0.3); break;
    case 'chest': tone('sawtooth', 160, 90, 0.18, 0.25); nz(900, 0.2, 0.25, 'lowpass'); break;
    case 'whoosh': nz(500, 0.32, 0.28, 'bandpass', 0, 2600); nz(1800, 0.22, 0.12, 'bandpass', 0.06, 600); break;
    case 'paper': nz(2600, 0.09, 0.32, 'bandpass', 0, 5200); nz(5000, 0.05, 0.18, 'highpass', 0.05); nz(1400, 0.12, 0.14, 'bandpass', 0.02, 700); tone('sine', 1800, 900, 0.03, 0.05, 0.06); break;
    case 'reveal': [660, 990].forEach((f, i) => tone('triangle', f, 0, 0.16, 0.16, i * 0.07)); break;
    case 'legend': [523, 659, 784, 1046, 1318].forEach((f, i) => tone('square', f, 0, 0.3, 0.12, i * 0.09)); break;
    case 'upgrade': [440, 554, 659, 880].forEach((f, i) => tone('triangle', f, 0, 0.22, 0.16, i * 0.08)); break;
    case 'tick': tone('square', 1200, 0, 0.04, 0.08); break;
    case 'nope': tone('square', 200, 120, 0.12, 0.15); break;
  }
}


// ---------- Ses seviyeleri: genel, müzik, efektler (0-1, kaydedilir) ----------
const VOL = { main: 0.8, music: 0.8, sfx: 0.9 };
try { const v = JSON.parse(localStorage.getItem('bulgurVol')); if (v) Object.assign(VOL, v); } catch (e) {}
let sfxBus = null;
if (AC) { sfxBus = AC.createGain(); sfxBus.connect(master); }
function applyVolumes() {
  if (master) master.gain.value = VOL.main;
  if (musicBus) musicBus.gain.value = musicOn ? MUSIC_VOL * VOL.music : 0;
  if (sfxBus) sfxBus.gain.value = VOL.sfx * 1.1;
  if (typeof curFile !== 'undefined' && curFile) curFile.volume = clamp((FILE_VOL[musicMode] || 0.55) * VOL.music * VOL.main, 0, 1);
}
function setVol(k, v) { VOL[k] = clamp(v, 0, 1); try { localStorage.setItem('bulgurVol', JSON.stringify(VOL)); } catch (e) {} applyVolumes(); }

// ---------- Kendi müzik dosyaların (muzik/ klasörü): kodla üretilen müziğin yerine çalar ----------
// menu ve savas döngüde çalar; savas2x tam 60 sn kala, savas30 tam 30 sn kala başlar (geri sayım parçaları döngüye girmez)
const MUSIC_FILES = { menu: 'menu', battle: 'savas', battle2x: 'savas2x', battle30: 'savas30', win: 'zafer', lose: 'yenilgi' };
const MUSIC_LOOP = { menu: true, battle: true };
const FILE_VOL = { menu: 0.5, battle: 0.55, battle2x: 0.6, battle30: 0.6, win: 0.65, lose: 0.65 };
const fileMus = {}; let curFile = null;
(function probeMusicFiles() {
  for (const [mode, name] of Object.entries(MUSIC_FILES)) {
    const exts = ['mp3', 'ogg', 'm4a', 'wav']; let i = 0;
    fileMus[mode] = 'probing';
    const tryNext = () => {
      if (i >= exts.length) { fileMus[mode] = null; return; }
      const a = new Audio(); a.preload = 'auto'; a.loop = !!MUSIC_LOOP[mode];
      a.oncanplay = () => { a.oncanplay = null; if (fileMus[mode] !== 'probing') return; fileMus[mode] = a; if (wantMusic === mode || (mode === 'battle' && /^battle/.test(wantMusic))) { musicMode = ''; setMusic(wantMusic); } };
      a.onerror = () => { i++; tryNext(); };
      a.onended = () => { if (curFile === a && /^battle(2x|30)$/.test(musicMode)) { curFile = null; const m = musicMode; setMusic('battle'); musicMode = m; } };   // geri sayım parçası bitince savaş müziğine dön
      a.src = 'muzik/' + name + '.' + exts[i];
    };
    tryNext();
  }
})();
const hasFile = mode => fileMus[mode] && fileMus[mode] !== 'probing';
function fileFor(mode) { if (hasFile(mode)) return fileMus[mode]; if (mode === 'battle2x' && hasFile('battle')) return fileMus.battle; return null; }
function fadeTo(a, vol, ms, then) {
  const v0 = a.volume, t0 = performance.now();
  const tick = () => { const k = Math.min(1, (performance.now() - t0) / ms); a.volume = clamp(v0 + (vol - v0) * k, 0, 1); if (k < 1) setTimeout(tick, 30); else if (then) then(); };
  tick();
}
function stopMusic() { synthStop(); if (curFile) { const old = curFile; fadeTo(old, 0, 1000, () => old.pause()); } curFile = null; }
function setMusic(mode) {
  if (mode === 'battle30' && !hasFile('battle30')) mode = 'battle2x';   // 30 sn parçası yoksa 60 sn parçası devam eder
  const f = mode && musicOn ? fileFor(mode) : null;
  if (f) {
    synthStop();
    if (curFile !== f) {
      const old = curFile; if (old) fadeTo(old, 0, 1400, () => { if (old !== curFile) old.pause(); });
      f.currentTime = 0; f.volume = 0; f.play().catch(() => {}); fadeTo(f, (FILE_VOL[mode] || 0.55) * VOL.music * VOL.main, 1200);
    } else if (f.paused) { f.play().catch(() => {}); fadeTo(f, (FILE_VOL[mode] || 0.55) * VOL.music * VOL.main, 300); }
    curFile = f; musicMode = mode;
    f.playbackRate = mode === 'battle2x' && f === fileMus.battle ? 1.08 : 1;   // ayrı 60 sn parçası yoksa savaş müziği biraz hızlanır
    return;
  }
  if (curFile) { const old = curFile; fadeTo(old, 0, 400, () => old.pause()); curFile = null; }
  synthSetMusic(mode === 'battle30' ? 'battle2x' : mode);
}

applyVolumes();

// son 10 saniye geri sayım sesi (muzik/geri.mp3)
let cdAud = null;
function playCountdown() { try { if (!cdAud) cdAud = new Audio('muzik/geri.mp3'); cdAud.volume = clamp(VOL.main * VOL.sfx, 0, 1); cdAud.currentTime = 0; if (!muted) cdAud.play().catch(() => {}); } catch (e) {} }
function stopCountdown() { if (cdAud) { cdAud.pause(); cdAud.currentTime = 0; } }

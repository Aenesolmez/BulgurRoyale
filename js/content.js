// ================= Ek içerik: büyüler, savunma binaları, arenalar, seviye / sandık / kupa yolu tabloları =================

// --- Yeni büyüler ve savunma binaları (kart resimleri assets.js içinde kodla çizilir) ---
const EXTRA_CARDS = [
  { id: 'fireball', art: 'fireball', name: 'Fasulye Topu', rar: 'rare', cost: 4, type: 'spell', spell: 'fireball', radius: 2.6, dmg: 400, towerPct: 0.35, speed: 11, knock: 1.2,
    fx: { col: '#ff8a3d', snd: 0.6, shake: 6 },
    tema: 'Kaynayan kazandan fırlatılmış, ateş gibi yanan dev bir fasulye.', silah: 'Kral kulesinden fırlatılır; düştüğü yerde patlar ve hafifleri geri iter.',
    evo: { name: 'Kızgın Fasulye', radius: 0.5, puddle: { dps: 55, t: 3 }, desc: 'Daha büyük patlama; yerde 3 sn yanan gaz bırakır.' } },
  { id: 'arrows', art: 'arrows', name: 'Kürdan Yağmuru', rar: 'common', cost: 3, type: 'spell', spell: 'arrows', radius: 4, dmg: 100, waves: 3, towerPct: 0.35, speed: 14,
    fx: { col: '#e8c48a', snd: 1.4 },
    tema: 'Pilav sonrası toplanan bütün kürdanlar gökten iner.', silah: 'Geniş alana üç dalga halinde hasar. Sürülere birebir.',
    evo: { name: 'Çatal Bıçak Takımı', waves: 4, desc: 'Dört dalga iner.' } },
  { id: 'zap', art: 'zap', name: 'Gaz Çarpması', rar: 'common', cost: 2, type: 'spell', spell: 'zap', radius: 2.5, dmg: 150, stun: 0.5, towerPct: 0.35,
    fx: { col: '#6fe82a', snd: 2.2 },
    tema: 'Elektrikli gaz: değdiği her şey bir an kasılır.', silah: 'Anında hasar ve kısa sersemletme (Gaz Kulesi ısınmasını sıfırlar).',
    evo: { name: 'Yüksek Gerilim', radius: 0.5, stun: 1.2, desc: 'Daha geniş alan, 1.2 sn sersemletir.' } },
  { id: 'log', art: 'log', name: 'Oklava', rar: 'legendary', cost: 2, type: 'spell', spell: 'log', radius: 1.95, dmg: 240, range: 10, speed: 7, knock: 1.4, towerPct: 0.35,
    fx: { col: '#a8743d', snd: 0.5, shake: 3 },
    tema: 'Annenin oklavası. Yuvarlanır, yerdeki her şeyi ezer ve geri iter.', silah: 'Yerde 10 kare yuvarlanır: yer birimlerine hasar + geri itme.',
    evo: { name: 'Merdane', radius: 0.6, knock: 2.6, desc: 'Daha geniş, iki kat geri iter.' } },
  { id: 'poison', art: 'poison', name: 'Gaz Bulutu', rar: 'epic', cost: 4, type: 'spell', spell: 'poison', radius: 3.5, dps: 70, dur: 8, slow: 0.15, towerPct: 0.35,
    fx: { col: '#9be33a', snd: 0.4 },
    tema: 'Üç gündür havalandırılmayan odanın havası.', silah: '8 sn boyunca alanda sürekli hasar ve yavaşlatma.',
    evo: { name: 'Lahana Turşusu', radius: 1, dur: 10, desc: 'Daha büyük ve 10 sn sürer.' } },
  { id: 'freeze', art: 'freeze', name: 'Buzdolabı', rar: 'epic', cost: 4, type: 'spell', spell: 'freeze', radius: 3, dmg: 100, freeze: 4, towerPct: 0.35,
    fx: { col: '#bfeaff', snd: 2.6 },
    tema: 'Kapağı açık unutulan buzdolabı. Herkes donup kalır.', silah: 'Alandaki her şeyi (kuleler dahil) 4 sn dondurur.',
    evo: { name: 'Derin Dondurucu', freeze: 5.5, desc: '5.5 sn dondurur.' } },
  { id: 'cannon', art: 'cannon', name: 'Fasulye Topçusu', rar: 'common', cost: 3, type: 'building', hp: 900, life: 30, dmg: 120, hs: 0.9, range: 5.5, size: 1.3, rad: 0.9,
    fx: { shot: 'ball', hit: 'cloud', col: '#5d4037', snd: 0.7 },
    tema: 'İçi fasulye dolu eski bir top.', silah: 'Yer birimlerine hızlı atış yapan savunma binası. Kule koşucularını kendine çeker.',
    evo: { name: 'Çift Namlu', burst: 2, desc: 'Her atışta iki gülle.' } },
  { id: 'inferno', art: 'inferno', name: 'Gaz Kulesi', rar: 'rare', cost: 5, type: 'building', hp: 1400, life: 35, dmg: 20, hs: 0.2, range: 6, air: true, ramp: 4, rampMax: 12, size: 2.4, rad: 1,
    fx: { shot: 'beam', hit: 'flame', col: '#ff5a1f', snd: 0.5 },
    tema: 'Kaynayan bir gaz kazanı. Hedefe ne kadar uzun bakarsa o kadar yakar.', silah: 'Aynı hedefe kilitlendikçe hasarı 12 katına kadar çıkar (tank avcısı).',
    evo: { name: 'Süper Gaz Kulesi', ramp: 2.2, desc: 'İki kat hızlı ısınır.' } },
  { id: 'mortar', art: 'mortar', name: 'Fasulye Havanı', rar: 'common', cost: 4, type: 'building', hp: 900, life: 30, dmg: 160, hs: 5, range: 11.5, minRange: 3.5, splash: 2, size: 1.35, rad: 0.9,
    fx: { shot: 'lob', hit: 'boom', col: '#8d6e63', snd: 0.45, shake: 3 },
    tema: 'Uzaklara fasulye bombası atan havan.', silah: 'Çok uzun menzil ve alan hasarı. Dibindekini vuramaz.',
    evo: { name: 'Zombi Havanı', impactSpawn: 'zombi', desc: 'Düştüğü yere bir Zombi Bulgur bırakır.' } },
];
CARDS.push(...EXTRA_CARDS);
EXTRA_CARDS.forEach(c => { BY_ID[c.id] = c; });

// --- Evrimleri sadece "sayı büyüten" değil, oynanışı değiştiren hale getir ---
Object.assign(BY_ID.keko.evo, { spdm: 1, hsm: 1, charge: { dist: 2.5, mult: 2, spd: 2 }, desc: 'Hücum: 2.5 kare koşunca hızlanır, ilk vuruşu 2 kat sert.' });
Object.assign(BY_ID.turgut.evo, { hsm: 1, ramp: 3, rampMax: 2.5, desc: 'Ritim tutunca: aynı hedefe vurdukça hasarı 2.5 katına çıkar.' });
Object.assign(BY_ID.davaci.evo, { firstStun: 1.2, desc: 'Mahkeme celbi: her yeni hedefe ilk vuruşu 1.2 sn sersemletir; can çalar.' });
Object.assign(BY_ID.minecraft.evo, { shield: 400, knockHit: 0.8, desc: '400 kalkan; vuruşları hedefi geri iter.' });
Object.assign(BY_ID.bulgur.evo, { shield: 300, dash: 1, desc: '300 kalkan; hedefine atılarak ilk vuruşu yapar.' });

// Evrimin dolması için normal oynanış sayısı (tanklar 2)
const EVO_CYCLES = { bowser: 2, sogutu: 2, yastik: 2, hamsik: 2, davuk: 2, inferno: 2, fan: 2 };
const evoCycles = id => EVO_CYCLES[id] || 1;

// --- Karakter rig tipi (render.js) ---
const RIG_TYPE = { hamsik: 'blob', skibidi: 'blob', sogutu: 'blob', hayalet: 'float', fan: 'float', spider: 'hang', tab: 'none', omni: 'fly', civciv: 'biped' };
const RIG_FIX = { aura: { hip: 0.7 }, gojo: { split: 0.5 }, omni: { split: 0.5 }, mafya: { split: 0.5 }, japon: { split: 0.5, hip: 0.74 }, nerd: { hip: 0.7 }, minecraft: { hip: 0.7, neck: 0.3 },
  davaci: { hip: 0.72 }, jahrein: { hip: 0.72 }, bowser: { split: 0.5 }, obez: { split: 0.5 }, ayvabulgur: { split: 0.5 } };

// --- Arenalar ---
const ARENAS = [
  { name: 'Fasulye Tarlası', tr: 0, g: ['#7db84c', '#86c254'], e: ['#79b34a', '#82bd50'], path: '#d8c48f', side: '#5c9a3a', tree: '#2f7a2a', tree2: '#3f9a36', rim: '#6b5434', water: '#3b8fd6' },
  { name: 'Pilav Sarayı', tr: 300, g: ['#cbb36a', '#d4bc72'], e: ['#c4ab62', '#cdb46a'], path: '#ecdfb4', side: '#a88f4c', tree: '#7a6a2c', tree2: '#9a8a3c', rim: '#7a5d2a', water: '#2f9fd0' },
  { name: 'Turşu Mağarası', tr: 600, g: ['#5e8a4a', '#679352'], e: ['#577f45', '#60884c'], path: '#a8a07e', side: '#344a2d', tree: '#1f3d25', tree2: '#2d5533', rim: '#3d3528', water: '#2b7a8a' },
  { name: 'Gaz Fabrikası', tr: 1000, g: ['#8c9196', '#959a9e'], e: ['#858a8f', '#8e9397'], path: '#c4baa5', side: '#55595d', tree: '#3a4448', tree2: '#4c585c', rim: '#3e3f42', water: '#3f6f8f' },
  { name: 'Kuru Fasulye Vadisi', tr: 1500, g: ['#b8744d', '#c07b55'], e: ['#b06d47', '#b8744f'], path: '#e2bb8c', side: '#874a30', tree: '#5e3420', tree2: '#7a4528', rim: '#5a3420', water: '#3b8fd6' },
  { name: 'Osuruk Zirvesi', tr: 2200, g: ['#dde8ee', '#e6eff4'], e: ['#d6e2e9', '#dfe9ef'], path: '#b9c6cf', side: '#bccdd6', tree: '#6e8f9c', tree2: '#86a6b2', rim: '#8094a0', water: '#5fb3f0' },
];
// Hangi kart hangi arenada açılır
const CARD_ARENA = {
  bulgur: 0, nerd: 0, zombi: 0, minecraft: 0, turgut: 0, ayvabulgur: 0, keko: 0, mafya: 0, arrows: 0, cannon: 0,
  kasa: 1, spider: 1, hayalet: 1, fireball: 1, zap: 1, mortar: 1,
  aura: 2, b456: 2, davaci: 2, skibidi: 2, ayva: 2, armutcu: 3, tab: 2,
  jahrein: 3, omni: 3, hamsik: 3, poison: 3, inferno: 3,
  japon: 4, gojo: 4, davuk: 4, sogutu: 4, freeze: 4,
  bowser: 5, obez: 4, fan: 5, yastik: 5, log: 5,
};

// --- Kart seviyeleri ---
const MAX_LVL = 10;
const levelMul = l => Math.pow(1.08, (l || 1) - 1);
const RAR = {
  common: { n: 'Sıradan', col: '#a9bfe6', f: 1, need: [2, 4, 10, 20, 50, 100, 200, 400, 800], gold: [5, 20, 50, 150, 400, 1000, 2000, 4000, 8000] },
  rare: { n: 'Nadir', col: '#ffab40', f: 2, need: [1, 2, 4, 8, 20, 40, 80, 160, 300], gold: [20, 50, 150, 400, 1000, 2000, 4000, 8000, 15000] },
  epic: { n: 'Destansı', col: '#d27bff', f: 3, need: [1, 1, 2, 4, 8, 15, 30, 50, 80], gold: [100, 400, 1000, 2000, 4000, 8000, 15000, 30000, 50000] },
  legendary: { n: 'Efsanevi', col: '#7ffff0', f: 5, need: [1, 1, 1, 2, 3, 5, 8, 12, 16], gold: [500, 2000, 4000, 8000, 15000, 30000, 50000, 75000, 100000] },
};
const KING_NEED = [20, 50, 100, 200, 400, 800, 1500, 3000, 5000];

// --- Sandıklar (süreler eğlence için kısaltıldı) ---
const CHESTS = {
  wood: { n: 'Tahta Sandık', time: 15, gold: [15, 30], cards: 4, stacks: 2, col: '#b07a42', col2: '#6b4423' },
  silver: { n: 'Gümüş Sandık', time: 60, gold: [30, 60], cards: 8, stacks: 3, col: '#cfd9e2', col2: '#7a8a99' },
  gold: { n: 'Altın Sandık', time: 240, gold: [120, 220], cards: 20, stacks: 4, col: '#ffd447', col2: '#b8860b' },
  magic: { n: 'Büyülü Sandık', time: 600, gold: [350, 500], cards: 45, stacks: 5, epic: 2, col: '#c47bff', col2: '#5a1f8c' },
  legend: { n: 'Efsane Sandığı', time: 900, gold: [500, 800], cards: 12, stacks: 2, legend: 1, col: '#6ff5ea', col2: '#1f6f8f' },
  crown: { n: 'Taç Sandığı', time: 0, gold: [80, 150], cards: 14, stacks: 3, col: '#5fb8ff', col2: '#1f4f9a' },
  free: { n: 'Bedava Sandık', time: 0, gold: [20, 40], cards: 5, stacks: 2, col: '#8fd05a', col2: '#3f7a1c' },
};
const CHEST_CYCLE = ['silver', 'silver', 'wood', 'gold', 'silver', 'silver', 'gold', 'silver', 'magic', 'silver', 'gold', 'silver', 'wood', 'gold', 'legend', 'silver', 'gold', 'magic'];

// --- Kupa yolu: her 50 kupada bir basamak; arena girişlerinde büyük sandık ---
const ROAD_MAX = 3000;
const ROAD = (() => {
  const out = [], arenaChest = { 300: 'gold', 600: 'magic', 1000: 'gold', 1500: 'legend', 2200: 'magic', 3000: 'legend' }, cyc = ['gold', 'silver', 'gems', 'cards', 'gold', 'emote', 'silver', 'cards'];
  let k = 0, emo = 0;
  for (let tr = 50; tr <= ROAD_MAX; tr += 50) {
    if (arenaChest[tr]) { out.push({ tr, chest: arenaChest[tr], big: true }); continue; }
    const kind = cyc[k++ % cyc.length];
    if (kind === 'gold') out.push({ tr, gold: Math.round((40 + tr / 6) / 10) * 10 });
    else if (kind === 'silver') out.push({ tr, chest: tr > 1200 ? 'gold' : 'silver' });
    else if (kind === 'gems') out.push({ tr, gems: 10 + Math.floor(tr / 300) * 5 });
    else if (kind === 'cards') out.push({ tr, cards: tr > 1500 ? 'epic' : tr > 600 ? 'rare' : 'common', n: tr > 1500 ? 2 : tr > 600 ? 6 : 20 });
    else if (kind === 'emote') { const ids = ['skibidi_e', 'hayalet_e', 'davuk_e', 'keko_e', 'jahrein_e', 'b456_e', 'hamsik_e', 'king_e']; if (emo < ids.length) out.push({ tr, emote: ids[emo++] }); else out.push({ tr, gold: 300 }); }
  }
  return out;
})();

// --- Emojiler (Clash Royale tarzı): 8'i baştan açık, diğerleri mağaza ve kupa yolundan ---
// anim: bounce, laugh, shake, spin, jump, cry, punch, float, freeze, bow ; s: osuruk sesi dizisi [gecikme ms, perde, süre]
const EMOTE_LIST = [
  { id: 'bulgur_e', img: 'bulgur', e: '😂', anim: 'laugh', name: 'Kahkaha', s: [[0, 1.6, 0.14], [90, 1.9, 0.14], [180, 1.5, 0.14], [270, 2.1, 0.22]] },
  { id: 'zombi_e', img: 'zombi', e: '💀', anim: 'shake', name: 'Öldüm', s: [[0, 0.5, 0.5]] },
  { id: 'nerd_e', img: 'nerd', e: '🤓', anim: 'jump', name: 'Aslında...', s: [[0, 2.3, 0.1], [120, 2.6, 0.1]] },
  { id: 'gojo_e', img: 'gojo', e: '😎', anim: 'spin', name: 'Havalı', s: [[0, 0.8, 0.4]] },
  { id: 'mafya_e', img: 'mafya', e: '👊', anim: 'punch', name: 'ORA ORA', s: [[0, 1.4, 0.08], [70, 1.4, 0.08], [140, 1.4, 0.08], [210, 1.1, 0.16]] },
  { id: 'obez_e', img: 'obez', e: '🍔', anim: 'jump', name: 'Acıktım', s: [[0, 0.3, 0.3], [250, 0.25, 0.4]], price: 80 },
  { id: 'bowser_e', img: 'bowser', e: '🔥', anim: 'shake', name: 'Yanıyor', s: [[0, 0.35, 0.6]] },
  { id: 'japon_e', img: 'japon', e: '🥺', anim: 'cry', name: 'Lütfen', s: [[0, 2.4, 0.3]] },
  { id: 'omni_e', img: 'omni', e: '😡', anim: 'shake', name: 'Sinirli', s: [[0, 0.7, 0.2], [180, 0.6, 0.3]] },
  { id: 'skibidi_e', img: 'skibidi', e: '🚽', anim: 'spin', name: 'Sifon', s: [[0, 1, 0.5]], price: 50 },
  { id: 'hayalet_e', img: 'hayalet', e: '👻', anim: 'float', name: 'Buuu', s: [[0, 1.8, 0.6]], price: 50 },
  { id: 'davuk_e', img: 'davuk', e: '🐔', anim: 'jump', name: 'Gıdak', s: [[0, 2.6, 0.08], [100, 2.8, 0.08], [200, 2.4, 0.15]], price: 50 },
  { id: 'keko_e', img: 'keko', e: '🌻', anim: 'bounce', name: 'Çekirdek', s: [[0, 1.3, 0.15], [150, 1.5, 0.15]], price: 50 },
  { id: 'jahrein_e', img: 'jahrein', e: '💰', anim: 'laugh', name: 'Bağış', s: [[0, 0.6, 0.3]], price: 80 },
  { id: 'b456_e', img: 'b456', e: '🔴', anim: 'freeze', name: 'Kırmızı Işık', s: [[0, 1.5, 0.4]], price: 80 },
  { id: 'hamsik_e', img: 'hamsik', e: '😭', anim: 'cry', name: 'Hüzün', s: [[0, 0.45, 0.7]], price: 80 },
  { id: 'pass_spider', img: 'spider', e: '🕸️', anim: 'jump', name: 'Ağ Attım', s: [[0, 1.8, 0.15], [150, 2.1, 0.2]], pass: true },
  { id: 'pass_japon', img: 'japon', e: '🌸', anim: 'bow', name: 'Arigato', s: [[0, 1.4, 0.3], [300, 1.7, 0.3]], pass: true },
  { id: 'pass_obez', img: 'obez', e: '😎', anim: 'laugh', name: 'Göbek Dansı', s: [[0, 0.3, 0.2], [180, 0.35, 0.2], [360, 0.28, 0.4]], pass: true },
  { id: 'pass_gojo', img: 'gojo', e: '🤞', anim: 'float', name: 'Sınırsız', s: [[0, 2, 0.5]], pass: true },
  { id: 'pass_aura', img: 'aura', e: '✨', anim: 'spin', name: 'Aura +1000', s: [[0, 1.6, 0.2], [200, 2, 0.4]], pass: true },
  { id: 'pass_omni', img: 'omni', e: '😤', anim: 'punch', name: 'Bas Bas', s: [[0, 0.7, 0.15], [140, 0.6, 0.15], [280, 0.5, 0.3]], pass: true },
  { id: 'king_e', img: 'king', e: '👑', anim: 'bow', name: 'Kral Selamı', s: [[0, 0.9, 0.3], [250, 1.2, 0.3]], price: 120 },
];
const EMOTE_BY = Object.fromEntries(EMOTE_LIST.map(e => [e.id, e]));
const PHRASES = ['Merhaba!', 'Bol şans!', 'İyi oyundu!', 'Vay be!', 'Teşekkürler!', 'Ups!'];

// --- Kartın nasıl oynandığı (kart detayındaki "Hakkında" bölümü) ---
const TIPS = {
  bulgur: 'Ucuz ve dengeli. Tankın arkasına destek koy ya da tek gelen düşmanı kesmek için kullan. Evrimi ilk vuruşta hedefe atılır.',
  nerd: '1 gazlık dikkat dağıtıcı: kule koşucularını ve tankları bir an oyalar, kulen ateş ederken zaman kazandırır.',
  zombi: 'Üçlü sürü: tek hedefli ağır vurucuları (Jahrein, Gaz Kulesi) çok iyi oyalar. Kürdan Yağmuru ve Gaz Çarpması karşısında zayıftır.',
  minecraft: 'Sağlam ve ucuz şövalye: köprüde savunma yapar, karşı saldırıda önde yürür. Evrimi vuruşlarıyla geri iter.',
  turgut: 'Menzilli destek: kulenin arkasına koy, havadakileri de vurur. Evrimi aynı hedefe vurdukça güçlenir; tank arkasında harikadır.',
  ayvabulgur: 'Orta boy tank: tek hedefli düşmana karşı güçlü. Evrimi ölünce patlar, yanına sokulanı cezalandırır.',
  keko: 'Hızlı dövüşçü: köprüden ani baskı kurar. Evrimi koştukça hızlanır ve ilk vuruşu iki kat sert.',
  kasa: 'Girişte şok: Gaz Kulesi ısınmasını ve hücumları durdurur, uçanları da vurur. Savunmada hedefin üstüne bırak.',
  spider: 'Uçan çevik saldırgan: yer birimlerinin vuramadığı yerden saldırır. Evrimi ağıyla yavaşlatır ve sıçrar.',
  hayalet: 'Uçan hızlı ikili: yer tanklarına ve tek hedefli birimlere karşı mükemmel. Kürdan ve Gaz Çarpması onları bitirir.',
  mafya: 'Çok hızlı yumruk: tekli birimleri ve binaları eritir, sürülerle zorlanır. Evrimi zamanı durdurup savunmayı dağıtır.',
  aura: 'Alan hasarlı orta menzil: sürüleri temizler. Evrimi yakındaki dostlarını iyileştirir; tankın arkasına koy.',
  b456: 'Kırmızı ışık: çevresindeki herkesi düzenli olarak dondurur. Hücumları ve karşı saldırıları durdurmak için savunmada kullan.',
  davaci: 'Can çalan dövüşçü: uzun dövüşlerde ayakta kalır. Evrimi her yeni hedefini mahkemeye çağırıp sersemletir.',
  jahrein: 'Tek vuruşta ağır hasar: tankları ve kule koşucularını eritir. Yavaş vurduğu için sürülere karşı zayıf.',
  skibidi: 'Hızlı kule koşucusu: sadece binalara gider. Tek şeritten sürekli baskı kur; binalar ve sürüler onu durdurur.',
  omni: 'Uçan alan hasarı: yer sürülerini havadan temizler. Uçanları vuranlara ve Gaz Kulesi\'ne dikkat.',
  japon: 'Arenanın en uzun menzilli atıcısı: köprüye yakın kuleyi bile kendi tarafından vurur. Çok kırılgan; Fasulye Topu tek atar.',
  gojo: 'Alan hasarlı büyücü: sürüleri yok eder. Tankın arkasında en iyisidir; evrimi vurduklarını sersemletir.',
  obez: 'Mega tank: düşmanın ortasına at, iniş hasarı kümeyi temizler. Uzaktaki hedefe zıplayıp göbek çakar; havadakileri vuramaz, Turgut veya Fan ile destekle.',
  bowser: 'Dev alan hasarlı tank: kral kulesinin arkasından başlat, gaz biriktir, arkasına destek ekle. Gaz Kulesi en büyük tehdit.',
  fan: 'Uçan kule avcısı: bir kuleye ulaşırsa ağır hasar verir. Uçanları vuranlar ve Gaz Kulesi onu durdurur.',
  davuk: 'Kuleye yürüyen dev: önde tank, arkasında destek. Evrimi ölünce civcivler bırakır.',
  hamsik: 'Çok dayanıklı ama yavaş tank: hasarı üstlenir. Evrimi arkasında yavaşlatan gaz izi bırakır.',
  sogutu: 'Vurduğunu yavaşlatan dev: hücumları köprüde keser. Evrimi çevresini sürekli yavaşlatır ve dondurur.',
  yastik: 'Alan hasarlı tank: sürüleri ezer. Evrimi kalkanlıdır ve vurduğunu uyutur.',
  armutcu: 'Menzilli destek: tankın arkasına koy, armutlar kümeleri ve havadakileri vurur. Evrimi yavaşlatır, hızlı kule koşucularına karşı birebir.',
  ayva: 'Gecikmeli alan büyüsü: kümelenmiş birimleri ve düşük canlı kuleyi bitirir. Hızlı birimlerin önüne at.',
  tab: 'Sürekli Bulgur üreten bina: savunmada kule koşucularını çeker, karşı saldırıya durmadan asker yollar.',
  fireball: 'Orta alan büyüsü: okçu tipi destekleri ve sürüleri öldürür, hafifleri geri iter. Kuleyi bitirmek için de kullan.',
  arrows: 'Geniş alanda üç dalga: sürülere ve uçan ikililere karşı. Tanklara hasarı düşüktür.',
  zap: 'Anlık şok: Gaz Kulesi ısınmasını sıfırlar, sürüleri ve hücumları durdurur. 2 gaza çok değerli.',
  log: 'Yerde yuvarlanır: yer sürülerini siler ve hepsini geri iter. Uçanlara dokunmaz.',
  poison: 'Uzun süren alan hasarı: alanda kalanları eritir ve yavaşlatır. Kule ve okçuların üstüne at.',
  freeze: 'Her şeyi 4 sn dondurur: kuleleri de durdurup saldırını kuleye ulaştır ya da kaybedilen savunmayı kurtar.',
  cannon: 'Ucuz savunma binası: kule koşucularını ve tankları ortaya çeker. Uçanları vuramaz.',
  inferno: 'Isındıkça hasarı katlanır: tankların kâbusu. Gaz Çarpması ve sürüler ısınmayı bozar.',
  mortar: 'Uzak menzilli havan: kendi tarafından düşman kulesine ateş edebilir. Dibine gelen birimleri vuramaz.',
};

const BOT_NAMES = ['Fasulye_Kral', 'GazMaster61', 'PilavSever', 'Osurukçu_Ali', 'KuruFasulyeX', 'Bulgur_Avcısı', 'TurşuKralı', 'Lahana99', 'NohutBaba', 'GazBombası', 'MercimekMan', 'SifonCu'];

// Kart rolü (yapay zekâ ve arayüz için)
function cardRole(c) {
  if (c.type === 'spell') return 'spell';
  if (c.type === 'building') return c.dmg ? 'defense' : 'spawner';
  if (c.target === 'buildings') return 'wincon';
  if (c.hp * (c.count || 1) >= 1800) return 'tank';
  if (c.splash) return 'splash';
  if ((c.count || 1) >= 2) return 'swarm';
  if (c.range >= 3) return 'ranged';
  return 'melee';
}

// ---------- Kule görünümleri (kozmetik; oyunu etkilemez) ----------
// g: nöbetçi karakter, b: gövde renkleri [koyu, açık, en koyu], top: üst platform, k: kral karakteri (yoksa varsayılan)
const TOWER_SKINS = [
  { id: 'klasik', name: 'Klasik Kale', g: 'bulgur', b: ['#7d7369', '#c2b8ad', '#6b6158'], top: '#d6ccc0' },
  { id: 'altin', name: 'Altın Kule', g: 'aura', b: ['#a8741a', '#ffe27a', '#7a5208'], top: '#ffd447', price: 300 },
  { id: 'buz', name: 'Buz Sarayı', g: 'sogutu', b: ['#5d9cc4', '#dff4ff', '#3e7299'], top: '#eaf8ff', price: 300 },
  { id: 'lav', name: 'Lav Kalesi', g: 'bowser', b: ['#5a2a22', '#c2563a', '#3a1712'], top: '#ff8a4a', price: 450 },
  { id: 'seker', name: 'Şeker Kule', g: 'fan', b: ['#d46aa8', '#ffd1ec', '#a3477c'], top: '#ffe6f4', price: 450 },
  { id: 'nerd', name: 'Kütüphane', g: 'nerd', b: ['#4a5d8a', '#a9bbe6', '#33426a'], top: '#c9d6f5', pass: true },
  { id: 'obez', name: 'Kebapçı Kalesi', g: 'obez', b: ['#7a3d1a', '#e09a4e', '#55290f'], top: '#ffcf7a', pass: true },
];
const SKIN_BY = Object.fromEntries(TOWER_SKINS.map(s => [s.id, s]));

// ---------- Pass Royale: taç topladıkça kademe atlanır; ücretsiz + premium yol ----------
const PASS_CROWNS = 6, PASS_TIERS = 30, PASS_PRICE = 500, PASS_LOOP = 10;   // kademe başına taç, kademe sayısı, premium elmas fiyatı, son kademeden sonra şanslı döngü
const PASS = Array.from({ length: PASS_TIERS }, (_, i) => {
  const t = i + 1, f = t === 8 ? { emote: 'pass_spider' } : t === 22 ? { emote: 'pass_japon' } : t % 5 === 0 ? { chest: t >= 20 ? 'gold' : 'silver' } : t % 3 === 0 ? { cards: t > 15 ? 'rare' : 'common', n: 10 + t } : { gold: 40 + t * 8 };
  const prem = { 5: { emote: 'pass_obez' }, 10: { skin: 'nerd' }, 15: { emote: 'pass_gojo' }, 20: { emote: 'pass_aura' }, 25: { emote: 'pass_omni' }, 30: { skin: 'obez' } }[t]
    || (t % 4 === 0 ? { chest: t >= 16 ? 'magic' in CHESTS ? 'magic' : 'gold' : 'gold' } : t % 2 ? { gems: 10 + t } : { cards: t > 12 ? 'epic' : 'rare', n: 2 + (t >> 2) });
  return { t, free: f, prem };
});

// ---------- Şampiyonlar: destenin 3. slotuna konan şampiyonluk özellikli kart sahada şampiyon olur; iksirle ultisini kullanırsın ----------
Object.assign(BY_ID.bulgur, { champ: { name: 'Şampiyon Bulgur', img: 'bulgur_ch', hpm: 1.6, dmgm: 1.4,
  abil: { name: 'Altın Osuruk', icon: '💨', cost: 2, cd: 10, r: 3, dmg: 240, stun: 1, rage: 4 },
  desc: 'Altın zırhlı Bulgur. ULTİ (2 iksir): etrafına altın osuruk patlatır, düşmanları savurur ve sersemletir, 4 sn öfkeyle hızlanır.' } });
const isChamp = id => !!(BY_ID[id] && BY_ID[id].champ);

// ---------- Parti modları (kupasız) ve özel arena ----------
const PARTY_ARENA = { name: 'Parti Arenası', tr: 0, g: ['#6b4fc4', '#7658cf'], e: ['#6447bb', '#6f51c6'], path: '#ffd36b', side: '#3a2a78', tree: '#ff4fb8', tree2: '#46d8ff', rim: '#2a1c5c', water: '#ff6fd0' };
const arenaOf = k => k === 'party' ? PARTY_ARENA : ARENAS[k] || ARENAS[0];
const MODES = [
  { id: 'duel', n: '1v1 Dostluk', i: '⚔️', d: 'Kendi destenle, kupa yok' },
  { id: 'duo', n: '2v2', i: '👥', d: 'Bot takım arkadaşınla 2 rakibe karşı' },
  { id: 'triple', n: 'Üçlü Çekiliş', i: '🎴', d: 'Her turda 3 karttan birini seç' },
  { id: 'mega', n: 'Mega Çekiliş', i: '🃏', d: 'İki kart çiftinden birini al, diğeri rakibe' },
  { id: 'x2', n: 'Çifte İksir', i: '💧', d: 'Baştan sona 2x iksir' },
];

// yeni tasarımlar (SVG)
const EXTRA_FILES = {"fireball":"Fasulye Tanesi.svg","cannon":"Fasulye Topcusu.svg","log":"Oklava.svg","zap":"Gaz Carpmasi.svg","mortar":"Fasulye Kazani.svg","inferno":"Gaz Kazani.svg"};

// ================= Arkadaşla çevrimiçi oyun: sunucusuz WebRTC (kod kopyala-yapıştır ile bağlanma) =================
// Ev sahibi savaşı çalıştırır, misafire saniyede 15 anlık görüntü yollar; misafir sadece kart oynama isteği gönderir.
const NET = { pc: null, dc: null, role: null, on: null, open: false, status: '' };
const RTC_CFG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

async function packSDP(desc) {
  const json = JSON.stringify({ t: desc.type, s: desc.sdp });
  try {
    const cs = new CompressionStream('deflate-raw'), w = cs.writable.getWriter(); w.write(new TextEncoder().encode(json)); w.close();
    const buf = new Uint8Array(await new Response(cs.readable).arrayBuffer()); let s = ''; buf.forEach(b => { s += String.fromCharCode(b); });
    return 'BR1' + btoa(s);
  } catch (e) { return 'BR0' + btoa(unescape(encodeURIComponent(json))); }
}
async function unpackSDP(code) {
  code = code.trim();
  let json;
  if (code.startsWith('BR1')) {
    const bin = atob(code.slice(3)), buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    const ds = new DecompressionStream('deflate-raw'), w = ds.writable.getWriter(); w.write(buf); w.close();
    json = new TextDecoder().decode(await new Response(ds.readable).arrayBuffer());
  } else if (code.startsWith('BR0')) json = decodeURIComponent(escape(atob(code.slice(3))));
  else throw new Error('Kod tanınmadı');
  const o = JSON.parse(json); return { type: o.t, sdp: o.s };
}
function waitIce(pc) {
  return new Promise(res => {
    if (pc.iceGatheringState === 'complete') return res();
    const done = () => { if (pc.iceGatheringState === 'complete') { pc.removeEventListener('icegatheringstatechange', done); res(); } };
    pc.addEventListener('icegatheringstatechange', done); setTimeout(res, 3000);
  });
}
function netReset() { try { NET.dc && NET.dc.close(); NET.pc && NET.pc.close(); } catch (e) {} NET.pc = NET.dc = null; NET.open = false; NET.role = null; }
function setupDC(dc) {
  NET.dc = dc;
  dc.onopen = () => { NET.open = true; NET.status = 'bağlandı'; NET.on && NET.on({ t: '_open' }); };
  dc.onclose = () => { NET.open = false; NET.status = 'koptu'; NET.on && NET.on({ t: '_close' }); };
  dc.onmessage = ev => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } NET.on && NET.on(m); };
}
async function netHost() {
  netReset(); NET.role = 'host';
  const pc = NET.pc = new RTCPeerConnection(RTC_CFG);
  setupDC(pc.createDataChannel('bulgur', { ordered: true }));
  await pc.setLocalDescription(await pc.createOffer());
  await waitIce(pc);
  return packSDP(pc.localDescription);
}
async function netHostAccept(code) { await NET.pc.setRemoteDescription(await unpackSDP(code)); }
async function netJoin(code) {
  netReset(); NET.role = 'guest';
  const pc = NET.pc = new RTCPeerConnection(RTC_CFG);
  pc.ondatachannel = e => setupDC(e.channel);
  await pc.setRemoteDescription(await unpackSDP(code));
  await pc.setLocalDescription(await pc.createAnswer());
  await waitIce(pc);
  return packSDP(pc.localDescription);
}
function netSend(m) { if (NET.dc && NET.open) { try { NET.dc.send(JSON.stringify(m)); } catch (e) {} } }

// ================= Kısa oda kodu (PeerJS genel aracı sunucusu): sadece 5 harflik kod =================
// Sadece eşleşme için aracı kullanılır; oyun verisi yine doğrudan telefonlar arasında (WebRTC) akar.
function netReset2() { netReset(); try { NET.peerObj && NET.peerObj.destroy(); } catch (e) {} NET.peerObj = null; }
function setupConn(conn) {
  NET.dc = { send: s => conn.send(s), close: () => conn.close() };
  const open = () => { NET.open = true; NET.status = 'bağlandı'; NET.on && NET.on({ t: '_open' }); };
  conn.open ? open() : conn.on('open', open);
  conn.on('close', () => { NET.open = false; NET.status = 'koptu'; NET.on && NET.on({ t: '_close' }); });
  conn.on('data', d => { let m = d; if (typeof d === 'string') { try { m = JSON.parse(d); } catch (e) { return; } } NET.on && NET.on(m); });
}
function needPeer() { if (typeof Peer === 'undefined') throw new Error('İnternet gerekli (PeerJS yüklenemedi)'); }
function netHostRoom() {
  netReset2(); needPeer(); NET.role = 'host';
  const AL = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return new Promise((res, rej) => {
    let tries = 0;
    const make = () => {
      let code = ''; for (let i = 0; i < 5; i++) code += AL[Math.floor(Math.random() * AL.length)];
      const p = new Peer('bulgur-' + code); NET.peerObj = p;
      p.on('open', () => res(code));
      p.on('connection', c => { if (NET.dc) { c.close(); return; } setupConn(c); });
      p.on('error', e => { if (e.type === 'unavailable-id' && ++tries < 5) { try { p.destroy(); } catch (x) {} make(); } else rej(new Error(e.type || 'bağlantı')); });
    };
    make();
  });
}
function netJoinRoom(code) {
  netReset2(); needPeer(); NET.role = 'guest';
  code = String(code).trim().toUpperCase();
  return new Promise((res, rej) => {
    const p = new Peer(); NET.peerObj = p;
    const to = setTimeout(() => rej(new Error('Oda bulunamadı')), 12000);
    p.on('open', () => { const c = p.connect('bulgur-' + code, { reliable: true }); setupConn(c); c.on('open', () => { clearTimeout(to); res(); }); });
    p.on('error', e => { clearTimeout(to); rej(new Error(e.type === 'peer-unavailable' ? 'Oda bulunamadı' : (e.type || 'bağlantı'))); });
  });
}

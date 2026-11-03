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

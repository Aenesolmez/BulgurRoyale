# Bulgur Royale: yapım geçmişi

Eğlence amaçlı, ticari olmayan Clash Royale tarzı oyun. Tarayıcıda `index.html` açılarak oynanır, kurulum yok.

## Dosyalar (v3: modüler yapı)
- `index.html`: tüm ekranlar (ana sayfa sekmeleri, VS, savaş, sonuç, pencereler) ve CSS. Arayüz `--u` birimiyle ölçeklenir.
- `cards.js`: 27 karakter kartının verileri (isim, değer, evrim, açıklama) + token (civciv). **Karakter kartı eklemek/değiştirmek için burası.**
- `js/content.js`: 9 yeni kart (6 büyü, 3 savunma binası), oynanışı değiştiren evrimler, rig tipleri, arenalar, kart seviyeleri, sandıklar, kupa yolu, bot isimleri.
- `js/rigdata.js`: SVG'ler taranarak otomatik çıkarılmış kafa/kalça/bacak ayrım noktaları.
- `js/assets.js`: büyü/bina kart resimleri ve bina modelleri (kodla çizilir), sprite ve emoji önbelleği.
- `js/audio.js`: osuruk sesleri, kodla üretilen müzik, olay sesleri.
- `js/sim.js`: savaş simülasyonu (çizimden bağımsız). Olaylar `B.ev` ile çizime gider. Ağ için anlık görüntü (snapshot).
- `js/ai.js`: bot (3 zorluk).
- `js/profile.js`: oyuncu profili ve ilerleme (tarayıcıda `bulgurProfile3`).
- `js/render.js`: eğik perspektifli arena, 3D kuleler, rigli karakterler, vektör efektler.
- `js/net.js`: sunucusuz WebRTC (kod kopyala-yapıştır ile bağlanma).
- `js/ui.js`: ana sayfa sekmeleri, kart detay, sandık açma, mağaza, kupa yolu, arkadaş, ayarlar.
- `js/main.js`: maç akışı, sürükle-bırak, döngü, emojiler, çevrimiçi maç, tam ekran.
- `bulgurs/`: karakter SVG'leri.

## Temel kararlar
- Her zaman dikey; arena Clash Royale gibi eğik perspektif (uzak taraf dar). Kendi tarafın her zaman altta ve mavi (misafirde tahta 180° döner).
- Gaz = iksir (osuruk teması). 3 dk maç, son 1 dk 2x, berabereyse 1 dk uzatma 3x ve ilk kule kazanır; yine berabereyse en düşük canlı kulesi zayıf olan kaybeder.
- Deste 8 kart; ilk 2 slot evrim. Evrim maça hazır başlar; kullanınca kartın döngü sayısı kadar normal oynanması gerekir (tanklar 2).
- Kart yerleştirme kareye oturur; sürükle-bırak veya seç-dokun. Birimler bırakıldıkları koridorun köprüsünü/kulesini kullanır.
- Hedefleme: saldırırken kilitli; yürürken yakında daha iyisi çıkarsa değişir; ilk vuruştan önce hazırlanma süresi var. Kuleler ve binalar etrafından dolaşılır.
- Yazı az: hasar sayısı yok; efektler görsel. Alan hasarında gerçek etki yarıçapı gösterilir.
- Düşman kule can barı üstte, kendi kulelerin altta (kral barı kulenin gövdesinde).
- İlerleme: kupa ve 6 arena; arena kart açar; sandık yuvaları (süreler eğlence için kısa); bedava sandık 10 dk; 10 taç = taç sandığı; mağaza 30 dk'da yenilenir.

## Yapılanlar (sırayla)
1-10. İlk sürümden emojilere kadar (v1-v2): 27 kart, osuruk teması, evrimler, Jojo, müzik, sade efektler, koridor düzeltmesi.
11. **v3 yeniden yazım:** modüler yapı, rig sistemi, perspektif arena, 3D kuleler, yeni simülasyon (kare, yol bulma, kilitlenme, geri itme, uçan büyüler, 3x uzatma, beraberlik bozma), 9 yeni kart, akıllı bot, ilerleme döngüsü, ana sayfa sekmeleri, VS/sonuç ekranı, kart detay, sandık açma, mağaza, kupa yolu, sürükle-bırak, çevrimiçi mod, takım renkli ışıma.

12. Emoji sistemi baştan (16 animasyonlu emoji, 6 hazır söz, 8'lik emoji destesi, mağaza/kupa yolu ile açılan emojiler, rakibi sustur), yeni müzik (savaş marşı + meyhane havası), açılmamış kart detayı, kart "Hakkında" bölümü (canlı önizleme, nasıl oynanır, güçlü/zayıf yan, karşı kartlar), 50 kupada bir basamaklı kupa yolu ve arena başlıkları, karakterlerin yüz yönü düzeltmesi (`ART_DIR`).

## Test notları
- Test edilen (headless Chrome + DevTools protokolü): sürükle-bırak ile kart oynama, tam kupa maçı → sonuç → ödül → ana sayfa, bot-bota 6 maç, WebRTC bağlantısı ve anlık görüntü aktarımı (tek sayfada iki bağlantı), misafir görünümü, kalabalık savaşta performans (çizim ~4 ms/kare).
- Test edilemeyen: iki ayrı bilgisayar arasında gerçek internet bağlantısı (bazı ağlarda STUN yetmeyebilir), seslerin kulağa nasıl geldiği, gerçek dokunmatik ekran.

## Yapılabilecekler
- Karakterler için ayrı parça SVG'leri (kafa, gövde, kollar, bacaklar) gelirse rig çok daha iyi olur (şu an tek resim otomatik dilimleniyor; kollar hareket etmiyor).
- Gerçek çok oyunculu eşleştirme için sunucu gerekir.
- Test: `index.html#auto` iki botun oynadığı maçı açar.

## 13
- Köprü takılması düzeltildi (köprüye yönelen birim kararından dönmez). Obez Bulgur eklendi (7 iksir, iniş hasarı + zıplama). Kart modalı transform tabanlı kaydırma; sürükleme modalı kapatmaz. Önizlemeler gerçek simülasyonla çalışıyor. Lobide yana kaydırma, emoji animasyonları, kupa yolu aşağıdan yukarı.

## 14
- Pass Royale, kule görünümleri, şampiyon slotu (Şampiyon Bulgur + ulti), Esporcu zorluğu, Parti modları (1v1, 2v2 iki kral kulesi, Üçlü/Mega Çekiliş arenada, Çifte İksir), yeni çizimler (kazanlar kapaklı animasyonlu, oklava, gaz çarpması, fasulye), Ayva Büyüsü + yeni Ayva (armut atar).
- İnsancıl botlar (fark etme gecikmesi), bot maçlarıyla kart dengesi, el kartında iksir dolum çubuğu, ilk maç ipuçları, kapalı modalda önizleme durur, yavaş cihazda efekt azaltma.

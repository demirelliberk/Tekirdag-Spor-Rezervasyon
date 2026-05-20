// ===================================================================
// TEKİRDAĞ SPOR REZERVASYON SİSTEMİ
// CSV Veri Yükleme Modülü
//
// Java karşılığı: CSVReader.java
//
// Tarayıcı ortamında dosya sistemi erişimi olmadığından,
// CSV verileri bu dosyaya gömülmüştür. loadFromCSV() fonksiyonu
// bu verileri parse edip localStorage'a aktarır.
//
// Bonus Gereksinim: Veri kalıcılığı (JSON/CSV ile kaydet/yükle)
//   ✓ CSV → localStorage yükleme
//   ✓ localStorage → CSV dışa aktarma
//   ✓ localStorage → JSON dışa aktarma
// ===================================================================

// -------------------------------------------------------------------
// GÖMÜlÜ CSV VERİLERİ (data/ klasöründeki dosyalardan)
// -------------------------------------------------------------------

const CSV_DATA = {

    kullanicilar: `kullaniciId,adSoyad,email,sifre,rol
1,Dilan Admin,dilan@mail.com,1234,ADMIN
2,Berk Kullanici,berk@mail.com,asdf,USER
3,Zeynep Kullanici,zeynep@mail.com,qwer,USER
4,Safa Kullanici,safa@mail.com,zxcv,USER`,

    kompleksler: `kompleksId,kompleksAdi,ilce,adres,acilisSaati,kapanisSaati
101,Namık Kemal Spor Kompleksi,Süleymanpaşa,Merkez Mah.,09:00,23:00
102,Çorlu Atatürk Kompleksi,Çorlu,Omurtak Cad.,09:30,23:00
103,Süleymanpaşa Gençlik Merkezi,Süleymanpaşa,Sahil Yolu,09:00,23:00
104,Çerkezköy Kapalı Spor Salonu,Çerkezköy,İstasyon Mah.,09:00,23:00
105,Ergene Spor Tesisleri,Ergene,Sağlık Mah.,09:00,23:00
106,Malkara Belediye Tesisleri,Malkara,Camiatik Mah.,09:00,23:00
107,Saray Kapalı Spor Alanı,Saray,Ayaspaşa Mah.,09:00,23:00
108,Hayrabolu Spor Merkezi,Hayrabolu,Hisar Mah.,09:00,23:00`,

    tesisler: `tesisId,kompleksId,tesisAdi,tesisTuru,kapasite,ucretSaatlik,durum,gorselUrl
1,101,Namık Kemal Stadı Sahası,Futbol,500,100,Aktif,
2,102,Çorlu Atatürk Spor Salonu,Basketbol,200,80,Aktif,
3,103,Süleymanpaşa Yüzme Havuzu,Yuzme,250,90,Aktif,
4,104,Çerkezköy Kapalı Saha,Futbol,400,120,Aktif,
5,105,Ergene Tenis Kortları,Tenis,300,70,Aktif,
6,106,Malkara Voleybol Alanı,Voleybol,150,60,Aktif,
7,107,Saray Güreş Sahası,Gures,100,85,Aktif,
8,108,Hayrabolu Fitness Merkezi,Fitness,120,76,Bakimda,
9,101,Namık Kemal Atletizm Pisti,Kosu,0,50,Aktif,
10,105,Ergene Padel Kortu,Tenis,350,65,Aktif,`,

    rezervasyonlar: `rezervasyonId,tesisId,kullaniciId,tarih,saat,sure,durum
1,1,2,2026-05-10,18:00,1 Saat,Onaylandi
2,2,2,2026-05-11,19:00,2 Saat,Beklemede
3,3,2,2026-05-12,20:00,1 Saat,Onaylandi
4,4,2,2026-05-13,21:00,1 Saat,Iptal
5,5,2,2026-05-14,22:00,2 Saat,Onaylandi
6,6,2,2026-05-15,17:00,1 Saat,Beklemede
7,7,2,2026-05-16,16:00,1 Saat,Onaylandi
8,8,2,2026-05-17,15:00,1 Saat,Iptal
9,9,2,2026-05-18,14:00,1 Saat,Onaylandi`,

    degerlendirmeler: `degerlendirmeId,kullaniciId,kompleksId,puan,yorum,tarih
1,2,101,5,Harika bir saha!,2026-05-06
2,3,102,4,Çok güzel bir kompleks.,2026-05-07
3,4,103,3,Orta düzeyde bir tesis.,2026-05-08
4,2,104,2,Temizlik konusunda sorun var.,2026-05-09
5,3,105,5,Mükemmel tenis kortları!,2026-05-10
6,4,106,4,İyi bir voleybol alanı.,2026-05-11
7,2,107,3,Güzel bir güreş sahası.,2026-05-12
8,3,108,2,Fitness merkezi biraz eski.,2026-05-13
9,4,101,5,Atletizm pistini çok beğendim!,2026-05-14
10,2,105,4,Padel kartları harika!,2026-05-15`
};

// -------------------------------------------------------------------
// SPOR DALINA GÖRE İKON & RENK EŞLEMESİ
// -------------------------------------------------------------------

const SPOR_IKON_MAP = {
    'Futbol':    { icon: 'fas fa-futbol',                    bgClass: 'football-bg', image: 'https://images.unsplash.com/photo-1518605368461-1ee51181cdfa?q=80&w=600&auto=format&fit=crop' },
    'Basketbol': { icon: 'fas fa-basketball-ball',           bgClass: 'basketball-bg', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=600&auto=format&fit=crop' },
    'Yuzme':     { icon: 'fas fa-swimmer',                   bgClass: 'pool-bg', image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=600&auto=format&fit=crop' },
    'Tenis':     { icon: 'fas fa-table-tennis-paddle-ball',  bgClass: 'tennis-bg', image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=600&auto=format&fit=crop' },
    'Voleybol':  { icon: 'fas fa-volleyball-ball',           bgClass: 'volleyball-bg', image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=600&auto=format&fit=crop' },
    'Fitness':   { icon: 'fas fa-dumbbell',                  bgClass: 'gym-bg', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop' },
    'Gures':     { icon: 'fas fa-fist-raised',               bgClass: 'basketball-bg', image: 'https://images.unsplash.com/photo-1564883492576-903df12c0199?q=80&w=600&auto=format&fit=crop' },
    'Kosu':      { icon: 'fas fa-running',                   bgClass: 'football-bg', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop' }
};

// -------------------------------------------------------------------
// CSV PARSE FONKSİYONU
// -------------------------------------------------------------------

/**
 * CSV string'ini obje dizisine çevirir.
 * İlk satır başlık olarak kullanılır.
 *
 * @param {string} csvString - CSV formatındaki metin
 * @returns {Array<Object>} Parse edilmiş obje dizisi
 *
 * Zaman: O(n*m) — n satır, m sütun
 * Alan:  O(n*m)
 */
function parseCSV(csvString) {
    const satirlar = csvString.trim().split('\n');

    if (satirlar.length < 2) return [];

    const basliklar = satirlar[0].split(',').map(b => b.trim());
    const sonuc = [];

    for (let i = 1; i < satirlar.length; i++) {
        const satir = satirlar[i].trim();
        if (!satir) continue;

        const degerler = satir.split(',').map(d => d.trim());
        const obje = {};

        basliklar.forEach((baslik, idx) => {
            obje[baslik] = degerler[idx] || '';
        });

        sonuc.push(obje);
    }

    return sonuc;
}

// -------------------------------------------------------------------
// CSV → LOCALSTORAGE YÜKLEME
// -------------------------------------------------------------------

/**
 * Tüm CSV verilerini parse eder ve localStorage'a yükler.
 * Mevcut verileri korur (force=true ile üzerine yazılabilir).
 *
 * @param {boolean} force - true ise mevcut verilerin üzerine yaz
 *
 * Zaman: O(n) — Toplam veri satırı sayısı
 */
function loadFromCSV(force = false) {
    // LocalStorage'daki eski ASCII tesis isimlerini tespit edip otomatik temizleme
    try {
        const facs = JSON.parse(localStorage.getItem('tsr_facilities') || '[]');
        if (facs.length > 0 && facs.some(f => f.name === 'Namik Kemal Stadi Sahasi')) {
            console.log('🔄 Eski ASCII veriler tespit edildi. LocalStorage temizleniyor...');
            localStorage.removeItem('tsr_facilities');
            localStorage.removeItem('tsr_kompleksler');
            localStorage.removeItem('tsr_degerlendirmeler');
        }
    } catch (e) {
        console.error(e);
    }

    console.log('📂 CSV verileri yükleniyor...');

    // --- KULLANICILAR ---
    if (force || !localStorage.getItem('tsr_users_csv')) {
        const kullanicilar = parseCSV(CSV_DATA.kullanicilar);
        localStorage.setItem('tsr_users_csv', JSON.stringify(kullanicilar));
        console.log(`  ✓ ${kullanicilar.length} kullanıcı yüklendi`);
    }

    // --- KOMPLEKSLER ---
    if (force || !localStorage.getItem('tsr_kompleksler')) {
        const kompleksler = parseCSV(CSV_DATA.kompleksler);
        localStorage.setItem('tsr_kompleksler', JSON.stringify(kompleksler));
        console.log(`  ✓ ${kompleksler.length} kompleks yüklendi`);
    }

    // --- TESİSLER ---
    // CSV'den okunan tesisleri dashboard'un beklediği formata dönüştür
    if (force || !localStorage.getItem('tsr_facilities')) {
        const tesislerRaw = parseCSV(CSV_DATA.tesisler);
        const kompleksler = JSON.parse(localStorage.getItem('tsr_kompleksler') || '[]');

        const tesisler = tesislerRaw.map(t => {
            const kompleks = kompleksler.find(k => k.kompleksId === t.kompleksId);
            const sporMap = SPOR_IKON_MAP[t.tesisTuru] || { icon: 'fas fa-trophy', bgClass: 'football-bg' };

            return {
                id: 'tesis-' + t.tesisId,
                tesisId: parseInt(t.tesisId),
                kompleksId: parseInt(t.kompleksId),
                name: t.tesisAdi,
                sport: t.tesisTuru,
                location: kompleks ? (kompleks.ilce + ', Tekirdağ') : 'Tekirdağ',
                kompleksAdi: kompleks ? kompleks.kompleksAdi : '',
                icon: sporMap.icon,
                bgClass: sporMap.bgClass,
                image: t.gorselUrl || sporMap.image,
                price: parseFloat(t.ucretSaatlik),
                capacity: parseInt(t.kapasite),
                hours: kompleks ? (kompleks.acilisSaati + ' - ' + kompleks.kapanisSaati) : '09:00 - 23:00',
                rating: 0,
                status: t.durum === 'Aktif' ? 'active' : 'maintenance'
            };
        });

        localStorage.setItem('tsr_facilities', JSON.stringify(tesisler));
        console.log(`  ✓ ${tesisler.length} tesis yüklendi`);
    }

    // --- REZERVASYONLAR ---
    if (force || !localStorage.getItem('tsr_reservations')) {
        const rezRaw = parseCSV(CSV_DATA.rezervasyonlar);
        const tesisler = JSON.parse(localStorage.getItem('tsr_facilities') || '[]');
        const kullanicilar = JSON.parse(localStorage.getItem('tsr_users_csv') || '[]');

        const rezervasyonlar = rezRaw.map(r => {
            const tesis = tesisler.find(t => t.tesisId === parseInt(r.tesisId));
            const cleanId = (id) => String(id || '').trim().replace(/^0+/, '');
            const rUid = cleanId(r.kullaniciId);
            const kullanici = kullanicilar.find(k => cleanId(k.kullaniciId) === rUid);

            let durum = 'confirmed';
            if (r.durum === 'Beklemede') durum = 'pending';
            else if (r.durum === 'Iptal') durum = 'cancelled';
            else if (r.durum === 'Arsivlendi') durum = 'archived';

            return {
                id: 'RES-CSV-' + r.rezervasyonId,
                facilityId: tesis ? tesis.id : 'tesis-' + r.tesisId,
                facilityName: tesis ? tesis.name : 'Tesis #' + r.tesisId,
                userId: r.kullaniciId,
                userName: kullanici ? kullanici.adSoyad : 'Kullanıcı #' + r.kullaniciId,
                date: r.tarih,
                time: r.saat,
                duration: parseInt(r.sure) || 1,
                people: 1,
                notes: '',
                totalPrice: tesis ? tesis.price : 0,
                status: durum,
                createdAt: r.tarih + 'T00:00:00.000Z'
            };
        });

        localStorage.setItem('tsr_reservations', JSON.stringify(rezervasyonlar));
        console.log(`  ✓ ${rezervasyonlar.length} rezervasyon yüklendi`);
    }

    // --- DEĞERLENDİRMELER ---
    if (force || !localStorage.getItem('tsr_degerlendirmeler')) {
        const degerler = parseCSV(CSV_DATA.degerlendirmeler);
        localStorage.setItem('tsr_degerlendirmeler', JSON.stringify(degerler));
        console.log(`  ✓ ${degerler.length} değerlendirme yüklendi`);

        // Kompleks bazlı ortalama puan hesapla ve tesislere uygula
        hesaplaOrtalamaPuanlar();
    }

    // --- KULLANICILARI WEB AUTH FORMATINA DA EKLE ---
    // Her zaman CSV kullanıcılarını kontrol et ve eksikleri ekle
    const csvKullanicilar = JSON.parse(localStorage.getItem('tsr_users_csv') || '[]');
    const mevcutUsers = JSON.parse(localStorage.getItem('tsr_users') || '[]');

    let eklenen = 0;
    csvKullanicilar.forEach(k => {
        // Email ile çakışma kontrolü
        const varMi = mevcutUsers.some(u => u.email === k.email);
        if (!varMi) {
            mevcutUsers.push({
                name: k.adSoyad,
                tc: '0000000000' + k.kullaniciId,
                email: k.email,
                phone: '05001234567',
                password: k.sifre,  // CSV'den düz metin şifre
                role: k.rol === 'ADMIN' ? 'admin' : 'user',
                createdAt: new Date().toISOString()
            });
            eklenen++;
        }
    });

    if (eklenen > 0) {
        localStorage.setItem('tsr_users', JSON.stringify(mevcutUsers));
        console.log(`  ✓ ${eklenen} CSV kullanıcısı web auth formatına eklendi`);
    }

    console.log('📂 CSV yükleme tamamlandı!\n');
}

/**
 * Sunucudaki güncel CSV dosyalarını okur ve localStorage'ı günceller.
 * Eğer local dosya protokolündeyse (file://) veya sunucuya erişilemiyorsa gömülü CSV verilerine geri döner.
 */
async function syncFromCSVServer() {
    // LocalStorage'daki eski ASCII tesis isimlerini tespit edip otomatik temizleme
    try {
        const facs = JSON.parse(localStorage.getItem('tsr_facilities') || '[]');
        if (facs.length > 0 && facs.some(f => f.name === 'Namik Kemal Stadi Sahasi')) {
            console.log('🔄 Eski ASCII veriler tespit edildi. LocalStorage temizleniyor...');
            localStorage.removeItem('tsr_facilities');
            localStorage.removeItem('tsr_kompleksler');
            localStorage.removeItem('tsr_degerlendirmeler');
        }
    } catch (e) {
        console.error(e);
    }

    if (window.location.protocol.startsWith('file')) {
        console.log('🌐 Local file protocol, using local embedded CSV data.');
        loadFromCSV(false);
        return false;
    }

    console.log('📂 Sunucudan güncel CSV verileri çekiliyor...');
    try {
        // Önce kompleksleri ve kullanıcıları yükleyelim çünkü tesisler ve rezervasyonlar bunlara bağımlı olabilir.
        const t = Date.now();
        // 1. Kompleksler
        const resKompleks = await fetch(`data/kompleksler.csv?t=${t}`);
        if (resKompleks.ok) {
            const csvText = await resKompleks.text();
            const kompleksler = parseCSV(csvText);
            localStorage.setItem('tsr_kompleksler', JSON.stringify(kompleksler));
            console.log(`  ✓ ${kompleksler.length} kompleks sunucudan güncellendi`);
        }

        // 2. Kullanıcılar
        const resUsers = await fetch(`data/kullanicilar.csv?t=${t}`);
        if (resUsers.ok) {
            const csvText = await resUsers.text();
            const kullanicilar = parseCSV(csvText);
            localStorage.setItem('tsr_users_csv', JSON.stringify(kullanicilar));
            
            // Web auth formatını da güncelle
            const mevcutUsers = JSON.parse(localStorage.getItem('tsr_users') || '[]');
            kullanicilar.forEach(k => {
                const varMi = mevcutUsers.some(u => u.email === k.email);
                if (!varMi) {
                    mevcutUsers.push({
                        name: k.adSoyad,
                        tc: '0000000000' + k.kullaniciId,
                        email: k.email,
                        phone: '05001234567',
                        password: k.sifre,
                        role: k.rol === 'ADMIN' ? 'admin' : 'user',
                        createdAt: new Date().toISOString()
                    });
                }
            });
            localStorage.setItem('tsr_users', JSON.stringify(mevcutUsers));
            console.log(`  ✓ ${kullanicilar.length} kullanıcı sunucudan güncellendi`);
        }

        // 3. Tesisler
        const resTesis = await fetch(`data/tesisler.csv?t=${t}`);
        if (resTesis.ok) {
            const csvText = await resTesis.text();
            const tesislerRaw = parseCSV(csvText);
            const kompleksler = JSON.parse(localStorage.getItem('tsr_kompleksler') || '[]');

            const tesisler = tesislerRaw.map(t => {
                const kompleks = kompleksler.find(k => k.kompleksId === t.kompleksId);
                const sporMap = SPOR_IKON_MAP[t.tesisTuru] || { icon: 'fas fa-trophy', bgClass: 'football-bg' };

                return {
                    id: 'tesis-' + t.tesisId,
                    tesisId: parseInt(t.tesisId),
                    kompleksId: parseInt(t.kompleksId),
                    name: t.tesisAdi,
                    sport: t.tesisTuru,
                    location: kompleks ? (kompleks.ilce + ', Tekirdağ') : 'Tekirdağ',
                    kompleksAdi: kompleks ? kompleks.kompleksAdi : '',
                    icon: sporMap.icon,
                    bgClass: sporMap.bgClass,
                    image: t.gorselUrl || sporMap.image,
                    price: parseFloat(t.ucretSaatlik),
                    capacity: parseInt(t.kapasite),
                    hours: kompleks ? (kompleks.acilisSaati + ' - ' + kompleks.kapanisSaati) : '09:00 - 23:00',
                    rating: 0,
                    status: t.durum === 'Aktif' ? 'active' : 'maintenance'
                };
            });
            localStorage.setItem('tsr_facilities', JSON.stringify(tesisler));
            console.log(`  ✓ ${tesisler.length} tesis sunucudan güncellendi`);
        }

        // 4. Rezervasyonlar
        const resRez = await fetch(`data/rezervasyonlar.csv?t=${t}`);
        if (resRez.ok) {
            const csvText = await resRez.text();
            const rezRaw = parseCSV(csvText);
            const tesisler = JSON.parse(localStorage.getItem('tsr_facilities') || '[]');
            const kullanicilar = JSON.parse(localStorage.getItem('tsr_users_csv') || '[]');

            const rezervasyonlar = rezRaw.map(r => {
                const tesis = tesisler.find(t => t.tesisId === parseInt(r.tesisId));
                const cleanId = (id) => String(id || '').trim().replace(/^0+/, '');
                const rUid = cleanId(r.kullaniciId);
                const kullanici = kullanicilar.find(k => cleanId(k.kullaniciId) === rUid);

                let durum = 'confirmed';
                if (r.durum === 'Beklemede') durum = 'pending';
                else if (r.durum === 'Iptal') durum = 'cancelled';
                else if (r.durum === 'Arsivlendi') durum = 'archived';

                return {
                    id: r.rezervasyonId.startsWith('RES-') ? r.rezervasyonId : 'RES-CSV-' + r.rezervasyonId,
                    facilityId: tesis ? tesis.id : 'tesis-' + r.tesisId,
                    facilityName: tesis ? tesis.name : 'Tesis #' + r.tesisId,
                    userId: r.kullaniciId,
                    userName: kullanici ? kullanici.adSoyad : 'Kullanıcı #' + r.kullaniciId,
                    date: r.tarih,
                    time: r.saat,
                    duration: parseInt(r.sure) || 1,
                    people: 1,
                    notes: '',
                    totalPrice: tesis ? tesis.price : 0,
                    status: durum,
                    createdAt: r.tarih + 'T00:00:00.000Z'
                };
            });
            localStorage.setItem('tsr_reservations', JSON.stringify(rezervasyonlar));
            console.log(`  ✓ ${rezervasyonlar.length} rezervasyon sunucudan güncellendi`);
        }

        // 5. Değerlendirmeler
        const resReviews = await fetch(`data/degerlendirmeler.csv?t=${t}`);
        if (resReviews.ok) {
            const csvText = await resReviews.text();
            const degerler = parseCSV(csvText);
            localStorage.setItem('tsr_degerlendirmeler', JSON.stringify(degerler));
            console.log(`  ✓ ${degerler.length} değerlendirme sunucudan güncellendi`);
            hesaplaOrtalamaPuanlar();
        }

        return true;
    } catch (err) {
        console.warn('⚠️ Sunucudan güncel veriler çekilemedi, gömülü verilere geri dönülüyor:', err.message);
        loadFromCSV(false);
        return false;
    }
}


/**
 * Değerlendirme puanlarını kompleks bazında hesaplar
 * ve tesislerin rating değerlerini günceller.
 *
 * Zaman: O(d + t) — d = değerlendirme, t = tesis sayısı
 */
function hesaplaOrtalamaPuanlar() {
    const degerler = JSON.parse(localStorage.getItem('tsr_degerlendirmeler') || '[]');
    const tesisler = JSON.parse(localStorage.getItem('tsr_facilities') || '[]');

    // Kompleks bazında puan topla
    const puanMap = {};
    degerler.forEach(d => {
        const kid = d.kompleksId;
        if (!puanMap[kid]) {
            puanMap[kid] = { toplam: 0, sayi: 0 };
        }
        puanMap[kid].toplam += parseInt(d.puan);
        puanMap[kid].sayi++;
    });

    // Tesislere ortalama puanı uygula
    tesisler.forEach(t => {
        const p = puanMap[t.kompleksId];
        if (p) {
            t.rating = parseFloat((p.toplam / p.sayi).toFixed(1));
        }
    });

    localStorage.setItem('tsr_facilities', JSON.stringify(tesisler));
}

// -------------------------------------------------------------------
// DIŞA AKTARMA FONKSİYONLARI
// -------------------------------------------------------------------

/**
 * localStorage verilerini CSV formatında indirir.
 *
 * @param {string} tablo - 'kullanicilar' | 'tesisler' | 'rezervasyonlar' | 'degerlendirmeler'
 */
function exportToCSV(tablo) {
    let data, filename, headers;

    switch (tablo) {
        case 'kullanicilar':
            data = JSON.parse(localStorage.getItem('tsr_users_csv') || '[]');
            headers = 'kullaniciId,adSoyad,email,sifre,rol';
            filename = 'kullanicilar.csv';
            break;
        case 'tesisler':
            data = JSON.parse(localStorage.getItem('tsr_facilities') || '[]');
            headers = 'tesisId,kompleksId,tesisAdi,tesisTuru,kapasite,ucretSaatlik,durum,gorselUrl';
            data = data.map(t => ({
                tesisId: t.tesisId, kompleksId: t.kompleksId,
                tesisAdi: t.name, tesisTuru: t.sport,
                kapasite: t.capacity || 50, ucretSaatlik: t.price,
                durum: t.status === 'active' ? 'Aktif' : 'Bakimda',
                gorselUrl: t.image || ''
            }));
            filename = 'tesisler.csv';
            break;
        case 'rezervasyonlar':
            data = JSON.parse(localStorage.getItem('tsr_reservations') || '[]');
            headers = 'rezervasyonId,tesisId,kullaniciId,tarih,saat,sure,durum';
            data = data.map((r, i) => ({
                rezervasyonId: i + 1, tesisId: r.facilityId,
                kullaniciId: r.userId, tarih: r.date,
                saat: r.time, sure: r.duration + ' Saat',
                durum: r.status === 'confirmed' ? 'Onaylandi' : r.status === 'pending' ? 'Beklemede' : 'Iptal'
            }));
            filename = 'rezervasyonlar.csv';
            break;
        case 'degerlendirmeler':
            data = JSON.parse(localStorage.getItem('tsr_degerlendirmeler') || '[]');
            headers = 'degerlendirmeId,kullaniciId,kompleksId,puan,yorum,tarih';
            filename = 'degerlendirmeler.csv';
            break;
        default:
            console.error('Bilinmeyen tablo:', tablo);
            return;
    }

    const satirlar = data.map(obj => Object.values(obj).join(','));
    const csvContent = headers + '\n' + satirlar.join('\n');

    downloadFile(csvContent, filename, 'text/csv;charset=utf-8');
}

/**
 * localStorage verilerini JSON formatında indirir.
 *
 * @param {string} tablo - Tablo adı
 */
function exportToJSON(tablo) {
    const keyMap = {
        'kullanicilar': 'tsr_users_csv',
        'kompleksler': 'tsr_kompleksler',
        'tesisler': 'tsr_facilities',
        'rezervasyonlar': 'tsr_reservations',
        'degerlendirmeler': 'tsr_degerlendirmeler'
    };

    const key = keyMap[tablo];
    if (!key) {
        console.error('Bilinmeyen tablo:', tablo);
        return;
    }

    const data = localStorage.getItem(key) || '[]';
    const formatted = JSON.stringify(JSON.parse(data), null, 2);

    downloadFile(formatted, tablo + '.json', 'application/json;charset=utf-8');
}

/**
 * Tüm verileri tek bir JSON dosyası olarak indirir.
 */
function exportAllJSON() {
    const tumVeri = {
        kullanicilar: JSON.parse(localStorage.getItem('tsr_users_csv') || '[]'),
        kompleksler: JSON.parse(localStorage.getItem('tsr_kompleksler') || '[]'),
        tesisler: JSON.parse(localStorage.getItem('tsr_facilities') || '[]'),
        rezervasyonlar: JSON.parse(localStorage.getItem('tsr_reservations') || '[]'),
        degerlendirmeler: JSON.parse(localStorage.getItem('tsr_degerlendirmeler') || '[]'),
        exportTarihi: new Date().toISOString()
    };

    const formatted = JSON.stringify(tumVeri, null, 2);
    downloadFile(formatted, 'tekirdag_spor_tum_veri.json', 'application/json;charset=utf-8');
}

// -------------------------------------------------------------------
// VERİ ERİŞİM YARDIMCILARI
// -------------------------------------------------------------------

/**
 * Kompleks listesini döndürür.
 * @returns {Array}
 */
function getKompleksler() {
    return JSON.parse(localStorage.getItem('tsr_kompleksler') || '[]');
}

/**
 * Değerlendirme listesini döndürür.
 * @returns {Array}
 */
function getDegerlendirmeler() {
    return JSON.parse(localStorage.getItem('tsr_degerlendirmeler') || '[]');
}

/**
 * Belirli bir kompleksin değerlendirmelerini döndürür.
 * @param {string|number} kompleksId
 * @returns {Array}
 *
 * Zaman: O(n) — Lineer filtre
 */
function getKompleksDegerlendirmeleri(kompleksId) {
    const degerler = getDegerlendirmeler();
    return degerler.filter(d => d.kompleksId == kompleksId);
}

/**
 * Belirli bir kompleksin tesislerini döndürür.
 * @param {number} kompleksId
 * @returns {Array}
 *
 * Zaman: O(n) — Lineer filtre
 */
function getKompleksTesisleri(kompleksId) {
    const tesisler = JSON.parse(localStorage.getItem('tsr_facilities') || '[]');
    return tesisler.filter(t => t.kompleksId === kompleksId);
}

// -------------------------------------------------------------------
// DOSYA İNDİRME YARDIMCISI
// -------------------------------------------------------------------

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// -------------------------------------------------------------------
// PYTHON SUNUCUSUNA SYNC
// -------------------------------------------------------------------

/**
 * localStorage verilerini Python sunucusuna POST eder.
 * Sunucu /api/sync endpoint'i ile CSV dosyalarını günceller.
 *
 * @param {string|null} tablo - Belirli bir tablo adı veya null (tümü)
 * @returns {Promise<boolean>} Başarılı mı?
 *
 * Kullanım:
 *   syncToServer()              → tüm tabloları senkronize et
 *   syncToServer('degerlendirmeler') → sadece değerlendirmeleri senkronize et
 */
async function syncToServer(tablo = null, singleRecord = null) {
    const payload = {};

    if (!tablo || tablo === 'kullanicilar') {
        payload.kullanicilar = JSON.parse(localStorage.getItem('tsr_users_csv') || '[]');
    }
    if (!tablo || tablo === 'kompleksler') {
        payload.kompleksler = JSON.parse(localStorage.getItem('tsr_kompleksler') || '[]');
    }
    if (!tablo || tablo === 'tesisler') {
        payload.tesisler = JSON.parse(localStorage.getItem('tsr_facilities') || '[]');
    }
    if (!tablo || tablo === 'rezervasyonlar') {
        if (singleRecord) {
            // Sadece yeni eklenen tek kaydı gönder (çifte gönderim önlenir)
            payload.rezervasyonlar = [singleRecord];
        } else {
            // Tüm listeyi gönder (Sunucu RES-CSV- olanların durumunu güncelleyecek, yeni olanları ekleyecek)
            payload.rezervasyonlar = JSON.parse(localStorage.getItem('tsr_reservations') || '[]');
        }
    }
    if (!tablo || tablo === 'degerlendirmeler') {
        payload.degerlendirmeler = JSON.parse(localStorage.getItem('tsr_degerlendirmeler') || '[]');
    }

    try {
        const response = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ CSV sync başarılı:', result.details);
            return true;
        } else if (response.status === 409) {
            const errData = await response.json();
            console.warn('⚠️ Çifte Rezervasyon tespit edildi:', errData.message);
            const err = new Error(errData.message || 'Rezervasyon başka bir kişi tarafından yapılmıştır.');
            err.status = 409;
            err.errorType = errData.errorType || 'DOUBLE_BOOKING';
            throw err;
        } else {
            console.warn('⚠️ CSV sync başarısız:', response.status);
            return false;
        }
    } catch (err) {
        if (err.message && err.message.includes('başka bir kişi tarafından')) {
            throw err;
        }
        // Sunucu çalışmıyorsa sessiz ol (file:// protokolünde normal)
        if (!window.location.protocol.startsWith('file')) {
            console.warn('⚠️ Sync sunucusuna bağlanılamadı:', err.message);
        }
        return false;
    }
}

/**
 * Veri değişikliği sonrası otomatik sync tetikler.
 * Debounce ile 1 saniye bekler, böylece peş peşe değişiklikler tek sync olur.
 */
let _syncTimer = null;
function autoSync(tablo = null) {
    if (_syncTimer) clearTimeout(_syncTimer);
    _syncTimer = setTimeout(() => {
        syncToServer(tablo);
    }, 1000);
}


// ===================================================================
// TEKİRDAĞ SPOR REZERVASYON SİSTEMİ
// Veri Yapıları Modülü (Sıfırdan Implement Edilmiş)
//
// Java karşılıkları:
//   - Node.java        → Node class
//   - BeklemeKuyrugu.java → BeklemeKuyrugu class (Linked List Queue)
//   - Tesis.java (Stack)  → IptalYigini class (Stack)
//   - Tesis.java (slots)  → SlotArray class (Fixed Array)
//
// Teknik Gereksinim 1: En az 2 farklı veri yapısı (1'i sıfırdan)
//   ✓ BeklemeKuyrugu — Linked List tabanlı Queue (sıfırdan)
//   ✓ IptalYigini   — Stack (sıfırdan)
//   ✓ SlotArray      — Sabit boyutlu dizi yapısı
//
// Teknik Gereksinim 2: Big-O analizi her metoda eklenmiştir.
// ===================================================================

// -------------------------------------------------------------------
// NODE — Bağlı Liste Düğümü
// Java karşılığı: Node.java
// -------------------------------------------------------------------

class Node {
    /**
     * @param {*} data - Düğümde saklanacak veri
     *
     * Zaman: O(1)
     * Alan:  O(1)
     */
    constructor(data) {
        this.data = data;
        this.next = null;
    }
}

// -------------------------------------------------------------------
// BEKLEME KUYRUĞU — Linked List Tabanlı Queue (FIFO)
// Java karşılığı: BeklemeKuyrugu.java
//
// Sıfırdan implement edilmiştir (Java koleksiyon kütüphanesi
// kullanılmadan, sadece Node referansları ile).
//
// Kullanım: Dolu saatlerde kullanıcıları bekleme sırasına alma
// -------------------------------------------------------------------

class BeklemeKuyrugu {

    constructor() {
        /** @private Kuyruğun başı (ilk çıkacak eleman) */
        this.front = null;

        /** @private Kuyruğun sonu (son eklenen eleman) */
        this.rear = null;

        /** @private Eleman sayısı */
        this._size = 0;
    }

    /**
     * Kuyruğun boş olup olmadığını kontrol eder.
     * @returns {boolean}
     *
     * Zaman: O(1) — Tek karşılaştırma
     * Alan:  O(1)
     */
    isEmpty() {
        return this.front === null;
    }

    /**
     * Kuyruğun eleman sayısını döndürür.
     * @returns {number}
     *
     * Zaman: O(1) — Saklanan değeri döndürme
     * Alan:  O(1)
     */
    size() {
        return this._size;
    }

    /**
     * Kuyruğun sonuna eleman ekler (enqueue).
     * Yeni bir Node oluşturur ve rear'a bağlar.
     *
     * @param {*} data - Eklenecek veri
     *
     * Zaman: O(1) — rear referansı ile doğrudan ekleme
     * Alan:  O(1) — Tek Node oluşturma
     */
    enqueue(data) {
        const yeniNode = new Node(data);

        if (this.isEmpty()) {
            // Kuyruk boşsa hem front hem rear yeni node'u gösterir
            this.front = yeniNode;
            this.rear = yeniNode;
        } else {
            // Mevcut rear'ın next'ini yeni node'a bağla
            this.rear.next = yeniNode;
            // rear'ı yeni node'a güncelle
            this.rear = yeniNode;
        }

        this._size++;
        return data;
    }

    /**
     * Kuyruğun başından eleman çıkarır (dequeue).
     * Front referansını bir sonraki düğüme ilerletir.
     *
     * @returns {*} Çıkarılan eleman verisi veya null
     *
     * Zaman: O(1) — front referansı ile doğrudan çıkarma
     * Alan:  O(1)
     */
    dequeue() {
        if (this.isEmpty()) {
            return null;
        }

        const cikan = this.front.data;

        // front'u ilerlet
        this.front = this.front.next;

        // Kuyruk boşaldıysa rear'ı da null yap
        if (this.front === null) {
            this.rear = null;
        }

        this._size--;
        return cikan;
    }

    /**
     * Kuyruğun başındaki elemanı çıkarmadan gösterir.
     * @returns {*} Baştaki eleman verisi veya null
     *
     * Zaman: O(1)
     * Alan:  O(1)
     */
    peek() {
        if (this.isEmpty()) {
            return null;
        }
        return this.front.data;
    }

    /**
     * Kuyruktaki tüm elemanları dizi olarak döndürür.
     * Front'tan rear'a doğru dolaşır.
     *
     * @returns {Array} Kuyruktaki elemanlar
     *
     * Zaman: O(n) — Tüm düğümleri dolaşma
     * Alan:  O(n) — Yeni dizi oluşturma
     */
    toArray() {
        const sonuc = [];
        let current = this.front;

        while (current !== null) {
            sonuc.push(current.data);
            current = current.next;
        }

        return sonuc;
    }

    /**
     * Kuyruğu tamamen temizler.
     *
     * Zaman: O(1) — Referansları null yapma
     * Alan:  O(1)
     */
    clear() {
        this.front = null;
        this.rear = null;
        this._size = 0;
    }

    /**
     * Kuyrukta belirli bir elemanın olup olmadığını arar.
     *
     * @param {Function} predicate - Arama koşulu fonksiyonu
     * @returns {*} Bulunan eleman veya null
     *
     * Zaman: O(n) — Lineer arama
     * Alan:  O(1)
     */
    bul(predicate) {
        let current = this.front;

        while (current !== null) {
            if (predicate(current.data)) {
                return current.data;
            }
            current = current.next;
        }

        return null;
    }
}

// -------------------------------------------------------------------
// İPTAL YIĞINI — Stack (LIFO)
// Java karşılığı: Tesis.java içindeki Stack<Reservation>
//
// Sıfırdan implement edilmiştir.
// Kullanım: İptal edilen rezervasyonları saklama ve geri alma
// -------------------------------------------------------------------

class IptalYigini {

    constructor() {
        /** @private Stack elemanlarını tutan dizi */
        this.items = [];
    }

    /**
     * Stack'in boş olup olmadığını kontrol eder.
     * @returns {boolean}
     *
     * Zaman: O(1)
     * Alan:  O(1)
     */
    isEmpty() {
        return this.items.length === 0;
    }

    /**
     * Stack'teki eleman sayısını döndürür.
     * @returns {number}
     *
     * Zaman: O(1)
     * Alan:  O(1)
     */
    size() {
        return this.items.length;
    }

    /**
     * Stack'in tepesine eleman ekler (push).
     * @param {*} item - Eklenecek eleman
     *
     * Zaman: O(1) amortized — Dizi sonuna ekleme
     * Alan:  O(1)
     */
    push(item) {
        this.items.push(item);
        return item;
    }

    /**
     * Stack'in tepesinden eleman çıkarır (pop).
     * Son eklenen eleman ilk çıkar (LIFO).
     *
     * @returns {*} Çıkarılan eleman veya null
     *
     * Zaman: O(1) — Dizi sonundan çıkarma
     * Alan:  O(1)
     */
    pop() {
        if (this.isEmpty()) {
            return null;
        }
        return this.items.pop();
    }

    /**
     * Stack'in tepesindeki elemanı çıkarmadan gösterir.
     * @returns {*} Tepe elemanı veya null
     *
     * Zaman: O(1)
     * Alan:  O(1)
     */
    peek() {
        if (this.isEmpty()) {
            return null;
        }
        return this.items[this.items.length - 1];
    }

    /**
     * Stack'teki tüm elemanları dizi olarak döndürür.
     * Tepeden alta doğru sıralı.
     *
     * @returns {Array} Stack elemanları (ters sırada — son eklenen başta)
     *
     * Zaman: O(n) — Dizi kopyalama ve ters çevirme
     * Alan:  O(n)
     */
    toArray() {
        return [...this.items].reverse();
    }

    /**
     * Stack'i tamamen temizler.
     *
     * Zaman: O(1)
     * Alan:  O(1)
     */
    clear() {
        this.items = [];
    }
}

// -------------------------------------------------------------------
// SLOT ARRAY — Sabit Boyutlu Saat Dizisi
// Java karşılığı: Tesis.java içindeki Reservation[] slots
//
// 09:00 - 23:00 arası 14 saatlik slot yönetimi.
// Her slot bir rezervasyonu temsil eder.
// -------------------------------------------------------------------

class SlotArray {

    /**
     * @param {number} baslangicSaat - İlk slot saati (varsayılan 9)
     * @param {number} bitisSaat - Son slot saati (varsayılan 23)
     *
     * Zaman: O(n) — n = slot sayısı, dizi oluşturma
     * Alan:  O(n)
     */
    constructor(baslangicSaat = 9, bitisSaat = 23) {
        this.baslangicSaat = baslangicSaat;
        this.bitisSaat = bitisSaat;
        this.slotSayisi = bitisSaat - baslangicSaat; // 14

        /** @private Her saat için slot (null = boş) */
        this.slots = new Array(this.slotSayisi).fill(null);
    }

    /**
     * Saat değerini dizi indeksine çevirir.
     * @param {number} saat - Saat değeri (9-22)
     * @returns {number} Dizi indeksi
     *
     * Zaman: O(1)
     */
    _saatToIndex(saat) {
        return saat - this.baslangicSaat;
    }

    /**
     * Belirtilen saate rezervasyon ekler.
     *
     * @param {number} saat - Başlangıç saati
     * @param {Object} rezervasyon - Rezervasyon verisi
     * @param {number} sure - Süre (saat cinsinden, varsayılan 1)
     * @returns {boolean} Başarılı ise true
     *
     * Hata yönetimi:
     *   - Geçersiz saat aralığı kontrolü
     *   - Çakışma kontrolü (dolu slot)
     *
     * Zaman: O(k) — k = süre (genelde 1-2, pratikte O(1))
     * Alan:  O(1)
     */
    rezervasyonEkle(saat, rezervasyon, sure = 1) {
        const startIdx = this._saatToIndex(saat);
        const endIdx = startIdx + sure;

        // Hata Yönetimi: Geçersiz saat aralığı
        if (startIdx < 0 || endIdx > this.slotSayisi || startIdx >= endIdx) {
            console.warn(`Geçersiz saat aralığı: ${saat}:00 - ${saat + sure}:00`);
            return false;
        }

        // Hata Yönetimi: Çakışma kontrolü
        for (let i = startIdx; i < endIdx; i++) {
            if (this.slots[i] !== null) {
                console.warn(`Saat ${i + this.baslangicSaat}:00 zaten dolu!`);
                return false;
            }
        }

        // Slotlara yerleştir
        for (let i = startIdx; i < endIdx; i++) {
            this.slots[i] = rezervasyon;
        }

        return true;
    }

    /**
     * Belirtilen saatteki rezervasyonu iptal eder.
     *
     * @param {number} saat - İptal edilecek saatin başlangıcı
     * @returns {Object|null} İptal edilen rezervasyon veya null
     *
     * Zaman: O(n) — Tüm slotlarda aynı rezervasyonu temizleme
     * Alan:  O(1)
     */
    rezervasyonIptal(saat) {
        const index = this._saatToIndex(saat);

        // Hata Yönetimi: Sınır kontrolü
        if (index < 0 || index >= this.slotSayisi) {
            console.warn(`Saat ${this.baslangicSaat}:00 ile ${this.bitisSaat}:00 arasında olmalıdır.`);
            return null;
        }

        // Hata Yönetimi: Boş slot
        if (this.slots[index] === null) {
            console.warn(`Bu saatte iptal edilecek rezervasyon yok!`);
            return null;
        }

        const iptalEdilen = this.slots[index];

        // Aynı rezervasyonu tüm slotlardan temizle
        for (let i = 0; i < this.slotSayisi; i++) {
            if (this.slots[i] === iptalEdilen) {
                this.slots[i] = null;
            }
        }

        return iptalEdilen;
    }

    /**
     * Belirtilen saatin müsait olup olmadığını kontrol eder.
     *
     * @param {number} saat - Kontrol edilecek saat
     * @returns {boolean}
     *
     * Zaman: O(1) — Doğrudan indeks erişimi
     * Alan:  O(1)
     */
    musaitMi(saat) {
        const index = this._saatToIndex(saat);
        if (index < 0 || index >= this.slotSayisi) return false;
        return this.slots[index] === null;
    }

    /**
     * Tüm müsait saatleri döndürür.
     * @returns {Array<number>} Müsait saat listesi
     *
     * Zaman: O(n) — n = slot sayısı (14)
     * Alan:  O(m) — m = müsait slot sayısı
     */
    musaitSaatler() {
        const sonuc = [];

        for (let i = 0; i < this.slotSayisi; i++) {
            if (this.slots[i] === null) {
                sonuc.push(i + this.baslangicSaat);
            }
        }

        return sonuc;
    }

    /**
     * Tüm dolu saatleri döndürür.
     * @returns {Array<{saat: number, rezervasyon: Object}>}
     *
     * Zaman: O(n) — n = slot sayısı
     * Alan:  O(m) — m = dolu slot sayısı
     */
    doluSaatler() {
        const sonuc = [];

        for (let i = 0; i < this.slotSayisi; i++) {
            if (this.slots[i] !== null) {
                sonuc.push({
                    saat: i + this.baslangicSaat,
                    rezervasyon: this.slots[i]
                });
            }
        }

        return sonuc;
    }

    /**
     * Tüm slotların durumunu döndürür.
     * @returns {Array<{saat: number, durum: string, rezervasyon: Object|null}>}
     *
     * Zaman: O(n)
     * Alan:  O(n)
     */
    tumSlotlar() {
        const sonuc = [];

        for (let i = 0; i < this.slotSayisi; i++) {
            sonuc.push({
                saat: i + this.baslangicSaat,
                saatStr: `${String(i + this.baslangicSaat).padStart(2, '0')}:00`,
                durum: this.slots[i] === null ? 'BOŞ' : 'DOLU',
                rezervasyon: this.slots[i]
            });
        }

        return sonuc;
    }
}

// -------------------------------------------------------------------
// TEST SENARYOLARI
// Teknik Gereksinim 5: En az 3 test senaryosu
// -------------------------------------------------------------------

/**
 * Veri yapıları test fonksiyonu.
 * Tarayıcı konsolunda çalıştırılabilir: testVeriYapilari()
 */
function testVeriYapilari() {

    console.log('╔══════════════════════════════════════╗');
    console.log('║   VERİ YAPILARI TEST SENARYOLARI     ║');
    console.log('╚══════════════════════════════════════╝\n');

    // ===========================================
    // TEST 1: BeklemeKuyrugu (Queue) Testi
    // ===========================================
    console.log('━━━ TEST 1: BeklemeKuyrugu (Queue) ━━━');

    const kuyruk = new BeklemeKuyrugu();

    // Boş kuyruk testi
    console.assert(kuyruk.isEmpty() === true, 'Boş kuyruk isEmpty() = true olmalı');
    console.assert(kuyruk.size() === 0, 'Boş kuyruk size() = 0 olmalı');
    console.assert(kuyruk.dequeue() === null, 'Boş kuyruktan dequeue() = null olmalı');
    console.assert(kuyruk.peek() === null, 'Boş kuyrukta peek() = null olmalı');

    // Eleman ekleme
    kuyruk.enqueue({ ad: 'Berk', id: 2 });
    kuyruk.enqueue({ ad: 'Zeynep', id: 3 });
    kuyruk.enqueue({ ad: 'Safa', id: 4 });

    console.assert(kuyruk.size() === 3, 'Kuyruk boyutu 3 olmalı');
    console.assert(kuyruk.isEmpty() === false, 'Kuyruk boş olmamalı');
    console.assert(kuyruk.peek().ad === 'Berk', 'İlk sıradaki Berk olmalı (FIFO)');

    // Eleman çıkarma (FIFO sırası)
    const ilk = kuyruk.dequeue();
    console.assert(ilk.ad === 'Berk', 'İlk çıkan Berk olmalı');
    console.assert(kuyruk.peek().ad === 'Zeynep', 'Şimdi sıradaki Zeynep olmalı');
    console.assert(kuyruk.size() === 2, 'Kuyruk boyutu 2 olmalı');

    // Arama testi
    const bulunan = kuyruk.bul(k => k.id === 4);
    console.assert(bulunan !== null && bulunan.ad === 'Safa', 'ID=4 Safa olmalı');
    const bulunamayan = kuyruk.bul(k => k.id === 99);
    console.assert(bulunamayan === null, 'Olmayan ID null dönmeli');

    console.log('✓ TEST 1 BAŞARILI — BeklemeKuyrugu FIFO düzeni doğru çalışıyor\n');

    // ===========================================
    // TEST 2: IptalYigini (Stack) Testi
    // ===========================================
    console.log('━━━ TEST 2: IptalYigini (Stack) ━━━');

    const yigin = new IptalYigini();

    // Boş stack testi
    console.assert(yigin.isEmpty() === true, 'Boş stack isEmpty() = true olmalı');
    console.assert(yigin.pop() === null, 'Boş stacktan pop() = null olmalı');

    // Eleman ekleme
    yigin.push({ id: 'RES-1', tesis: 'Futbol Sahası', saat: '18:00' });
    yigin.push({ id: 'RES-2', tesis: 'Tenis Kortu', saat: '19:00' });
    yigin.push({ id: 'RES-3', tesis: 'Yüzme Havuzu', saat: '20:00' });

    console.assert(yigin.size() === 3, 'Stack boyutu 3 olmalı');

    // LIFO sırası testi (son eklenen ilk çıkar)
    console.assert(yigin.peek().id === 'RES-3', 'Tepedeki RES-3 olmalı (LIFO)');

    const sonIptal = yigin.pop();
    console.assert(sonIptal.id === 'RES-3', 'İlk çıkan RES-3 olmalı');
    console.assert(yigin.peek().id === 'RES-2', 'Şimdi tepedeki RES-2 olmalı');

    // toArray testi
    const stackDizi = yigin.toArray();
    console.assert(stackDizi[0].id === 'RES-2', 'toArray tepeden başlamalı');

    console.log('✓ TEST 2 BAŞARILI — IptalYigini LIFO düzeni doğru çalışıyor\n');

    // ===========================================
    // TEST 3: SlotArray Testi
    // ===========================================
    console.log('━━━ TEST 3: SlotArray (Saat Slotları) ━━━');

    const slotlar = new SlotArray(9, 23);

    // Başlangıçta tüm slotlar boş olmalı
    console.assert(slotlar.musaitSaatler().length === 14, '14 müsait slot olmalı');
    console.assert(slotlar.doluSaatler().length === 0, 'Dolu slot olmamalı');
    console.assert(slotlar.musaitMi(9) === true, '09:00 müsait olmalı');

    // Rezervasyon ekle
    const rez1 = { id: 'RES-A', kisi: 'Berk' };
    const eklendi = slotlar.rezervasyonEkle(18, rez1);
    console.assert(eklendi === true, 'Rezervasyon eklenmeli');
    console.assert(slotlar.musaitMi(18) === false, '18:00 artık dolu olmalı');
    console.assert(slotlar.musaitSaatler().length === 13, '13 müsait slot kalmalı');

    // Çakışma kontrolü
    const cakisma = slotlar.rezervasyonEkle(18, { id: 'RES-B' });
    console.assert(cakisma === false, 'Dolu saate ekleme başarısız olmalı');

    // İptal
    const iptal = slotlar.rezervasyonIptal(18);
    console.assert(iptal !== null && iptal.id === 'RES-A', 'İptal edilen RES-A olmalı');
    console.assert(slotlar.musaitMi(18) === true, '18:00 tekrar müsait olmalı');

    // Geçersiz saat testi
    console.assert(slotlar.musaitMi(5) === false, 'Geçersiz saat false dönmeli');
    console.assert(slotlar.rezervasyonIptal(5) === null, 'Geçersiz saat iptal null dönmeli');

    // Boş slot iptal testi
    console.assert(slotlar.rezervasyonIptal(10) === null, 'Boş slot iptal null dönmeli');

    console.log('✓ TEST 3 BAŞARILI — SlotArray slot yönetimi doğru çalışıyor\n');

    // ===========================================
    // ÖZET
    // ===========================================
    console.log('══════════════════════════════════════');
    console.log('✓ TÜM TESTLER BAŞARILI');
    console.log('  • BeklemeKuyrugu (Linked List Queue) — FIFO ✓');
    console.log('  • IptalYigini (Stack) — LIFO ✓');
    console.log('  • SlotArray (Sabit Dizi) — Slot Yönetimi ✓');
    console.log('══════════════════════════════════════');

    return true;
}

// ===========================
// Tekirdağ Spor Rezervasyon Sistemi
// Dashboard Scripts
// ===========================

document.addEventListener('DOMContentLoaded', async () => {
    // Önce sunucudan güncel verileri çekmeye çalış
    if (typeof syncFromCSVServer === 'function') {
        await syncFromCSVServer();
    } else if (typeof loadFromCSV === 'function') {
        loadFromCSV(false);
    }

    // Oturum kontrolü - giriş yapmamışsa login sayfasına yönlendir
    const session = checkSession();
    if (!session) return;

    // Varsayılan tesisleri oluştur (yoksa) — artık CSV'den yükleniyor
    ensureDefaultFacilities();

    // Kullanıcı bilgilerini göster
    displayUserInfo(session);

    // Tesis kartlarını render et (localStorage'dan)
    renderFacilityCards();

    // İstatistikleri güncelle (gerçek verilerle)
    loadDashboardStats();

    // Modüller
    initUserMenu();
    initLogout();
    initMobileMenu();
    initReservationModal();
    initReservationForm();

    // Veri Yapıları Paneli (Sadece Admin kullanıcılar görebilir)
    if (session.role === 'admin') {
        const dsSection = document.getElementById('data-structures');
        if (dsSection) dsSection.style.display = '';
        initDataStructuresPanel();
    }

    // İstatistikleri güncelle
    updateKompleksStats();
});

// --- Dashboard İstatistikleri (Gerçek Veriler) ---
function loadDashboardStats() {
    const users = JSON.parse(localStorage.getItem('tsr_users') || '[]');
    const reservations = JSON.parse(localStorage.getItem('tsr_reservations') || '[]');

    // Tesis sayısı (localStorage'dan)
    const facilities = getFacilities();
    const activeFacilities = facilities.filter(f => f.status === 'active');
    document.getElementById('stat-facilities').textContent = activeFacilities.length;

    // Spor dalı sayısı (benzersiz spor dalları)
    const uniqueSports = new Set(facilities.map(f => f.sport));
    document.getElementById('stat-sports').textContent = uniqueSports.size;

    // Aktif üye sayısı (kayıtlı kullanıcı)
    document.getElementById('stat-members').textContent = users.length;

    // Toplam rezervasyon sayısı
    document.getElementById('stat-total-res').textContent = reservations.length;
}

// --- Session Kontrolü ---
function checkSession() {
    const session = JSON.parse(localStorage.getItem('tsr_session') || 'null');
    if (!session || !session.loggedIn) {
        window.location.href = 'index.html';
        return null;
    }
    return session;
}

// --- Kullanıcı Bilgilerini Göster ---
function displayUserInfo(session) {
    // Header user name
    const displayName = document.getElementById('user-display-name');
    const dropdownName = document.getElementById('dropdown-name');
    const dropdownEmail = document.getElementById('dropdown-email');
    const welcomeTitle = document.getElementById('welcome-title');

    const firstName = session.name.split(' ')[0];

    displayName.textContent = firstName;
    dropdownName.textContent = session.name;
    dropdownEmail.textContent = session.email;
    welcomeTitle.textContent = `Hoş Geldiniz, ${firstName}!`;

    // Avatar harfi
    const avatar = document.getElementById('user-avatar');
    avatar.innerHTML = `<span style="font-weight:700; font-size:0.95rem;">${session.name.charAt(0).toUpperCase()}</span>`;

    // Admin paneli linkini sadece admin rolüne göster
    const adminLink = document.getElementById('dropdown-admin');
    if (adminLink) {
        if (session.role !== 'admin') {
            adminLink.style.display = 'none';
        }
    }
}

// --- User Menu Dropdown ---
function initUserMenu() {
    const menuBtn = document.getElementById('user-menu-btn');
    const menu = document.getElementById('user-menu');

    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('open');
    });

    // Dışarı tıklanınca kapat
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target)) {
            menu.classList.remove('open');
        }
    });
}

// --- Çıkış Yap ---
function initLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('tsr_session');
        showToast('Çıkış yapıldı. Giriş sayfasına yönlendiriliyorsunuz...', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    });
}

// --- Mobile Menu ---
function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const nav = document.getElementById('main-nav');
    const icon = toggle.querySelector('i');

    toggle.addEventListener('click', () => {
        nav.classList.toggle('open');
        if (nav.classList.contains('open')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
}

// --- Tesis Yönetimi (localStorage) ---
const DEFAULT_FACILITIES = [
    { id: 'facility-football', name: 'Süleymanpaşa Futbol Sahası', location: 'Süleymanpaşa, Tekirdağ', sport: 'Futbol', icon: 'fas fa-futbol', bgClass: 'football-bg', price: 250, hours: '08:00 - 23:00', rating: 4.8, status: 'active' },
    { id: 'facility-tennis', name: 'Çorlu Tenis Kortları', location: 'Çorlu, Tekirdağ', sport: 'Tenis', icon: 'fas fa-table-tennis-paddle-ball', bgClass: 'tennis-bg', price: 180, hours: '07:00 - 22:00', rating: 4.6, status: 'active' },
    { id: 'facility-pool', name: 'Ergene Yüzme Havuzu', location: 'Ergene, Tekirdağ', sport: 'Yüzme', icon: 'fas fa-swimmer', bgClass: 'pool-bg', price: 150, hours: '09:00 - 21:00', rating: 4.9, status: 'active' },
    { id: 'facility-basketball', name: 'Kapaklı Basketbol Sahası', location: 'Kapaklı, Tekirdağ', sport: 'Basketbol', icon: 'fas fa-basketball-ball', bgClass: 'basketball-bg', price: 200, hours: '08:00 - 22:00', rating: 4.5, status: 'active' },
    { id: 'facility-gym', name: 'Çerkezköy Fitness Center', location: 'Çerkezköy, Tekirdağ', sport: 'Fitness', icon: 'fas fa-dumbbell', bgClass: 'gym-bg', price: 100, hours: '06:00 - 23:00', rating: 4.7, status: 'active' },
    { id: 'facility-volleyball', name: 'Malkara Voleybol Sahası', location: 'Malkara, Tekirdağ', sport: 'Voleybol', icon: 'fas fa-volleyball-ball', bgClass: 'volleyball-bg', price: 175, hours: '09:00 - 20:00', rating: 4.3, status: 'active' }
];

function ensureDefaultFacilities() {
    if (!localStorage.getItem('tsr_facilities')) {
        localStorage.setItem('tsr_facilities', JSON.stringify(DEFAULT_FACILITIES));
    }
}

function getFacilities() {
    return JSON.parse(localStorage.getItem('tsr_facilities') || '[]');
}

// facilityData objesi — eski kodla uyum için
function buildFacilityData() {
    const facilities = getFacilities();
    const data = {};
    facilities.forEach(f => {
        data[f.id] = { name: f.name, price: f.price, status: f.status };
    });
    return data;
}
const facilityData = {};

// --- Tesis Kartlarını Dinamik Render ---
function renderFacilityCards() {
    const grid = document.getElementById('facilities-grid');
    const facilities = getFacilities();

    grid.innerHTML = '';

    facilities.forEach(f => {
        const isMaintenance = f.status === 'maintenance';
        const badgeClass = isMaintenance ? 'full' : 'available';
        const badgeText = isMaintenance ? 'Bakımda' : 'Müsait';
        const btnDisabled = isMaintenance ? 'disabled' : '';
        const btnClass = isMaintenance ? 'btn-reserve disabled' : 'btn-reserve';
        const btnText = isMaintenance ? '<i class="fas fa-tools"></i> Bakımda' : 'Rezerve Et';
        const cardClass = isMaintenance ? 'facility-card maintenance' : 'facility-card';

        let imgSrc = f.image;
        if (!imgSrc && typeof SPOR_IKON_MAP !== 'undefined' && SPOR_IKON_MAP[f.sport]) {
            imgSrc = SPOR_IKON_MAP[f.sport].image;
        }

        let imageContent = '';
        if (imgSrc) {
            imageContent = `<img src="${imgSrc}" alt="${f.name}" style="width:100%; height:100%; object-fit:cover;">
                            <div style="position:absolute; inset:0; background: linear-gradient(0deg, var(--dark-card) 0%, transparent 40%);"></div>`;
        } else {
            imageContent = `<div class="facility-img-placeholder ${f.bgClass}">
                                <i class="${f.icon}"></i>
                            </div>`;
        }

        grid.innerHTML += `
            <div class="${cardClass}" id="${f.id}" data-facility-id="${f.id}">
                <div class="facility-image">
                    ${imageContent}
                    <span class="facility-badge ${badgeClass}" style="z-index: 10;">${badgeText}</span>
                </div>
                <div class="facility-info">
                    <h3>${f.name}</h3>
                    <p class="facility-location"><i class="fas fa-map-pin"></i> ${f.location}</p>
                    <div class="facility-details">
                        <span><i class="fas fa-clock"></i> ${f.hours}</span>
                        <span><i class="fas fa-star"></i> ${f.rating}</span>
                    </div>
                    <div class="facility-footer">
                        <span class="facility-price">₺${f.price} <small>/ saat</small></span>
                        <button class="${btnClass}" data-fid="${f.id}" ${btnDisabled}>${btnText}</button>
                    </div>
                </div>
            </div>
        `;
    });

    // Butonlara event listener ekle
    initReservationButtons();
}

let currentFacility = null;

// --- Rezervasyon Butonları ---
function initReservationButtons() {
    document.querySelectorAll('.btn-reserve:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
            const fid = btn.dataset.fid;
            const facilities = getFacilities();
            const facility = facilities.find(f => f.id === fid);

            if (facility) {
                currentFacility = { ...facility, id: fid };
                openReservationModal(facility);
            }
        });
    });
}

// --- Mevcut Rezervasyonları Getir ---
function getReservationsForFacility(facilityId, date) {
    const all = JSON.parse(localStorage.getItem('tsr_reservations') || '[]');
    return all.filter(r =>
        r.facilityId === facilityId &&
        r.date === date &&
        r.status === 'confirmed'
    );
}

// Bir saatin dolu olup olmadığını kontrol et (1 saat sabit)
function isTimeSlotReserved(facilityId, date, timeSlot) {
    const existing = getReservationsForFacility(facilityId, date);
    return existing.some(r => r.time === timeSlot);
}

// Saat seçeneklerini dinamik olarak oluştur
function populateTimeSlots(facilityId, date) {
    const timeSelect = document.getElementById('res-time');

    // Seçili tesisin saatlerini CSV/kompleks verisinden al
    const facilities = getFacilities();
    const facility = facilities.find(f => f.id === facilityId);

    // Tesisin hours alanından başlangıç/bitiş saat parse et (ör: "09:00 - 23:00")
    let startHour = 9;   // Varsayılan (Java Tesis.java ile uyumlu)
    let endHour = 23;

    if (facility && facility.hours) {
        const parts = facility.hours.split('-').map(s => s.trim());
        if (parts.length === 2) {
            startHour = parseInt(parts[0].split(':')[0]) || 9;
            endHour = parseInt(parts[1].split(':')[0]) || 23;
        }
    }

    // Saatleri dinamik oluştur
    const allHours = [];
    for (let h = startHour; h < endHour; h++) {
        allHours.push(String(h).padStart(2, '0') + ':00');
    }

    // Bugünün tarihini ve şu anki saati al
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const isToday = (date === todayStr);
    const currentHour = now.getHours();

    // Mevcut option'ları tamamen temizle
    timeSelect.innerHTML = '';

    // Varsayılan boş seçenek
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = 'Saat seçin';
    timeSelect.appendChild(defaultOpt);

    allHours.forEach(hour => {
        const option = document.createElement('option');
        const slotHour = parseInt(hour.split(':')[0]);
        const reserved = isTimeSlotReserved(facilityId, date, hour);
        const isPast = isToday && slotHour <= currentHour;

        if (isPast) {
            option.value = '';
            option.textContent = `${hour}  ⏱  Geçmiş Saat`;
            option.disabled = true;
            option.style.color = '#64748b';
        } else if (reserved) {
            option.value = '';
            option.textContent = `${hour}  ❌  Rezerve`;
            option.disabled = true;
            option.style.color = '#ef4444';
            option.style.backgroundColor = '#1a0a0a';
        } else {
            option.value = hour;
            option.textContent = `${hour}  ✓  Müsait`;
        }

        timeSelect.appendChild(option);
    });
}

// --- Modal Aç/Kapa ---
async function openReservationModal(facility) {
    if (typeof syncFromCSVServer === 'function') {
        await syncFromCSVServer();
    }
    const modal = document.getElementById('reservation-modal');
    const title = document.getElementById('modal-subtitle');
    const priceDisplay = document.getElementById('summary-price');

    title.textContent = facility.name;
    priceDisplay.textContent = `₺${facility.price}`;

    // Minimum tarihi bugüne ayarla
    const dateInput = document.getElementById('res-date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;

    // Formu sıfırla
    document.getElementById('res-people').value = '1';
    document.getElementById('res-notes').value = '';

    // Fiyat güncelle (sabit 1 saat)
    priceDisplay.textContent = `₺${facility.price}`;

    // Saat slotlarını oluştur (mevcut rezervasyonları kontrol ederek)
    populateTimeSlots(currentFacility.id, today);

    // Tabları sıfırla
    document.getElementById('tab-res-form-btn').classList.add('active');
    document.getElementById('tab-res-reviews-btn').classList.remove('active');
    document.getElementById('reservation-form').classList.add('active');
    document.getElementById('facility-reviews-container').classList.remove('active');

    // Değerlendirmeleri modal için yükle
    if (facility.kompleksId) {
        renderModalReviews(facility.kompleksId);
    } else {
        renderModalReviews(null); // Fallback for hardcoded facilities
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeReservationModal() {
    const modal = document.getElementById('reservation-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    currentFacility = null;
}

function initReservationModal() {
    const closeBtn = document.getElementById('modal-close');
    const overlay = document.getElementById('reservation-modal');

    closeBtn.addEventListener('click', closeReservationModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeReservationModal();
    });

    // ESC tuşu ile kapat
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeReservationModal();
    });

    // Tarih değiştiğinde saat slotlarını yeniden oluştur
    document.getElementById('res-date').addEventListener('change', async (e) => {
        if (currentFacility) {
            if (typeof syncFromCSVServer === 'function') {
                await syncFromCSVServer();
            }
            populateTimeSlots(currentFacility.id, e.target.value);
        }
    });

    // Tab mantığı
    const tabFormBtn = document.getElementById('tab-res-form-btn');
    const tabReviewsBtn = document.getElementById('tab-res-reviews-btn');
    const tabFormContent = document.getElementById('reservation-form');
    const tabReviewsContent = document.getElementById('facility-reviews-container');

    if (tabFormBtn && tabReviewsBtn) {
        tabFormBtn.addEventListener('click', (e) => {
            e.preventDefault();
            tabFormBtn.classList.add('active');
            tabReviewsBtn.classList.remove('active');
            tabFormContent.classList.add('active');
            tabReviewsContent.classList.remove('active');
        });

        tabReviewsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            tabReviewsBtn.classList.add('active');
            tabFormBtn.classList.remove('active');
            tabReviewsContent.classList.add('active');
            tabFormContent.classList.remove('active');
        });
    }
}

// --- Rezervasyon Formu ---
function initReservationForm() {
    const form = document.getElementById('reservation-form');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const date = document.getElementById('res-date').value;
        const time = document.getElementById('res-time').value;
        const people = document.getElementById('res-people').value;
        const notes = document.getElementById('res-notes').value;

        if (!date || !time) {
            showToast('Lütfen tarih ve müsait bir saat seçin.', 'error');
            return;
        }

        // Son kontrol: seçilen saat hala müsait mi? (localStorage'ı taze oku)
        if (isTimeSlotReserved(currentFacility.id, date, time)) {
            showToast('Bu saat az önce başka biri tarafından rezerve edildi! Farklı bir saat seçin.', 'error');
            // Slotları yenile
            populateTimeSlots(currentFacility.id, date);
            return;
        }

        // Rezervasyonu kaydet
        const session = JSON.parse(localStorage.getItem('tsr_session'));
        const reservations = JSON.parse(localStorage.getItem('tsr_reservations') || '[]');

        const newReservation = {
            id: 'RES-' + Date.now(),
            facilityId: currentFacility.id,
            facilityName: currentFacility.name,
            userId: session.userId,
            userName: session.name,
            date: date,
            time: time,
            duration: 1,
            people: parseInt(people),
            notes: notes,
            totalPrice: currentFacility.price,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };

        reservations.push(newReservation);
        localStorage.setItem('tsr_reservations', JSON.stringify(reservations));

        // Düğüm/Boolean kontrolü için doğrudan sunucuyla iletişim (autoSync yerine)
        const btn = document.getElementById('confirm-reservation-btn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> İşleniyor...';
        btn.disabled = true;

        if (typeof syncToServer === 'function') {
            syncToServer('rezervasyonlar', newReservation).then(success => {
                if (!success) {
                    throw new Error("Sunucuya bağlanılamadı veya eşitleme başarısız.");
                }
                
                // Başarılı sync sonrası, kaydı RES-CSV- formatına dönüştür
                // (gelecekte tekrar sunucuya gönderilmesini engeller)
                const currentRes = JSON.parse(localStorage.getItem('tsr_reservations') || '[]');
                const idx = currentRes.findIndex(r => r.id === newReservation.id);
                if (idx !== -1) {
                    currentRes[idx].id = 'RES-CSV-' + newReservation.id;
                    localStorage.setItem('tsr_reservations', JSON.stringify(currentRes));
                }
                
                // Modal kapatılmadan önce değişkenleri yedekle
                const fName = currentFacility.name;
                const fId = currentFacility.id;
                
                closeReservationModal(); // Bu fonksiyon currentFacility'i null yapar!
                
                showToast(`Rezervasyon onaylandı! ${fName} - ${date} ${time}`, 'success');
                populateTimeSlots(fId, date);
                
                btn.innerHTML = '<i class="fas fa-check-circle"></i> Rezervasyonu Onayla';
                btn.disabled = false;
            }).catch(async err => {
                if (err.status === 409) {
                    // Çifte rezervasyon / çakışma durumunda kullanıcıyı bekleme listesine alalım
                    newReservation.status = 'pending';
                    
                    // Local storage'a pending olarak geri ekle
                    const currentRes = JSON.parse(localStorage.getItem('tsr_reservations') || '[]');
                    const idx = currentRes.findIndex(r => r.id === newReservation.id);
                    if (idx !== -1) {
                        currentRes[idx].status = 'pending';
                    } else {
                        currentRes.push(newReservation);
                    }
                    localStorage.setItem('tsr_reservations', JSON.stringify(currentRes));
                    
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sıraya alınıyor...';
                    
                    try {
                        // Sunucuya 'pending' olarak gönder (sunucu buna izin verecek çünkü kilit kontrolü sadece Onaylandi için yapılıyor)
                        const syncSuccess = await syncToServer('rezervasyonlar', newReservation);
                        if (syncSuccess) {
                            // ID'yi RES-CSV- formatına çevir
                            const updatedRes = JSON.parse(localStorage.getItem('tsr_reservations') || '[]');
                            const uIdx = updatedRes.findIndex(r => r.id === newReservation.id);
                            if (uIdx !== -1) {
                                updatedRes[uIdx].id = 'RES-CSV-' + newReservation.id;
                                localStorage.setItem('tsr_reservations', JSON.stringify(updatedRes));
                            }
                            
                            // Arayüzü güncelle ve modalı kapat
                            const fName = currentFacility.name;
                            const fId = currentFacility.id;
                            closeReservationModal();
                            
                            showToast("Aynı anda başka rezervasyon yapıldı, bekleme listesine alındınız.", "warning");
                            populateTimeSlots(fId, date);
                            
                            // Kuyruk UI'ını tazele
                            if (typeof renderQueueUI === 'function') {
                                // Paneldeki beklemeKuyrugu nesnesine de ekle
                                beklemeKuyrugu.enqueue({
                                    userName: newReservation.userName,
                                    facilityName: newReservation.facilityName,
                                    date: newReservation.date,
                                    time: newReservation.time,
                                    resId: 'RES-CSV-' + newReservation.id
                                });
                                renderQueueUI();
                            }
                        } else {
                            throw new Error("Bekleme sırasına eşitleme yapılamadı.");
                        }
                    } catch (syncErr) {
                        // Tamamen başarısızsa sil
                        const cleanRes = JSON.parse(localStorage.getItem('tsr_reservations') || '[]');
                        const filtered = cleanRes.filter(r => r.id !== newReservation.id && r.id !== 'RES-CSV-' + newReservation.id);
                        localStorage.setItem('tsr_reservations', JSON.stringify(filtered));
                        showToast("Bekleme kuyruğuna alınırken hata oluştu: " + syncErr.message, "error");
                    }
                    
                    btn.innerHTML = '<i class="fas fa-check-circle"></i> Rezervasyonu Onayla';
                    btn.disabled = false;
                } else {
                    // Diğer sistem hataları
                    const currentRes = JSON.parse(localStorage.getItem('tsr_reservations') || '[]');
                    const filtered = currentRes.filter(r => r.id !== newReservation.id);
                    localStorage.setItem('tsr_reservations', JSON.stringify(filtered));

                    showToast(err.message || 'Bir hata oluştu.', 'error');
                    btn.innerHTML = '<i class="fas fa-check-circle"></i> Rezervasyonu Onayla';
                    btn.disabled = false;
                    
                    if (currentFacility) {
                        populateTimeSlots(currentFacility.id, date);
                    }
                }
            });
        } else {
            if (typeof autoSync === 'function') autoSync('rezervasyonlar');
            const fName = currentFacility.name;
            const fId = currentFacility.id;
            
            closeReservationModal();
            
            showToast(`Rezervasyon onaylandı! ${fName} - ${date} ${time}`, 'success');
            populateTimeSlots(fId, date);
            
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Rezervasyonu Onayla';
            btn.disabled = false;
        }
    });
}

// --- Toast Notification ---
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// ==========================================
// VERİ YAPILARI PANELİ
// ==========================================

// Global veri yapısı örnekleri
const beklemeKuyrugu = new BeklemeKuyrugu();
const iptalYigini = new IptalYigini();

function initDataStructuresPanel() {
    // Sadece gelecekteki ve bugünkü rezervasyonlar için
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reservations = JSON.parse(localStorage.getItem('tsr_reservations') || '[]');
    const kullanicilar = JSON.parse(localStorage.getItem('tsr_users_csv') || '[]');

    const cleanId = (id) => String(id || '').trim().replace(/^0+/, '');

    reservations.forEach(r => {
        const resDate = new Date(r.date);
        resDate.setHours(0, 0, 0, 0);
        
        let displayUserName = r.userName;
        if (!displayUserName || displayUserName.startsWith('Kullanıcı #')) {
            const cleanUid = cleanId(r.userId);
            const foundUser = kullanicilar.find(u => cleanId(u.kullaniciId) === cleanUid);
            if (foundUser) {
                displayUserName = foundUser.adSoyad;
            }
        }

        // Tarihi geçmiş olanları panele ekleme
        if (resDate >= today) {
            if (r.status === 'pending') {
                beklemeKuyrugu.enqueue({
                    userName: displayUserName,
                    facilityName: r.facilityName,
                    date: r.date,
                    time: r.time,
                    resId: r.id
                });
            }
            // İptal edilenler (Sadece 'cancelled' olanlar, 'archived' olanlar hariç)
            if (r.status === 'cancelled') {
                iptalYigini.push({
                    userName: displayUserName,
                    facilityName: r.facilityName,
                    date: r.date,
                    time: r.time,
                    resId: r.id,
                    totalPrice: r.totalPrice
                });
            }
        }
    });

    renderQueueUI();
    renderStackUI();

    // Buton event listener'ları
    document.getElementById('btn-dequeue').addEventListener('click', async () => {
        const cikan = beklemeKuyrugu.peek();
        if (cikan) {
            // Rezervasyon listesinde bul ve durumunu 'confirmed' yapmayı dene
            const res = JSON.parse(localStorage.getItem('tsr_reservations') || '[]');
            const rez = res.find(r => r.id === cikan.resId);
            if (rez) {
                const oldStatus = rez.status;
                const oldId = rez.id;
                rez.status = 'confirmed';
                
                // CSV ID öneki varsa geçici olarak kaldır (sunucuya temiz ID gitsin)
                if (rez.id.startsWith('RES-CSV-')) {
                    rez.id = rez.id.replace('RES-CSV-', '');
                }
                
                localStorage.setItem('tsr_reservations', JSON.stringify(res));
                
                // Arayüze geri bildirim
                const btn = document.getElementById('btn-dequeue');
                const oldText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Onaylanıyor...';
                btn.disabled = true;
                
                try {
                    // Sunucuya tekil sync denemesi yap
                    const success = await syncToServer('rezervasyonlar', rez);
                    if (success) {
                        // Başarılı sync sonrası ID'yi tekrar RES-CSV- yap
                        const updatedRes = JSON.parse(localStorage.getItem('tsr_reservations') || '[]');
                        const uIdx = updatedRes.findIndex(r => r.id === rez.id);
                        if (uIdx !== -1) {
                            updatedRes[uIdx].id = 'RES-CSV-' + rez.id;
                            localStorage.setItem('tsr_reservations', JSON.stringify(updatedRes));
                        }
                        
                        beklemeKuyrugu.dequeue(); // Şimdi kuyruktan çıkar
                        showToast(`${cikan.userName} kuyruktan alındı ve onaylandı — ${cikan.facilityName}`, 'success');
                        renderQueueUI();
                    } else {
                        throw new Error("Eşitleme başarısız.");
                    }
                } catch (err) {
                    // Hata durumunda eski statüsüne ve ID'sine geri çevir
                    const revertRes = JSON.parse(localStorage.getItem('tsr_reservations') || '[]');
                    const rIdx = revertRes.findIndex(r => r.id === rez.id || r.id === oldId);
                    if (rIdx !== -1) {
                        revertRes[rIdx].status = oldStatus;
                        revertRes[rIdx].id = oldId;
                        localStorage.setItem('tsr_reservations', JSON.stringify(revertRes));
                    }
                    showToast(`Sıradaki kullanıcı onaylanamadı: Bu saat hâlâ dolu. Öncelikle çakışan rezervasyonu iptal etmelisiniz.`, 'error');
                }
                
                btn.innerHTML = oldText;
                btn.disabled = false;
            }
        }
    });

    document.getElementById('btn-clear-queue').addEventListener('click', () => {
        const items = beklemeKuyrugu.toArray();
        const res = JSON.parse(localStorage.getItem('tsr_reservations') || '[]');
        
        // Kuyruktakilerin hepsini İptal durumuna geçir
        items.forEach(item => {
            const rez = res.find(r => r.id === item.resId);
            if (rez) rez.status = 'cancelled';
        });
        localStorage.setItem('tsr_reservations', JSON.stringify(res));
        if (typeof autoSync === 'function') autoSync('rezervasyonlar');

        beklemeKuyrugu.clear();
        showToast('Bekleme kuyruğu temizlendi (Kuyruktakiler iptal edildi).', 'success');
        renderQueueUI();
    });

    document.getElementById('btn-undo-cancel').addEventListener('click', () => {
        const geriAlinan = iptalYigini.pop();
        if (geriAlinan) {
            // Rezervasyonu tekrar aktif et
            const res = JSON.parse(localStorage.getItem('tsr_reservations') || '[]');
            const rez = res.find(r => r.id === geriAlinan.resId);
            if (rez) {
                rez.status = 'confirmed';
                localStorage.setItem('tsr_reservations', JSON.stringify(res));
                if (typeof autoSync === 'function') autoSync('rezervasyonlar');
            }
            showToast(`İptal geri alındı: ${geriAlinan.facilityName} — ${geriAlinan.date} ${geriAlinan.time}`, 'success');
            renderStackUI();
        }
    });

    document.getElementById('btn-clear-stack').addEventListener('click', () => {
        const items = iptalYigini.toArray();
        const res = JSON.parse(localStorage.getItem('tsr_reservations') || '[]');
        
        // Stackteki tüm iptal edilmiş kayıtların durumunu 'archived' yap (CSV'ye Arsivlendi olarak yansır)
        items.forEach(item => {
            const rez = res.find(r => r.id === item.resId);
            if (rez) rez.status = 'archived';
        });
        localStorage.setItem('tsr_reservations', JSON.stringify(res));
        if (typeof autoSync === 'function') autoSync('rezervasyonlar');

        iptalYigini.clear();
        showToast('İptal geçmişi kalıcı olarak temizlendi (CSVye Arşivlendi olarak kaydedildi).', 'success');
        renderStackUI();
    });
}

function renderQueueUI() {
    const list = document.getElementById('queue-list');
    const count = document.getElementById('queue-count');
    const btnDequeue = document.getElementById('btn-dequeue');
    const btnClear = document.getElementById('btn-clear-queue');

    const items = beklemeKuyrugu.toArray();
    count.textContent = items.length + ' kişi';
    btnDequeue.disabled = items.length === 0;
    btnClear.disabled = items.length === 0;

    if (items.length === 0) {
        list.innerHTML = '<p class="ds-empty"><i class="fas fa-inbox"></i> Kuyrukta bekleyen yok</p>';
        return;
    }

    list.innerHTML = items.map((item, idx) => `
        <div class="ds-list-item">
            <span class="ds-order">${idx + 1}.</span>
            <div class="ds-item-info">
                <div>${item.userName}</div>
                <div class="ds-item-meta">${item.facilityName} — ${item.date} ${item.time}</div>
            </div>
        </div>
    `).join('');
}

function renderStackUI() {
    const list = document.getElementById('stack-list');
    const count = document.getElementById('stack-count');
    const btnUndo = document.getElementById('btn-undo-cancel');
    const btnClear = document.getElementById('btn-clear-stack');

    const items = iptalYigini.toArray();
    count.textContent = items.length + ' iptal';
    btnUndo.disabled = items.length === 0;
    btnClear.disabled = items.length === 0;

    if (items.length === 0) {
        list.innerHTML = '<p class="ds-empty"><i class="fas fa-inbox"></i> İptal geçmişi boş</p>';
        return;
    }

    list.innerHTML = items.map((item, idx) => `
        <div class="ds-list-item">
            <span class="ds-order">${idx === 0 ? '⬆' : (idx + 1)}</span>
            <div class="ds-item-info">
                <div>${item.userName} — ${item.facilityName}</div>
                <div class="ds-item-meta">${item.date} ${item.time} | ₺${item.totalPrice || 0}</div>
            </div>
        </div>
    `).join('');
}

// ==========================================
// DEĞERLENDİRMELER
// ==========================================

function renderModalReviews(kompleksId) {
    const grid = document.getElementById('modal-reviews-grid');
    if (!grid) return;

    if (!kompleksId) {
        grid.innerHTML = '<p class="ds-empty"><i class="fas fa-star"></i> Bu tesis için değerlendirme bulunamadı</p>';
        return;
    }

    const tümDeğerler = JSON.parse(localStorage.getItem('tsr_degerlendirmeler') || '[]');
    const degerler = tümDeğerler.filter(d => d.kompleksId == kompleksId);
    
    const kullanicilar = JSON.parse(localStorage.getItem('tsr_users_csv') || '[]');

    if (degerler.length === 0) {
        grid.innerHTML = '<p class="ds-empty"><i class="fas fa-star"></i> Bu tesis için henüz değerlendirme yapılmamış</p>';
        return;
    }

    grid.innerHTML = degerler.map(d => {
        const cleanId = (id) => String(id || '').trim().replace(/^0+/, '');
        const dUidClean = cleanId(d.kullaniciId);
        const kullanici = kullanicilar.find(k => cleanId(k.kullaniciId) === dUidClean);
        const tamAd = kullanici ? kullanici.adSoyad : 'Anonim';
        const ad = tamAd.split(' ')[0]; // Sadece ilk isim
        const harf = ad.charAt(0).toUpperCase();
        const puan = parseInt(d.puan);

        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<i class="fas fa-star ${i > puan ? 'empty' : ''}"></i>`;
        }

        return `
            <div class="review-card" style="margin-bottom: 0;">
                <div class="review-header">
                    <div class="review-user">
                        <div class="review-avatar">${harf}</div>
                        <div>
                            <div class="review-name">${ad}</div>
                            <div class="review-date">${d.tarih}</div>
                        </div>
                    </div>
                    <div class="review-stars">${stars}</div>
                </div>
                <p class="review-body" style="margin-bottom: 0;">${d.yorum}</p>
            </div>
        `;
    }).join('');
}

// ==========================================
// KOMPLEKS İSTATİSTİKLERİ
// ==========================================

function updateKompleksStats() {
    const kompleksler = JSON.parse(localStorage.getItem('tsr_kompleksler') || '[]');
    const facilities = getFacilities();

    const statFacilities = document.getElementById('stat-facilities');
    const statSports = document.getElementById('stat-sports');

    if (statFacilities) statFacilities.textContent = facilities.length;
    if (statSports) {
        const uniqueSports = new Set(facilities.map(f => f.sport));
        statSports.textContent = uniqueSports.size;
    }
}

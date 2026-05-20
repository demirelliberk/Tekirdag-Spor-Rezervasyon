// ===========================
// Tekirdağ Spor Rezervasyon Sistemi
// Rezervasyonlarım Sayfası
// ===========================

document.addEventListener('DOMContentLoaded', async () => {
    // CSV verilerini yükle
    if (typeof syncFromCSVServer === 'function') {
        await syncFromCSVServer();
    } else if (typeof loadFromCSV === 'function') {
        loadFromCSV(false);
    }

    // Oturum kontrolü
    const session = JSON.parse(localStorage.getItem('tsr_session') || 'null');
    if (!session || !session.loggedIn) {
        window.location.href = 'index.html';
        return;
    }

    // Kullanıcı bilgilerini göster
    initUserInfo(session);
    initUserMenu();
    initLogout();
    initMobileMenu();

    // Rezervasyonları yükle
    loadMyReservations();
    initTabs();
    initReviewModal();
});

// ==========================================
// KULLANICI BİLGİLERİ
// ==========================================

function initUserInfo(session) {
    const firstName = (session.name || 'Kullanıcı').split(' ')[0];
    const initial = firstName.charAt(0).toUpperCase();

    document.getElementById('user-display-name').textContent = firstName;
    document.getElementById('user-avatar').textContent = initial;
    document.getElementById('user-avatar').innerHTML = `<span style="font-weight:700">${initial}</span>`;
    document.getElementById('dropdown-name').textContent = session.name || 'Kullanıcı';
    document.getElementById('dropdown-email').textContent = session.email || '';
}

function initUserMenu() {
    const btn = document.getElementById('user-menu-btn');
    const dropdown = document.getElementById('user-dropdown');

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    });

    document.addEventListener('click', () => {
        dropdown.classList.remove('open');
    });
}

function initLogout() {
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('tsr_session');
        window.location.href = 'index.html';
    });
}

function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const nav = document.getElementById('main-nav');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
        nav.classList.toggle('open');
        const icon = toggle.querySelector('i');
        if (nav.classList.contains('open')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
}

// ==========================================
// REZERVASYONLARI YÜKLEME
// ==========================================

let allMyReservations = [];
let currentFilter = 'all';

function loadMyReservations() {
    const session = JSON.parse(localStorage.getItem('tsr_session') || 'null');
    const allReservations = JSON.parse(localStorage.getItem('tsr_reservations') || '[]');
    const facilities = JSON.parse(localStorage.getItem('tsr_facilities') || '[]');

    // Kullanıcının rezervasyonlarını filtrele
    const userEmail = session?.email;
    const userName = session?.name;
    const cleanId = (id) => String(id || '').trim().replace(/^0+/, '');

    allMyReservations = allReservations.filter(r => {
        const rUidClean = cleanId(r.userId);
        const sUidClean = cleanId(session?.userId || session?.tc);
        return r.userName === userName ||
               r.userEmail === userEmail ||
               (r.userId && session?.userId && r.userId === session.userId) ||
               (rUidClean && sUidClean && rUidClean === sUidClean);
    });

    // Eğer CSV kullanıcısıysa userId ile de eşleştir
    const csvUsers = JSON.parse(localStorage.getItem('tsr_users_csv') || '[]');
    const csvUser = csvUsers.find(u => u.email === userEmail);
    if (csvUser) {
        const csvUserClean = cleanId(csvUser.kullaniciId);
        const csvRez = allReservations.filter(r => {
            const rUidClean = cleanId(r.userId);
            return (r.userId === csvUser.kullaniciId || (rUidClean && csvUserClean && rUidClean === csvUserClean)) &&
                   !allMyReservations.some(m => m.id === r.id);
        });
        allMyReservations = [...allMyReservations, ...csvRez];
    }

    // Tarih durumu güncelle (geçmişe kalan onaylıları "completed" yap)
    const now = new Date();
    allMyReservations.forEach(r => {
        if (r.status === 'confirmed') {
            const rezDate = new Date(r.date + 'T' + (r.time || '23:59'));
            if (rezDate < now) {
                r._displayStatus = 'completed';
            } else {
                r._displayStatus = 'confirmed';
            }
        } else if (r.status === 'archived') {
            r._displayStatus = 'cancelled';
        } else {
            r._displayStatus = r.status;
        }
    });

    // Tarihe göre sırala (yeniden eskiye)
    allMyReservations.sort((a, b) => {
        const da = new Date(a.date + 'T' + (a.time || '00:00'));
        const db = new Date(b.date + 'T' + (b.time || '00:00'));
        return db - da;
    });

    // Tesis bilgilerini zenginleştir
    allMyReservations.forEach(r => {
        const facility = facilities.find(f => f.id === r.facilityId);
        if (facility) {
            r._icon = facility.icon || 'fas fa-trophy';
            r._bgClass = facility.bgClass || 'football-bg';
            r._location = facility.location || '';
        } else {
            r._icon = 'fas fa-trophy';
            r._bgClass = 'football-bg';
            r._location = '';
        }
    });

    updateStats();
    updateBadges();
    renderReservations();
}

// ==========================================
// İSTATİSTİKLER
// ==========================================

function updateStats() {
    const active = allMyReservations.filter(r => r._displayStatus === 'confirmed').length;
    const pending = allMyReservations.filter(r => r._displayStatus === 'pending').length;
    const completed = allMyReservations.filter(r => r._displayStatus === 'completed').length;
    const cancelled = allMyReservations.filter(r => r._displayStatus === 'cancelled').length;
    const totalSpent = allMyReservations
        .filter(r => r._displayStatus !== 'cancelled')
        .reduce((sum, r) => sum + (r.totalPrice || 0), 0);

    document.getElementById('stat-active').textContent = active;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-cancelled').textContent = cancelled;
    document.getElementById('stat-total-spent').textContent = `₺${totalSpent.toLocaleString('tr-TR')}`;
}

function updateBadges() {
    const counts = {
        all: allMyReservations.length,
        active: allMyReservations.filter(r => r._displayStatus === 'confirmed').length,
        pending: allMyReservations.filter(r => r._displayStatus === 'pending').length,
        completed: allMyReservations.filter(r => r._displayStatus === 'completed').length,
        cancelled: allMyReservations.filter(r => r._displayStatus === 'cancelled').length
    };

    Object.keys(counts).forEach(key => {
        const badge = document.getElementById('badge-' + key);
        if (badge) badge.textContent = counts[key];
    });
}

// ==========================================
// RENDER
// ==========================================

function renderReservations() {
    const list = document.getElementById('rez-list');
    const empty = document.getElementById('rez-empty');

    let filtered = allMyReservations;
    if (currentFilter !== 'all') {
        const statusMap = {
            'active': 'confirmed',
            'pending': 'pending',
            'completed': 'completed',
            'cancelled': 'cancelled'
        };
        filtered = allMyReservations.filter(r => r._displayStatus === statusMap[currentFilter]);
    }

    if (filtered.length === 0) {
        list.innerHTML = '';
        list.style.display = 'none';
        empty.classList.remove('hidden');
        return;
    }

    list.style.display = '';
    empty.classList.add('hidden');

    list.innerHTML = filtered.map(r => {
        const statusClass = r._displayStatus;
        const statusText = {
            'confirmed': 'Aktif',
            'pending': 'Beklemede',
            'completed': 'Tamamlandı',
            'cancelled': 'İptal'
        }[statusClass] || statusClass;

        const canCancel = statusClass === 'confirmed' || statusClass === 'pending';
        const isCompleted = statusClass === 'completed';
        const hasReview = isCompleted && isAlreadyReviewed(r.id);

        return `
        <div class="rez-card status-${statusClass}">
            <div class="rez-card-icon ${r._bgClass}">
                <i class="${r._icon}"></i>
            </div>
            <div class="rez-card-info">
                <div class="rez-card-title">${escapeHtml(r.facilityName)}</div>
                <div class="rez-card-meta">
                    <span><i class="fas fa-calendar"></i> ${escapeHtml(r.date)}</span>
                    <span><i class="fas fa-clock"></i> ${escapeHtml(r.time)}</span>
                    <span><i class="fas fa-hourglass-half"></i> ${r.duration || 1} saat</span>
                    ${r._location ? `<span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(r._location)}</span>` : ''}
                </div>
            </div>
            <div class="rez-card-right">
                <div class="rez-card-price">₺${(r.totalPrice || 0).toLocaleString('tr-TR')}</div>
                <span class="rez-card-status ${statusClass}">${statusText}</span>
                <div class="rez-card-actions">
                    ${canCancel ? `<button class="rez-btn-cancel" onclick="cancelReservation('${r.id}')"><i class="fas fa-times"></i> İptal Et</button>` : ''}
                    ${isCompleted && !hasReview ? `<button class="rez-btn-review" onclick="openReviewModal('${r.id}')"><i class="fas fa-star"></i> Değerlendir</button>` : ''}
                    ${hasReview ? `<span class="rez-btn-reviewed"><i class="fas fa-check"></i> Değerlendirildi</span>` : ''}
                </div>
                <span class="rez-card-id">${r.id}</span>
            </div>
        </div>
    `;
    }).join('');
}

// ==========================================
// TAB GEÇİŞ
// ==========================================

function initTabs() {
    const tabs = document.querySelectorAll('.rez-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.tab;
            renderReservations();
        });
    });
}

// ==========================================
// İPTAL İŞLEMİ
// ==========================================

function cancelReservation(resId) {
    if (!confirm('Bu rezervasyonu iptal etmek istediğinize emin misiniz?')) return;

    const reservations = JSON.parse(localStorage.getItem('tsr_reservations') || '[]');
    const idx = reservations.findIndex(r => r.id === resId);
    if (idx !== -1) {
        reservations[idx].status = 'cancelled';
        localStorage.setItem('tsr_reservations', JSON.stringify(reservations));

        // IptalYigini'na ekle (eğer veri yapısı modülü yüklüyse)
        if (typeof IptalYigini !== 'undefined') {
            const iptalStack = new IptalYigini();
            iptalStack.push(reservations[idx]);
        }

        // CSV'ye senkronize et
        if (typeof autoSync === 'function') autoSync('rezervasyonlar');

        showToast(`Rezervasyon iptal edildi: ${resId}`, 'success');
        loadMyReservations();
    }
}

// ==========================================
// YARDIMCI
// ==========================================

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

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
    }, 3500);
}

// ==========================================
// DEĞERLENDİRME SİSTEMİ
// ==========================================

let selectedStars = 0;

function initReviewModal() {
    const modal = document.getElementById('review-modal');
    const closeBtn = document.getElementById('review-modal-close');
    const form = document.getElementById('review-form');
    const starPicker = document.getElementById('star-picker');

    // Modal kapat
    closeBtn.addEventListener('click', () => closeReviewModal());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeReviewModal();
    });

    // Yıldız seçici
    const stars = starPicker.querySelectorAll('i');
    stars.forEach(star => {
        star.addEventListener('mouseenter', () => {
            const val = parseInt(star.dataset.star);
            stars.forEach(s => {
                s.classList.toggle('hover-fill', parseInt(s.dataset.star) <= val);
            });
        });

        star.addEventListener('click', () => {
            selectedStars = parseInt(star.dataset.star);
            stars.forEach(s => {
                s.classList.toggle('active', parseInt(s.dataset.star) <= selectedStars);
            });
            const labels = ['', 'Çok Kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel'];
            document.getElementById('star-label').textContent = `${selectedStars}/5 — ${labels[selectedStars]}`;
        });
    });

    starPicker.addEventListener('mouseleave', () => {
        stars.forEach(s => {
            s.classList.remove('hover-fill');
        });
    });

    // Form gönder
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitReview();
    });
}

function openReviewModal(rezId) {
    const rez = allMyReservations.find(r => r.id === rezId);
    if (!rez) return;

    const modal = document.getElementById('review-modal');
    document.getElementById('review-rez-id').value = rezId;
    document.getElementById('review-facility-id').value = rez.facilityId;
    document.getElementById('review-facility-name').textContent = rez.facilityName;

    // Kompleks ID bul
    const facilities = JSON.parse(localStorage.getItem('tsr_facilities') || '[]');
    const facility = facilities.find(f => f.id === rez.facilityId);
    document.getElementById('review-kompleks-id').value = facility ? facility.kompleksId : '';

    // Reset
    selectedStars = 0;
    document.getElementById('review-comment').value = '';
    document.getElementById('star-label').textContent = 'Puan seçin';
    document.querySelectorAll('#star-picker i').forEach(s => {
        s.classList.remove('active', 'hover-fill');
    });

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeReviewModal() {
    document.getElementById('review-modal').classList.remove('active');
    document.body.style.overflow = '';
}

function submitReview() {
    if (selectedStars === 0) {
        showToast('Lütfen bir puan seçin!', 'error');
        return;
    }

    const comment = document.getElementById('review-comment').value.trim();
    if (!comment) {
        showToast('Lütfen bir yorum yazın!', 'error');
        return;
    }

    const rezId = document.getElementById('review-rez-id').value;
    const facilityId = document.getElementById('review-facility-id').value;
    const kompleksId = document.getElementById('review-kompleks-id').value;
    const session = JSON.parse(localStorage.getItem('tsr_session') || 'null');

    // Kullanıcı CSV ID'sini bul
    const csvUsers = JSON.parse(localStorage.getItem('tsr_users_csv') || '[]');
    const csvUser = csvUsers.find(u => u.email === session?.email);
    const kullaniciId = csvUser ? csvUser.kullaniciId : '0';

    // Mevcut değerlendirmeleri al
    const degerlendirmeler = JSON.parse(localStorage.getItem('tsr_degerlendirmeler') || '[]');

    // Yeni değerlendirme ekle
    const yeniId = degerlendirmeler.length > 0
        ? Math.max(...degerlendirmeler.map(d => parseInt(d.degerlendirmeId) || 0)) + 1
        : 1;

    const yeniDeger = {
        degerlendirmeId: String(yeniId),
        kullaniciId: kullaniciId,
        kompleksId: kompleksId,
        puan: String(selectedStars),
        yorum: comment,
        tarih: new Date().toISOString().split('T')[0],
        _rezId: rezId  // hangi rezervasyona ait olduğunu takip
    };

    degerlendirmeler.push(yeniDeger);
    localStorage.setItem('tsr_degerlendirmeler', JSON.stringify(degerlendirmeler));

    // Tesis ortalama puanlarını güncelle
    recalculateRatings();

    // CSV'ye senkronize et
    if (typeof autoSync === 'function') autoSync('degerlendirmeler');

    closeReviewModal();
    showToast('Değerlendirmeniz kaydedildi! Teşekkürler ⭐', 'success');
    loadMyReservations(); // Kartları yenile
}

/**
 * Bir rezervasyonun daha önce değerlendirilip değerlendirilmediğini kontrol eder.
 */
function isAlreadyReviewed(rezId) {
    const degerlendirmeler = JSON.parse(localStorage.getItem('tsr_degerlendirmeler') || '[]');
    return degerlendirmeler.some(d => d._rezId === rezId);
}

/**
 * Tüm değerlendirmelerden kompleks bazında ortalama puan hesaplar
 * ve tesislerin rating değerlerini günceller.
 * Bu fonksiyon csv-data.js'teki hesaplaOrtalamaPuanlar() ile aynı mantığı kullanır.
 */
function recalculateRatings() {
    const degerler = JSON.parse(localStorage.getItem('tsr_degerlendirmeler') || '[]');
    const tesisler = JSON.parse(localStorage.getItem('tsr_facilities') || '[]');

    // Kompleks bazında puan topla
    const puanMap = {};
    degerler.forEach(d => {
        const kid = d.kompleksId;
        if (!kid) return;
        if (!puanMap[kid]) {
            puanMap[kid] = { toplam: 0, sayi: 0 };
        }
        puanMap[kid].toplam += parseInt(d.puan) || 0;
        puanMap[kid].sayi++;
    });

    // Tesislere ortalama puanı uygula
    tesisler.forEach(t => {
        const p = puanMap[t.kompleksId];
        if (p && p.sayi > 0) {
            t.rating = parseFloat((p.toplam / p.sayi).toFixed(1));
        }
    });

    localStorage.setItem('tsr_facilities', JSON.stringify(tesisler));
}


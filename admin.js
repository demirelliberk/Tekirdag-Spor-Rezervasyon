// ===========================
// Tekirdağ Spor Rezervasyon Sistemi
// Admin Panel - Veritabanı Yönetimi
// ===========================

document.addEventListener('DOMContentLoaded', async () => {
    // Admin oturum kontrolü
    const session = JSON.parse(localStorage.getItem('tsr_session') || 'null');

    // Giriş yapılmamışsa login sayfasına
    if (!session || !session.loggedIn) {
        window.location.href = 'index.html';
        return;
    }

    // Admin rolü kontrolü
    if (session.role !== 'admin') {
        alert('⛔ Erişim Reddedildi!\n\nBu sayfaya yalnızca yönetici hesabıyla erişilebilir.\n\nAdmin Giriş Bilgileri:\nE-Posta: admin@tekirdag.gov.tr\nŞifre: admin123');
        window.location.href = 'dashboard.html';
        return;
    }

    // CSV verilerini yükle
    if (typeof syncFromCSVServer === 'function') {
        await syncFromCSVServer();
    } else if (typeof loadFromCSV === 'function') {
        loadFromCSV(false);
    }

    // Başlat
    loadStats();
    loadUsersTable();
    loadReservationsTable();
    loadFacilitiesTable();
    loadKomplekslerTable();
    loadDegerlendirmelerTable();
    renderSQLPreview();
    initTabs();
    initExport();
    initSearch();
    initClearButtons();
    initMobileMenu();
    initLogoutLink();
    initFacilityManagement();
});

// ==========================================
// VERİ ERİŞİM FONKSİYONLARI
// ==========================================

function getUsers() {
    return JSON.parse(localStorage.getItem('tsr_users') || '[]');
}

function getReservations() {
    return JSON.parse(localStorage.getItem('tsr_reservations') || '[]');
}

function saveUsers(users) {
    localStorage.setItem('tsr_users', JSON.stringify(users));
}

function saveReservations(reservations) {
    localStorage.setItem('tsr_reservations', JSON.stringify(reservations));
}

// ==========================================
// İSTATİSTİKLER
// ==========================================

function loadStats() {
    const users = getUsers();
    const reservations = getReservations();
    const session = JSON.parse(localStorage.getItem('tsr_session') || 'null');

    document.getElementById('stat-users').textContent = users.length;
    document.getElementById('stat-reservations').textContent = reservations.length;

    const totalRevenue = reservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    document.getElementById('stat-revenue').textContent = `₺${totalRevenue.toLocaleString('tr-TR')}`;

    document.getElementById('stat-active-sessions').textContent = session ? '1' : '0';
}

// ==========================================
// KULLANICILAR TABLOSU
// ==========================================

function loadUsersTable(filter = '') {
    const users = getUsers();
    const tbody = document.getElementById('users-tbody');
    const emptyMsg = document.getElementById('users-empty');
    const tableWrapper = document.querySelector('#panel-users .table-wrapper');

    const filtered = filter
        ? users.filter(u =>
            (u.name || '').toLowerCase().includes(filter) ||
            (u.email || '').toLowerCase().includes(filter) ||
            (u.tc || '').includes(filter)
        )
        : users;

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        tableWrapper.style.display = 'none';
        emptyMsg.classList.remove('hidden');
        return;
    }

    tableWrapper.style.display = '';
    emptyMsg.classList.add('hidden');

    tbody.innerHTML = filtered.map((user, idx) => {
        const roleClass = user.role === 'admin' ? 'confirmed' : '';
        const roleText = user.role === 'admin' ? 'Admin' : 'Kullanıcı';
        return `
        <tr>
            <td>${idx + 1}</td>
            <td><strong>${escapeHtml(user.name)}</strong></td>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="status-badge ${roleClass}">${roleText}</span></td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <button class="btn-delete-row" onclick="deleteUser('${user.email}')">
                    <i class="fas fa-trash"></i> Sil
                </button>
            </td>
        </tr>
    `;
    }).join('');
}

// ==========================================
// REZERVASYONLAR TABLOSU
// ==========================================

function loadReservationsTable(filter = '') {
    const reservations = getReservations();
    const tbody = document.getElementById('reservations-tbody');
    const emptyMsg = document.getElementById('reservations-empty');
    const tableWrapper = document.querySelector('#panel-reservations .table-wrapper');

    const filtered = filter
        ? reservations.filter(r =>
            r.facilityName.toLowerCase().includes(filter) ||
            r.userName.toLowerCase().includes(filter) ||
            r.id.toLowerCase().includes(filter)
        )
        : reservations;

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        tableWrapper.style.display = 'none';
        emptyMsg.classList.remove('hidden');
        return;
    }

    tableWrapper.style.display = '';
    emptyMsg.classList.add('hidden');

    tbody.innerHTML = filtered.map(res => {
        let statusClass = 'cancelled';
        let statusText = 'İptal';
        
        if (res.status === 'confirmed') {
            statusClass = 'confirmed';
            statusText = 'Onaylı';
        } else if (res.status === 'pending') {
            statusClass = 'pending'; // CSS'te sarı/turuncu yapabilirsiniz
            statusText = 'Beklemede';
        } else if (res.status === 'archived') {
            statusClass = 'cancelled';
            statusText = 'İptal (Arşiv)';
        }
        return `
            <tr>
                <td><code>${escapeHtml(res.id)}</code></td>
                <td>${escapeHtml(res.userName)}</td>
                <td>${escapeHtml(res.facilityName)}</td>
                <td>${escapeHtml(res.date)}</td>
                <td>${escapeHtml(res.time)}</td>
                <td>${res.duration} saat</td>
                <td>${res.people}</td>
                <td><strong>₺${(res.totalPrice || 0).toLocaleString('tr-TR')}</strong></td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn-delete-row" onclick="deleteReservation('${res.id}')">
                        <i class="fas fa-trash"></i> Sil
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ==========================================
// SQL OLUŞTURMA (CREATE + INSERT)
// ==========================================

function generateSQL() {
    const users = getUsers();
    const reservations = getReservations();
    const kompleksler = typeof getKompleksler === 'function' ? getKompleksler() : [];
    const tesisler = getFacilities();
    const degerlendirmeler = typeof getDegerlendirmeler === 'function' ? getDegerlendirmeler() : [];

    let sql = '';

    // Header
    sql += '-- =====================================================\n';
    sql += '-- TEKİRDAĞ SPOR REZERVASYON SİSTEMİ\n';
    sql += '-- Veritabanı Dışa Aktarımı\n';
    sql += `-- Tarih: ${new Date().toLocaleString('tr-TR')}\n`;
    sql += '-- =====================================================\n\n';

    // Kullanıcılar tablosu
    sql += '-- -----------------------------------------------------\n';
    sql += '-- Tablo: kullanicilar\n';
    sql += '-- -----------------------------------------------------\n';
    sql += 'DROP TABLE IF EXISTS kullanicilar;\n\n';
    sql += 'CREATE TABLE kullanicilar (\n';
    sql += '    id              INTEGER PRIMARY KEY AUTOINCREMENT,\n';
    sql += '    ad_soyad        VARCHAR(100) NOT NULL,\n';
    sql += '    eposta          VARCHAR(255) NOT NULL UNIQUE,\n';
    sql += '    sifre           VARCHAR(64) NOT NULL,\n';
    sql += '    rol             VARCHAR(10) DEFAULT \'USER\',\n';
    sql += '    kayit_tarihi    DATETIME DEFAULT CURRENT_TIMESTAMP\n';
    sql += ');\n\n';

    if (users.length > 0) {
        sql += '-- Kullanıcı Kayıtları\n';
        users.forEach((user, idx) => {
            sql += `INSERT INTO kullanicilar (id, ad_soyad, eposta, sifre, rol)\n`;
            sql += `VALUES (${idx + 1}, '${escapeSql(user.name)}', '${escapeSql(user.email)}', '${escapeSql(user.password)}', '${escapeSql(user.role || 'user')}');\n\n`;
        });
    }

    // Kompleksler tablosu
    sql += '-- -----------------------------------------------------\n';
    sql += '-- Tablo: kompleksler\n';
    sql += '-- -----------------------------------------------------\n';
    sql += 'DROP TABLE IF EXISTS kompleksler;\n\n';
    sql += 'CREATE TABLE kompleksler (\n';
    sql += '    kompleks_id     INTEGER PRIMARY KEY,\n';
    sql += '    kompleks_adi    VARCHAR(200) NOT NULL,\n';
    sql += '    ilce            VARCHAR(100),\n';
    sql += '    adres           VARCHAR(255),\n';
    sql += '    acilis_saati    TIME,\n';
    sql += '    kapanis_saati   TIME\n';
    sql += ');\n\n';

    if (kompleksler.length > 0) {
        sql += '-- Kompleks Kayıtları\n';
        kompleksler.forEach(k => {
            sql += `INSERT INTO kompleksler VALUES (${k.kompleksId}, '${escapeSql(k.kompleksAdi)}', '${escapeSql(k.ilce)}', '${escapeSql(k.adres)}', '${escapeSql(k.acilisSaati)}', '${escapeSql(k.kapanisSaati)}');\n`;
        });
        sql += '\n';
    }

    // Tesisler tablosu
    sql += '-- -----------------------------------------------------\n';
    sql += '-- Tablo: tesisler\n';
    sql += '-- -----------------------------------------------------\n';
    sql += 'DROP TABLE IF EXISTS tesisler;\n\n';
    sql += 'CREATE TABLE tesisler (\n';
    sql += '    tesis_id        INTEGER PRIMARY KEY,\n';
    sql += '    kompleks_id     INTEGER NOT NULL,\n';
    sql += '    tesis_adi       VARCHAR(200) NOT NULL,\n';
    sql += '    tesis_turu      VARCHAR(50),\n';
    sql += '    kapasite        INTEGER DEFAULT 0,\n';
    sql += '    ucret_saatlik   DECIMAL(10,2),\n';
    sql += '    durum           VARCHAR(20) DEFAULT \'Aktif\',\n';
    sql += '    FOREIGN KEY (kompleks_id) REFERENCES kompleksler(kompleks_id)\n';
    sql += ');\n\n';

    if (tesisler.length > 0) {
        sql += '-- Tesis Kayıtları\n';
        tesisler.forEach(t => {
            sql += `INSERT INTO tesisler VALUES (${t.tesisId || 0}, ${t.kompleksId || 0}, '${escapeSql(t.name)}', '${escapeSql(t.sport)}', ${t.capacity || 0}, ${t.price || 0}, '${t.status === 'active' ? 'Aktif' : 'Bakımda'}');\n`;
        });
        sql += '\n';
    }

    // Rezervasyonlar tablosu
    sql += '-- -----------------------------------------------------\n';
    sql += '-- Tablo: rezervasyonlar\n';
    sql += '-- -----------------------------------------------------\n';
    sql += 'DROP TABLE IF EXISTS rezervasyonlar;\n\n';
    sql += 'CREATE TABLE rezervasyonlar (\n';
    sql += '    id              VARCHAR(20) PRIMARY KEY,\n';
    sql += '    tesis_id        VARCHAR(50) NOT NULL,\n';
    sql += '    kullanici_adi   VARCHAR(100),\n';
    sql += '    tarih           DATE NOT NULL,\n';
    sql += '    saat            TIME NOT NULL,\n';
    sql += '    sure_saat       INTEGER DEFAULT 1,\n';
    sql += '    toplam_tutar    DECIMAL(10,2),\n';
    sql += '    durum           VARCHAR(20) DEFAULT \'confirmed\'\n';
    sql += ');\n\n';

    if (reservations.length > 0) {
        sql += '-- Rezervasyon Kayıtları\n';
        reservations.forEach(res => {
            sql += `INSERT INTO rezervasyonlar VALUES ('${escapeSql(res.id)}', '${escapeSql(res.facilityId)}', '${escapeSql(res.userName)}', '${escapeSql(res.date)}', '${escapeSql(res.time)}', ${res.duration}, ${res.totalPrice || 0}, '${escapeSql(res.status)}');\n`;
        });
        sql += '\n';
    }

    // Değerlendirmeler tablosu
    sql += '-- -----------------------------------------------------\n';
    sql += '-- Tablo: degerlendirmeler\n';
    sql += '-- -----------------------------------------------------\n';
    sql += 'DROP TABLE IF EXISTS degerlendirmeler;\n\n';
    sql += 'CREATE TABLE degerlendirmeler (\n';
    sql += '    id              INTEGER PRIMARY KEY,\n';
    sql += '    kullanici_id    INTEGER,\n';
    sql += '    kompleks_id     INTEGER,\n';
    sql += '    puan            INTEGER CHECK(puan BETWEEN 1 AND 5),\n';
    sql += '    yorum           TEXT,\n';
    sql += '    tarih           DATE,\n';
    sql += '    FOREIGN KEY (kompleks_id) REFERENCES kompleksler(kompleks_id)\n';
    sql += ');\n\n';

    if (degerlendirmeler.length > 0) {
        sql += '-- Değerlendirme Kayıtları\n';
        degerlendirmeler.forEach(d => {
            sql += `INSERT INTO degerlendirmeler VALUES (${d.degerlendirmeId}, ${d.kullaniciId}, ${d.kompleksId}, ${d.puan}, '${escapeSql(d.yorum)}', '${escapeSql(d.tarih)}');\n`;
        });
        sql += '\n';
    }

    // Faydalı sorgular
    sql += '-- =====================================================\n';
    sql += '-- ÖRNEK SORGULAR\n';
    sql += '-- =====================================================\n\n';
    sql += '-- Kompleks bazında tesis sayısı\n';
    sql += 'SELECT k.kompleks_adi, COUNT(t.tesis_id) AS tesis_sayisi\n';
    sql += 'FROM kompleksler k LEFT JOIN tesisler t ON k.kompleks_id = t.kompleks_id\n';
    sql += 'GROUP BY k.kompleks_id ORDER BY tesis_sayisi DESC;\n\n';
    sql += '-- Kompleks bazında ortalama puan\n';
    sql += 'SELECT k.kompleks_adi, AVG(d.puan) AS ortalama_puan\n';
    sql += 'FROM kompleksler k LEFT JOIN degerlendirmeler d ON k.kompleks_id = d.kompleks_id\n';
    sql += 'GROUP BY k.kompleks_id ORDER BY ortalama_puan DESC;\n\n';
    sql += '-- Tesis bazında gelir raporu\n';
    sql += 'SELECT r.tesis_id, COUNT(*) AS rez_sayisi, SUM(r.toplam_tutar) AS toplam_gelir\n';
    sql += 'FROM rezervasyonlar r WHERE r.durum = \'confirmed\'\n';
    sql += 'GROUP BY r.tesis_id ORDER BY toplam_gelir DESC;\n';

    return sql;
}

// SQL tablo adları renklendirme
function getTableNames() {
    return ['kullanicilar', 'kompleksler', 'tesisler', 'rezervasyonlar', 'degerlendirmeler'];
}

// ==========================================
// SQL ÖNİZLEME & RENKLENDIRME
// ==========================================

function renderSQLPreview() {
    const sql = generateSQL();
    const preElement = document.getElementById('sql-preview-code');
    preElement.innerHTML = highlightSQL(sql);
}

function highlightSQL(sql) {
    // Basit SQL syntax renklendirme
    let html = escapeHtml(sql);

    // Yorumlar
    html = html.replace(/(--[^\n]*)/g, '<span class="sql-comment">$1</span>');

    // Anahtar kelimeler
    const keywords = [
        'CREATE TABLE', 'DROP TABLE IF EXISTS', 'INSERT INTO', 'VALUES',
        'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'ON', 'GROUP BY',
        'ORDER BY', 'DESC', 'ASC', 'AS', 'COUNT', 'SUM', 'AND', 'OR',
        'NOT NULL', 'UNIQUE', 'DEFAULT', 'PRIMARY KEY', 'FOREIGN KEY',
        'REFERENCES', 'AUTOINCREMENT', 'CURRENT_TIMESTAMP', 'CURRENT_DATE'
    ];

    keywords.forEach(kw => {
        const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
        html = html.replace(regex, '<span class="sql-keyword">$1</span>');
    });

    // Veri tipleri
    const types = ['INTEGER', 'VARCHAR', 'CHAR', 'TEXT', 'DATE', 'TIME', 'DATETIME', 'DECIMAL'];
    types.forEach(type => {
        const regex = new RegExp(`\\b(${type})(\\([^)]*\\))?`, 'gi');
        html = html.replace(regex, '<span class="sql-type">$1$2</span>');
    });

    // Tablo adları (DROP/CREATE/INSERT/FROM/JOIN sonrası)
    html = html.replace(/\b(kullanicilar|kompleksler|tesisler|rezervasyonlar|degerlendirmeler)\b/g, '<span class="sql-table">$1</span>');

    // Sayılar (tek başına)
    html = html.replace(/\b(\d+)\b/g, '<span class="sql-number">$1</span>');

    return html;
}

// ==========================================
// DOSYA İNDİRME
// ==========================================

function downloadSQL() {
    const sql = generateSQL();
    const blob = new Blob([sql], { type: 'application/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tekirdag_spor_veritabani_${formatDateForFile(new Date())}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('SQL dosyası başarıyla indirildi!', 'success');
}

function copySQL() {
    const sql = generateSQL();
    navigator.clipboard.writeText(sql).then(() => {
        showToast('SQL kodu panoya kopyalandı!', 'success');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = sql;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('SQL kodu panoya kopyalandı!', 'success');
    });
}

// ==========================================
// SİLME İŞLEMLERİ
// ==========================================

function deleteUser(email) {
    if (!confirm(`${email} kullanıcısını silmek istediğinize emin misiniz?`)) return;

    const users = getUsers();
    const filtered = users.filter(u => u.email !== email);
    saveUsers(filtered);
    refreshAll();
    if (typeof autoSync === 'function') autoSync('kullanicilar');
    showToast('Kullanıcı başarıyla silindi.', 'success');
}

function deleteReservation(id) {
    if (!confirm(`${id} numaralı rezervasyonu silmek istediğinize emin misiniz?`)) return;

    const reservations = getReservations();
    const filtered = reservations.filter(r => r.id !== id);
    saveReservations(filtered);
    refreshAll();
    if (typeof autoSync === 'function') autoSync('rezervasyonlar');
    showToast('Rezervasyon başarıyla silindi.', 'success');
}

// ==========================================
// TAB GEÇİŞ
// ==========================================

function initTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    const panels = {
        'users': document.getElementById('panel-users'),
        'kompleksler': document.getElementById('panel-kompleksler'),
        'facilities': document.getElementById('panel-facilities'),
        'reservations': document.getElementById('panel-reservations'),
        'degerlendirmeler': document.getElementById('panel-degerlendirmeler'),
        'sql-preview': document.getElementById('panel-sql-preview')
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            Object.values(panels).forEach(p => p.classList.add('hidden'));
            panels[target].classList.remove('hidden');

            // SQL önizleme sekmesine geçince güncelle
            if (target === 'sql-preview') {
                renderSQLPreview();
            }
        });
    });
}

// ==========================================
// ARAMA
// ==========================================

function initSearch() {
    document.getElementById('search-users').addEventListener('input', (e) => {
        loadUsersTable(e.target.value.toLowerCase());
    });

    document.getElementById('search-reservations').addEventListener('input', (e) => {
        loadReservationsTable(e.target.value.toLowerCase());
    });
}

// ==========================================
// TEMİZLEME BUTONLARI
// ==========================================

function initClearButtons() {
    document.getElementById('btn-clear-users').addEventListener('click', () => {
        if (!confirm('TÜM kullanıcı kayıtlarını silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;
        localStorage.setItem('tsr_users', '[]');
        localStorage.setItem('tsr_users_csv', '[]');
        refreshAll();
        showToast('Tüm kullanıcı kayıtları silindi.', 'success');
    });

    document.getElementById('btn-clear-reservations').addEventListener('click', () => {
        if (!confirm('TÜM rezervasyon kayıtlarını silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;
        localStorage.setItem('tsr_reservations', '[]');
        refreshAll();
        showToast('Tüm rezervasyon kayıtları silindi.', 'success');
    });
}

// ==========================================
// DIŞA AKTARMA
// ==========================================

function initExport() {
    document.getElementById('btn-export-sql').addEventListener('click', downloadSQL);
    document.getElementById('btn-download-sql-preview').addEventListener('click', downloadSQL);
    document.getElementById('btn-copy-sql').addEventListener('click', copySQL);
    document.getElementById('btn-refresh').addEventListener('click', () => {
        refreshAll();
        showToast('Veriler yenilendi.', 'success');
    });

    // CSV İndir — aktif tab'a göre
    document.getElementById('btn-export-csv').addEventListener('click', () => {
        const activeTab = document.querySelector('.admin-tab.active');
        const tabName = activeTab ? activeTab.dataset.tab : 'users';
        const csvMap = {
            'users': 'kullanicilar',
            'kompleksler': 'kompleksler',
            'facilities': 'tesisler',
            'reservations': 'rezervasyonlar',
            'degerlendirmeler': 'degerlendirmeler'
        };
        const tablo = csvMap[tabName];
        if (tablo && typeof exportToCSV === 'function') {
            exportToCSV(tablo);
            showToast(`${tablo}.csv indirildi!`, 'success');
        } else {
            showToast('Bu sekme için CSV export yok.', 'error');
        }
    });

    // JSON İndir — aktif tab'a göre
    document.getElementById('btn-export-json').addEventListener('click', () => {
        const activeTab = document.querySelector('.admin-tab.active');
        const tabName = activeTab ? activeTab.dataset.tab : 'users';
        const jsonMap = {
            'users': 'kullanicilar',
            'kompleksler': 'kompleksler',
            'facilities': 'tesisler',
            'reservations': 'rezervasyonlar',
            'degerlendirmeler': 'degerlendirmeler'
        };
        const tablo = jsonMap[tabName];
        if (tablo && typeof exportToJSON === 'function') {
            exportToJSON(tablo);
            showToast(`${tablo}.json indirildi!`, 'success');
        } else if (typeof exportAllJSON === 'function') {
            exportAllJSON();
            showToast('Tüm veriler JSON olarak indirildi!', 'success');
        }
    });
}

// ==========================================
// YENİLEME
// ==========================================

function refreshAll() {
    loadStats();
    loadUsersTable();
    loadReservationsTable();
    loadFacilitiesTable();
    loadKomplekslerTable();
    loadDegerlendirmelerTable();
    renderSQLPreview();
    // Her yenileme sonrası CSV'ye sync
    if (typeof autoSync === 'function') autoSync();
}

// ==========================================
// ÇIKIŞ
// ==========================================

function initLogoutLink() {
    document.getElementById('nav-logout-link').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('tsr_session');
        window.location.href = 'index.html';
    });
}

// ==========================================
// MOBİL MENÜ
// ==========================================

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

// ==========================================
// YARDIMCI FONKSİYONLAR
// ==========================================

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeSql(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "''");
}

function formatDate(isoString) {
    if (!isoString) return '-';
    try {
        const d = new Date(isoString);
        return d.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return isoString;
    }
}

function formatDateForFile(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}${m}${d}_${h}${min}`;
}

// ==========================================
// TOAST BİLDİRİM
// ==========================================

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
// TESİS YÖNETİMİ
// ==========================================

function getFacilities() {
    return JSON.parse(localStorage.getItem('tsr_facilities') || '[]');
}

function saveFacilities(facilities) {
    localStorage.setItem('tsr_facilities', JSON.stringify(facilities));
}

function loadFacilitiesTable() {
    const facilities = getFacilities();
    const tbody = document.getElementById('facilities-tbody');
    const emptyMsg = document.getElementById('facilities-empty');
    const tableWrapper = tbody.closest('.table-wrapper');

    if (facilities.length === 0) {
        tableWrapper.style.display = 'none';
        emptyMsg.classList.remove('hidden');
        return;
    }

    tableWrapper.style.display = '';
    emptyMsg.classList.add('hidden');

    tbody.innerHTML = facilities.map((f, idx) => {
        const statusClass = f.status === 'active' ? 'confirmed' : '';
        const statusText = f.status === 'active' ? 'Aktif' : 'Bakımda';
        const toggleIcon = f.status === 'active' ? 'fa-pause-circle' : 'fa-play-circle';
        const toggleTitle = f.status === 'active' ? 'Bakıma Al' : 'Aktif Et';
        const toggleBtnClass = f.status === 'active' ? 'btn-toggle-maintenance' : 'btn-toggle-active';

        return `
        <tr>
            <td>${idx + 1}</td>
            <td><i class="${f.icon}" style="font-size:1.2rem;color:var(--accent);"></i></td>
            <td><strong>${escapeHtml(f.name)}</strong></td>
            <td>${escapeHtml(f.location)}</td>
            <td>${escapeHtml(f.sport)}</td>
            <td><strong>₺${f.price}</strong></td>
            <td>${escapeHtml(f.hours)}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td class="action-btns">
                <button class="btn-edit-facility" onclick="openEditFacility('${f.id}')" title="Düzenle">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="${toggleBtnClass}" onclick="toggleFacilityStatus('${f.id}')" title="${toggleTitle}">
                    <i class="fas ${toggleIcon}"></i>
                </button>
                <button class="btn-delete-row" onclick="deleteFacility('${f.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
    }).join('');
}

function initFacilityManagement() {
    const modal = document.getElementById('facility-modal');
    const closeBtn = document.getElementById('facility-modal-close');
    const addBtn = document.getElementById('btn-add-facility');
    const form = document.getElementById('facility-form');

    // Yeni tesis ekle butonu
    addBtn.addEventListener('click', () => {
        openFacilityModal();
    });

    // Modal kapat
    closeBtn.addEventListener('click', () => closeFacilityModal());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeFacilityModal();
    });

    // Form kaydet
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveFacilityFromForm();
    });

    // Görsel yükleme
    const fileInput = document.getElementById('fac-image-upload');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            showToast('Görsel yükleniyor...', 'success');
            try {
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename: file.name, base64 })
                });

                const result = await response.json();
                if (result.success) {
                    document.getElementById('fac-image-url').value = result.url;
                    showToast('Görsel başarıyla yüklendi!', 'success');
                } else {
                    showToast('Görsel yüklenirken bir hata oluştu.', 'error');
                }
            } catch (error) {
                console.error(error);
                showToast('Görsel yüklenemedi.', 'error');
            }
        });
    }
}

function openFacilityModal(facility = null) {
    const modal = document.getElementById('facility-modal');
    const title = document.getElementById('facility-modal-title');
    const subtitle = document.getElementById('facility-modal-subtitle');
    const editId = document.getElementById('fac-edit-id');

    // Formu sıfırla
    document.getElementById('facility-form').reset();
    editId.value = '';

    // Kompleks listesini doldur
    const kompleksSelect = document.getElementById('fac-kompleks');
    if (kompleksSelect) {
        const kompleksler = typeof getKompleksler === 'function' ? getKompleksler() : [];
        kompleksSelect.innerHTML = kompleksler.map(k => `
            <option value="${k.kompleksId}" data-location="${k.ilce}, Tekirdağ" data-hours="${k.acilisSaati} - ${k.kapanisSaati}">${escapeHtml(k.kompleksAdi)}</option>
        `).join('');

        // Kompleks seçilince konum ve çalışma saatlerini otomatik doldurma
        const onKompleksChange = () => {
            const selectedOpt = kompleksSelect.options[kompleksSelect.selectedIndex];
            if (selectedOpt) {
                document.getElementById('fac-location').value = selectedOpt.dataset.location;
                document.getElementById('fac-hours').value = selectedOpt.dataset.hours;
                updateFacilityPreview();
            }
        };

        // Eski dinleyiciyi temizle
        kompleksSelect.removeEventListener('change', kompleksSelect._changeHandler);
        kompleksSelect._changeHandler = onKompleksChange;
        kompleksSelect.addEventListener('change', onKompleksChange);
    }

    if (facility) {
        title.textContent = 'Tesis Düzenle';
        subtitle.textContent = facility.name;
        editId.value = facility.id;
        document.getElementById('fac-name').value = facility.name;
        document.getElementById('fac-sport').value = facility.sport;
        document.getElementById('fac-location').value = facility.location;
        document.getElementById('fac-price').value = facility.price;
        document.getElementById('fac-hours').value = facility.hours;
        document.getElementById('fac-icon').value = facility.icon;
        document.getElementById('fac-color').value = facility.bgClass;
        document.getElementById('fac-image-url').value = facility.image || '';
        
        if (kompleksSelect && facility.kompleksId) {
            kompleksSelect.value = facility.kompleksId;
        }
    } else {
        title.textContent = 'Yeni Tesis Ekle';
        subtitle.textContent = 'Sisteme yeni bir spor tesisi tanımlayın';
        document.getElementById('fac-image-url').value = '';
        
        // Yeni tesis için varsayılan kompleks verilerini doldur
        if (kompleksSelect && kompleksSelect.options.length > 0) {
            kompleksSelect.selectedIndex = 0;
            const selectedOpt = kompleksSelect.options[0];
            document.getElementById('fac-location').value = selectedOpt.dataset.location;
            document.getElementById('fac-hours').value = selectedOpt.dataset.hours;
        }
    }
    
    document.getElementById('fac-image-upload').value = '';

    updateFacilityPreview();
    initFacilityPreviewListeners();

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Canlı önizleme güncelleme
function updateFacilityPreview() {
    const name = document.getElementById('fac-name').value.trim() || 'Tesis Adı';
    const location = document.getElementById('fac-location').value.trim() || 'Konum';
    const sport = document.getElementById('fac-sport').value.trim() || 'Spor Dalı';
    const icon = document.getElementById('fac-icon').value;

    document.getElementById('fac-preview-name').textContent = name;
    document.getElementById('fac-preview-meta').textContent = `${location} · ${sport}`;
    document.getElementById('fac-preview-icon').innerHTML = `<i class="${icon}"></i>`;
}

let _previewListenersAdded = false;
function initFacilityPreviewListeners() {
    if (_previewListenersAdded) return;
    _previewListenersAdded = true;

    ['fac-name', 'fac-location', 'fac-sport'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateFacilityPreview);
    });
    document.getElementById('fac-icon').addEventListener('change', updateFacilityPreview);
}

function closeFacilityModal() {
    const modal = document.getElementById('facility-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function openEditFacility(facilityId) {
    const facilities = getFacilities();
    const facility = facilities.find(f => f.id === facilityId);
    if (facility) {
        openFacilityModal(facility);
    }
}

function saveFacilityFromForm() {
    const editId = document.getElementById('fac-edit-id').value;
    const name = document.getElementById('fac-name').value.trim();
    const sport = document.getElementById('fac-sport').value.trim();
    const location = document.getElementById('fac-location').value.trim();
    const price = parseInt(document.getElementById('fac-price').value);
    const hours = document.getElementById('fac-hours').value.trim();
    const icon = document.getElementById('fac-icon').value;
    const bgClass = document.getElementById('fac-color').value;
    const image = document.getElementById('fac-image-url').value;
    const kompleksId = parseInt(document.getElementById('fac-kompleks').value);

    if (!name || !sport || !location || !price || !hours || isNaN(kompleksId)) {
        showToast('Lütfen tüm alanları doldurun.', 'error');
        return;
    }

    let facilities = getFacilities();

    if (editId) {
        // Düzenleme
        const idx = facilities.findIndex(f => f.id === editId);
        if (idx !== -1) {
            facilities[idx] = { ...facilities[idx], name, sport, location, price, hours, icon, bgClass, image, kompleksId };
            showToast(`"${name}" tesisi güncellendi.`, 'success');
        }
    } else {
        // Yeni ekleme
        const maxTesisId = facilities.reduce((max, f) => Math.max(max, f.tesisId || 0), 0);
        const newTesisId = maxTesisId + 1;
        
        const newFacility = {
            id: 'tesis-' + newTesisId,
            tesisId: newTesisId,
            kompleksId: kompleksId,
            name, sport, location, price, hours, icon, bgClass, image,
            capacity: 50,
            rating: 0,
            status: 'active'
        };
        facilities.push(newFacility);
        showToast(`"${name}" tesisi eklendi.`, 'success');
    }

    saveFacilities(facilities);
    closeFacilityModal();
    loadFacilitiesTable();
    loadStats();
    renderSQLPreview();
    if (typeof autoSync === 'function') autoSync('tesisler');
}

function toggleFacilityStatus(facilityId) {
    let facilities = getFacilities();
    const facility = facilities.find(f => f.id === facilityId);

    if (facility) {
        const newStatus = facility.status === 'active' ? 'maintenance' : 'active';
        const statusText = newStatus === 'active' ? 'Aktif' : 'Bakımda';
        facility.status = newStatus;
        saveFacilities(facilities);
        loadFacilitiesTable();
        loadStats();
        renderSQLPreview();
        if (typeof autoSync === 'function') autoSync('tesisler');
        showToast(`"${facility.name}" durumu: ${statusText}`, 'success');
    }
}

function deleteFacility(facilityId) {
    if (!confirm('Bu tesisi silmek istediğinize emin misiniz?')) return;

    let facilities = getFacilities();
    const facility = facilities.find(f => f.id === facilityId);
    facilities = facilities.filter(f => f.id !== facilityId);
    saveFacilities(facilities);
    loadFacilitiesTable();
    loadStats();
    renderSQLPreview();
    if (typeof autoSync === 'function') autoSync('tesisler');
    showToast(`"${facility?.name}" tesisi silindi.`, 'success');
}

// ==========================================
// KOMPLEKSLER TABLOSU
// ==========================================

function loadKomplekslerTable() {
    const kompleksler = typeof getKompleksler === 'function' ? getKompleksler() : [];
    const tbody = document.getElementById('kompleksler-tbody');
    const emptyMsg = document.getElementById('kompleksler-empty');
    const tableWrapper = tbody.closest('.table-wrapper');

    if (kompleksler.length === 0) {
        tableWrapper.style.display = 'none';
        emptyMsg.classList.remove('hidden');
        return;
    }

    tableWrapper.style.display = '';
    emptyMsg.classList.add('hidden');

    const tesisler = getFacilities();

    tbody.innerHTML = kompleksler.map(k => {
        const tesisSayisi = tesisler.filter(t => String(t.kompleksId) === String(k.kompleksId)).length;
        return `
        <tr>
            <td><code>${escapeHtml(k.kompleksId)}</code></td>
            <td><strong>${escapeHtml(k.kompleksAdi)}</strong></td>
            <td>${escapeHtml(k.ilce)}</td>
            <td>${escapeHtml(k.adres)}</td>
            <td>${escapeHtml(k.acilisSaati)}</td>
            <td>${escapeHtml(k.kapanisSaati)}</td>
            <td><span class="status-badge confirmed">${tesisSayisi}</span></td>
        </tr>
    `;
    }).join('');
}

// ==========================================
// DEĞERLENDİRMELER TABLOSU
// ==========================================

function loadDegerlendirmelerTable() {
    const degerlendirmeler = typeof getDegerlendirmeler === 'function' ? getDegerlendirmeler() : [];
    const tbody = document.getElementById('degerlendirmeler-tbody');
    const emptyMsg = document.getElementById('degerlendirmeler-empty');
    const tableWrapper = tbody.closest('.table-wrapper');

    if (degerlendirmeler.length === 0) {
        tableWrapper.style.display = 'none';
        emptyMsg.classList.remove('hidden');
        return;
    }

    tableWrapper.style.display = '';
    emptyMsg.classList.add('hidden');

    const kullanicilar = JSON.parse(localStorage.getItem('tsr_users_csv') || '[]');
    const kompleksler = typeof getKompleksler === 'function' ? getKompleksler() : [];

    tbody.innerHTML = degerlendirmeler.map(d => {
        const cleanId = (id) => String(id || '').trim().replace(/^0+/, '');
        const dUidClean = cleanId(d.kullaniciId);
        const kullanici = kullanicilar.find(k => cleanId(k.kullaniciId) === dUidClean);
        const kompleks = kompleksler.find(k => String(k.kompleksId) === String(d.kompleksId));

        const stars = '★'.repeat(parseInt(d.puan)) + '☆'.repeat(5 - parseInt(d.puan));
        const puanClass = parseInt(d.puan) >= 4 ? 'confirmed' : parseInt(d.puan) <= 2 ? 'cancelled' : '';

        return `
        <tr>
            <td><code>${escapeHtml(d.degerlendirmeId)}</code></td>
            <td>${escapeHtml(kullanici ? kullanici.adSoyad : 'Kullanıcı #' + d.kullaniciId)}</td>
            <td>${escapeHtml(kompleks ? kompleks.kompleksAdi : 'Kompleks #' + d.kompleksId)}</td>
            <td><span class="status-badge ${puanClass}" title="${d.puan}/5">${stars}</span></td>
            <td style="white-space:normal;max-width:300px;">${escapeHtml(d.yorum)}</td>
            <td>${escapeHtml(d.tarih)}</td>
        </tr>
    `;
    }).join('');
}

// ===========================
// Tekirdağ Spor Rezervasyon Sistemi
// Login / Register Page Scripts
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    // CSV verilerini localStorage'a yükle (yoksa)
    if (typeof loadFromCSV === 'function') {
        loadFromCSV(false);
    }

    // Varsayılan admin hesabını oluştur (yoksa)
    ensureDefaultAdmin();

    // Eğer kullanıcı zaten giriş yapmışsa dashboard'a yönlendir
    checkExistingSession();

    initAuthTabs();
    initPasswordToggles();
    initFormSubmissions();
    initHeaderScroll();
    initMobileMenu();
    initNavRegisterBtn();
});

// --- Session Check ---
function checkExistingSession() {
    const session = JSON.parse(localStorage.getItem('tsr_session') || 'null');
    if (session && session.loggedIn) {
        window.location.href = 'dashboard.html';
    }
}

// --- Kullanıcı Veritabanı (localStorage) ---
function getUsers() {
    return JSON.parse(localStorage.getItem('tsr_users') || '[]');
}

function saveUsers(users) {
    localStorage.setItem('tsr_users', JSON.stringify(users));
}

function findUser(emailOrTc) {
    const users = getUsers();
    return users.find(u => u.email === emailOrTc || u.tc === emailOrTc);
}

function createSession(user) {
    const session = {
        loggedIn: true,
        userId: user.tc,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || 'user',
        loginTime: new Date().toISOString()
    };
    localStorage.setItem('tsr_session', JSON.stringify(session));
}

// --- Varsayılan Admin Hesabı ---
async function ensureDefaultAdmin() {
    const users = getUsers();
    const adminExists = users.some(u => u.role === 'admin');
    if (!adminExists) {
        const adminPassword = await hashPassword('admin123');
        const adminUser = {
            name: 'Sistem Yöneticisi',
            tc: '10000000000',
            email: 'admin@tekirdag.gov.tr',
            phone: '05001234567',
            password: adminPassword,
            role: 'admin',
            createdAt: new Date().toISOString()
        };
        users.push(adminUser);
        saveUsers(users);
        console.log('Varsayılan admin hesabı oluşturuldu: admin@tekirdag.gov.tr / admin123');
    }
}

// Basit şifre hash fonksiyonu (gerçek projede bcrypt vb. kullanılmalı)
async function hashPassword(password) {
    if (!window.crypto || !window.crypto.subtle) {
        // HTTP üzerinde çalışırken (localhost harici) crypto.subtle kullanılamaz, fallback:
        return btoa(password + 'tsr_salt_2026');
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'tsr_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Auth Tabs ---
function initAuthTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show/hide forms with animation
            if (target === 'login') {
                registerForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
                loginForm.style.animation = 'fadeInUp 0.35s ease-out';
            } else {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
                registerForm.style.animation = 'fadeInUp 0.35s ease-out';
            }
        });
    });
}

// --- Password Visibility Toggle ---
function initPasswordToggles() {
    const toggles = document.querySelectorAll('.password-toggle');

    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const input = toggle.parentElement.querySelector('input');
            const icon = toggle.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    });
}

// --- Form Submissions (Gerçek localStorage Auth) ---
function initFormSubmissions() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // ========== GİRİŞ YAP ==========
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailOrTc = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!emailOrTc || !password) {
            showToast('Lütfen tüm alanları doldurun.', 'error');
            return;
        }

        const btn = document.getElementById('login-submit-btn');
        btn.textContent = 'GİRİŞ YAPILIYOR...';
        btn.disabled = true;

        try {
            // Şifreyi hashle ve kullanıcıyı bul
            const hashedPassword = await hashPassword(password);
            const user = findUser(emailOrTc);

            // Gerçekçi gecikme
            setTimeout(() => {
                if (!user) {
                    showToast('Kullanıcı bulunamadı! Lütfen kayıt olun.', 'error');
                    btn.textContent = 'GİRİŞ YAP';
                    btn.disabled = false;
                    return;
                }

                // Şifre kontrolü: hem hash'li hem düz metin (CSV) şifrelerini destekle
                if (user.password !== hashedPassword && user.password !== password) {
                    showToast('Şifre hatalı! Tekrar deneyin.', 'error');
                    btn.textContent = 'GİRİŞ YAP';
                    btn.disabled = false;
                    return;
                }

                // Başarılı giriş - session oluştur
                createSession(user);
                showToast('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            }, 800);
        } catch (err) {
            console.error('Login Error:', err);
            showToast('Giriş sırasında bir hata oluştu: ' + err.message, 'error');
            btn.textContent = 'GİRİŞ YAP';
            btn.disabled = false;
        }
    });

    // ========== KAYIT OL ==========
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;
        const terms = document.getElementById('terms-checkbox').checked;

        // Validasyonlar
        if (!name || !email || !password || !passwordConfirm) {
            showToast('Lütfen tüm alanları doldurun.', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showToast('Geçerli bir e-posta adresi girin.', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Şifre en az 6 karakter olmalıdır.', 'error');
            return;
        }

        if (password !== passwordConfirm) {
            showToast('Şifreler eşleşmiyor!', 'error');
            return;
        }

        if (!terms) {
            showToast('Kullanım koşullarını kabul etmelisiniz.', 'error');
            return;
        }

        // Mevcut kullanıcı kontrolü
        const existingByEmail = findUser(email);
        if (existingByEmail) {
            showToast('Bu e-posta adresi zaten kayıtlı!', 'error');
            return;
        }

        const btn = document.getElementById('register-submit-btn');
        btn.textContent = 'KAYIT YAPILIYOR...';
        btn.disabled = true;

        // Şifreyi hashle
        const hashedPassword = await hashPassword(password);

        // CSV formatı için tsr_users_csv'ye de ekle ve max id'yi bul
        const csvUsers = JSON.parse(localStorage.getItem('tsr_users_csv') || '[]');
        let maxId = 0;
        csvUsers.forEach(u => {
            const id = parseInt(u.kullaniciId);
            if (!isNaN(id) && id > maxId) maxId = id;
        });
        const generatedId = String(maxId + 1);

        // Kullanıcıyı web veritabanına (localStorage) kaydet
        const users = getUsers();
        const newUser = {
            name: name,
            tc: generatedId, // Web session için id olarak kullanıyoruz
            email: email,
            phone: '-',
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        saveUsers(users);

        const newCsvUser = {
            kullaniciId: generatedId,
            adSoyad: name,
            email: email,
            sifre: password, // CSV düz metin saklıyor
            rol: 'USER'
        };
        csvUsers.push(newCsvUser);
        localStorage.setItem('tsr_users_csv', JSON.stringify(csvUsers));

        // Python sunucusuna senkronize et
        if (typeof autoSync === 'function') autoSync('kullanicilar');

        setTimeout(() => {
            showToast('Kayıt başarılı! Şimdi giriş yapabilirsiniz.', 'success');
            btn.textContent = 'KAYIT OL';
            btn.disabled = false;

            // Formu temizle
            registerForm.reset();

            // Giriş sekmesine geç
            document.getElementById('tab-login').click();
        }, 1000);
    });
}

// --- Doğrulama Yardımcıları ---
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    // Türk telefon numarası formatı
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return /^(0?5\d{9}|905\d{9})$/.test(cleaned);
}

// --- Header Scroll Effect ---
function initHeaderScroll() {
    const header = document.getElementById('main-header');
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > 20) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
                ticking = false;
            });
            ticking = true;
        }
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

    // Close on link click
    nav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('open');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });
}

// --- Nav Register Button ---
function initNavRegisterBtn() {
    const btn = document.getElementById('nav-register-btn');
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        // Switch to register tab
        document.getElementById('tab-register').click();
        // Scroll to auth panel
        document.getElementById('auth-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

// --- Toast Notification ---
function showToast(message, type = 'success') {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Show
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto-hide
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

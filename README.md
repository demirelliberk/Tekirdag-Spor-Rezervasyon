# Akıllı Spor Kompleksi Rezervasyon Sistemi
Tekirdağ ilindeki yoğun spor tesislerinin (Süleymanpaşa Namık Kemal Stadı, Çorlu Atatürk Spor Kompleksi vb.) randevu, çakışma yönetimi ve sıra süreçlerini optimize etmek amacıyla geliştirilmiş, *Veri Yapıları tabanlı* modüler bir rezervasyon yönetim sistemidir.
---
## 👥 Proje Ekibi ve Görev Dağılımı
* **Aleyna Dilan Öztürk:** Veri Altyapısı, Kalıcı Dosya Yönetimi (CSVReader) ve Big-O Karmaşıklık Analizi.
* **Halil Safa Kancabaş:** İş Mantığı (Business Logic), Rezervasyon Algoritması ve Slot Kontrolleri.
* **Zeynep Demireridem:** Gelişmiş Veri Yapıları Entegrasyonu (MyQueue Bekleme Listesi & Stack İşlem Geçmişi).
* **Berk Demirelli:** Frontend Katmanı (Kullanıcı & Yönetim Arayüzleri), Konsol/Kullanıcı Arayüzü, Python Backend ve Sistem Entegrasyonları.
---
## 🛠️ Kullanılan Teknolojiler & Veri Yapıları
### 💻 Web & Backend Teknolojileri:
* **Arayüz (Frontend):** HTML5, Vanilla CSS (Modern Dark Mode, Glassmorphic Tasarım), Vanilla JavaScript (Matris Yapıları).
* **Arka Uç (Backend):** Python 3 (Hafif RESTful API Sunucusu, Çakışma Önleme Kilit Mantığı).
* **Veri Depolama:** Kalıcı Dosya Sistemi (CSV - Comma Separated Values).
### ☕ Java & Algoritmalar:
* **Dil:** Java 17+ (Konsol Arabirimi ve Simülasyon).
* **Bellek Yapısı:**
  * **ArrayList:** Aktif RAM bellekte dinamik veri yönetimi.
  * **Queue (Node Tabanlı Generic FIFO):** Yoğun saatlerde çakışmayı önlemek için adil bekleme sırası.
  * **Stack (LIFO):** Son yapılan işlemlerin takibi ve iptal/geri alma (Undo) mekanizması.
---
## 🚀 Kurulum ve Çalıştırma
Projenin çalıştırılabilmesi için bilgisayarınızda **Python 3** ve **Java JDK** yüklü olmalıdır.
### 1. Depoyu Klonlayın
```bash
git clone https://github.com/Aleynadilanztrk/Tekirda-SporRezervasyonSistemi.git
cd Tekirda-SporRezervasyonSistemi
```
---
### 2. 🌐 Web Uygulamasını Başlatma (Önerilen)
Web arayüzünün anlık veri eşitlemesi yapabilmesi, doluluk matrisini güncelleyebilmesi ve verileri CSV veritabanına kaydedebilmesi için önce Python sunucusu başlatılmalıdır.
```bash
# Proje ana dizinindeyken sunucuyu çalıştırın
python server.py
```
Sunucu başladıktan sonra tarayıcınızdan aşağıdaki adrese giderek sistemi hemen kullanmaya başlayabilirsiniz:
👉 **`http://localhost:8080/index.html`**
---
### 3. ☕ Java Konsol Uygulamasını Başlatma (Etkileşimli CLI)
Web arayüzünden yapılan rezervasyonları izlemek ve RAM üzerinde geçici simülasyonlar (çakışma ve bekleme kuyruğu yönetimi) gerçekleştirmek için Java uygulamasını başlatabilirsiniz.
Proje kök dizininde bir terminal açarak sırasıyla şu komutları çalıştırın:
```powershell
# 1. Adım: Tüm Java dosyalarını derleyip "bin" klasörüne aktarın (UTF-8 karakter desteğiyle)
javac -encoding UTF-8 -d bin src/*.java
# 2. Adım: Programı başlatın
java -cp bin Main
```
---
## 🔒 Concurrency (Eşzamanlılık) & Veri Güvenliği
Sistemde iki kullanıcının aynı anda aynı tesise ve saate rezervasyon yapmaya çalışması, Python backend katmanındaki **Double-Booking Kilit Mekanizması** ile engellenmektedir. Çakışma durumunda sunucu istemciye HTTP 409 hata kodu döner ve ilgili rezervasyon otomatik olarak **Bekleme Kuyruğuna (FIFO)** yönlendirilir.

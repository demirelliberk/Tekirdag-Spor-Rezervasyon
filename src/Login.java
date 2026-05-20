import java.util.ArrayList;
import java.util.Scanner;

/**
 * Login - Kullanıcı Giriş ve Kayıt Sistemi
 * 
 * CSV dosyasındaki kullanıcı verilerini kullanarak
 * giriş yapma, kayıt olma ve oturum yönetimi sağlar.
 * 
 * Kullanılan Veri Yapıları:
 *   - ArrayList<Kullanici>  → Kullanıcı listesi (dinamik dizi)
 *   - BeklemeKuyrugu        → Giriş sırası kuyruğu (Linked List Queue)
 * 
 * Zaman Karmaşıklığı Analizi:
 *   - girisYap()       → O(n) — Lineer arama ile kullanıcı bulma
 *   - kayitOl()        → O(n) — Email çakışma kontrolü
 *   - emailBul()       → O(n) — Liste üzerinde doğrusal tarama
 *   - idUret()         → O(n) — Maks ID bulma
 *   - menuGoster()     → O(1) — Sabit işlem
 * 
 * Alan Karmaşıklığı:
 *   - O(n) — n = toplam kullanıcı sayısı
 */
public class Login {

    // -------------------------------------------------------
    // ALANLAR
    // -------------------------------------------------------

    private ArrayList<Kullanici> kullaniciListesi;  // CSV'den okunan kullanıcılar
    private Kullanici aktifKullanici;               // Giriş yapmış kullanıcı
    private Scanner scanner;                        // Konsol girişi
    private BeklemeKuyrugu<Kullanici> girisKuyrugu;            // Giriş bekleme kuyruğu

    // -------------------------------------------------------
    // CONSTRUCTOR
    // -------------------------------------------------------

    /**
     * Login sistemi başlatılır.
     * CSVReader ile kullanıcılar okunur.
     * 
     * Zaman: O(n) — CSV satır sayısı kadar okuma
     * Alan:  O(n) — Kullanıcı listesi
     */
    public Login() {
        this.kullaniciListesi = CSVReader.kullanicilariOku();
        this.aktifKullanici = null;
        this.scanner = new Scanner(System.in);
        this.girisKuyrugu = new BeklemeKuyrugu<>();

        // CSV'den okunan kullanıcı sayısını kontrol et
        if (kullaniciListesi.isEmpty()) {
            System.out.println("⚠ Uyarı: Kullanıcı verisi bulunamadı!");
            System.out.println("  data/kullanicilar.csv dosyasını kontrol edin.\n");
        } else {
            System.out.println("✓ " + kullaniciListesi.size() 
                + " kullanıcı CSV'den yüklendi.\n");
        }
    }

    // -------------------------------------------------------
    // ANA MENÜ
    // -------------------------------------------------------

    /**
     * Konsol tabanlı interaktif menü.
     * Kullanıcı giriş yapana veya çıkış seçene kadar döngüde kalır.
     * 
     * Zaman: O(1) her iterasyon (menü gösterimi)
     */
    public void menuGoster() {

        boolean devam = true;

        while (devam) {

            System.out.println("╔══════════════════════════════════════╗");
            System.out.println("║   TEKİRDAĞ SPOR REZERVASYON SİSTEMİ ║");
            System.out.println("║          GİRİŞ / KAYIT MENÜSÜ       ║");
            System.out.println("╠══════════════════════════════════════╣");
            System.out.println("║  1. Giriş Yap                       ║");
            System.out.println("║  2. Kayıt Ol                        ║");
            System.out.println("║  3. Kayıtlı Kullanıcıları Listele   ║");
            System.out.println("║  4. Bekleme Kuyruğunu Göster         ║");
            System.out.println("║  0. Çıkış                           ║");
            System.out.println("╚══════════════════════════════════════╝");
            System.out.print("Seçiminiz: ");

            String secim = scanner.nextLine().trim();

            switch (secim) {
                case "1":
                    girisYap();
                    break;
                case "2":
                    kayitOl();
                    break;
                case "3":
                    kullanicilariListele();
                    break;
                case "4":
                    kuyrukGoster();
                    break;
                case "0":
                    System.out.println("\nSistemden çıkılıyor...");
                    devam = false;
                    break;
                default:
                    // Hata Yönetimi: Geçersiz menü seçimi
                    System.out.println("\n✗ Geçersiz seçim! Lütfen 0-4 arası bir sayı girin.\n");
                    break;
            }
        }
    }

    // -------------------------------------------------------
    // GİRİŞ YAP
    // -------------------------------------------------------

    /**
     * Email ve şifre ile kullanıcı girişi.
     * 
     * Algoritma:
     *   1. Email'i al → emailBul() ile kullanıcıyı ara → O(n)
     *   2. Şifre kontrolü yap → O(1)
     *   3. Başarılıysa aktif kullanıcı olarak ata
     * 
     * Zaman: O(n) — n kullanıcı üzerinde arama
     * Alan:  O(1) — Ek alan kullanılmaz
     */
    public void girisYap() {

        System.out.println("\n--- GİRİŞ YAP ---");

        // Hata Yönetimi: Boş liste kontrolü
        if (kullaniciListesi.isEmpty()) {
            System.out.println("✗ Sistemde kayıtlı kullanıcı yok!");
            System.out.println("  Önce kayıt olmanız gerekiyor.\n");
            return;
        }

        // Email girişi
        System.out.print("Email: ");
        String email = scanner.nextLine().trim();

        // Hata Yönetimi: Boş giriş kontrolü
        if (email.isEmpty()) {
            System.out.println("✗ Email boş bırakılamaz!\n");
            return;
        }

        // Hata Yönetimi: Geçerli email format kontrolü
        if (!email.contains("@") || !email.contains(".")) {
            System.out.println("✗ Geçersiz email formatı! (örn: ad@mail.com)\n");
            return;
        }

        // Kullanıcıyı bul — O(n)
        Kullanici bulunan = emailBul(email);

        // Hata Yönetimi: Kullanıcı bulunamadı
        if (bulunan == null) {
            System.out.println("✗ Bu email ile kayıtlı kullanıcı bulunamadı: " + email);
            System.out.println("  Kayıt olmak için menüden 2'yi seçin.\n");
            return;
        }

        // Şifre girişi
        System.out.print("Şifre: ");
        String sifre = scanner.nextLine().trim();

        // Hata Yönetimi: Boş şifre kontrolü
        if (sifre.isEmpty()) {
            System.out.println("✗ Şifre boş bırakılamaz!\n");
            return;
        }

        // Şifre doğrulama — O(1)
        if (!bulunan.getSifre().equals(sifre)) {
            System.out.println("✗ Şifre hatalı! Tekrar deneyin.\n");
            return;
        }

        // Başarılı giriş
        aktifKullanici = bulunan;

        System.out.println("\n✓ Giriş başarılı!");
        System.out.println("  Hoş geldiniz, " + aktifKullanici.getAdSoyad() + "!");
        System.out.println("  Rol: " + aktifKullanici.getRol());
        System.out.println("  ID:  " + aktifKullanici.getKullaniciId());

        // Bekleme kuyruğuna ekle (giriş sırası takibi)
        girisKuyrugu.enqueue(aktifKullanici);

        System.out.println();
    }

    // -------------------------------------------------------
    // KAYIT OL
    // -------------------------------------------------------

    /**
     * Yeni kullanıcı kaydı oluşturur.
     * 
     * Algoritma:
     *   1. Ad soyad, email, şifre al
     *   2. Email çakışma kontrolü → emailBul() → O(n)
     *   3. Yeni ID üret → idUret() → O(n)
     *   4. Kullanıcı oluştur ve listeye ekle → O(1) amortized
     *   5. CSV dosyasına yaz → O(n)
     * 
     * Zaman: O(n) — Email kontrolü ve ID üretimi
     * Alan:  O(1) — Sadece yeni nesne
     */
    public void kayitOl() {

        System.out.println("\n--- KAYIT OL ---");

        // Ad Soyad
        System.out.print("Ad Soyad: ");
        String adSoyad = scanner.nextLine().trim();

        if (adSoyad.isEmpty()) {
            System.out.println("✗ Ad Soyad boş bırakılamaz!\n");
            return;
        }

        if (adSoyad.length() < 3) {
            System.out.println("✗ Ad Soyad en az 3 karakter olmalıdır!\n");
            return;
        }

        // Email
        System.out.print("Email: ");
        String email = scanner.nextLine().trim();

        if (email.isEmpty()) {
            System.out.println("✗ Email boş bırakılamaz!\n");
            return;
        }

        if (!email.contains("@") || !email.contains(".")) {
            System.out.println("✗ Geçersiz email formatı! (örn: ad@mail.com)\n");
            return;
        }

        // Hata Yönetimi: Email çakışma kontrolü — O(n)
        if (emailBul(email) != null) {
            System.out.println("✗ Bu email zaten kayıtlı: " + email);
            System.out.println("  Giriş yapmak için menüden 1'i seçin.\n");
            return;
        }

        // Şifre
        System.out.print("Şifre: ");
        String sifre = scanner.nextLine().trim();

        if (sifre.isEmpty()) {
            System.out.println("✗ Şifre boş bırakılamaz!\n");
            return;
        }

        if (sifre.length() < 4) {
            System.out.println("✗ Şifre en az 4 karakter olmalıdır!\n");
            return;
        }

        // Şifre tekrar
        System.out.print("Şifre (Tekrar): ");
        String sifreTekrar = scanner.nextLine().trim();

        if (!sifre.equals(sifreTekrar)) {
            System.out.println("✗ Şifreler eşleşmiyor!\n");
            return;
        }

        // Yeni ID üret — O(n)
        int yeniId = idUret();

        // Kullanıcı oluştur (varsayılan rol: USER)
        Kullanici yeniKullanici = new Kullanici(
            yeniId,
            adSoyad,
            email,
            sifre,
            "USER"
        );

        // Listeye ekle — O(1) amortized
        kullaniciListesi.add(yeniKullanici);

        // CSV dosyasına kaydet — O(n)
        csvyeKaydet(yeniKullanici);

        System.out.println("\n✓ Kayıt başarılı!");
        System.out.println("  ID:    " + yeniId);
        System.out.println("  Ad:    " + adSoyad);
        System.out.println("  Email: " + email);
        System.out.println("  Rol:   USER");
        System.out.println("  Şimdi giriş yapabilirsiniz.\n");
    }

    // -------------------------------------------------------
    // KULLANICILARI LİSTELE
    // -------------------------------------------------------

    /**
     * Tüm kayıtlı kullanıcıları listeler.
     * 
     * Zaman: O(n) — Tüm listeyi dolaşma
     * Alan:  O(1) — Ek alan yok
     */
    public void kullanicilariListele() {

        System.out.println("\n--- KAYITLI KULLANICILAR ---");

        // Hata Yönetimi: Boş liste
        if (kullaniciListesi.isEmpty()) {
            System.out.println("Kayıtlı kullanıcı bulunmuyor.\n");
            return;
        }

        System.out.println("┌────┬────────────────────┬─────────────────────┬────────┐");
        System.out.println("│ ID │ Ad Soyad           │ Email               │ Rol    │");
        System.out.println("├────┼────────────────────┼─────────────────────┼────────┤");

        for (Kullanici k : kullaniciListesi) {
            System.out.printf("│ %-2d │ %-18s │ %-19s │ %-6s │%n",
                k.getKullaniciId(),
                k.getAdSoyad(),
                k.getKullaniciAdi(),  // email olarak kullanılıyor
                k.getRol()
            );
        }

        System.out.println("└────┴────────────────────┴─────────────────────┴────────┘");
        System.out.println("Toplam: " + kullaniciListesi.size() + " kullanıcı\n");
    }

    // -------------------------------------------------------
    // BEKLEME KUYRUĞU GÖSTER
    // -------------------------------------------------------

    /**
     * Giriş sırası bekleme kuyruğunu gösterir.
     * BeklemeKuyrugu (Linked List Queue) kullanır.
     * 
     * Zaman: O(n) — Kuyruktaki elemanları dolaşma
     * Alan:  O(1)
     */
    public void kuyrukGoster() {

        System.out.println("\n--- GİRİŞ BEKLEME KUYRUĞU ---");

        if (girisKuyrugu.isEmpty()) {
            System.out.println("Kuyrukta bekleyen kullanıcı yok.\n");
            return;
        }

        girisKuyrugu.listele();

        Kullanici ilk = girisKuyrugu.peek();
        if (ilk != null) {
            System.out.println("\nSıradaki: " + ilk.getAdSoyad());
        }

        System.out.println();
    }

    // -------------------------------------------------------
    // YARDIMCI METOTLAR
    // -------------------------------------------------------

    /**
     * Email adresine göre kullanıcı arar.
     * Lineer arama (Linear Search) algoritması.
     * 
     * @param email Aranan email adresi
     * @return Bulunan Kullanici nesnesi veya null
     * 
     * Zaman: O(n) — En kötü durumda tüm listeyi dolaşır
     * Alan:  O(1)
     */
    private Kullanici emailBul(String email) {

        for (Kullanici k : kullaniciListesi) {
            // kullaniciAdi alanı CSV'deki email sütununa karşılık gelir
            if (k.getKullaniciAdi().equalsIgnoreCase(email)) {
                return k;
            }
        }

        return null; // Bulunamadı
    }

    /**
     * Yeni kullanıcı için benzersiz ID üretir.
     * Mevcut en yüksek ID'yi bulup +1 ekler.
     * 
     * @return Yeni benzersiz ID
     * 
     * Zaman: O(n) — Maksimum ID bulma
     * Alan:  O(1)
     */
    private int idUret() {

        int maxId = 0;

        for (Kullanici k : kullaniciListesi) {
            if (k.getKullaniciId() > maxId) {
                maxId = k.getKullaniciId();
            }
        }

        return maxId + 1;
    }

    /**
     * Yeni kullanıcıyı CSV dosyasına append eder.
     * Mevcut dosyanın sonuna yeni satır ekler.
     * 
     * CSV Formatı: kullaniciId,adSoyad,email,sifre,rol
     * 
     * @param k Kaydedilecek kullanıcı
     * 
     * Zaman: O(1) — Dosya sonuna ekleme
     * Alan:  O(1)
     */
    private void csvyeKaydet(Kullanici k) {

        try {
            java.io.FileWriter fw = new java.io.FileWriter(
                "../data/kullanicilar.csv", true  // true = append mode
            );

            // CSV satırı oluştur
            String satir = String.format("\n%d,%s,%s,%s,%s",
                k.getKullaniciId(),
                k.getAdSoyad(),
                k.getKullaniciAdi(),  // email
                k.getSifre(),
                k.getRol()
            );

            fw.write(satir);
            fw.close();

            System.out.println("  (CSV dosyasına kaydedildi)");

        } catch (Exception e) {
            System.out.println("  ⚠ CSV'ye yazma hatası: " + e.getMessage());
            System.out.println("  (Kullanıcı belleğe eklendi, dosyaya yazılamadı)");
        }
    }

    // -------------------------------------------------------
    // GETTER
    // -------------------------------------------------------

    /**
     * Aktif (giriş yapmış) kullanıcıyı döndürür.
     * 
     * Zaman: O(1)
     */
    public Kullanici getAktifKullanici() {
        return aktifKullanici;
    }

    /**
     * Kullanıcı listesini döndürür.
     * 
     * Zaman: O(1)
     */
    public ArrayList<Kullanici> getKullaniciListesi() {
        return kullaniciListesi;
    }

    /**
     * Giriş bekleme kuyruğunu döndürür.
     * 
     * Zaman: O(1)
     */
    public BeklemeKuyrugu<Kullanici> getGirisKuyrugu() {
        return girisKuyrugu;
    }
}

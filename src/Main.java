import java.util.ArrayList;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        // 1. CSV'den Rezervasyonları ve Kullanıcıları Yükle
        ArrayList<Rezervasyon> tumRezervasyonlar = CSVReader.rezervasyonlariOku();
        ArrayList<Kullanici> tumKullanicilar = CSVReader.kullanicilariOku();
        
        // 2. Bekleme Kuyruğunu (FIFO Queue) Oluştur ve 'Beklemede' olanları ekle
        BeklemeKuyrugu<Rezervasyon> beklemeKuyrugu = new BeklemeKuyrugu<>();
        for (Rezervasyon r : tumRezervasyonlar) {
            if ("Beklemede".equals(r.getDurum())) {
                beklemeKuyrugu.enqueue(r);
            }
        }
        
        boolean running = true;
        while (running) {
            System.out.println("\n===================================================================");
            System.out.println("     TEKIRDAG SPOR REZERVASYON SISTEMI - INTERAKTIF CLI (RAM)");
            System.out.println("===================================================================");
            System.out.println("1. Mevcut Rezervasyonları ve Bekleme Kuyruğunu Listele");
            System.out.println("2. Yeni Geçici Rezervasyon Oluştur (Çakışma Kontrolü Yapılır)");
            System.out.println("3. Bekleme Kuyruğundan Sıradakini Al (Onayla)");
            System.out.println("4. Sistemden Güvenli Çıkış (Verileri Kaydetmeden)");
            System.out.print("Seçiminiz (1-4): ");
            
            String secim = scanner.nextLine().trim();
            switch (secim) {
                case "1":
                    System.out.println("\n📋 BELLEKTEKİ TÜM REZERVASYONLAR:");
                    System.out.println("-------------------------------------------------------------------");
                    if (tumRezervasyonlar.isEmpty()) {
                        System.out.println("   Kayıtlı rezervasyon bulunmuyor.");
                    } else {
                        for (Rezervasyon r : tumRezervasyonlar) {
                            System.out.println("   - " + r);
                        }
                    }
                    
                    System.out.println("\n👥 GÜNCEL BEKLEME KUYRUĞU (FIFO Queue):");
                    System.out.println("-------------------------------------------------------------------");
                    beklemeKuyrugu.listele();
                    break;
                    
                case "2":
                    System.out.println("\n🆕 YENİ GEÇİCİ REZERVASYON OLUŞTURMA");
                    System.out.println("-------------------------------------------------------------------");
                    System.out.print("Tesis ID girin (örn. 1): ");
                    int tesisId = 1;
                    try {
                        tesisId = Integer.parseInt(scanner.nextLine().trim());
                    } catch (Exception e) {
                        System.out.println("[HATA] Tesis ID sayı olmalıdır. Varsayılan 1 alındı.");
                    }
                    
                    System.out.print("Kullanıcı ID veya TC girin (örn. 2): ");
                    String kullaniciId = scanner.nextLine().trim();
                    String kullaniciAdi = getKullaniciAdi(kullaniciId, tumKullanicilar);
                    
                    System.out.print("Tarih girin (YYYY-AA-GG): ");
                    String tarih = scanner.nextLine().trim();
                    
                    System.out.print("Saat girin (SS:DD, örn. 16:00): ");
                    String saat = scanner.nextLine().trim();
                    
                    // Slot Doluluk Kontrolü
                    boolean slotDolu = false;
                    for (Rezervasyon r : tumRezervasyonlar) {
                        if (r.getTesisId() == tesisId && r.getTarih().equals(tarih) && r.getBaslangicSaati().equals(saat)) {
                            if ("Onaylandi".equals(r.getDurum())) {
                                slotDolu = true;
                                break;
                            }
                        }
                    }
                    
                    String resId = "RES-TEMP-" + System.currentTimeMillis();
                    Rezervasyon yeniRez;
                    
                    if (slotDolu) {
                        yeniRez = new Rezervasyon(resId, tesisId, kullaniciId, kullaniciAdi, tarih, saat, "1 Saat", "Beklemede");
                        tumRezervasyonlar.add(yeniRez);
                        beklemeKuyrugu.enqueue(yeniRez);
                        System.out.println("\n[⚠️ UYARI] Seçtiğiniz saat slotu dolu! Rezervasyonunuz");
                        System.out.println("          otomatik olarak BEKLEME KUYRUĞUNA (Queue) alınmıştır.");
                    } else {
                        yeniRez = new Rezervasyon(resId, tesisId, kullaniciId, kullaniciAdi, tarih, saat, "1 Saat", "Onaylandi");
                        tumRezervasyonlar.add(yeniRez);
                        System.out.println("\n[✅ ONAYLANDI] Rezervasyon başarıyla onaylandı ve belleğe eklendi.");
                    }
                    System.out.println("Eklenen Kayıt: " + yeniRez);
                    break;
                    
                case "3":
                    System.out.println("\n🔄 BEKLEME KUYRUĞUNDAN SIRADAKİNİ ALMA");
                    System.out.println("-------------------------------------------------------------------");
                    if (beklemeKuyrugu.isEmpty()) {
                        System.out.println("[BİLGİ] Şu anda bekleme kuyruğunda bekleyen rezervasyon bulunmuyor.");
                    } else {
                        Rezervasyon siradaki = beklemeKuyrugu.peek();
                        
                        // İlgili slotun dolu olup olmadığını tekrar denetle
                        boolean slotHalaDolu = false;
                        for (Rezervasyon r : tumRezervasyonlar) {
                            if (r.getTesisId() == siradaki.getTesisId() && r.getTarih().equals(siradaki.getTarih()) && r.getBaslangicSaati().equals(siradaki.getBaslangicSaati())) {
                                if ("Onaylandi".equals(r.getDurum())) {
                                    slotHalaDolu = true;
                                    break;
                                }
                            }
                        }
                        
                        if (slotHalaDolu) {
                            System.out.println("[ENGELLENDİ] Sıradaki kullanıcı onaylanamıyor.");
                            System.out.println("             İlgili saat slotu hâlâ dolu (Onaylı rezervasyon mevcut).");
                            System.out.println("             Öncelikle çakışan rezervasyonu iptal etmelisiniz.");
                        } else {
                            beklemeKuyrugu.dequeue();
                            // Rezervasyon listesinde statüyü Onaylandı yap
                            for (Rezervasyon r : tumRezervasyonlar) {
                                if (r.getRezervasyonId().equals(siradaki.getRezervasyonId())) {
                                    r.setDurum("Onaylandi");
                                    break;
                                }
                            }
                            System.out.println("[✅ BAŞARILI] Sıradaki rezervasyon kuyruktan çıkarıldı ve onaylandı!");
                            System.out.println("Onaylanan: " + siradaki);
                        }
                    }
                    break;
                    
                case "4":
                    System.out.println("\n👋 Program kapatılıyor. Geçici bellek (RAM) temizlendi.");
                    running = false;
                    break;
                    
                default:
                    System.out.println("[HATA] Geçersiz seçenek! Lütfen 1-4 arasında bir sayı girin.");
                    break;
            }
        }
        
        scanner.close();
    }
    
    private static String cleanId(String id) {
        if (id == null) return "";
        return id.trim().replaceAll("^0+", "");
    }
    
    private static String getKullaniciAdi(String id, ArrayList<Kullanici> kullanicilar) {
        String cleanInput = cleanId(id);
        for (Kullanici k : kullanicilar) {
            String cleanKId = cleanId(String.valueOf(k.getKullaniciId()));
            if (cleanKId.equals(cleanInput)) {
                return k.getAdSoyad();
            }
        }
        return "Kullanıcı #" + id;
    }
}
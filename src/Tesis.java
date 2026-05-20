import java.util.Stack;

public class Tesis {

    // -----------------------------
    // TESİS BİLGİLERİ
    // -----------------------------
    private int tesisId;
    private int kompleksId;
    private String tesisAdi;
    private String tesisTuru;
    private int kapasite;
    private double ucretSaatlik;
    private String durum;

    // -----------------------------
    // REZERVASYON SİSTEMİ
    // -----------------------------

    // 09:00 - 23:00 arası toplam 14 slot
    private Reservation[] slots;

    // İptal edilen rezervasyonlar
    private Stack<Reservation> canceledReservations;

    // -----------------------------
    // CONSTRUCTOR
    // -----------------------------
    public Tesis(int tesisId,
                 int kompleksId,
                 String tesisAdi,
                 String tesisTuru,
                 int kapasite,
                 double ucretSaatlik,
                 String durum) {

        this.tesisId = tesisId;
        this.kompleksId = kompleksId;
        this.tesisAdi = tesisAdi;
        this.tesisTuru = tesisTuru;
        this.kapasite = kapasite;
        this.ucretSaatlik = ucretSaatlik;
        this.durum = durum;

        // Rezervasyon sistemi
        slots = new Reservation[14];
        canceledReservations = new Stack<>();
    }

    // -----------------------------
    // GETTER METOTLARI
    // -----------------------------

    public int getTesisId() {
        return tesisId;
    }

    public int getKompleksId() {
        return kompleksId;
    }

    public String getTesisAdi() {
        return tesisAdi;
    }

    public String getTesisTuru() {
        return tesisTuru;
    }

    public int getKapasite() {
        return kapasite;
    }

    public double getUcretSaatlik() {
        return ucretSaatlik;
    }

    public String getDurum() {
        return durum;
    }

    // -----------------------------
    // REZERVASYON EKLE
    // -----------------------------

    public boolean addReservation(String customerName,
                                  int startHour,
                                  int endHour) {

        int startIndex = startHour - 9;
        int endIndex = endHour - 9;

        // Geçersiz saat kontrolü
        if(startIndex < 0 || endIndex > 14 || startIndex >= endIndex) {

            System.out.println("Geçersiz saat aralığı!");
            return false;
        }

        // Çakışma kontrolü
        for(int i = startIndex; i < endIndex; i++) {

            if(slots[i] != null) {

                System.out.println("Bu saatler dolu!");
                return false;
            }
        }

        // Yeni rezervasyon oluştur
        Reservation reservation =
                new Reservation(customerName,
                        startHour,
                        endHour);

        // Slotlara yerleştir
        for(int i = startIndex; i < endIndex; i++) {

            slots[i] = reservation;
        }

        System.out.println("Rezervasyon başarıyla oluşturuldu.");
        return true;
    }

    // -----------------------------
    // REZERVASYON İPTAL
    // -----------------------------

    public boolean cancelReservation(int startHour) {

        int index = startHour - 9;

        // Sınır kontrolü
        if(index < 0 || index >= slots.length) {

            System.out.println(
                    "Saat 09:00 ile 23:00 arasında olmalıdır."
            );
            return false;
        }

        // Slot boş mu?
        if(slots[index] == null) {

            System.out.println(
                    "Bu saatte iptal edilecek rezervasyon yok!"
            );
            return false;
        }

        // Rezervasyonu al
        Reservation reservation = slots[index];

        // Stack'e kaydet
        canceledReservations.push(reservation);

        // Tüm slotlardan temizle
        for(int i = 0; i < slots.length; i++) {

            if(slots[i] == reservation) {

                slots[i] = null;
            }
        }

        System.out.println("Rezervasyon iptal edildi.");
        return true;
    }

    // -----------------------------
    // MÜSAİT SAATLERİ GÖSTER
    // -----------------------------

    public void showAvailableSlots() {

        System.out.println("\n=== MÜSAİT SAATLER ===");

        for(int i = 0; i < slots.length; i++) {

            int hour = i + 9;

            if(slots[i] == null) {

                System.out.println(hour + ":00 -> BOŞ");
            }
            else {

                System.out.println(hour + ":00 -> DOLU");
            }
        }
    }

    // -----------------------------
    // AKTİF REZERVASYONLAR
    // -----------------------------

    public void showReservations() {

        System.out.println("\n=== AKTİF REZERVASYONLAR ===");

        Reservation sonYazdirilan = null;
        boolean rezervasyonVarMi = false;

        for(int i = 0; i < slots.length; i++) {

            if(slots[i] != null) {

                rezervasyonVarMi = true;

                if(slots[i] != sonYazdirilan) {

                    int hour = i + 9;

                    System.out.println(
                            "Başlangıç "
                                    + hour
                                    + ":00 -> "
                                    + slots[i]
                    );

                    sonYazdirilan = slots[i];
                }
            }
        }

        if(!rezervasyonVarMi) {

            System.out.println(
                    "Aktif rezervasyon bulunmuyor."
            );
        }
    }

    // -----------------------------
    // İPTAL EDİLENLER
    // -----------------------------

    public void showCanceledReservations() {

        System.out.println(
                "\n=== İPTAL EDİLEN REZERVASYONLAR ==="
        );

        if(canceledReservations.isEmpty()) {

            System.out.println(
                    "İptal edilen rezervasyon yok."
            );
            return;
        }

        for(Reservation r : canceledReservations) {

            System.out.println(r);
        }
    }

    // -----------------------------
    // TOSTRING
    // -----------------------------

    @Override
    public String toString() {

        return tesisId + " | "
                + tesisAdi + " | "
                + tesisTuru + " | Kapasite: "
                + kapasite + " | Saatlik Ücret: "
                + ucretSaatlik + " TL | "
                + durum;
    }
}
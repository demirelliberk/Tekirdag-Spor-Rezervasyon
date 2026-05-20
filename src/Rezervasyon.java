public class Rezervasyon {

    private String rezervasyonId;
    private int tesisId;
    private String kullaniciId;
    private String kullaniciAdi;
    private String tarih;
    private String baslangicSaati;
    private String bitisSaati;
    private String durum;

    public Rezervasyon(String rezervasyonId, int tesisId, String kullaniciId, String kullaniciAdi, String tarih, String baslangicSaati, String bitisSaati, String durum) {
        this.rezervasyonId = rezervasyonId;
        this.tesisId = tesisId;
        this.kullaniciId = kullaniciId;
        this.kullaniciAdi = kullaniciAdi;
        this.tarih = tarih;
        this.baslangicSaati = baslangicSaati;
        this.bitisSaati = bitisSaati;
        this.durum = durum;
    }

    public String getRezervasyonId() {
        return rezervasyonId;
    }

    public int getTesisId() {
        return tesisId;
    }

    public String getKullaniciId() {
        return kullaniciId;
    }

    public String getKullaniciAdi() {
        return kullaniciAdi;
    }

    public String getTarih() {
        return tarih;
    }

    public String getBaslangicSaati() {
        return baslangicSaati;
    }

    public String getBitisSaati() {
        return bitisSaati;
    }

    public String getDurum() {
        return durum;
    }

    public void setDurum(String durum) {
        this.durum = durum;
    }

    @Override
    public String toString() {
        return "Rezervasyon ID: " + rezervasyonId + " | Tesis: " + tesisId + " | Kullanıcı: " + kullaniciAdi + " | Tarih: " + tarih + " " + baslangicSaati + " (" + durum + ")";
    }
}

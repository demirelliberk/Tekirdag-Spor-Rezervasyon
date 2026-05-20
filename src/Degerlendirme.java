public class Degerlendirme {

    private int degerlendirmeId;
    private int kullaniciId;
    private int kompleksId;
    private int puan;
    private String yorum;
    private String tarih;

    public Degerlendirme(int degerlendirmeId, int kullaniciId, int kompleksId, int puan, String yorum, String tarih) {
        this.degerlendirmeId = degerlendirmeId;
        this.kullaniciId = kullaniciId;
        this.kompleksId = kompleksId;
        this.puan = puan;
        this.yorum = yorum;
        this.tarih = tarih;
    }

    public int getDegerlendirmeId() {
        return degerlendirmeId;
    }

    public int getKullaniciId() {
        return kullaniciId;
    }

    public int getKompleksId() {
        return kompleksId;
    }

    public int getPuan() {
        return puan;
    }

    public String getYorum() {
        return yorum;
    }

    public String getTarih() {
        return tarih;
    }

    @Override
    public String toString() {
        return "Puan: " + puan + " | Yorum: " + yorum;
    }
}

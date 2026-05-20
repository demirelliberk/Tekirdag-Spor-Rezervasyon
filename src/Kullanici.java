public class Kullanici {

    private int kullaniciId;
    private String adSoyad;
    private String kullaniciAdi;
    private String sifre;
    private String rol;

    public Kullanici(int kullaniciId, String adSoyad, String kullaniciAdi, String sifre, String rol) {
        this.kullaniciId = kullaniciId;
        this.adSoyad = adSoyad;
        this.kullaniciAdi = kullaniciAdi;
        this.sifre = sifre;
        this.rol = rol;
    }

    public int getKullaniciId() {
        return kullaniciId;
    }

    public String getAdSoyad() {
        return adSoyad;
    }

    public String getKullaniciAdi() {
        return kullaniciAdi;
    }

    public String getSifre() {
        return sifre;
    }

    public String getRol() {
        return rol;
    }

    @Override
    public String toString() {
        return adSoyad + " (" + rol + ")";
    }
}

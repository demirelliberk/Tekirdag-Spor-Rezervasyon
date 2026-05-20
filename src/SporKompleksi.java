public class SporKompleksi {

    private int kompleksId;
    private String kompleksAdi;
    private String ilce;
    private String adres;
    private String acilisSaati;
    private String kapanisSaati;

    public SporKompleksi(int kompleksId, String kompleksAdi, String ilce, String adres, String acilisSaati, String kapanisSaati) {
        this.kompleksId = kompleksId;
        this.kompleksAdi = kompleksAdi;
        this.ilce = ilce;
        this.adres = adres;
        this.acilisSaati = acilisSaati;
        this.kapanisSaati = kapanisSaati;
    }

    public int getKompleksId() {
        return kompleksId;
    }

    public String getKompleksAdi() {
        return kompleksAdi;
    }

    public String getIlce() {
        return ilce;
    }

    public String getAdres() {
        return adres;
    }

    public String getAcilisSaati() {
        return acilisSaati;
    }

    public String getKapanisSaati() {
        return kapanisSaati;
    }

    @Override
    public String toString() {
        return kompleksAdi + " - " + ilce;
    }
}

import java.io.*;
import java.util.*;

public class CSVReader {

    // ------------------ TESİSLER ------------------
    public static ArrayList<Tesis> tesisleriOku() {
        ArrayList<Tesis> liste = new ArrayList<>();
        
        try {
            BufferedReader br = new BufferedReader(new FileReader("data/tesisler.csv"));
            String line;// okunan her satır burada tutulacak
            br.readLine(); // başlık satırlarını  atla

            while ((line = br.readLine()) != null) { //virgüllerle ayrılmış olan satırı parçalar("","") ve diziye atar
                String[] d = line.split(",");//CSV satırını virgüle göre bölerek d dizisine atar

                Tesis t = new Tesis(
                        Integer.parseInt(d[0]),
                        Integer.parseInt(d[1]),
                        d[2],
                        d[3],
                        Integer.parseInt(d[4]),
                        Double.parseDouble(d[5]),
                        d[6]
                        
                );

                liste.add(t);
            }

            br.close();
        } catch (Exception e) {
            e.printStackTrace();// hata hangi satırda, neden oluştu
        }

        return liste;
    }
/*CSV dosyasını aç

Satır satır oku
↓
Virgüle göre parçala
↓
Verileri uygun tipe çevir
↓
Nesne oluştur
↓
Listeye ekle
↓
Tüm listeyi döndür
*/
    // ------------------ KOMPLEKSLER ------------------
    public static ArrayList<SporKompleksi> kompleksleriOku() {
        ArrayList<SporKompleksi> liste = new ArrayList<>();

        try {
            BufferedReader br = new BufferedReader(new FileReader("data/kompleksler.csv"));
            String line;
            br.readLine();

            while ((line = br.readLine()) != null) {
                String[] d = line.split(",");

                SporKompleksi k = new SporKompleksi(
                        Integer.parseInt(d[0]),
                        d[1],
                        d[2],
                        d[3],
                        d[4],
                        d[5]
                );

                liste.add(k);
            }

            br.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return liste;
    }

    // ------------------ KULLANICILAR ------------------
    public static ArrayList<Kullanici> kullanicilariOku() {
        ArrayList<Kullanici> liste = new ArrayList<>();

        try {
            BufferedReader br = new BufferedReader(new FileReader("data/kullanicilar.csv"));
            String line;
            br.readLine();

            while ((line = br.readLine()) != null) {
                String[] d = line.split(",");

                Kullanici k = new Kullanici(
                        Integer.parseInt(d[0]),
                        d[1],
                        d[2],
                        d[3],
                        d[4]
                );

                liste.add(k);
            }

            br.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return liste;
    }

    // ------------------ REZERVASYONLAR ------------------
    public static ArrayList<Rezervasyon> rezervasyonlariOku() {
        ArrayList<Rezervasyon> liste = new ArrayList<>();
        ArrayList<Kullanici> kullanicilar = kullanicilariOku();

        try {
            BufferedReader br = new BufferedReader(new FileReader("data/rezervasyonlar.csv"));
            String line;
            br.readLine();

            while ((line = br.readLine()) != null) {
                String[] d = line.split(",");

                String kId = d[2];
                String cleanKId = kId.trim().replaceAll("^0+", "");
                String kAd = "Kullanıcı #" + kId;

                for (Kullanici k : kullanicilar) {
                    String compId = String.valueOf(k.getKullaniciId()).trim().replaceAll("^0+", "");
                    if (compId.equals(cleanKId)) {
                        kAd = k.getAdSoyad();
                        break;
                    }
                }

                Rezervasyon r = new Rezervasyon(
                        d[0],
                        Integer.parseInt(d[1]),
                        kId,
                        kAd,
                        d[3],
                        d[4],
                        d[5],
                        d[6]
                );

                liste.add(r);
            }

            br.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return liste;
    }

    // ------------------ DEĞERLENDİRMELER ------------------
    public static ArrayList<Degerlendirme> degerlendirmeleriOku() {
        ArrayList<Degerlendirme> liste = new ArrayList<>();

        try {
            BufferedReader br = new BufferedReader(new FileReader("data/degerlendirmeler.csv"));
            String line;
            br.readLine();

            while ((line = br.readLine()) != null) {
                String[] d = line.split(",");

                Degerlendirme dgr = new Degerlendirme(
                        Integer.parseInt(d[0]),
                        Integer.parseInt(d[1]),
                        Integer.parseInt(d[2]),
                        Integer.parseInt(d[3]),
                        d[4],
                        d[5]
                );

                liste.add(dgr);
            }

            br.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return liste;
    }
}

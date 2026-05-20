import java.util.ArrayList;

public class QueueTest {

    public static void main(String[] args) {

        ArrayList<Kullanici> kullanicilar = CSVReader.kullanicilariOku();

        BeklemeKuyrugu<Kullanici> kuyruk = new BeklemeKuyrugu<>();

        for (Kullanici k : kullanicilar) {
            kuyruk.enqueue(k);
        }

        System.out.println("\nBekleme Kuyruğu:");
        kuyruk.listele();

        Kullanici siradaki = kuyruk.peek();

        if (siradaki != null) {
            System.out.println("\nİlk sıradaki kişi: " + siradaki.getAdSoyad());
        }

        Kullanici cikan = kuyruk.dequeue();

        if (cikan != null) {
            System.out.println("\nKuyruktan çıkan kişi: " + cikan.getAdSoyad());
        }

        System.out.println("\nGüncel Kuyruk:");
        kuyruk.listele();
    }
}

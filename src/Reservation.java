// Reservation classı
// Bir rezervasyonun bilgilerini tutar

public class Reservation {

    // Rezervasyonu yapan kişinin adı
    private final String customerName;

    // Başlangıç saati
    private final int startHour;

    // Bitiş saati
    private final int endHour;

    // Yapıcı method oluşturdum ve nesne oluşturulduğu an onun ismi ile giriş ve çıkış saatleri alınıyor.
    public Reservation(String customerName, int startHour, int endHour) {

        this.customerName = customerName;
        this.startHour = startHour;
        this.endHour = endHour;
    }

    // Getter metodları

    public String getCustomerName() {
        return customerName;
    }

    public int getStartHour() {
        return startHour;
    }

    public int getEndHour() {
        return endHour;
    }

    // Rezervasyon bilgisini yazdırmak için fonksiyon yarattım ve üst sınıftan override ile miras aldım.
    @Override
    public String toString() {

        return customerName + " | " +
               startHour + ":00 - " +
               endHour + ":00";
    }
}

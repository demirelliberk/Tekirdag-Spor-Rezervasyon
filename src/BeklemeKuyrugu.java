public class BeklemeKuyrugu<T> {
    private Node<T> front;
    private Node<T> rear;

    public BeklemeKuyrugu() {
        front = null;//front kuyruğun başı
        rear = null;//rear kuyruğun sonu yeni gelen kişi buraya eklenir
      }
    public boolean isEmpty() {
    return front == null;
  } //kuyruk boş mu kontrolü
  public void enqueue(T data) {

    Node<T> yeniNode = new Node<>(data);

    if (isEmpty()) {
        front = yeniNode;
        rear = yeniNode;
    } else {
        rear.next = yeniNode;
        rear = yeniNode;
    }

    System.out.println(data + " bekleme kuyruğuna eklendi.");
  }
  public T dequeue() {

    if (isEmpty()) {
        return null;
    } //eğer kuyruk boşsa çıkarma yapılmaz

    T cikan = front.data;

    front = front.next; //frontu ilerletiyoruz

    if (front == null) {
        rear = null;
    }

    return cikan;
  }
  public T peek() {
    if (isEmpty()) {
        return null;
    }//kuyruğun başını gösterir ama çıkarmadan kuyruk değişmez

    return front.data;
  }
  public void listele() {

    if (isEmpty()) {
        System.out.println("Bekleme kuyruğu boş.");
        return;
    }

    Node<T> current = front;

    int sira = 1;

    while (current != null) { //geçiçi gezen node olduğu sürece devam et

        System.out.println(sira + ". " + current.data);

        current = current.next; //bir sonraki kşiye geçme sağlanır
        sira++;
    }
  }
}
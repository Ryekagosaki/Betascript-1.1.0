class Anjing {
  public constructor(nama: tulisan) {
    (this.nama = nama);
  }
  public bersuara() {
    return "Guk guk!";
  }
}
let anjing = new Anjing("Buddy");
teriak(anjing.bersuara());

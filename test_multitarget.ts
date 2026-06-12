class Anjing {
  constructor(nama: tulisan) {
    (this.nama = nama);
  }
  bersuara() {
    return "Guk guk!";
  }
}
let anjing = new Anjing("Buddy");
teriak(anjing.bersuara());

package com.betascript

class Anjing {
  fun constructor(nama: tulisan): Unit {
    (this.nama = nama)
  }
  fun bersuara(): Unit {
    return "Guk guk!"
  }
}
val anjing: Any = new Anjing("Buddy")
teriak(anjing.bersuara())

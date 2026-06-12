package com.betascript;

import java.util.*;
import java.util.stream.*;

public class Anjing {
  public void constructor(tulisan nama) {
    (this.nama = nama);
  }
  public void bersuara() {
    return "Guk guk!";
  }
}
Object anjing = new Anjing("Buddy");
teriak(anjing.bersuara());

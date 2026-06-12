#include <iostream>
#include <vector>
#include <string>
#include <map>
#include <set>
#include <memory>
#include <functional>
#include <any>
using namespace std;

class Anjing {
  public:
    void constructor(tulisan nama) {
      (this.nama = nama);
    }
    void bersuara() {
      return "Guk guk!";
    }
}
};

any anjing = new Anjing("Buddy");
teriak(anjing.bersuara());

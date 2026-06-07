# BetaScript

**Bahasa pemrograman berbasis Betawi - Ngoding rasa Betawi, kagak ribet!**

BetaScript adalah bahasa pemrograman yang menggunakan bahasa Betawi sebagai sintaks utama. Dibuat untuk memudakan nyari yang baru belajar ngoding, dengan gaya bahasa yang lebih akrab buat yang ora gugur Jawa.

## 📖 Introduksi

BetaScript lahir dari ide buat bikin bahasa pemrograman yang pakai istilah Sunda/Betawi supaya lebih gampang dimengerti. Contoh:
- `teriak` buat print/console.log
- `bikin` buat function
- `cetakan` buat class
- `kalo` buat if, `kalo_kagak` buat else

Bahasa ini otomatis ditranspil ke JavaScript, jadi bisa dipake di mana aja JavaScript jalan.

## ⌨️ Sintaks Utama (Keywords Mapping)

| BetaScript | JavaScript | Penjelasan |
|------------|------------|------------|
| `ane` | `let` | Deklarasi variabel |
| `tetap` | `const` | Variabel tetap/tidak berubah |
| `teriak(...)` | `console.log(...)` | Mencetak output |
| `bikin` | `function` | Deklarasi fungsi |
| `asinkron bikin` | `async function` | Fungsi asinkron |
| `balikin` | `return` | Mengembalikan nilai |
| `kalo` | `if` | Kondisi if |
| `kalo_kagak` | `else` | Kondisi else |
| `kagaknya` | `else if` | Kondisi else if |
| `selama` | `while` | Loop while |
| `itungan` | `for` | Loop for |
| `coba` | `try` | Try block |
| `tangkep` | `catch` | Catch block |
| `pilih` | `switch` | Switch statement |
| `kalau_gitu` | `case` | Case dalam switch |
| `udahan` | `break` | Break dari switch/loop |
| `lanjut` | `continue` | Lanjut ke iterasi berikutnya |
| `cetakan` | `class` | Deklarasi kelas |
| `warisan` | `extends` | Pewarisan kelas |
| `panggil` | - | Memanggil method/fungsi |
| `atas` | `super` | Referensi ke parent class |
| `ini` | `this` | Referensi instance |
| `impor` | `import` | Mengimpor modul |
| `ekspor` | `export` | Mengekspor modul |
| `bener` | `true` | Nilai boolean true |
| `kagak` | `false` | Nilai boolean false |
| `kosong` | `void` | Tipe yang kosong/tidak ada return |
| `tunggu` | `await` | Menunggu promise |
| `kata` | `string` | Tipe teks |
| `angka` | `number` | Tipe angka |

## 📦 Cara Install

### Acode Android (Global via GitHub Release)

Cara paling enak adalah pakai Plugin Source URL Acode:

```text
https://raw.githubusercontent.com/Ryekagosaki/Betascript-Acode/main/acode-plugin-source.json
```

Langkahnya:

1. Buka Acode.
2. Masuk ke menu plugin/extension.
3. Buka pengaturan plugin source/repository source.
4. Tambahkan URL di atas.
5. Refresh daftar plugin.
6. Install `BetaScript`.
7. Restart Acode.
8. Buat file `test.beta`.

Kalau Plugin Source URL belum tersedia di versi Acode kamu, pakai cara ZIP manual di bawah.

Plugin Acode BetaScript sudah tersedia sebagai ZIP publik di GitHub Release:

```text
https://github.com/Ryekagosaki/Betascript-Acode/releases/download/v1.0.1/betascript-acode-1.0.1.zip
```

Cara install di Acode:

1. Download file `betascript-acode-1.0.1.zip` dari link di atas.
2. Buka Acode di HP.
3. Masuk ke menu plugin/extension.
4. Pilih install plugin dari file ZIP lokal.
5. Pilih `betascript-acode-1.0.1.zip`.
6. Restart Acode.
7. Buat file baru, misalnya `test.beta`.

Setelah plugin aktif, file berakhiran `.beta` akan dikenali sebagai file BetaScript dan akan diberi logo BetaScript di Acode file explorer. Kalau logo belum muncul, tutup dan buka ulang folder project atau restart Acode sekali lagi.

### Terminal (Linux/macOS/Windows)

```bash
# Clone repository
git clone https://github.com/USERNAME/betascript.git
cd betascript

# Install dependencies
npm install

# Build
npm run build

# Install globally (optional)
npm install -g .
```

### Termux (Android)

```bash
# Jalankan script setup
bash scripts/termux-setup.sh

# Atau manual:
pkg install nodejs-lts
npm install -g .
```

### VS Code

1. Buka VS Code
2. Pergi ke Extensions (Ctrl+Shift+X)
3. Gunakan repo extension terpisah: https://github.com/Ryekagosaki/Betascript-VSCode
4. Ikuti instruksi install/package di repo extension tersebut
5. Restart VS Code

Atau install manual:
```bash
git clone https://github.com/Ryekagosaki/Betascript-VSCode.git
cd Betascript-VSCode
npm install
npm run compile
```

### Web

Buka file `web-ide/index.html` di browser, atau:

```bash
# Jika ada server lokal
npm run dev
# Buka http://localhost:3000
```

## 💻 Contoh Kode

### Hello World
```betascript
teriak("Hai dunia!");
teriak("Ngoding rasa Betawi, kagak ribet!");

ane nama = "BetaScript";
teriak(nama);
```

### Fibonacci
```betascript
bikin fibonacci(n: angka): angka {
  kalo (n <= 1) {
    balikin n;
  }
  balikin fibonacci(n - 1) + fibonacci(n - 2);
}

ane hasil = fibonacci(10);
teriak("Fibonacci(10) =", hasil);
```

### Async/Await
```betascript
asinkron bikin ambil_data() {
  teriak("Sabar ya, ambil data...");
  kosong
}

asinkron bikin main() {
  teriak("Mulai");
  tunggu ambil_data();
  teriak("Selesai");
}

main();
```

### OOP (Object Oriented Programming)
```betascript
cetakan Binatang {
  tetap nama = "";
  
  bikin baru(nama: kata) {
    ini.nama = nama;
  }
  
  suara() {
    teriak("Suara binatang");
  }
}

cetakan Kucing warisan Binatang {
  bikin baru(nama: kata) {
    panggil atas.bikin baru(nama);
  }
  
  suara() {
    teriak("Miaw miaw!");
  }
}

ane kucing = baru Kucing("Kitty");
kucing.suara();
teriak(kucing.nama);
```

## ✨ Fitur-fitur Utama

- **Sintaks Bahasa Betawi**: Lebih gampang dimengerti buat pemula
- **Transpiler ke JavaScript**: Bisa jalan di Node.js, browser, atau mana aja JS jalan
- **Dukungan OOP**: Class, inheritance, method, constructor
- **Async/Await**: Dukungan programming asynchronous
- **Type Annotations**: Dukungan tipe data dasar (kata, angka, dll)
- **Extension VS Code**: Syntax highlighting, snippets, autocomplete
- **Web IDE**: Bisa ditulis langsung di browser
- **CLI Tool**: Jalankan langsung dari terminal

## 🛣️ Roadmap

- [x] Lexer dan Parser dasar
- [x] Transpiler ke JavaScript
- [x] Dukungan fungsi dan variabel
- [x] OOP (Class, Inheritance)
- [x] Async/Await
- [x] Extension VS Code
- [x] Web IDE
- [x] CLI Tool
- [ ] Package Manager khusus BetaScript
- [ ] Standard Library lebih lengkap (Array, String methods)
- [ ] Debugger terintegrasi
- [ ] Tutorial interaktif di web
- [ ] Dokumentasi lebih detail
- [ ] Mobile app untuk belajar
- [ ] Community packages ecosystem

## 🤝 Kontribusi

BetaScript open source dan terbuka buat kontribusi! Buka issue atau pull request di GitHub.

## 📄 Lisensi

MIT License - Bebas pakai, dimodifikasi, dan didistribusikan.
Copyright (c) 2024 BetaScript

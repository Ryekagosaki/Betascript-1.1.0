# BetaScript Acode Global Install

BetaScript bisa dipakai secara global di Acode lewat **Plugin Source URL** dari GitHub. Dengan cara ini pengguna tidak perlu download ZIP manual. Pengguna cukup menambahkan source URL ke Acode, refresh daftar plugin, lalu install BetaScript.

## Plugin Source URL

```text
https://raw.githubusercontent.com/Ryekagosaki/Betascript-Acode/main/acode-plugin-source.json
```

## Cara Pakai di Acode

1. Buka Acode.
2. Masuk ke menu plugin atau extension.
3. Buka menu plugin source, repository source, atau custom source.
4. Tambahkan URL ini:

```text
https://raw.githubusercontent.com/Ryekagosaki/Betascript-Acode/main/acode-plugin-source.json
```

5. Refresh daftar plugin.
6. Install plugin `BetaScript`.
7. Restart Acode.
8. Buat file baru bernama `test.beta`.

Setelah plugin aktif, file `.beta` akan dikenali sebagai BetaScript dan logo BetaScript akan muncul di file explorer Acode.

## Link ZIP Manual

Kalau versi Acode pengguna belum punya menu plugin source/custom source, gunakan ZIP manual dari GitHub Release:

```text
https://github.com/Ryekagosaki/Betascript-Acode/releases/download/v1.0.1/betascript-acode-1.0.1.zip
```

## Catatan Penting

Acode tetap perlu memuat plugin minimal sekali. GitHub hanya menjadi host global untuk source dan file plugin. Agar pengguna bisa menemukan BetaScript langsung di daftar plugin bawaan Acode tanpa menambahkan source URL, plugin harus disubmit ke official Acode plugin store.

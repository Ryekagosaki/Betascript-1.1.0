# BetaScript 2.0 - Polyglot Transpiler & IDE Toolkit

## Updated Architecture

```
file.beta
│
▼
┌─────────────────────┐
│  Lexer Betawi       │ ← Tokenisasi semua keyword Betawi (ane, tetep, antarmuka, tipe, paket, generik, dekorator, tampilan, gaya, uji, dll.)
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│  Parser Betawi      │ ← Hasilkan AST Terpadu
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│  Semantic Analyzer  │ ← Validasi semantik, builtins, scope
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│  Type Checker       │ ← Cek tipe (opsional, wajib untuk TS target)
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│  IR Generator       │ ← Intermediate Representation target-agnostic
└─────────┬───────────┘
          ▼
┌─────────────────────────────────────────────┐
│  Code Generator (pilih via --target)        │
├────┬────┬─────┬─────┬────┬─────┬──────┬────┤
│ JS │ TS │ JSX │ TSX │ Py │ C++ │ Java │ KT │
└────┴────┴─────┴─────┴────┴─────┬──────┬────┘
          │
          ▼
   Output file sesuai target
```

## ✅ Fitur yang Sudah Diimplementasikan

### 1. Modular Compiler Pipeline
- **Lexer Betawi Universal** — Tokenisasi keyword Betawi lengkap
- **Parser Betawi** — AST terpadu untuk semua target
- **Semantic Analyzer** — Validasi scope, builtins, break/continue
- **Type Checker** — Type checking opsional dengan IR type system
- **IR Generator** — Intermediate Representation target-agnostic
- **Code Generator** — Base class + 8 generator target

### 2. Standard Library Abstraction (target-agnostic)
Semua module standar sudah menerapkan pola abstraksi layer:

| Modul | JavaScript | Python | C++ | Java | Kotlin |
|-------|-----------|--------|-----|------|--------|
| `deret` | `Array` | `list` | `std::vector` | `ArrayList` | `List` |
| `http` | `fetch` | `requests` | `cpp-httplib` | `HttpClient` | `OkHttp` |
| `file` | `fs` | `os`/`pathlib` | `std::fstream` | `java.nio` | `java.io` |
| `basis_data` | ORM/QueryBuilder | `sqlite3` | `sqlite3.h` | `DriverManager` | `JDBC` |
| `otentikasi` | JWT lib | `jwt`/`hashlib` | `OpenSSL` | `javax.crypto` | `java.security` |
| `tampilan` | Native DOM | — | — | — | `Jetpack Compose` |
| `gaya` | CSS-in-JS | — | — | — | Compose styling |

### 3. 8 Target Language Generators
- **JavaScript** — Runtime helpers + built-in modules
- **TypeScript** — Type annotation preservation
- **JSX / TSX** — React component emission
- **Python** — Pythonic syntax with `def`, `class`, `self`
- **C++** — `std::` libraries, class, `public:`/`private:`
- **Java** — Package, `public class`, imports
- **Kotlin** — `val`/`var`, nullable types, package

### 4. Ujian Testing Framework
Built-in unit testing dengan keyword:
- `uji(nama_test)` — Test case
- `harapkan(ekspresi)` — Assertion
- `sebelum { ... }` — Setup
- `sesudah { ... }` — Teardown

### 5. Template Engine
- `tampilan` — HTML template parsing & compilation
- `gaya` — CSS parsing & compilation
- Interpolation `<?= expr ?>` untuk dynamic content

### 6. Plugin System
Hook-based plugin architecture:
- `beforeParse(source)` — Transform source sebelum parsing
- `afterParse(ast)` — Transform AST setelah parsing
- `beforeEmit(ir)` — Transform IR sebelum codegen
- `afterEmit(code, target)` — Post-process output

### 7. Source Map Generator
VLQ-encoded source maps untuk mapping error output ke source `.beta`

### 8. Improved CLI
```bash
betascript compile file.beta --target=ts --mode=full
betascript run file.beta --target=py --watch
betascript repl
betascript format file.beta
betascript lint file.beta
```

### 9. Keyword Baru yang Didukung
| Keyword | Equivalent | Ket |
|---------|-----------|-----|
| `tampilan` | HTML template / View | UI abstraction |
| `gaya` | CSS / Styling | Styling abstraction |
| `antarmuka` | `interface` | TS/Java/Kotlin |
| `tipe` | `type alias` | Type system |
| `abstrak` | `abstract` | OOP |
| `implementasi` | `implements` | OOP |
| `paket` | `package` | Namespace |
| `enumerasi` | `enum` | Enum type |
| `generik` | `generic` | Type parameter |
| `dekorator` | `@decorator` | Annotation |
| `pribadi` | `private` | Visibility |
| `publik` | `public` | Visibility |
| `terlindungi` | `protected` | Visibility |
| `statik` | `static` | Class member |
| `komponen` | Component | JSX/TSX |
| `render` | render() | UI |
| `state` | state management | UI |
| `efek` | side effect | UI |
| `uji` | test case | Testing |
| `harapkan` | assert/expect | Testing |
| `sebelum` | setup | Testing |
| `sesudah` | teardown | Testing |
| `impor` | `import` | Module |
| `ekspor` | `export` | Module |

### 10. New AST & IR Nodes for Multi-Language Features
- Package/namespace declarations
- Generic type parameters
- Decorators/annotations
- Visibility modifiers (private/public/protected)
- Interface declarations
- Type alias declarations
- Enum declarations
- Component declarations for JSX/TSX

## 📁 Struktur Direktori

```
src/
├── lexer/           # Universal Betawi Lexer
├── parser/          # Betawi Parser → AST
├── analyzer/        # Semantic Analyzer
├── typechecker/     # Type Checker opsional
├── ir/              # IR (Intermediate Representation)
├── codegen/         # Code Generator per target
│   ├── CodeGenerator.ts
│   ├── JavaScriptGenerator.ts
│   ├── TypeScriptGenerator.ts
│   ├── TSXGenerator.ts
│   ├── JSXGenerator.ts
│   ├── PythonGenerator.ts
│   ├── CppGenerator.ts
│   ├── JavaGenerator.ts
│   └── KotlinGenerator.ts
├── stdlib/          # Standard Library Abstraction
│   └── StdLib.ts
├── runtime/         # Runtime & Ujian Framework
│   └── UjianFramework.ts
├── template/        # HTML/CSS Template Engine
├── plugin/          # Plugin System
├── sourcemap/       # Source Map Generator
├── lsp/             # Language Server Protocol (framework siap)
├── bundler/         # Bundler (framework siap)
├── formatter/       # Formatter (framework siap)
├── docs/            # Doc generator (framework siap)
└── cli.ts           # Command-line interface
```

## 🚀 Contoh Penggunaan

### Compile ke berbagai target
```bash
# JavaScript
betascript compile app.beta --target=js

# TypeScript
betascript compile app.beta --target=ts

# Python
betascript compile app.beta --target=py

# Kotlin (Android)
betascript compile app.beta --target=kt

# C++
betascript compile app.beta --target=cpp
```

### Contoh kode BetaScript 2.0
```betascript
paket aplikasi.saya

antarmuka Hewan {
  bersuara(): tulisan
}

abstrak cetak Binatang {
  properti nama: tulisan
  
  abstrak bersuara(): tulisan
}

cetak Anjing turun Binatang {
  mula(nama: tulisan) {
    ini.nama = nama
  }
  
  bersuara(): tulisan {
    balikin "Guk guk!"
  }
}

impor { file, http } dari "standar"

ane anjing = anyar Anjing("Buddy")
teriak(anjing.bersuara())

// HTML Template (tampilan)
tampilan halaman_utama {
  div {
    h1 { "Selamat Datang" }
    p { teks_sapaan }
  }
}

// CSS (gaya)
gaya tombol {
  latar: merah;
  tulisan_putih: benar;
  radius: 8;
}

// Unit Test (ujian)
sebelum {
  bersihkan_database()
}

uji "test_tambah_angka" {
  harapkan 1 + 1 == 2
}

sesudah {
  tutup_koneksi()
}
```

## ⚡ Build & Test

```bash
npm run build    # Compile TypeScript → dist/
npm test         # Run all tests (59 passing)
```

## 📦 Dependencies
- `commander` — CLI framework
- `chalk` — Terminal styling

## 🔧 Roadmap Lanjutan
- [x] Core compiler architecture
- [x] 8 target generators
- [x] Standard library abstraction
- [x] Template engine (HTML/CSS)
- [x] Testing framework
- [ ] LSP server (autocompletion, hover, diagnostics)
- [ ] BetaScript Playground Web
- [ ] Package Registry (`beta-registry`)
- [ ] Bundler (`betascript bundel`)
- [ ] Auto-documentation generator (`betascript docs`)


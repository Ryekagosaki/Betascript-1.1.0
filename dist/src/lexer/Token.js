"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    // Literals
    TokenType["NUMBER"] = "NUMBER";
    TokenType["STRING"] = "STRING";
    TokenType["TEMPLATE"] = "TEMPLATE";
    TokenType["REGEX"] = "REGEX";
    TokenType["IDENTIFIER"] = "IDENTIFIER";
    // Keywords - Modern Betawi
    TokenType["ANE"] = "ane";
    TokenType["TETEP"] = "tetep";
    TokenType["BETOEL"] = "betoel";
    TokenType["KAGA"] = "kaga";
    TokenType["KOSONG"] = "kosong";
    TokenType["ANGKA"] = "angka";
    TokenType["KATA"] = "kata";
    TokenType["ENTE"] = "ente";
    TokenType["ENTAH"] = "entah";
    // Control flow
    TokenType["KALO"] = "kalo";
    TokenType["KAGAKNYE"] = "kagaknye";
    TokenType["UDAH_GITUH"] = "udah_gituh";
    TokenType["SELAGI"] = "selagi";
    TokenType["KERJAIN"] = "kerjain";
    TokenType["ITUNG"] = "itung";
    TokenType["SABAN"] = "saban";
    TokenType["DAH"] = "dah";
    TokenType["LANJUT"] = "lanjut";
    TokenType["PILIH"] = "pilih";
    TokenType["KALO_GINI"] = "kalo_gini";
    TokenType["BODO_AMAT"] = "bodo_amat";
    // Functions
    TokenType["BIKIN"] = "bikin";
    TokenType["NANTI"] = "nanti";
    TokenType["KASOH"] = "kasoh";
    TokenType["SABUT"] = "sabut";
    // OOP
    TokenType["CETAK"] = "cetak";
    TokenType["TURUN"] = "turun";
    TokenType["IKUT"] = "ikut";
    TokenType["MULA"] = "mula";
    TokenType["KONSTRUKTOR"] = "konstruktor";
    TokenType["GUA"] = "gua";
    TokenType["PUNYE"] = "punye";
    TokenType["BABANG"] = "babang";
    TokenType["ANYAR"] = "anyar";
    TokenType["DIEM"] = "diem";
    TokenType["STATIK"] = "statik";
    // Error handling
    TokenType["COBA"] = "cobi";
    TokenType["TANGKEP"] = "tangkep";
    TokenType["AKHIRNYE"] = "akhirnye";
    TokenType["LEMPAR"] = "lempar";
    // Modules
    TokenType["AMBIL"] = "ambil";
    TokenType["DARI"] = "dari";
    // I/O Utility
    TokenType["TERIAK"] = "teriak";
    TokenType["BISIK"] = "bisik";
    TokenType["DENGERIN"] = "dengerin";
    TokenType["SEBRAPA"] = "sebrapa";
    TokenType["APE"] = "ape";
    TokenType["ITUNGAN"] = "itungan";
    TokenType["OMONGAN"] = "omongan";
    TokenType["KUMPULIN"] = "kumpulin";
    TokenType["ACAK"] = "acak";
    TokenType["TIDUR"] = "tidur";
    // Interface & type system
    TokenType["ANTARMUKA"] = "antarmuka";
    TokenType["TIPE"] = "tipe";
    TokenType["ABSTRAK"] = "abstrak";
    TokenType["IMPLEMENTASI"] = "implementasi";
    TokenType["PAKET"] = "paket";
    TokenType["ENUMERASI"] = "enumerasi";
    TokenType["GENERIK"] = "generic";
    TokenType["DEKORATOR"] = "dekorator";
    TokenType["PROPERTI"] = "properti";
    TokenType["DAPATKAN"] = "dapatkan";
    TokenType["ATUR"] = "atur";
    TokenType["PRIBADI"] = "pribadi";
    TokenType["TERLINDUNGI"] = "terlindungi";
    TokenType["PUBLIK"] = "publik";
    TokenType["CAMPUR"] = "campur";
    TokenType["PROTOKOL"] = "protocol";
    TokenType["KOLEKSI"] = "koleksi";
    TokenType["OPSIONAL"] = "opsional";
    TokenType["GABUNGAN"] = "gabungan";
    TokenType["POTONGAN"] = "potongan";
    TokenType["FUNGSI_PANAH"] = "=>";
    TokenType["KOMPONEN"] = "komponen";
    TokenType["RENDER"] = "render";
    TokenType["STATE"] = "state";
    TokenType["EFEK"] = "efek";
    TokenType["RUTE"] = "rute";
    TokenType["MODEL"] = "model";
    TokenType["KONTROLER"] = "kontroler";
    TokenType["TAMPILAN"] = "tampilan";
    TokenType["GAYA"] = "gaya";
    TokenType["IMPOR"] = "impor";
    TokenType["EKSPOR"] = "ekspor";
    // Testing
    TokenType["UJI"] = "uji";
    TokenType["HARAPKAN"] = "harapkan";
    TokenType["SEBELUM"] = "sebelum";
    TokenType["SESUDAH"] = "sesudah";
    // Standard library
    TokenType["FILE"] = "file";
    TokenType["HTTP"] = "http";
    TokenType["BASIS_DATA"] = "basis_data";
    TokenType["OTENTIKASI"] = "otentikasi";
    TokenType["DERET"] = "deret";
    // Operators
    TokenType["PLUS"] = "+";
    TokenType["MINUS"] = "-";
    TokenType["TIMES"] = "*";
    TokenType["DIVIDE"] = "/";
    TokenType["MODULO"] = "%";
    TokenType["POWER"] = "**";
    TokenType["EQUAL"] = "=";
    TokenType["PLUS_ASSIGN"] = "+=";
    TokenType["MINUS_ASSIGN"] = "-=";
    TokenType["TIMES_ASSIGN"] = "*=";
    TokenType["DIVIDE_ASSIGN"] = "/=";
    TokenType["EQUAL_EQUAL"] = "==";
    TokenType["NOT_EQUAL"] = "!=";
    TokenType["STRICT_EQUAL"] = "===";
    TokenType["STRICT_NOT_EQUAL"] = "!==";
    TokenType["LESS"] = "<";
    TokenType["GREATER"] = ">";
    TokenType["LESS_EQUAL"] = "<=";
    TokenType["GREATER_EQUAL"] = ">=";
    TokenType["AND"] = "&&";
    TokenType["OR"] = "||";
    TokenType["NULLISH"] = "??";
    TokenType["NOT"] = "!";
    TokenType["INCREMENT"] = "++";
    TokenType["DECREMENT"] = "--";
    TokenType["SPREAD"] = "...";
    // Delimiters & punctuations
    TokenType["SEMICOLON"] = ";";
    TokenType["DOT"] = ".";
    TokenType["QUESTION_DOT"] = "?.";
    TokenType["COMMA"] = ",";
    TokenType["COLON"] = ":";
    TokenType["QUESTION"] = "?";
    TokenType["ARROW"] = "=>";
    TokenType["LEFT_PAREN"] = "(";
    TokenType["RIGHT_PAREN"] = ")";
    TokenType["LEFT_BRACE"] = "{";
    TokenType["RIGHT_BRACE"] = "}";
    TokenType["LEFT_BRACKET"] = "[";
    TokenType["RIGHT_BRACKET"] = "]";
    // End of file
    TokenType["EOF"] = "EOF";
})(TokenType || (exports.TokenType = TokenType = {}));
//# sourceMappingURL=Token.js.map
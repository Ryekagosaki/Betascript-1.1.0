import { Position } from "../utils/Position";

export enum TokenType {
  // Literals
  NUMBER = "NUMBER",
  STRING = "STRING",
  TEMPLATE = "TEMPLATE",
  REGEX = "REGEX",
  IDENTIFIER = "IDENTIFIER",

  // Keywords - Modern Betawi
  ANE = "ane",
  TETEP = "tetep",
  BETOEL = "betoel",
  KAGA = "kaga",
  KOSONG = "kosong",
  ANGKA = "angka",
  KATA = "kata",
  ENTE = "ente",
  ENTAH = "entah",

  // Control flow
  KALO = "kalo",
  KAGAKNYE = "kagaknye",
  UDAH_GITUH = "udah_gituh",
  SELAGI = "selagi",
  KERJAIN = "kerjain",
  ITUNG = "itung",
  SABAN = "saban",
  DAH = "dah",
  LANJUT = "lanjut",
  PILIH = "pilih",
  KALO_GINI = "kalo_gini",
  BODO_AMAT = "bodo_amat",

  // Functions
  BIKIN = "bikin",
  NANTI = "nanti",
  KASOH = "kasoh",
  SABUT = "sabut",

  // OOP
  CETAK = "cetak",
  TURUN = "turun",
  IKUT = "ikut",
  MULA = "mula",
  KONSTRUKTOR = "konstruktor",
  GUA = "gua",
  PUNYE = "punye",
  BABANG = "babang",
  ANYAR = "anyar",
  DIEM = "diem",
  STATIK = "statik",

  // Error handling
  COBA = "cobi",
  TANGKEP = "tangkep",
  AKHIRNYE = "akhirnye",
  LEMPAR = "lempar",

  // Modules
  AMBIL = "ambil",
  DARI = "dari",

  // I/O Utility
  TERIAK = "teriak",
  BISIK = "bisik",
  DENGERIN = "dengerin",
  SEBRAPA = "sebrapa",
  APE = "ape",
  ITUNGAN = "itungan",
  OMONGAN = "omongan",
  KUMPULIN = "kumpulin",
  ACAK = "acak",
  TIDUR = "tidur",

  // Interface & type system
  ANTARMUKA = "antarmuka",
  TIPE = "tipe",
  ABSTRAK = "abstrak",
  IMPLEMENTASI = "implementasi",
  PAKET = "paket",
  ENUMERASI = "enumerasi",
  GENERIK = "generic",
  DEKORATOR = "dekorator",
  PROPERTI = "properti",
  DAPATKAN = "dapatkan",
  ATUR = "atur",
  PRIBADI = "pribadi",
  TERLINDUNGI = "terlindungi",
  PUBLIK = "publik",
  CAMPUR = "campur",
  PROTOKOL = "protocol",
  KOLEKSI = "koleksi",
  OPSIONAL = "opsional",
  GABUNGAN = "gabungan",
  POTONGAN = "potongan",
  FUNGSI_PANAH = "=>",
  KOMPONEN = "komponen",
  RENDER = "render",
  STATE = "state",
  EFEK = "efek",
  RUTE = "rute",
  MODEL = "model",
  KONTROLER = "kontroler",
  TAMPILAN = "tampilan",
  GAYA = "gaya",
  IMPOR = "impor",
  EKSPOR = "ekspor",

  // Testing
  UJI = "uji",
  HARAPKAN = "harapkan",
  SEBELUM = "sebelum",
  SESUDAH = "sesudah",

  // Standard library
  FILE = "file",
  HTTP = "http",
  BASIS_DATA = "basis_data",
  OTENTIKASI = "otentikasi",
  DERET = "deret",

  // Operators
  PLUS = "+",
  MINUS = "-",
  TIMES = "*",
  DIVIDE = "/",
  MODULO = "%",
  POWER = "**",

  EQUAL = "=",
  PLUS_ASSIGN = "+=",
  MINUS_ASSIGN = "-=",
  TIMES_ASSIGN = "*=",
  DIVIDE_ASSIGN = "/=",

  EQUAL_EQUAL = "==",
  NOT_EQUAL = "!=",
  STRICT_EQUAL = "===",
  STRICT_NOT_EQUAL = "!==",

  LESS = "<",
  GREATER = ">",
  LESS_EQUAL = "<=",
  GREATER_EQUAL = ">=",

  AND = "&&",
  OR = "||",
  NULLISH = "??",

  NOT = "!",
  INCREMENT = "++",
  DECREMENT = "--",
  SPREAD = "...",

  // Delimiters & punctuations
  SEMICOLON = ";",
  DOT = ".",
  QUESTION_DOT = "?.",
  COMMA = ",",
  COLON = ":",
  QUESTION = "?",
  ARROW = "=>",

  LEFT_PAREN = "(",
  RIGHT_PAREN = ")",
  LEFT_BRACE = "{",
  RIGHT_BRACE = "}",
  LEFT_BRACKET = "[",
  RIGHT_BRACKET = "]",

  // End of file
  EOF = "EOF"
}

export interface Token {
  type: TokenType;
  value: string;
  position: Position;
}

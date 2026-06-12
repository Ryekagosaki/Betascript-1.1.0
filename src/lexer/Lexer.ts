import { Token, TokenType } from "./Token";
import { Position } from "../utils/Position";
import { BetaError } from "../utils/BetaError";

export class Lexer {
  private position: Position = new Position();
  private tokens: Token[] = [];
  private start = 0;

  constructor(private readonly source: string) {}

  tokenize(): Token[] {
    this.tokens = [];
    this.position = new Position();
    this.start = 0;
    
    while (this.start < this.source.length) {
      this.skipWhitespace();
      if (this.start >= this.source.length) {
        break;
      }
      this.scanToken();
    }
    this.tokens.push({ type: TokenType.EOF, value: "EOF", position: this.position });
    return this.tokens;
  }

  private skipWhitespace(): void {
    while (this.start < this.source.length) {
      const char = this.source[this.start];
      if (char === " " || char === "\t" || char === "\r") {
        this.start++;
        this.position = this.position.advance();
      } else if (char === "\n") {
        this.start++;
        this.position = this.position.newline();
      } else if (char === "/" && this.source[this.start + 1] === "/") {
        this.start += 2;
        while (this.start < this.source.length && this.source[this.start] !== "\n") {
          this.start++;
          this.position = this.position.advance();
        }
      } else if (char === "/" && this.source[this.start + 1] === "*") {
        this.start += 2;
        this.position = this.position.advance();
        this.position = this.position.advance();
        while (this.start < this.source.length && !(this.source[this.start] === "*" && this.source[this.start + 1] === "/")) {
          if (this.source[this.start] === "\n") this.position = this.position.newline();
          this.start++;
          this.position = this.position.advance();
        }
        this.start += 2;
      } else {
        break;
      }
    }
  }

  private addToken(type: TokenType, value?: string): void {
    this.tokens.push({ type, value: value ?? "", position: this.position });
  }

  private scanToken(): void {
    const char = this.source[this.start++];
    this.position = this.position.advance();

    switch (char) {
      case "+":
        if (this.source[this.start] === "+") {
          this.start++;
          this.position = this.position.advance();
          this.addToken(TokenType.INCREMENT, "++");
        } else if (this.source[this.start] === "=") {
          this.start++;
          this.position = this.position.advance();
          this.addToken(TokenType.PLUS_ASSIGN, "+=");
        } else {
          this.addToken(TokenType.PLUS, "+");
        }
        break;
      case "-":
        if (this.source[this.start] === "-") {
          this.start++;
          this.position = this.position.advance();
          this.addToken(TokenType.DECREMENT, "--");
        } else if (this.source[this.start] === "=") {
          this.start++;
          this.position = this.position.advance();
          this.addToken(TokenType.MINUS_ASSIGN, "-=");
        } else {
          this.addToken(TokenType.MINUS, "-");
        }
        break;
      case "*":
        if (this.source[this.start] === "=") {
          this.start++;
          this.position = this.position.advance();
          this.addToken(TokenType.TIMES_ASSIGN, "*=");
        } else if (this.source[this.start] === "*") {
          this.start++;
          this.position = this.position.advance();
          this.addToken(TokenType.POWER, "**");
        } else {
          this.addToken(TokenType.TIMES, "*");
        }
        break;
      case "/":
        if (this.source[this.start] === "=") {
          this.start++;
          this.position = this.position.advance();
          this.addToken(TokenType.DIVIDE_ASSIGN, "/=");
        } else if (this.canStartRegex() && this.source[this.start] !== " " && this.source[this.start] !== "\n") {
          this.scanRegex();
        } else {
          this.addToken(TokenType.DIVIDE, "/");
        }
        break;
      case "%":
        this.addToken(TokenType.MODULO, "%");
        break;
      case "(":
        this.addToken(TokenType.LEFT_PAREN, "(");
        break;
      case ")":
        this.addToken(TokenType.RIGHT_PAREN, ")");
        break;
      case "{":
        this.addToken(TokenType.LEFT_BRACE, "{");
        break;
      case "}":
        this.addToken(TokenType.RIGHT_BRACE, "}");
        break;
      case "[":
        this.addToken(TokenType.LEFT_BRACKET, "[");
        break;
      case "]":
        this.addToken(TokenType.RIGHT_BRACKET, "]");
        break;
      case ";":
        this.addToken(TokenType.SEMICOLON, ";");
        break;
      case ",":
        this.addToken(TokenType.COMMA, ",");
        break;
      case ".":
        if (this.source[this.start] === "." && this.source[this.start + 1] === ".") {
          this.start += 2;
          this.position = this.position.advance().advance();
          this.addToken(TokenType.SPREAD, "...");
        } else {
          this.addToken(TokenType.DOT, ".");
        }
        break;
      case ":":
        this.addToken(TokenType.COLON, ":");
        break;
      case "?":
        if (this.source[this.start] === "?") {
          this.start++;
          this.position = this.position.advance();
          this.addToken(TokenType.NULLISH, "??");
        } else if (this.source[this.start] === ".") {
          this.start++;
          this.position = this.position.advance();
          this.addToken(TokenType.QUESTION_DOT, "?.");
        } else {
          this.addToken(TokenType.QUESTION, "?");
        }
        break;
      case ">":
        if (this.source[this.start] === "=") {
          this.start++;
          this.position = this.position.advance();
          this.addToken(TokenType.GREATER_EQUAL, ">=");
        } else {
          this.addToken(TokenType.GREATER, ">");
        }
        break;
      case "<":
        if (this.source[this.start] === "=") {
          this.start++;
          this.position = this.position.advance();
          this.addToken(TokenType.LESS_EQUAL, "<=");
        } else {
          this.addToken(TokenType.LESS, "<");
        }
        break;
      case "!":
        if (this.source[this.start] === "=") {
          this.start++;
          this.position = this.position.advance();
          if (this.source[this.start] === "=") {
            this.start++;
            this.position = this.position.advance();
            this.addToken(TokenType.STRICT_NOT_EQUAL, "!==");
          } else {
            this.addToken(TokenType.NOT_EQUAL, "!=");
          }
        } else {
          this.addToken(TokenType.NOT, "!");
        }
        break;
      case "=":
        if (this.source[this.start] === "=") {
          this.start++;
          this.position = this.position.advance();
          if (this.source[this.start] === "=") {
            this.start++;
            this.position = this.position.advance();
            this.addToken(TokenType.STRICT_EQUAL, "===");
          } else {
            this.addToken(TokenType.EQUAL_EQUAL, "==");
          }
        } else {
          this.addToken(TokenType.EQUAL, "=");
        }
        break;
      case '"':
        this.scanString('"');
        break;
      case "'":
        this.scanString("'");
        break;
      case "`":
        this.scanTemplate();
        break;
      case "&":
        if (this.source[this.start] === "&") {
          this.start++;
          this.position = this.position.advance();
          this.addToken(TokenType.AND, "&&");
        }
        break;
      case "|":
        if (this.source[this.start] === "|") {
          this.start++;
          this.position = this.position.advance();
          this.addToken(TokenType.OR, "||");
        }
        break;
      default:
        if (this.isDigit(char)) {
          this.scanNumber();
        } else if (this.isAlpha(char)) {
          this.scanIdentifier();
        } else {
          throw BetaError.syntaxError(`Unexpected character: '${char}'`, this.position);
        }
    }
  }

  private scanString(quote: string): void {
    let value = "";
    while (this.start < this.source.length && this.source[this.start] !== quote) {
      if (this.source[this.start] === "\\") {
        this.start++;
        this.position = this.position.advance();
        const escaped = this.source[this.start];
        switch (escaped) {
          case "n": value += "\n"; break;
          case "t": value += "\t"; break;
          case "r": value += "\r"; break;
          case '"': value += '"'; break;
          case "'": value += "'"; break;
          case "\\": value += "\\"; break;
          default: value += escaped;
        }
      } else {
        value += this.source[this.start];
      }
      this.start++;
      this.position = this.position.advance();
    }
    if (this.start >= this.source.length) {
      throw BetaError.syntaxError("Unterminated string", this.position);
    }
    this.start++;
    this.position = this.position.advance();
    this.addToken(TokenType.STRING, value);
  }

  private scanTemplate(): void {
    let value = "`";
    while (this.start < this.source.length) {
      const char = this.source[this.start++];
      this.position = char === "\n" ? this.position.newline() : this.position.advance();
      value += char;
      if (char === "`") {
        this.addToken(TokenType.TEMPLATE, value);
        return;
      }
      if (char === "\\" && this.start < this.source.length) {
        const escaped = this.source[this.start++];
        this.position = escaped === "\n" ? this.position.newline() : this.position.advance();
        value += escaped;
      }
    }
    throw BetaError.syntaxError("Unterminated template literal", this.position);
  }

  private scanRegex(): void {
    let value = "/";
    let inClass = false;
    while (this.start < this.source.length) {
      const char = this.source[this.start++];
      this.position = this.position.advance();
      value += char;
      if (char === "\\" && this.start < this.source.length) {
        const escaped = this.source[this.start++];
        this.position = this.position.advance();
        value += escaped;
        continue;
      }
      if (char === "[") inClass = true;
      if (char === "]") inClass = false;
      if (char === "/" && !inClass) {
        while (this.start < this.source.length && /[a-z]/i.test(this.source[this.start])) {
          value += this.source[this.start++];
          this.position = this.position.advance();
        }
        this.addToken(TokenType.REGEX, value);
        return;
      }
      if (char === "\n") {
        throw BetaError.syntaxError("Unterminated regex literal", this.position);
      }
    }
    throw BetaError.syntaxError("Unterminated regex literal", this.position);
  }

  private canStartRegex(): boolean {
    const previous = this.tokens[this.tokens.length - 1];
    if (!previous) return true;
    return previous.type === TokenType.EQUAL ||
      previous.type === TokenType.LEFT_PAREN ||
      previous.type === TokenType.LEFT_BRACKET ||
      previous.type === TokenType.LEFT_BRACE ||
      previous.type === TokenType.COMMA ||
      previous.type === TokenType.COLON ||
      previous.type === TokenType.KASOH ||
      previous.type === TokenType.LEMPAR;
  }

  private scanNumber(): void {
    let value = this.source[this.start - 1];
    while (this.start < this.source.length && /[0-9]/.test(this.source[this.start])) {
      value += this.source[this.start];
      this.start++;
      this.position = this.position.advance();
    }
    if (this.start < this.source.length && this.source[this.start] === ".") {
      if (this.start + 1 < this.source.length && /[0-9]/.test(this.source[this.start + 1])) {
        value += ".";
        this.start++;
        this.position = this.position.advance();
        while (this.start < this.source.length && /[0-9]/.test(this.source[this.start])) {
          value += this.source[this.start];
          this.start++;
          this.position = this.position.advance();
        }
      }
    }
    this.addToken(TokenType.NUMBER, value);
  }

  private scanIdentifier(): void {
    let value = this.source[this.start - 1];
    while (this.start < this.source.length && /[a-zA-Z0-9_]/.test(this.source[this.start])) {
      value += this.source[this.start];
      this.start++;
      this.position = this.position.advance();
    }

    const keyword = this.getKeyword(value);
    if (keyword) {
      this.addToken(keyword);
    } else {
      this.addToken(TokenType.IDENTIFIER, value);
    }
  }

  private getKeyword(value: string): TokenType | null {
    const keywords: Record<string, TokenType> = {
      ane: TokenType.ANE,
      tetep: TokenType.TETEP,
      tetap: TokenType.TETEP,
      betoel: TokenType.BETOEL,
      bener: TokenType.BETOEL,
      benar: TokenType.BETOEL,
      kaga: TokenType.KAGA,
      kosong: TokenType.KOSONG,
      angka: TokenType.ANGKA,
      kata: TokenType.KATA,
      kalo: TokenType.KALO,
      kagaknye: TokenType.KAGAKNYE,
      kagaknya: TokenType.KAGAKNYE,
      kalo_kagak: TokenType.UDAH_GITUH,
      udah_gituh: TokenType.UDAH_GITUH,
      udahan: TokenType.BODO_AMAT,
      selagi: TokenType.SELAGI,
      selama: TokenType.SELAGI,
      kerjain: TokenType.KERJAIN,
      itung: TokenType.ITUNG,
      saban: TokenType.SABAN,
      dah: TokenType.DAH,
      keluar: TokenType.DAH,
      lanjut: TokenType.LANJUT,
      lanjut_aja: TokenType.LANJUT,
      pilih: TokenType.PILIH,
      kalo_gini: TokenType.KALO_GINI,
      kalau_gitu: TokenType.KALO_GINI,
      bodo_amat: TokenType.BODO_AMAT,
      bikin: TokenType.BIKIN,
      nanti: TokenType.NANTI,
      asinkron: TokenType.NANTI,
      kasoh: TokenType.KASOH,
      balikin: TokenType.KASOH,
      sabut: TokenType.SABUT,
      panggil: TokenType.SABUT,
      cetak: TokenType.CETAK,
      cetakan: TokenType.CETAK,
      turun: TokenType.TURUN,
      warisan: TokenType.TURUN,
      ikut: TokenType.IKUT,
      mula: TokenType.MULA,
      konstruktor: TokenType.KONSTRUKTOR,
      gua: TokenType.GUA,
      ini: TokenType.GUA,
      punye: TokenType.PUNYE,
      babang: TokenType.BABANG,
      atas: TokenType.BABANG,
      anyar: TokenType.ANYAR,
      baru: TokenType.ANYAR,
      diem: TokenType.DIEM,
      diam: TokenType.DIEM,
      statik: TokenType.STATIK,
      cobi: TokenType.COBA,
      coba: TokenType.COBA,
      tangkep: TokenType.TANGKEP,
      akhirnye: TokenType.AKHIRNYE,
      lempar: TokenType.LEMPAR,
      ambil: TokenType.AMBIL,
      impor: TokenType.AMBIL,
      ekspor: TokenType.EKSPOR,
      dari: TokenType.DARI,
      teriak: TokenType.TERIAK,
      bisik: TokenType.BISIK,
      dengerin: TokenType.DENGERIN,
      sebrapa: TokenType.SEBRAPA,
      ape: TokenType.APE,
      itungan: TokenType.ITUNGAN,
      omongan: TokenType.OMONGAN,
      kumpulin: TokenType.KUMPULIN,
      acak: TokenType.ACAK,
      tidur: TokenType.TIDUR,
      deret: TokenType.DERET,
      antarmuka: TokenType.ANTARMUKA,
      tipe: TokenType.TIPE,
      abstrak: TokenType.ABSTRAK,
      implementasi: TokenType.IMPLEMENTASI,
      paket: TokenType.PAKET,
      enumerasi: TokenType.ENUMERASI,
      generic: TokenType.GENERIK,
      dekorator: TokenType.DEKORATOR,
      properti: TokenType.PROPERTI,
      dapatkan: TokenType.DAPATKAN,
      atur: TokenType.ATUR,
      pribadi: TokenType.PRIBADI,
      terlindungi: TokenType.TERLINDUNGI,
      publik: TokenType.PUBLIK,
      campur: TokenType.CAMPUR,
      protocol: TokenType.PROTOKOL,
      koleksi: TokenType.KOLEKSI,
      opsional: TokenType.OPSIONAL,
      gabungan: TokenType.GABUNGAN,
      potongan: TokenType.POTONGAN,
      komponen: TokenType.KOMPONEN,
      render: TokenType.RENDER,
      state: TokenType.STATE,
      efek: TokenType.EFEK,
      rute: TokenType.RUTE,
      model: TokenType.MODEL,
      kontroler: TokenType.KONTROLER,
      tampilan: TokenType.TAMPILAN,
      gaya: TokenType.GAYA,
      uji: TokenType.UJI,
      harapkan: TokenType.HARAPKAN,
      sebelum: TokenType.SEBELUM,
      sesudah: TokenType.SESUDAH,
      file: TokenType.FILE,
      http: TokenType.HTTP,
      basis_data: TokenType.BASIS_DATA,
      otentikasi: TokenType.OTENTIKASI
    };
    return keywords[value] ?? null;
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z_]/.test(char);
  }
}

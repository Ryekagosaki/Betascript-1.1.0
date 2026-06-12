"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
const Token_1 = require("./Token");
const Position_1 = require("../utils/Position");
const BetaError_1 = require("../utils/BetaError");
class Lexer {
    source;
    position = new Position_1.Position();
    tokens = [];
    start = 0;
    constructor(source) {
        this.source = source;
    }
    tokenize() {
        this.tokens = [];
        this.position = new Position_1.Position();
        this.start = 0;
        while (this.start < this.source.length) {
            this.skipWhitespace();
            if (this.start >= this.source.length) {
                break;
            }
            this.scanToken();
        }
        this.tokens.push({ type: Token_1.TokenType.EOF, value: "EOF", position: this.position });
        return this.tokens;
    }
    skipWhitespace() {
        while (this.start < this.source.length) {
            const char = this.source[this.start];
            if (char === " " || char === "\t" || char === "\r") {
                this.start++;
                this.position = this.position.advance();
            }
            else if (char === "\n") {
                this.start++;
                this.position = this.position.newline();
            }
            else if (char === "/" && this.source[this.start + 1] === "/") {
                this.start += 2;
                while (this.start < this.source.length && this.source[this.start] !== "\n") {
                    this.start++;
                    this.position = this.position.advance();
                }
            }
            else if (char === "/" && this.source[this.start + 1] === "*") {
                this.start += 2;
                this.position = this.position.advance();
                this.position = this.position.advance();
                while (this.start < this.source.length && !(this.source[this.start] === "*" && this.source[this.start + 1] === "/")) {
                    if (this.source[this.start] === "\n")
                        this.position = this.position.newline();
                    this.start++;
                    this.position = this.position.advance();
                }
                this.start += 2;
            }
            else {
                break;
            }
        }
    }
    addToken(type, value) {
        this.tokens.push({ type, value: value ?? "", position: this.position });
    }
    scanToken() {
        const char = this.source[this.start++];
        this.position = this.position.advance();
        switch (char) {
            case "+":
                if (this.source[this.start] === "+") {
                    this.start++;
                    this.position = this.position.advance();
                    this.addToken(Token_1.TokenType.INCREMENT, "++");
                }
                else if (this.source[this.start] === "=") {
                    this.start++;
                    this.position = this.position.advance();
                    this.addToken(Token_1.TokenType.PLUS_ASSIGN, "+=");
                }
                else {
                    this.addToken(Token_1.TokenType.PLUS, "+");
                }
                break;
            case "-":
                if (this.source[this.start] === "-") {
                    this.start++;
                    this.position = this.position.advance();
                    this.addToken(Token_1.TokenType.DECREMENT, "--");
                }
                else if (this.source[this.start] === "=") {
                    this.start++;
                    this.position = this.position.advance();
                    this.addToken(Token_1.TokenType.MINUS_ASSIGN, "-=");
                }
                else {
                    this.addToken(Token_1.TokenType.MINUS, "-");
                }
                break;
            case "*":
                if (this.source[this.start] === "=") {
                    this.start++;
                    this.position = this.position.advance();
                    this.addToken(Token_1.TokenType.TIMES_ASSIGN, "*=");
                }
                else if (this.source[this.start] === "*") {
                    this.start++;
                    this.position = this.position.advance();
                    this.addToken(Token_1.TokenType.POWER, "**");
                }
                else {
                    this.addToken(Token_1.TokenType.TIMES, "*");
                }
                break;
            case "/":
                if (this.source[this.start] === "=") {
                    this.start++;
                    this.position = this.position.advance();
                    this.addToken(Token_1.TokenType.DIVIDE_ASSIGN, "/=");
                }
                else if (this.canStartRegex() && this.source[this.start] !== " " && this.source[this.start] !== "\n") {
                    this.scanRegex();
                }
                else {
                    this.addToken(Token_1.TokenType.DIVIDE, "/");
                }
                break;
            case "%":
                this.addToken(Token_1.TokenType.MODULO, "%");
                break;
            case "(":
                this.addToken(Token_1.TokenType.LEFT_PAREN, "(");
                break;
            case ")":
                this.addToken(Token_1.TokenType.RIGHT_PAREN, ")");
                break;
            case "{":
                this.addToken(Token_1.TokenType.LEFT_BRACE, "{");
                break;
            case "}":
                this.addToken(Token_1.TokenType.RIGHT_BRACE, "}");
                break;
            case "[":
                this.addToken(Token_1.TokenType.LEFT_BRACKET, "[");
                break;
            case "]":
                this.addToken(Token_1.TokenType.RIGHT_BRACKET, "]");
                break;
            case ";":
                this.addToken(Token_1.TokenType.SEMICOLON, ";");
                break;
            case ",":
                this.addToken(Token_1.TokenType.COMMA, ",");
                break;
            case ".":
                if (this.source[this.start] === "." && this.source[this.start + 1] === ".") {
                    this.start += 2;
                    this.position = this.position.advance().advance();
                    this.addToken(Token_1.TokenType.SPREAD, "...");
                }
                else {
                    this.addToken(Token_1.TokenType.DOT, ".");
                }
                break;
            case ":":
                this.addToken(Token_1.TokenType.COLON, ":");
                break;
            case "?":
                if (this.source[this.start] === "?") {
                    this.start++;
                    this.position = this.position.advance();
                    this.addToken(Token_1.TokenType.NULLISH, "??");
                }
                else if (this.source[this.start] === ".") {
                    this.start++;
                    this.position = this.position.advance();
                    this.addToken(Token_1.TokenType.QUESTION_DOT, "?.");
                }
                else {
                    this.addToken(Token_1.TokenType.QUESTION, "?");
                }
                break;
            case ">":
                if (this.source[this.start] === "=") {
                    this.start++;
                    this.position = this.position.advance();
                    this.addToken(Token_1.TokenType.GREATER_EQUAL, ">=");
                }
                else {
                    this.addToken(Token_1.TokenType.GREATER, ">");
                }
                break;
            case "<":
                if (this.source[this.start] === "=") {
                    this.start++;
                    this.position = this.position.advance();
                    this.addToken(Token_1.TokenType.LESS_EQUAL, "<=");
                }
                else {
                    this.addToken(Token_1.TokenType.LESS, "<");
                }
                break;
            case "!":
                if (this.source[this.start] === "=") {
                    this.start++;
                    this.position = this.position.advance();
                    if (this.source[this.start] === "=") {
                        this.start++;
                        this.position = this.position.advance();
                        this.addToken(Token_1.TokenType.STRICT_NOT_EQUAL, "!==");
                    }
                    else {
                        this.addToken(Token_1.TokenType.NOT_EQUAL, "!=");
                    }
                }
                else {
                    this.addToken(Token_1.TokenType.NOT, "!");
                }
                break;
            case "=":
                if (this.source[this.start] === "=") {
                    this.start++;
                    this.position = this.position.advance();
                    if (this.source[this.start] === "=") {
                        this.start++;
                        this.position = this.position.advance();
                        this.addToken(Token_1.TokenType.STRICT_EQUAL, "===");
                    }
                    else {
                        this.addToken(Token_1.TokenType.EQUAL_EQUAL, "==");
                    }
                }
                else {
                    this.addToken(Token_1.TokenType.EQUAL, "=");
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
                    this.addToken(Token_1.TokenType.AND, "&&");
                }
                break;
            case "|":
                if (this.source[this.start] === "|") {
                    this.start++;
                    this.position = this.position.advance();
                    this.addToken(Token_1.TokenType.OR, "||");
                }
                break;
            default:
                if (this.isDigit(char)) {
                    this.scanNumber();
                }
                else if (this.isAlpha(char)) {
                    this.scanIdentifier();
                }
                else {
                    throw BetaError_1.BetaError.syntaxError(`Unexpected character: '${char}'`, this.position);
                }
        }
    }
    scanString(quote) {
        let value = "";
        while (this.start < this.source.length && this.source[this.start] !== quote) {
            if (this.source[this.start] === "\\") {
                this.start++;
                this.position = this.position.advance();
                const escaped = this.source[this.start];
                switch (escaped) {
                    case "n":
                        value += "\n";
                        break;
                    case "t":
                        value += "\t";
                        break;
                    case "r":
                        value += "\r";
                        break;
                    case '"':
                        value += '"';
                        break;
                    case "'":
                        value += "'";
                        break;
                    case "\\":
                        value += "\\";
                        break;
                    default: value += escaped;
                }
            }
            else {
                value += this.source[this.start];
            }
            this.start++;
            this.position = this.position.advance();
        }
        if (this.start >= this.source.length) {
            throw BetaError_1.BetaError.syntaxError("Unterminated string", this.position);
        }
        this.start++;
        this.position = this.position.advance();
        this.addToken(Token_1.TokenType.STRING, value);
    }
    scanTemplate() {
        let value = "`";
        while (this.start < this.source.length) {
            const char = this.source[this.start++];
            this.position = char === "\n" ? this.position.newline() : this.position.advance();
            value += char;
            if (char === "`") {
                this.addToken(Token_1.TokenType.TEMPLATE, value);
                return;
            }
            if (char === "\\" && this.start < this.source.length) {
                const escaped = this.source[this.start++];
                this.position = escaped === "\n" ? this.position.newline() : this.position.advance();
                value += escaped;
            }
        }
        throw BetaError_1.BetaError.syntaxError("Unterminated template literal", this.position);
    }
    scanRegex() {
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
            if (char === "[")
                inClass = true;
            if (char === "]")
                inClass = false;
            if (char === "/" && !inClass) {
                while (this.start < this.source.length && /[a-z]/i.test(this.source[this.start])) {
                    value += this.source[this.start++];
                    this.position = this.position.advance();
                }
                this.addToken(Token_1.TokenType.REGEX, value);
                return;
            }
            if (char === "\n") {
                throw BetaError_1.BetaError.syntaxError("Unterminated regex literal", this.position);
            }
        }
        throw BetaError_1.BetaError.syntaxError("Unterminated regex literal", this.position);
    }
    canStartRegex() {
        const previous = this.tokens[this.tokens.length - 1];
        if (!previous)
            return true;
        return previous.type === Token_1.TokenType.EQUAL ||
            previous.type === Token_1.TokenType.LEFT_PAREN ||
            previous.type === Token_1.TokenType.LEFT_BRACKET ||
            previous.type === Token_1.TokenType.LEFT_BRACE ||
            previous.type === Token_1.TokenType.COMMA ||
            previous.type === Token_1.TokenType.COLON ||
            previous.type === Token_1.TokenType.KASOH ||
            previous.type === Token_1.TokenType.LEMPAR;
    }
    scanNumber() {
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
        this.addToken(Token_1.TokenType.NUMBER, value);
    }
    scanIdentifier() {
        let value = this.source[this.start - 1];
        while (this.start < this.source.length && /[a-zA-Z0-9_]/.test(this.source[this.start])) {
            value += this.source[this.start];
            this.start++;
            this.position = this.position.advance();
        }
        const keyword = this.getKeyword(value);
        if (keyword) {
            this.addToken(keyword);
        }
        else {
            this.addToken(Token_1.TokenType.IDENTIFIER, value);
        }
    }
    getKeyword(value) {
        const keywords = {
            ane: Token_1.TokenType.ANE,
            tetep: Token_1.TokenType.TETEP,
            tetap: Token_1.TokenType.TETEP,
            betoel: Token_1.TokenType.BETOEL,
            bener: Token_1.TokenType.BETOEL,
            benar: Token_1.TokenType.BETOEL,
            kaga: Token_1.TokenType.KAGA,
            kosong: Token_1.TokenType.KOSONG,
            angka: Token_1.TokenType.ANGKA,
            kata: Token_1.TokenType.KATA,
            kalo: Token_1.TokenType.KALO,
            kagaknye: Token_1.TokenType.KAGAKNYE,
            kagaknya: Token_1.TokenType.KAGAKNYE,
            kalo_kagak: Token_1.TokenType.UDAH_GITUH,
            udah_gituh: Token_1.TokenType.UDAH_GITUH,
            udahan: Token_1.TokenType.BODO_AMAT,
            selagi: Token_1.TokenType.SELAGI,
            selama: Token_1.TokenType.SELAGI,
            kerjain: Token_1.TokenType.KERJAIN,
            itung: Token_1.TokenType.ITUNG,
            saban: Token_1.TokenType.SABAN,
            dah: Token_1.TokenType.DAH,
            keluar: Token_1.TokenType.DAH,
            lanjut: Token_1.TokenType.LANJUT,
            lanjut_aja: Token_1.TokenType.LANJUT,
            pilih: Token_1.TokenType.PILIH,
            kalo_gini: Token_1.TokenType.KALO_GINI,
            kalau_gitu: Token_1.TokenType.KALO_GINI,
            bodo_amat: Token_1.TokenType.BODO_AMAT,
            bikin: Token_1.TokenType.BIKIN,
            nanti: Token_1.TokenType.NANTI,
            asinkron: Token_1.TokenType.NANTI,
            kasoh: Token_1.TokenType.KASOH,
            balikin: Token_1.TokenType.KASOH,
            sabut: Token_1.TokenType.SABUT,
            panggil: Token_1.TokenType.SABUT,
            cetak: Token_1.TokenType.CETAK,
            cetakan: Token_1.TokenType.CETAK,
            turun: Token_1.TokenType.TURUN,
            warisan: Token_1.TokenType.TURUN,
            ikut: Token_1.TokenType.IKUT,
            mula: Token_1.TokenType.MULA,
            konstruktor: Token_1.TokenType.KONSTRUKTOR,
            gua: Token_1.TokenType.GUA,
            ini: Token_1.TokenType.GUA,
            punye: Token_1.TokenType.PUNYE,
            babang: Token_1.TokenType.BABANG,
            atas: Token_1.TokenType.BABANG,
            anyar: Token_1.TokenType.ANYAR,
            baru: Token_1.TokenType.ANYAR,
            diem: Token_1.TokenType.DIEM,
            diam: Token_1.TokenType.DIEM,
            statik: Token_1.TokenType.STATIK,
            cobi: Token_1.TokenType.COBA,
            coba: Token_1.TokenType.COBA,
            tangkep: Token_1.TokenType.TANGKEP,
            akhirnye: Token_1.TokenType.AKHIRNYE,
            lempar: Token_1.TokenType.LEMPAR,
            ambil: Token_1.TokenType.AMBIL,
            impor: Token_1.TokenType.AMBIL,
            ekspor: Token_1.TokenType.EKSPOR,
            dari: Token_1.TokenType.DARI,
            teriak: Token_1.TokenType.TERIAK,
            bisik: Token_1.TokenType.BISIK,
            dengerin: Token_1.TokenType.DENGERIN,
            sebrapa: Token_1.TokenType.SEBRAPA,
            ape: Token_1.TokenType.APE,
            itungan: Token_1.TokenType.ITUNGAN,
            omongan: Token_1.TokenType.OMONGAN,
            kumpulin: Token_1.TokenType.KUMPULIN,
            acak: Token_1.TokenType.ACAK,
            tidur: Token_1.TokenType.TIDUR,
            deret: Token_1.TokenType.DERET,
            antarmuka: Token_1.TokenType.ANTARMUKA,
            tipe: Token_1.TokenType.TIPE,
            abstrak: Token_1.TokenType.ABSTRAK,
            implementasi: Token_1.TokenType.IMPLEMENTASI,
            paket: Token_1.TokenType.PAKET,
            enumerasi: Token_1.TokenType.ENUMERASI,
            generic: Token_1.TokenType.GENERIK,
            dekorator: Token_1.TokenType.DEKORATOR,
            properti: Token_1.TokenType.PROPERTI,
            dapatkan: Token_1.TokenType.DAPATKAN,
            atur: Token_1.TokenType.ATUR,
            pribadi: Token_1.TokenType.PRIBADI,
            terlindungi: Token_1.TokenType.TERLINDUNGI,
            publik: Token_1.TokenType.PUBLIK,
            campur: Token_1.TokenType.CAMPUR,
            protocol: Token_1.TokenType.PROTOKOL,
            koleksi: Token_1.TokenType.KOLEKSI,
            opsional: Token_1.TokenType.OPSIONAL,
            gabungan: Token_1.TokenType.GABUNGAN,
            potongan: Token_1.TokenType.POTONGAN,
            komponen: Token_1.TokenType.KOMPONEN,
            render: Token_1.TokenType.RENDER,
            state: Token_1.TokenType.STATE,
            efek: Token_1.TokenType.EFEK,
            rute: Token_1.TokenType.RUTE,
            model: Token_1.TokenType.MODEL,
            kontroler: Token_1.TokenType.KONTROLER,
            tampilan: Token_1.TokenType.TAMPILAN,
            gaya: Token_1.TokenType.GAYA,
            uji: Token_1.TokenType.UJI,
            harapkan: Token_1.TokenType.HARAPKAN,
            sebelum: Token_1.TokenType.SEBELUM,
            sesudah: Token_1.TokenType.SESUDAH,
            file: Token_1.TokenType.FILE,
            http: Token_1.TokenType.HTTP,
            basis_data: Token_1.TokenType.BASIS_DATA,
            otentikasi: Token_1.TokenType.OTENTIKASI
        };
        return keywords[value] ?? null;
    }
    isDigit(char) {
        return /[0-9]/.test(char);
    }
    isAlpha(char) {
        return /[a-zA-Z_]/.test(char);
    }
}
exports.Lexer = Lexer;
//# sourceMappingURL=Lexer.js.map
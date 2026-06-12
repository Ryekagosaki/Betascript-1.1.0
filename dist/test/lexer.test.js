"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Lexer_1 = require("../src/lexer/Lexer");
const Token_1 = require("../src/lexer/Token");
describe("Lexer", () => {
    test("should tokenize keywords", () => {
        const lexer = new Lexer_1.Lexer("ane tetep kalo selagi kerjain deret");
        const tokens = lexer.tokenize();
        expect(tokens[0].type).toBe(Token_1.TokenType.ANE);
        expect(tokens[1].type).toBe(Token_1.TokenType.TETEP);
        expect(tokens[2].type).toBe(Token_1.TokenType.KALO);
        expect(tokens[3].type).toBe(Token_1.TokenType.SELAGI);
        expect(tokens[4].type).toBe(Token_1.TokenType.KERJAIN);
        expect(tokens[5].type).toBe(Token_1.TokenType.DERET);
    });
    test("should tokenize literals", () => {
        const lexer = new Lexer_1.Lexer("10 20.5 \"hello\" 'world' betoel benar kaga kosong");
        const tokens = lexer.tokenize();
        expect(tokens[0].type).toBe(Token_1.TokenType.NUMBER);
        expect(tokens[0].value).toBe("10");
        expect(tokens[1].type).toBe(Token_1.TokenType.NUMBER);
        expect(tokens[1].value).toBe("20.5");
        expect(tokens[2].type).toBe(Token_1.TokenType.STRING);
        expect(tokens[2].value).toBe("hello");
        expect(tokens[3].type).toBe(Token_1.TokenType.STRING);
        expect(tokens[3].value).toBe("world");
        expect(tokens[4].type).toBe(Token_1.TokenType.BETOEL);
        expect(tokens[5].type).toBe(Token_1.TokenType.BETOEL);
        expect(tokens[6].type).toBe(Token_1.TokenType.KAGA);
        expect(tokens[7].type).toBe(Token_1.TokenType.KOSONG);
    });
    test("should tokenize operators", () => {
        const lexer = new Lexer_1.Lexer("+ - * / % ** == != === !== <= >= && || ! ++ --");
        const tokens = lexer.tokenize();
        expect(tokens[0].type).toBe(Token_1.TokenType.PLUS);
        expect(tokens[1].type).toBe(Token_1.TokenType.MINUS);
        expect(tokens[2].type).toBe(Token_1.TokenType.TIMES);
        expect(tokens[3].type).toBe(Token_1.TokenType.DIVIDE);
        expect(tokens[4].type).toBe(Token_1.TokenType.MODULO);
        expect(tokens[5].type).toBe(Token_1.TokenType.POWER);
        expect(tokens[6].type).toBe(Token_1.TokenType.EQUAL_EQUAL);
        expect(tokens[7].type).toBe(Token_1.TokenType.NOT_EQUAL);
        expect(tokens[8].type).toBe(Token_1.TokenType.STRICT_EQUAL);
        expect(tokens[9].type).toBe(Token_1.TokenType.STRICT_NOT_EQUAL);
        expect(tokens[10].type).toBe(Token_1.TokenType.LESS_EQUAL);
        expect(tokens[11].type).toBe(Token_1.TokenType.GREATER_EQUAL);
        expect(tokens[12].type).toBe(Token_1.TokenType.AND);
        expect(tokens[13].type).toBe(Token_1.TokenType.OR);
        expect(tokens[14].type).toBe(Token_1.TokenType.NOT);
        expect(tokens[15].type).toBe(Token_1.TokenType.INCREMENT);
        expect(tokens[16].type).toBe(Token_1.TokenType.DECREMENT);
    });
    test("should tokenize modern operators and literals", () => {
        const lexer = new Lexer_1.Lexer("objek?.nama ?? `Halo ${nama}` ane pola = /ab+/i ...data");
        const tokens = lexer.tokenize();
        expect(tokens[1].type).toBe(Token_1.TokenType.QUESTION_DOT);
        expect(tokens[3].type).toBe(Token_1.TokenType.NULLISH);
        expect(tokens[4].type).toBe(Token_1.TokenType.TEMPLATE);
        expect(tokens[8].type).toBe(Token_1.TokenType.REGEX);
        expect(tokens[9].type).toBe(Token_1.TokenType.SPREAD);
    });
});
//# sourceMappingURL=lexer.test.js.map
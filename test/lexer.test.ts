import { Lexer } from "../src/lexer/Lexer";
import { TokenType } from "../src/lexer/Token";

describe("Lexer", () => {
  test("should tokenize keywords", () => {
    const lexer = new Lexer("ane tetep kalo selagi kerjain deret");
    const tokens = lexer.tokenize();
    
    expect(tokens[0].type).toBe(TokenType.ANE);
    expect(tokens[1].type).toBe(TokenType.TETEP);
    expect(tokens[2].type).toBe(TokenType.KALO);
    expect(tokens[3].type).toBe(TokenType.SELAGI);
    expect(tokens[4].type).toBe(TokenType.KERJAIN);
    expect(tokens[5].type).toBe(TokenType.DERET);
  });

  test("should tokenize literals", () => {
    const lexer = new Lexer("10 20.5 \"hello\" 'world' betoel benar kaga kosong");
    const tokens = lexer.tokenize();
    
    expect(tokens[0].type).toBe(TokenType.NUMBER);
    expect(tokens[0].value).toBe("10");
    expect(tokens[1].type).toBe(TokenType.NUMBER);
    expect(tokens[1].value).toBe("20.5");
    expect(tokens[2].type).toBe(TokenType.STRING);
    expect(tokens[2].value).toBe("hello");
    expect(tokens[3].type).toBe(TokenType.STRING);
    expect(tokens[3].value).toBe("world");
    expect(tokens[4].type).toBe(TokenType.BETOEL);
    expect(tokens[5].type).toBe(TokenType.BETOEL);
    expect(tokens[6].type).toBe(TokenType.KAGA);
    expect(tokens[7].type).toBe(TokenType.KOSONG);
  });

  test("should tokenize operators", () => {
    const lexer = new Lexer("+ - * / % ** == != === !== <= >= && || ! ++ --");
    const tokens = lexer.tokenize();
    
    expect(tokens[0].type).toBe(TokenType.PLUS);
    expect(tokens[1].type).toBe(TokenType.MINUS);
    expect(tokens[2].type).toBe(TokenType.TIMES);
    expect(tokens[3].type).toBe(TokenType.DIVIDE);
    expect(tokens[4].type).toBe(TokenType.MODULO);
    expect(tokens[5].type).toBe(TokenType.POWER);
    expect(tokens[6].type).toBe(TokenType.EQUAL_EQUAL);
    expect(tokens[7].type).toBe(TokenType.NOT_EQUAL);
    expect(tokens[8].type).toBe(TokenType.STRICT_EQUAL);
    expect(tokens[9].type).toBe(TokenType.STRICT_NOT_EQUAL);
    expect(tokens[10].type).toBe(TokenType.LESS_EQUAL);
    expect(tokens[11].type).toBe(TokenType.GREATER_EQUAL);
    expect(tokens[12].type).toBe(TokenType.AND);
    expect(tokens[13].type).toBe(TokenType.OR);
    expect(tokens[14].type).toBe(TokenType.NOT);
    expect(tokens[15].type).toBe(TokenType.INCREMENT);
    expect(tokens[16].type).toBe(TokenType.DECREMENT);
  });

  test("should tokenize modern operators and literals", () => {
    const lexer = new Lexer("objek?.nama ?? `Halo ${nama}` ane pola = /ab+/i ...data");
    const tokens = lexer.tokenize();

    expect(tokens[1].type).toBe(TokenType.QUESTION_DOT);
    expect(tokens[3].type).toBe(TokenType.NULLISH);
    expect(tokens[4].type).toBe(TokenType.TEMPLATE);
    expect(tokens[8].type).toBe(TokenType.REGEX);
    expect(tokens[9].type).toBe(TokenType.SPREAD);
  });
});

import { Token, TokenType } from "../lexer/Token";
import { Position } from "../utils/Position";
import { BetaError } from "../utils/BetaError";
import {
  Program,
  Statement,
  VariableDeclaration,
  FunctionDeclaration,
  Parameter,
  ClassDeclaration,
  MethodDeclaration,
  FieldDeclaration,
  InterfaceDeclaration,
  InterfaceMethod,
  BlockStatement,
  IfStatement,
  ElseClause,
  WhileStatement,
  DoWhileStatement,
  ForStatement,
  ForEachStatement,
  SwitchStatement,
  SwitchCase,
  TryStatement,
  CatchClause,
  ReturnStatement,
  ThrowStatement,
  BreakStatement,
  ContinueStatement,
  ImportStatement,
  ExportStatement,
  ExpressionStatement,
  Expression,
  Identifier,
  Literal,
  BinaryExpression,
  UnaryExpression,
  AssignmentExpression,
  CallExpression,
  MemberExpression,
  NewExpression,
  SuperExpression,
  LambdaExpression,
  ArrayExpression,
  ObjectExpression,
  ObjectProperty
} from "./AST";

export class Parser {
  private tokens: Token[] = [];
  private current = 0;

  constructor(private readonly source: string) {}

  parse(tokens: Token[]): Program {
    this.tokens = tokens;
    this.current = 0;
    const statements: Statement[] = [];
    
    while (!this.isAtEnd()) {
      statements.push(this.parseStatement());
    }

    return {
      type: "Program",
      body: statements
    };
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private checkNext(type: TokenType): boolean {
    if (this.current + 1 >= this.tokens.length) return false;
    return this.tokens[this.current + 1].type === type;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw BetaError.expected(message, this.peek().position);
  }

  private parseStatement(): Statement {
    if (this.isStrictModeDirective()) return this.strictModeStatement();
    if (this.match(TokenType.AMBIL)) return this.importStatement();
    if (this.match(TokenType.KASOH)) return this.kasohStatement();
    if (this.match(TokenType.ANE, TokenType.TETEP)) return this.variableDeclaration();
     
     const isAsync = this.match(TokenType.NANTI);
    if (this.match(TokenType.BIKIN)) return this.functionDeclaration(isAsync);
    if (this.match(TokenType.CETAK)) return this.classDeclaration();
    if (this.match(TokenType.ANTARMUKA)) return this.interfaceDeclaration();
    if (this.match(TokenType.KALO)) return this.ifStatement();
    if (this.match(TokenType.SELAGI)) return this.whileStatement();
    if (this.match(TokenType.KERJAIN)) return this.doWhileStatement();
    if (this.match(TokenType.ITUNG)) return this.forStatement();
    if (this.match(TokenType.SABAN)) return this.forEachStatement();
    if (this.match(TokenType.PILIH)) return this.switchStatement();
    if (this.match(TokenType.COBA)) return this.tryStatement();
    if (this.match(TokenType.LEMPAR)) return this.throwStatement();
    if (this.match(TokenType.DAH)) return this.breakStatement();
    if (this.match(TokenType.LANJUT)) return this.continueStatement();
    if (this.match(TokenType.LEFT_BRACE)) return this.parseBlockBody();
    if (this.match(TokenType.SEMICOLON)) {
      return {
        type: "EmptyStatement",
        position: this.previous().position
      } as Statement;
    }
    
    return this.expressionStatement();
  }

  private isStrictModeDirective(): boolean {
    return this.check(TokenType.IDENTIFIER) && this.peek().value === "mode" &&
      this.current + 1 < this.tokens.length &&
      this.tokens[this.current + 1].type === TokenType.IDENTIFIER &&
      this.tokens[this.current + 1].value === "ketat";
  }

  private strictModeStatement(): Statement {
    const token = this.advance();
    this.advance();
    this.match(TokenType.SEMICOLON);
    return { type: "EmptyStatement", position: token.position } as Statement;
  }

  private kasohStatement(): ReturnStatement | ExportStatement {
    if (this.check(TokenType.BIKIN) || this.check(TokenType.CETAK) ||
        this.check(TokenType.ANE) || this.check(TokenType.TETEP)) {
      return this.exportStatement();
    }
    return this.returnStatement();
  }

  private variableDeclaration(): VariableDeclaration {
    const token = this.previous();
    const kind = token.type === TokenType.ANE ? "ane" : "tetep";
    const name = this.bindingPattern();
    
    let typeAnnotation: TypeAnnotation | undefined;
    if (this.match(TokenType.COLON)) {
      const typeToken = this.advance();
      typeAnnotation = this.getTypeAnnotation(typeToken);
    }
    
    let initializer: Expression | null = null;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.assignment();
    } else if (this.match(TokenType.PLUS_ASSIGN, TokenType.MINUS_ASSIGN, TokenType.TIMES_ASSIGN, TokenType.DIVIDE_ASSIGN)) {
      const op = this.previous().value;
      const right = this.assignment();
      initializer = {
        type: "BinaryExpression",
        operator: op.slice(0, -1),
        left: { type: "Identifier", name, position: this.peek().position } as Expression,
        right,
        position: this.peek().position
      } as Expression;
    }
    
    this.match(TokenType.SEMICOLON);
    
    return {
      type: "VariableDeclaration",
      kind,
      name,
      typeAnnotation,
      initializer,
      position: token.position
    };
  }

  private functionDeclaration(isAsync: boolean = false): FunctionDeclaration {
    const token = this.previous();
    const name = this.consume(TokenType.IDENTIFIER, "Expected function name").value;
    this.skipGenericParameters();
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after function name");
    const parameters = this.parameters();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after parameters");
    
    // Handle return type annotation
    let returnType: TypeAnnotation | undefined;
    if (this.match(TokenType.COLON)) {
      const typeToken = this.advance();
      returnType = this.getTypeAnnotation(typeToken);
    }
    
    this.consume(TokenType.LEFT_BRACE, "Expected '{' before function body");
    const body = this.parseBlockBody();
    
    return {
      type: "FunctionDeclaration",
      name,
      parameters,
      body,
      isAsync: isAsync,
      isExported: false,
      position: token.position
    };
  }

  private parameters(): Parameter[] {
    const params: Parameter[] = [];
    
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        const ente = this.match(TokenType.ENTE);
        const isRest = this.match(TokenType.SPREAD);
        const name = this.consume(TokenType.IDENTIFIER, "Expected parameter name").value;
        let paramType: TypeAnnotation | undefined;
        if (this.match(TokenType.COLON)) {
          const typeToken = this.advance();
          paramType = this.getTypeAnnotation(typeToken);
        }
        params.push({
          name,
          type: paramType,
          isRest,
          position: this.peek().position
        });
      } while (this.match(TokenType.COMMA));
    }
    
    return params;
  }

  private classDeclaration(): ClassDeclaration {
    const name = this.consume(TokenType.IDENTIFIER, "Expected class name").value;
    
    let superclass: string | undefined;
    if (this.match(TokenType.TURUN)) {
      superclass = this.consume(TokenType.IDENTIFIER, "Expected superclass name").value;
    }
    
    const interfaces: string[] = [];
    if (this.match(TokenType.IKUT)) {
      do {
        interfaces.push(this.consume(TokenType.IDENTIFIER, "Expected interface name").value);
      } while (this.match(TokenType.COMMA));
    }
    
    this.consume(TokenType.LEFT_BRACE, "Expected '{' before class body");
    const members = this.classMembers();
    
    return {
      type: "ClassDeclaration",
      name,
      superclass,
      interfaces,
      members,
      position: this.previous().position
    };
  }

private classMembers(): (MethodDeclaration | FieldDeclaration)[] {
    const members: (MethodDeclaration | FieldDeclaration)[] = [];
    
while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      let isStatic = false;
      
      // Check for static keyword
      if (this.match(TokenType.STATIK)) isStatic = true;
      
      // Constructor with final Betawi keyword: mula(...)
      if (this.match(TokenType.MULA)) {
        this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'mula'");
        const parameters = this.parameters();
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after parameters");
        this.consume(TokenType.LEFT_BRACE, "Expected '{' before constructor body");
        const body = this.parseBlockBody();

        members.push({
          type: "MethodDeclaration",
          name: "constructor",
          parameters,
          body,
          kind: "constructor",
          visibility: "public",
          isStatic,
          position: this.peek().position
        });
      } else if (this.match(TokenType.BIKIN)) {
        // Check if 'anyar' follows (constructor)
        if (this.check(TokenType.ANYAR)) {
          this.advance(); // consume 'anyar' keyword
          // Constructor without explicit name
          this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'anyar'");
          const parameters = this.parameters();
          this.consume(TokenType.RIGHT_PAREN, "Expected ')' after parameters");
          this.consume(TokenType.LEFT_BRACE, "Expected '{' before constructor body");
          const body = this.parseBlockBody();
          
          members.push({
            type: "MethodDeclaration",
            name: "constructor",
            parameters,
            body,
            kind: "constructor",
            visibility: "public",
            isStatic,
            position: this.peek().position
          });
        } else {
          // Regular method with 'bikin' - get name
          const nameToken = this.consume(TokenType.IDENTIFIER, "Expected method name");
          const name = nameToken.value;
          
          this.consume(TokenType.LEFT_PAREN, "Expected '(' after method name");
          const parameters = this.parameters();
          this.consume(TokenType.RIGHT_PAREN, "Expected ')' after parameters");
          this.consume(TokenType.LEFT_BRACE, "Expected '{' before method body");
          const body = this.parseBlockBody();
          
          members.push({
            type: "MethodDeclaration",
            name,
            parameters,
            body,
            kind: "method",
            visibility: "public",
            isStatic,
            position: this.peek().position
          });
        }
      } else if (this.check(TokenType.IDENTIFIER) && this.peek().value !== "statik") {
        // Method without 'bikin' keyword (shorthand)
        const nameToken = this.consume(TokenType.IDENTIFIER, "Expected method name");
        const name = nameToken.value;
        
        this.consume(TokenType.LEFT_PAREN, "Expected '(' after method name");
        const parameters = this.parameters();
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after parameters");
        
        let returnType: TypeAnnotation | undefined;
        if (this.match(TokenType.COLON)) {
          const typeToken = this.advance();
          returnType = this.getTypeAnnotation(typeToken);
        }
        
        this.consume(TokenType.LEFT_BRACE, "Expected '{' before method body");
        const body = this.parseBlockBody();
        
        members.push({
          type: "MethodDeclaration",
          name,
          parameters,
          body,
          kind: "method",
          visibility: "public",
          isStatic,
          position: this.peek().position
        });
      } else if (this.match(TokenType.ANE, TokenType.TETEP)) {
        // Field declaration inside class
        const fieldToken = this.previous();
        const fieldName = this.consume(TokenType.IDENTIFIER, "Expected field name").value;
        
        let initializer: Expression | null = null;
        if (this.match(TokenType.EQUAL)) {
          initializer = this.assignment();
        }
        
        // Optional semicolon
        this.match(TokenType.SEMICOLON);
        
        members.push({
          type: "FieldDeclaration",
          name: fieldName,
          visibility: "public",
          isStatic: isStatic,
          initializer,
          position: this.peek().position
        });
      } else {
        // Unknown statement in class - break to avoid infinite loop
        break;
      }
    }
    
    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after class body");
    return members;
  }

  private interfaceDeclaration(): InterfaceDeclaration {
    const name = this.consume(TokenType.IDENTIFIER, "Expected interface name").value;
    this.consume(TokenType.LEFT_BRACE, "Expected '{' before interface body");
    
    const methods: InterfaceMethod[] = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const methodName = this.consume(TokenType.IDENTIFIER, "Expected method name").value;
      this.consume(TokenType.LEFT_PAREN, "Expected '(' after method name");
      const parameters = this.parameters();
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after parameters");
      
      let returnType: TypeAnnotation | undefined;
      if (this.match(TokenType.COLON)) {
        const typeToken = this.advance();
        returnType = this.getTypeAnnotation(typeToken);
      }
      
      this.match(TokenType.SEMICOLON);
      
      methods.push({
        type: "InterfaceMethod",
        name: methodName,
        parameters,
        returnType,
        position: this.peek().position
      });
    }
    
    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after interface body");
    
    return {
      type: "InterfaceDeclaration",
      name,
      methods,
      position: this.peek().position
    };
  }

  private ifStatement(): IfStatement {
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'kalo'");
    const test = this.assignment();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after condition");
    this.consume(TokenType.LEFT_BRACE, "Expected '{' after if condition");
    const consequent = this.parseBlockBody();
    
    let alternate: ElseClause | null = null;
    if (this.match(TokenType.KAGAKNYE)) {
      alternate = {
        type: "ElseClause",
        ifStatement: this.ifStatement() as IfStatement,
        position: this.peek().position
      };
    } else if (this.match(TokenType.UDAH_GITUH)) {
      this.consume(TokenType.LEFT_BRACE, "Expected '{' after else");
      alternate = {
        type: "ElseClause",
        block: this.parseBlockBody(),
        position: this.peek().position
      };
    }
    
    return {
      type: "IfStatement",
      test,
      consequent,
      alternate,
      position: this.peek().position
    };
  }

  private parseBlockBody(): BlockStatement {
    const start = this.previous();
    const statements: Statement[] = [];
    
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      statements.push(this.parseStatement());
    }
    
    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after block");
    
    return {
      type: "BlockStatement",
      statements,
      position: start.position
    };
  }

  private whileStatement(): WhileStatement {
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'selagi'");
    const test = this.assignment();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after condition");
    this.consume(TokenType.LEFT_BRACE, "Expected '{' after while condition");
    const body = this.parseBlockBody();
    
    return {
      type: "WhileStatement",
      test,
      body,
      position: this.peek().position
    };
  }

  private doWhileStatement(): DoWhileStatement {
    const token = this.previous();
    this.consume(TokenType.LEFT_BRACE, "Expected '{' after 'kerjain'");
    const body = this.parseBlockBody();
    this.consume(TokenType.SELAGI, "Expected 'selagi' after do-while body");
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'selagi'");
    const test = this.assignment();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after do-while condition");
    this.match(TokenType.SEMICOLON);

    return {
      type: "DoWhileStatement",
      body,
      test,
      position: token.position
    };
  }

  private forStatement(): ForStatement {
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'itung'");
    if (!this.match(TokenType.ANE, TokenType.TETEP)) {
      throw BetaError.expected("Expected variable declaration after 'itung ('", this.peek().position);
    }
    const init = this.variableDeclaration();
    const test = this.assignment();
    this.consume(TokenType.SEMICOLON, "Expected ';' after for condition");
    const update = this.assignment();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after for update");
    this.consume(TokenType.LEFT_BRACE, "Expected '{' after for update");
    const body = this.parseBlockBody();
    
    return {
      type: "ForStatement",
      init,
      test,
      update,
      body,
      position: this.peek().position
    };
  }

  private forEachStatement(): ForEachStatement {
    let kind: "ane" | "tetep" = "ane";
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'saban'");
    if (this.match(TokenType.TETEP)) kind = "tetep";
    else this.match(TokenType.ANE);
    
    const variable = this.consume(TokenType.IDENTIFIER, "Expected variable name").value;
    this.consume(TokenType.DARI, "Expected 'dari' after variable");
    const iterable = this.assignment();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after iterable");
    this.consume(TokenType.LEFT_BRACE, "Expected '{' after iterable");
    const body = this.parseBlockBody();
    
    return {
      type: "ForEachStatement",
      kind,
      variable,
      iterable,
      body,
      position: this.peek().position
    };
  }

  private switchStatement(): SwitchStatement {
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'pilih'");
    const discriminant = this.assignment();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after discriminant");
    this.consume(TokenType.LEFT_BRACE, "Expected '{' before switch cases");
    
    const cases: SwitchCase[] = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const isDefault = this.match(TokenType.BODO_AMAT);
      let test: Expression | null = null;
      if (!isDefault) {
        this.consume(TokenType.KALO_GINI, "Expected 'kalo_gini'");
        test = this.assignment();
      }
      this.consume(TokenType.COLON, "Expected ':' after case keyword");
      
      const consequent: Statement[] = [];
      while (!this.check(TokenType.KALO_GINI) && 
             !this.check(TokenType.BODO_AMAT) && 
             !this.check(TokenType.RIGHT_BRACE) && 
             !this.isAtEnd()) {
        consequent.push(this.parseStatement());
      }
      
      cases.push({
        type: "SwitchCase",
        test,
        consequent,
        position: this.peek().position
      });
    }
    
    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after switch cases");
    
    return {
      type: "SwitchStatement",
      discriminant,
      cases,
      position: this.peek().position
    };
  }

  private tryStatement(): TryStatement {
    this.consume(TokenType.LEFT_BRACE, "Expected '{' after try");
    const block = this.parseBlockBody();
    let handler: CatchClause | null = null;
    let finalizer: BlockStatement | null = null;
    
    if (this.match(TokenType.TANGKEP)) {
      this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'tangkep'");
      let param: string | null = null;
      if (this.match(TokenType.ENTE)) {
        param = this.consume(TokenType.IDENTIFIER, "Expected catch parameter name").value;
      } else if (this.check(TokenType.IDENTIFIER)) {
        param = this.advance().value;
      }
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after catch parameter");
      this.consume(TokenType.LEFT_BRACE, "Expected '{' after catch");
      const catchBlock = this.parseBlockBody();
      handler = {
        type: "CatchClause",
        param,
        block: catchBlock,
        position: this.peek().position
      };
    }
    
    if (this.match(TokenType.AKHIRNYE)) {
      this.consume(TokenType.LEFT_BRACE, "Expected '{' after finally");
      finalizer = this.parseBlockBody();
    }
    
    return {
      type: "TryStatement",
      block,
      handler,
      finalizer,
      position: this.peek().position
    };
  }

  private returnStatement(): ReturnStatement {
    const arg = !this.check(TokenType.SEMICOLON) && !this.check(TokenType.RIGHT_BRACE) ? this.assignment() : null;
    return {
      type: "ReturnStatement",
      argument: arg,
      position: this.peek().position
    };
  }

  private throwStatement(): ThrowStatement {
    const arg = this.assignment();
    return {
      type: "ThrowStatement",
      argument: arg,
      position: this.peek().position
    };
  }

  private breakStatement(): BreakStatement {
    return {
      type: "BreakStatement",
      position: this.peek().position
    };
  }

  private continueStatement(): ContinueStatement {
    return {
      type: "ContinueStatement",
      position: this.peek().position
    };
  }

  private blockStatement(): BlockStatement {
    const start = this.previous();
    const statements: Statement[] = [];
    
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      statements.push(this.parseStatement());
    }
    
    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after block");
    
    return {
      type: "BlockStatement",
      statements,
      position: start.position
    };
  }

  private expressionStatement(): ExpressionStatement {
    const expr = this.call(this.assignment());
    this.match(TokenType.SEMICOLON);
    return {
      type: "ExpressionStatement",
      expression: expr,
      position: expr.position
    };
  }

  private importStatement(): ImportStatement {
    let specifiers: string[] = [];
    let defaultImport: string | null = null;
    
    if (this.match(TokenType.IDENTIFIER)) {
      defaultImport = this.previous().value;
      if (this.match(TokenType.COMMA)) {
        specifiers = this.parseImportSpecifiers();
      }
    } else if (this.match(TokenType.LEFT_BRACE)) {
      specifiers = this.parseImportSpecifiers();
    }
    
    this.consume(TokenType.DARI, "Expected 'dari' in import statement");
    const source = this.consume(TokenType.STRING, "Expected module specifier").value;
    
    return {
      type: "ImportStatement",
      specifiers,
      source,
      defaultImport,
      position: this.peek().position
    };
  }

  private parseImportSpecifiers(): string[] {
    const specifiers: string[] = [];
    if (this.check(TokenType.RIGHT_BRACE)) {
      this.advance();
      return specifiers;
    }
    
    do {
      specifiers.push(this.consume(TokenType.IDENTIFIER, "Expected identifier").value);
    } while (this.match(TokenType.COMMA));
    
    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after import specifiers");
    return specifiers;
  }

  private exportStatement(): ExportStatement {
    let declaration: Statement;
    
    if (this.match(TokenType.BIKIN)) {
      declaration = this.functionDeclaration();
      (declaration as FunctionDeclaration).isExported = true;
    } else if (this.match(TokenType.CETAK)) {
      declaration = this.classDeclaration();
    } else if (this.match(TokenType.ANE, TokenType.TETEP)) {
      declaration = this.variableDeclaration();
    } else {
      throw BetaError.expected("Expected declaration after 'kasoh'", this.peek().position);
    }
    
    return {
      type: "ExportStatement",
      declaration,
      position: this.peek().position
    };
  }

  private assignment(): Expression {
    let expr = this.ternary();
    
    if (this.match(TokenType.EQUAL, TokenType.PLUS_ASSIGN, TokenType.MINUS_ASSIGN, 
                  TokenType.TIMES_ASSIGN, TokenType.DIVIDE_ASSIGN)) {
      const op = this.previous().value;
      const right = this.assignment();
      expr = {
        type: "AssignmentExpression",
        left: expr,
        operator: op,
        right,
        position: this.peek().position
      };
    }
    
    return expr;
  }

  private ternary(): Expression {
    const expr = this.nullish();
    
    if (this.match(TokenType.QUESTION)) {
      const consequent = this.assignment();
      this.consume(TokenType.COLON, "Expected ':' in ternary expression");
      const alternate = this.assignment();
      return {
        type: "ConditionalExpression",
        test: expr,
        consequent,
        alternate,
        position: this.peek().position
      } as Expression;
    }
    
    return expr;
  }

  private nullish(): Expression {
    let expr = this.or();

    while (this.match(TokenType.NULLISH)) {
      const op = this.previous().value;
      const right = this.or();
      expr = {
        type: "BinaryExpression",
        left: expr,
        operator: op,
        right,
        position: this.peek().position
      };
    }

    return expr;
  }

  private or(): Expression {
    let expr = this.and();
    
    while (this.match(TokenType.OR)) {
      const op = this.previous().value;
      const right = this.and();
      expr = {
        type: "BinaryExpression",
        left: expr,
        operator: op,
        right,
        position: this.peek().position
      };
    }
    
    return expr;
  }

  private and(): Expression {
    let expr = this.equality();
    
    while (this.match(TokenType.AND)) {
      const op = this.previous().value;
      const right = this.equality();
      expr = {
        type: "BinaryExpression",
        left: expr,
        operator: op,
        right,
        position: this.peek().position
      };
    }
    
    return expr;
  }

  private equality(): Expression {
    let expr = this.comparison();
    
    while (this.match(TokenType.EQUAL_EQUAL, TokenType.NOT_EQUAL, 
                      TokenType.STRICT_EQUAL, TokenType.STRICT_NOT_EQUAL)) {
      const op = this.previous().value;
      const right = this.comparison();
      expr = {
        type: "BinaryExpression",
        left: expr,
        operator: op,
        right,
        position: this.peek().position
      };
    }
    
    return expr;
  }

  private comparison(): Expression {
    let expr = this.addition();
    
    while (this.match(TokenType.LESS, TokenType.GREATER, 
                      TokenType.LESS_EQUAL, TokenType.GREATER_EQUAL)) {
      const op = this.previous().value;
      const right = this.addition();
      expr = {
        type: "BinaryExpression",
        left: expr,
        operator: op,
        right,
        position: this.peek().position
      };
    }
    
    return expr;
  }

  private addition(): Expression {
    let expr = this.multiplication();
    
    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const op = this.previous().value;
      const right = this.multiplication();
      expr = {
        type: "BinaryExpression",
        left: expr,
        operator: op,
        right,
        position: this.peek().position
      };
    }
    
    return expr;
  }

  private multiplication(): Expression {
    let expr = this.power();
    
    while (this.match(TokenType.TIMES, TokenType.DIVIDE, TokenType.MODULO)) {
      const op = this.previous().value;
      const right = this.power();
      expr = {
        type: "BinaryExpression",
        left: expr,
        operator: op,
        right,
        position: this.peek().position
      };
    }
    
    return expr;
  }

  private power(): Expression {
    let expr = this.unary();
    
    while (this.match(TokenType.POWER)) {
      const op = this.previous().value;
      const right = this.unary();
      expr = {
        type: "BinaryExpression",
        left: expr,
        operator: op,
        right,
        position: this.peek().position
      };
    }
    
    return expr;
  }

  private unary(): Expression {
    if (this.match(TokenType.NOT, TokenType.MINUS, TokenType.INCREMENT, TokenType.DECREMENT, TokenType.SPREAD)) {
      const op = this.previous().value;
      const arg = this.unary();
      return {
        type: "UnaryExpression",
        operator: op,
        argument: arg,
        prefix: true,
        position: this.peek().position
      };
    }

    if (this.match(TokenType.ITUNGAN)) {
      const arg = this.unary();
      return {
        type: "UnaryExpression",
        operator: "await",
        argument: arg,
        prefix: true,
        position: this.peek().position
      };
    }

    if (this.match(TokenType.SABUT)) {
      if (this.check(TokenType.BABANG)) {
        return this.legacySuperCallExpression();
      }
      return this.unary();
    }
    
    // Handle 'babang' (super) expression
    if (this.match(TokenType.BABANG)) {
      let property: Identifier | undefined;
      let args: Expression[] = [];
      
      // Check for punye (.) after babang for super.property access
      if (this.match(TokenType.PUNYE, TokenType.DOT)) {
        const propName = this.consume(TokenType.IDENTIFIER, "Expected property name after 'punye'").value;
        property = {
          type: "Identifier",
          name: propName,
          position: this.peek().position
        };
      } else if (this.check(TokenType.IDENTIFIER)) {
        this.advance();
        property = {
          type: "Identifier",
          name: this.previous().value,
          position: this.peek().position
        };
      }
      
      if (this.match(TokenType.LEFT_PAREN)) {
        if (!this.check(TokenType.RIGHT_PAREN)) {
          do {
            args.push(this.assignment());
          } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after super call arguments");
      }
      
      return {
        type: "SuperExpression",
        property,
        arguments: args.length > 0 ? args : undefined,
        position: this.peek().position
      };
    }
    
    return this.postfix();
  }

  private postfix(): Expression {
    let expr = this.primary();
    
    while (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
      const op = this.previous().value;
      expr = {
        type: "UnaryExpression",
        operator: op,
        argument: expr,
        prefix: false,
        position: this.peek().position
      };
    }
    
    return this.call(expr);
  }

  private call(expr: Expression): Expression {
    let result = expr;
    
    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        const args: Expression[] = [];
        if (!this.check(TokenType.RIGHT_PAREN)) {
          do {
            args.push(this.assignment());
          } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after arguments");
        
        result = {
          type: "CallExpression",
          callee: result,
          arguments: args,
          optional: false,
          position: this.peek().position
        };
      } else if (this.match(TokenType.DOT, TokenType.PUNYE, TokenType.QUESTION_DOT)) {
        const optional = this.previous().type === TokenType.QUESTION_DOT;
        const property = this.propertyName();
        result = {
          type: "MemberExpression",
          object: result,
          property: {
            type: "Identifier",
            name: property,
            position: this.peek().position
          },
          computed: false,
          optional,
          position: this.peek().position
        };
      } else if (this.match(TokenType.LEFT_BRACKET)) {
        const property = this.assignment();
        this.consume(TokenType.RIGHT_BRACKET, "Expected ']' after computed property");
        result = {
          type: "MemberExpression",
          object: result,
          property,
          computed: true,
          position: this.peek().position
        };
      } else {
        break;
      }
    }
    
    return result;
  }

  private primary(): Expression {
    if (this.match(TokenType.NUMBER)) {
      return {
        type: "Literal",
        value: parseFloat(this.previous().value),
        raw: this.previous().value,
        position: this.peek().position
      };
    }
    
    if (this.match(TokenType.STRING)) {
      return {
        type: "Literal",
        value: this.previous().value,
        raw: this.previous().value,
        position: this.peek().position
      };
    }

    if (this.match(TokenType.TEMPLATE)) {
      return {
        type: "Literal",
        value: this.previous().value,
        raw: this.previous().value,
        position: this.peek().position
      };
    }

    if (this.match(TokenType.REGEX)) {
      return {
        type: "Literal",
        value: this.previous().value,
        raw: this.previous().value,
        position: this.peek().position
      };
    }
    
if (this.match(TokenType.BETOEL)) {
      return {
        type: "Literal",
        value: true,
        raw: "true",
        position: this.peek().position
      };
    }
    
    if (this.match(TokenType.KAGA)) {
      return {
        type: "Literal",
        value: false,
        raw: "false",
        position: this.peek().position
      };
    }
    
    if (this.match(TokenType.KOSONG)) {
      return {
        type: "Literal",
        value: null,
        raw: "null",
        position: this.peek().position
      };
    }
    
    if (this.match(TokenType.ENTAH)) {
      return {
        type: "Literal",
        value: undefined,
        raw: "undefined",
        position: this.peek().position
      };
    }
    
    if (this.match(TokenType.GUA)) {
      return {
        type: "Identifier",
        name: "this",
        position: this.peek().position
      };
    }
    
    // Handle 'anyar' (new) expression
    if (this.match(TokenType.ANYAR)) {
      const callee = this.consume(TokenType.IDENTIFIER, "Expected class name").value;
      
      let args: Expression[] = [];
      if (this.match(TokenType.LEFT_PAREN)) {
        if (!this.check(TokenType.RIGHT_PAREN)) {
          do {
            args.push(this.assignment());
          } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after new arguments");
      }
      
      return {
        type: "NewExpression",
        callee,
        arguments: args,
        position: this.peek().position
      };
    }
    
    if (this.check(TokenType.DERET) && this.current + 1 < this.tokens.length && this.tokens[this.current + 1].type === TokenType.LEFT_BRACKET) {
      this.advance();
      this.consume(TokenType.LEFT_BRACKET, "Expected '[' after 'deret'");
      return this.arrayLiteralAfterLeftBracket();
    }

    if (this.isBuiltinIdentifier(this.peek().type)) {
      const token = this.advance();
      return {
        type: "Identifier",
        name: token.value || token.type,
        position: this.peek().position
      };
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return {
        type: "Identifier",
        name: this.previous().value,
        position: this.peek().position
      };
    }
    
    if (this.match(TokenType.LEFT_BRACKET)) {
      const elements: Expression[] = [];
      if (!this.check(TokenType.RIGHT_BRACKET)) {
        do {
          elements.push(this.assignment());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RIGHT_BRACKET, "Expected ']' after array elements");
      
      return {
        type: "ArrayExpression",
        elements,
        position: this.peek().position
      };
    }

    if (this.match(TokenType.LEFT_BRACE)) {
      return this.objectExpression();
    }
    
    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.assignment();
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression");
      return expr;
    }
    
throw BetaError.expected("Expected expression", this.peek().position);
  }

  private legacySuperCallExpression(): SuperExpression {
    const token = this.consume(TokenType.BABANG, "Expected 'babang' after 'panggil'");
    let property: Identifier | undefined;

    if (this.match(TokenType.PUNYE, TokenType.DOT)) {
      if (this.match(TokenType.BIKIN)) {
        if (this.match(TokenType.ANYAR, TokenType.MULA)) {
          property = {
            type: "Identifier",
            name: "constructor",
            position: this.peek().position
          };
        } else {
          property = {
            type: "Identifier",
            name: "bikin",
            position: this.peek().position
          };
        }
      } else if (this.match(TokenType.MULA, TokenType.ANYAR)) {
        property = {
          type: "Identifier",
          name: "constructor",
          position: this.peek().position
        };
      } else {
        property = {
          type: "Identifier",
          name: this.propertyName(),
          position: this.peek().position
        };
      }
    }

    const args: Expression[] = [];
    if (this.match(TokenType.LEFT_PAREN)) {
      if (!this.check(TokenType.RIGHT_PAREN)) {
        do {
          args.push(this.assignment());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after super arguments");
    }

    return {
      type: "SuperExpression",
      property,
      arguments: args,
      position: token.position
    };
  }

  private isBuiltinIdentifier(type: TokenType): boolean {
    return type === TokenType.TERIAK ||
      type === TokenType.BISIK ||
      type === TokenType.DENGERIN ||
      type === TokenType.SEBRAPA ||
      type === TokenType.APE ||
      type === TokenType.ITUNGAN ||
      type === TokenType.OMONGAN ||
      type === TokenType.KUMPULIN ||
      type === TokenType.ACAK ||
      type === TokenType.TIDUR ||
      type === TokenType.DERET ||
      type === TokenType.ANGKA ||
      type === TokenType.KATA;
  }

  private propertyName(): string {
    if (this.check(TokenType.IDENTIFIER)) return this.advance().value;
    if (this.isBuiltinIdentifier(this.peek().type)) {
      const token = this.advance();
      return token.value || token.type;
    }
    throw BetaError.expected("Expected property name", this.peek().position);
  }
  
  private objectExpression(): Expression {
    const properties: ObjectProperty[] = [];
    
    if (!this.check(TokenType.RIGHT_BRACE)) {
      do {
        if (this.match(TokenType.SPREAD)) {
          properties.push({
            type: "ObjectProperty",
            key: "__spread",
            value: this.assignment(),
            position: this.peek().position
          });
          continue;
        }

        let key: string | Expression;
        const keyToken = this.peek();
        
        if (keyToken.type === TokenType.IDENTIFIER) {
          this.advance();
          key = keyToken.value;
        } else if (keyToken.type === TokenType.STRING) {
          this.advance();
          key = keyToken.value;
        } else {
          this.advance();
          key = this.assignment();
        }
        
        this.consume(TokenType.COLON, "Expected ':' in object property");
        const value = this.assignment();
        
        properties.push({
          type: "ObjectProperty",
          key,
          value,
          position: this.peek().position
        });
      } while (this.match(TokenType.COMMA));
    }
    
    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after object properties");
    
    return {
      type: "ObjectExpression",
      properties,
      position: this.peek().position
    };
  }

  private bindingPattern(): string {
    if (this.check(TokenType.IDENTIFIER)) {
      return this.advance().value;
    }
    if (this.check(TokenType.LEFT_BRACE) || this.check(TokenType.LEFT_BRACKET)) {
      const opening = this.advance();
      const closing = opening.type === TokenType.LEFT_BRACE ? TokenType.RIGHT_BRACE : TokenType.RIGHT_BRACKET;
      let depth = 1;
      const parts = [opening.value || opening.type];

      while (!this.isAtEnd() && depth > 0) {
        const token = this.advance();
        const value = token.value || token.type;
        parts.push(value);
        if (token.type === opening.type) depth++;
        if (token.type === closing) depth--;
      }

      if (depth !== 0) {
        throw BetaError.expected("Expected closing destructuring pattern", this.peek().position);
      }

      return parts.join(" ")
        .replace(/\s*([{}[\],:])\s*/g, "$1")
        .replace(/\s+/g, " ");
    }
    throw BetaError.expected("Expected variable name", this.peek().position);
  }

  private skipGenericParameters(): void {
    if (!this.match(TokenType.LESS)) return;
    let depth = 1;
    while (!this.isAtEnd() && depth > 0) {
      if (this.match(TokenType.LESS)) depth++;
      else if (this.match(TokenType.GREATER)) depth--;
      else this.advance();
    }
  }

  private arrayLiteralAfterLeftBracket(): ArrayExpression {
    const elements: Expression[] = [];
    if (!this.check(TokenType.RIGHT_BRACKET)) {
      do {
        elements.push(this.assignment());
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RIGHT_BRACKET, "Expected ']' after array elements");

    return {
      type: "ArrayExpression",
      elements,
      position: this.peek().position
    };
  }

  private getTypeAnnotation(token: Token): TypeAnnotation {
    switch (token.type) {
      case TokenType.ANGKA: return "angka";
      case TokenType.KATA: return "kata";
      case TokenType.BETOEL: return "betoel";
      case TokenType.DERET: return "deret";
      case TokenType.IDENTIFIER: return token.value;
      default: throw BetaError.expected("Expected type annotation", token.position);
    }
  }
}

type TypeAnnotation = "angka" | "kata" | "betoel" | "deret" | "peta" | string;

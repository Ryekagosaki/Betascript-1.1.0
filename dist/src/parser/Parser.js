"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const Token_1 = require("../lexer/Token");
const BetaError_1 = require("../utils/BetaError");
class Parser {
    source;
    tokens = [];
    current = 0;
    constructor(source) {
        this.source = source;
    }
    parse(tokens) {
        this.tokens = tokens;
        this.current = 0;
        const statements = [];
        while (!this.isAtEnd()) {
            statements.push(this.parseStatement());
        }
        return {
            type: "Program",
            body: statements
        };
    }
    isAtEnd() {
        return this.peek().type === Token_1.TokenType.EOF;
    }
    peek() {
        return this.tokens[this.current];
    }
    previous() {
        return this.tokens[this.current - 1];
    }
    advance() {
        if (!this.isAtEnd())
            this.current++;
        return this.previous();
    }
    check(type) {
        if (this.isAtEnd())
            return false;
        return this.peek().type === type;
    }
    checkNext(type) {
        if (this.current + 1 >= this.tokens.length)
            return false;
        return this.tokens[this.current + 1].type === type;
    }
    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    consume(type, message) {
        if (this.check(type))
            return this.advance();
        throw BetaError_1.BetaError.expected(message, this.peek().position);
    }
    parseStatement() {
        if (this.isStrictModeDirective())
            return this.strictModeStatement();
        if (this.match(Token_1.TokenType.AMBIL))
            return this.importStatement();
        if (this.match(Token_1.TokenType.KASOH))
            return this.kasohStatement();
        if (this.match(Token_1.TokenType.ANE, Token_1.TokenType.TETEP))
            return this.variableDeclaration();
        const isAsync = this.match(Token_1.TokenType.NANTI);
        if (this.match(Token_1.TokenType.BIKIN))
            return this.functionDeclaration(isAsync);
        if (this.match(Token_1.TokenType.CETAK))
            return this.classDeclaration();
        if (this.match(Token_1.TokenType.ANTARMUKA))
            return this.interfaceDeclaration();
        if (this.match(Token_1.TokenType.KALO))
            return this.ifStatement();
        if (this.match(Token_1.TokenType.SELAGI))
            return this.whileStatement();
        if (this.match(Token_1.TokenType.KERJAIN))
            return this.doWhileStatement();
        if (this.match(Token_1.TokenType.ITUNG))
            return this.forStatement();
        if (this.match(Token_1.TokenType.SABAN))
            return this.forEachStatement();
        if (this.match(Token_1.TokenType.PILIH))
            return this.switchStatement();
        if (this.match(Token_1.TokenType.COBA))
            return this.tryStatement();
        if (this.match(Token_1.TokenType.LEMPAR))
            return this.throwStatement();
        if (this.match(Token_1.TokenType.DAH))
            return this.breakStatement();
        if (this.match(Token_1.TokenType.LANJUT))
            return this.continueStatement();
        if (this.match(Token_1.TokenType.LEFT_BRACE))
            return this.parseBlockBody();
        if (this.match(Token_1.TokenType.SEMICOLON)) {
            return {
                type: "EmptyStatement",
                position: this.previous().position
            };
        }
        return this.expressionStatement();
    }
    isStrictModeDirective() {
        return this.check(Token_1.TokenType.IDENTIFIER) && this.peek().value === "mode" &&
            this.current + 1 < this.tokens.length &&
            this.tokens[this.current + 1].type === Token_1.TokenType.IDENTIFIER &&
            this.tokens[this.current + 1].value === "ketat";
    }
    strictModeStatement() {
        const token = this.advance();
        this.advance();
        this.match(Token_1.TokenType.SEMICOLON);
        return { type: "EmptyStatement", position: token.position };
    }
    kasohStatement() {
        if (this.check(Token_1.TokenType.BIKIN) || this.check(Token_1.TokenType.CETAK) ||
            this.check(Token_1.TokenType.ANE) || this.check(Token_1.TokenType.TETEP)) {
            return this.exportStatement();
        }
        return this.returnStatement();
    }
    variableDeclaration() {
        const token = this.previous();
        const kind = token.type === Token_1.TokenType.ANE ? "ane" : "tetep";
        const name = this.bindingPattern();
        let typeAnnotation;
        if (this.match(Token_1.TokenType.COLON)) {
            const typeToken = this.advance();
            typeAnnotation = this.getTypeAnnotation(typeToken);
        }
        let initializer = null;
        if (this.match(Token_1.TokenType.EQUAL)) {
            initializer = this.assignment();
        }
        else if (this.match(Token_1.TokenType.PLUS_ASSIGN, Token_1.TokenType.MINUS_ASSIGN, Token_1.TokenType.TIMES_ASSIGN, Token_1.TokenType.DIVIDE_ASSIGN)) {
            const op = this.previous().value;
            const right = this.assignment();
            initializer = {
                type: "BinaryExpression",
                operator: op.slice(0, -1),
                left: { type: "Identifier", name, position: this.peek().position },
                right,
                position: this.peek().position
            };
        }
        this.match(Token_1.TokenType.SEMICOLON);
        return {
            type: "VariableDeclaration",
            kind,
            name,
            typeAnnotation,
            initializer,
            position: token.position
        };
    }
    functionDeclaration(isAsync = false) {
        const token = this.previous();
        const name = this.consume(Token_1.TokenType.IDENTIFIER, "Expected function name").value;
        this.skipGenericParameters();
        this.consume(Token_1.TokenType.LEFT_PAREN, "Expected '(' after function name");
        const parameters = this.parameters();
        this.consume(Token_1.TokenType.RIGHT_PAREN, "Expected ')' after parameters");
        // Handle return type annotation
        let returnType;
        if (this.match(Token_1.TokenType.COLON)) {
            const typeToken = this.advance();
            returnType = this.getTypeAnnotation(typeToken);
        }
        this.consume(Token_1.TokenType.LEFT_BRACE, "Expected '{' before function body");
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
    parameters() {
        const params = [];
        if (!this.check(Token_1.TokenType.RIGHT_PAREN)) {
            do {
                const ente = this.match(Token_1.TokenType.ENTE);
                const isRest = this.match(Token_1.TokenType.SPREAD);
                const name = this.consume(Token_1.TokenType.IDENTIFIER, "Expected parameter name").value;
                let paramType;
                if (this.match(Token_1.TokenType.COLON)) {
                    const typeToken = this.advance();
                    paramType = this.getTypeAnnotation(typeToken);
                }
                params.push({
                    name,
                    type: paramType,
                    isRest,
                    position: this.peek().position
                });
            } while (this.match(Token_1.TokenType.COMMA));
        }
        return params;
    }
    classDeclaration() {
        const name = this.consume(Token_1.TokenType.IDENTIFIER, "Expected class name").value;
        let superclass;
        if (this.match(Token_1.TokenType.TURUN)) {
            superclass = this.consume(Token_1.TokenType.IDENTIFIER, "Expected superclass name").value;
        }
        const interfaces = [];
        if (this.match(Token_1.TokenType.IKUT)) {
            do {
                interfaces.push(this.consume(Token_1.TokenType.IDENTIFIER, "Expected interface name").value);
            } while (this.match(Token_1.TokenType.COMMA));
        }
        this.consume(Token_1.TokenType.LEFT_BRACE, "Expected '{' before class body");
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
    classMembers() {
        const members = [];
        while (!this.check(Token_1.TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            let isStatic = false;
            // Check for static keyword
            if (this.match(Token_1.TokenType.STATIK))
                isStatic = true;
            // Constructor with final Betawi keyword: mula(...)
            if (this.match(Token_1.TokenType.MULA)) {
                this.consume(Token_1.TokenType.LEFT_PAREN, "Expected '(' after 'mula'");
                const parameters = this.parameters();
                this.consume(Token_1.TokenType.RIGHT_PAREN, "Expected ')' after parameters");
                this.consume(Token_1.TokenType.LEFT_BRACE, "Expected '{' before constructor body");
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
            }
            else if (this.match(Token_1.TokenType.BIKIN)) {
                // Check if 'anyar' follows (constructor)
                if (this.check(Token_1.TokenType.ANYAR)) {
                    this.advance(); // consume 'anyar' keyword
                    // Constructor without explicit name
                    this.consume(Token_1.TokenType.LEFT_PAREN, "Expected '(' after 'anyar'");
                    const parameters = this.parameters();
                    this.consume(Token_1.TokenType.RIGHT_PAREN, "Expected ')' after parameters");
                    this.consume(Token_1.TokenType.LEFT_BRACE, "Expected '{' before constructor body");
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
                }
                else {
                    // Regular method with 'bikin' - get name
                    const nameToken = this.consume(Token_1.TokenType.IDENTIFIER, "Expected method name");
                    const name = nameToken.value;
                    this.consume(Token_1.TokenType.LEFT_PAREN, "Expected '(' after method name");
                    const parameters = this.parameters();
                    this.consume(Token_1.TokenType.RIGHT_PAREN, "Expected ')' after parameters");
                    this.consume(Token_1.TokenType.LEFT_BRACE, "Expected '{' before method body");
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
            }
            else if (this.check(Token_1.TokenType.IDENTIFIER) && this.peek().value !== "statik") {
                // Method without 'bikin' keyword (shorthand)
                const nameToken = this.consume(Token_1.TokenType.IDENTIFIER, "Expected method name");
                const name = nameToken.value;
                this.consume(Token_1.TokenType.LEFT_PAREN, "Expected '(' after method name");
                const parameters = this.parameters();
                this.consume(Token_1.TokenType.RIGHT_PAREN, "Expected ')' after parameters");
                let returnType;
                if (this.match(Token_1.TokenType.COLON)) {
                    const typeToken = this.advance();
                    returnType = this.getTypeAnnotation(typeToken);
                }
                this.consume(Token_1.TokenType.LEFT_BRACE, "Expected '{' before method body");
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
            else if (this.match(Token_1.TokenType.ANE, Token_1.TokenType.TETEP)) {
                // Field declaration inside class
                const fieldToken = this.previous();
                const fieldName = this.consume(Token_1.TokenType.IDENTIFIER, "Expected field name").value;
                let initializer = null;
                if (this.match(Token_1.TokenType.EQUAL)) {
                    initializer = this.assignment();
                }
                // Optional semicolon
                this.match(Token_1.TokenType.SEMICOLON);
                members.push({
                    type: "FieldDeclaration",
                    name: fieldName,
                    visibility: "public",
                    isStatic: isStatic,
                    initializer,
                    position: this.peek().position
                });
            }
            else {
                // Unknown statement in class - break to avoid infinite loop
                break;
            }
        }
        this.consume(Token_1.TokenType.RIGHT_BRACE, "Expected '}' after class body");
        return members;
    }
    interfaceDeclaration() {
        const name = this.consume(Token_1.TokenType.IDENTIFIER, "Expected interface name").value;
        this.consume(Token_1.TokenType.LEFT_BRACE, "Expected '{' before interface body");
        const methods = [];
        while (!this.check(Token_1.TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            const methodName = this.consume(Token_1.TokenType.IDENTIFIER, "Expected method name").value;
            this.consume(Token_1.TokenType.LEFT_PAREN, "Expected '(' after method name");
            const parameters = this.parameters();
            this.consume(Token_1.TokenType.RIGHT_PAREN, "Expected ')' after parameters");
            let returnType;
            if (this.match(Token_1.TokenType.COLON)) {
                const typeToken = this.advance();
                returnType = this.getTypeAnnotation(typeToken);
            }
            this.match(Token_1.TokenType.SEMICOLON);
            methods.push({
                type: "InterfaceMethod",
                name: methodName,
                parameters,
                returnType,
                position: this.peek().position
            });
        }
        this.consume(Token_1.TokenType.RIGHT_BRACE, "Expected '}' after interface body");
        return {
            type: "InterfaceDeclaration",
            name,
            methods,
            position: this.peek().position
        };
    }
    ifStatement() {
        this.consume(Token_1.TokenType.LEFT_PAREN, "Expected '(' after 'kalo'");
        const test = this.assignment();
        this.consume(Token_1.TokenType.RIGHT_PAREN, "Expected ')' after condition");
        this.consume(Token_1.TokenType.LEFT_BRACE, "Expected '{' after if condition");
        const consequent = this.parseBlockBody();
        let alternate = null;
        if (this.match(Token_1.TokenType.KAGAKNYE)) {
            alternate = {
                type: "ElseClause",
                ifStatement: this.ifStatement(),
                position: this.peek().position
            };
        }
        else if (this.match(Token_1.TokenType.UDAH_GITUH)) {
            this.consume(Token_1.TokenType.LEFT_BRACE, "Expected '{' after else");
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
    parseBlockBody() {
        const start = this.previous();
        const statements = [];
        while (!this.check(Token_1.TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            statements.push(this.parseStatement());
        }
        this.consume(Token_1.TokenType.RIGHT_BRACE, "Expected '}' after block");
        return {
            type: "BlockStatement",
            statements,
            position: start.position
        };
    }
    whileStatement() {
        this.consume(Token_1.TokenType.LEFT_PAREN, "Expected '(' after 'selagi'");
        const test = this.assignment();
        this.consume(Token_1.TokenType.RIGHT_PAREN, "Expected ')' after condition");
        this.consume(Token_1.TokenType.LEFT_BRACE, "Expected '{' after while condition");
        const body = this.parseBlockBody();
        return {
            type: "WhileStatement",
            test,
            body,
            position: this.peek().position
        };
    }
    doWhileStatement() {
        const token = this.previous();
        this.consume(Token_1.TokenType.LEFT_BRACE, "Expected '{' after 'kerjain'");
        const body = this.parseBlockBody();
        this.consume(Token_1.TokenType.SELAGI, "Expected 'selagi' after do-while body");
        this.consume(Token_1.TokenType.LEFT_PAREN, "Expected '(' after 'selagi'");
        const test = this.assignment();
        this.consume(Token_1.TokenType.RIGHT_PAREN, "Expected ')' after do-while condition");
        this.match(Token_1.TokenType.SEMICOLON);
        return {
            type: "DoWhileStatement",
            body,
            test,
            position: token.position
        };
    }
    forStatement() {
        this.consume(Token_1.TokenType.LEFT_PAREN, "Expected '(' after 'itung'");
        if (!this.match(Token_1.TokenType.ANE, Token_1.TokenType.TETEP)) {
            throw BetaError_1.BetaError.expected("Expected variable declaration after 'itung ('", this.peek().position);
        }
        const init = this.variableDeclaration();
        const test = this.assignment();
        this.consume(Token_1.TokenType.SEMICOLON, "Expected ';' after for condition");
        const update = this.assignment();
        this.consume(Token_1.TokenType.RIGHT_PAREN, "Expected ')' after for update");
        this.consume(Token_1.TokenType.LEFT_BRACE, "Expected '{' after for update");
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
    forEachStatement() {
        let kind = "ane";
        this.consume(Token_1.TokenType.LEFT_PAREN, "Expected '(' after 'saban'");
        if (this.match(Token_1.TokenType.TETEP))
            kind = "tetep";
        else
            this.match(Token_1.TokenType.ANE);
        const variable = this.consume(Token_1.TokenType.IDENTIFIER, "Expected variable name").value;
        this.consume(Token_1.TokenType.DARI, "Expected 'dari' after variable");
        const iterable = this.assignment();
        this.consume(Token_1.TokenType.RIGHT_PAREN, "Expected ')' after iterable");
        this.consume(Token_1.TokenType.LEFT_BRACE, "Expected '{' after iterable");
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
    switchStatement() {
        this.consume(Token_1.TokenType.LEFT_PAREN, "Expected '(' after 'pilih'");
        const discriminant = this.assignment();
        this.consume(Token_1.TokenType.RIGHT_PAREN, "Expected ')' after discriminant");
        this.consume(Token_1.TokenType.LEFT_BRACE, "Expected '{' before switch cases");
        const cases = [];
        while (!this.check(Token_1.TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            const isDefault = this.match(Token_1.TokenType.BODO_AMAT);
            let test = null;
            if (!isDefault) {
                this.consume(Token_1.TokenType.KALO_GINI, "Expected 'kalo_gini'");
                test = this.assignment();
            }
            this.consume(Token_1.TokenType.COLON, "Expected ':' after case keyword");
            const consequent = [];
            while (!this.check(Token_1.TokenType.KALO_GINI) &&
                !this.check(Token_1.TokenType.BODO_AMAT) &&
                !this.check(Token_1.TokenType.RIGHT_BRACE) &&
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
        this.consume(Token_1.TokenType.RIGHT_BRACE, "Expected '}' after switch cases");
        return {
            type: "SwitchStatement",
            discriminant,
            cases,
            position: this.peek().position
        };
    }
    tryStatement() {
        this.consume(Token_1.TokenType.LEFT_BRACE, "Expected '{' after try");
        const block = this.parseBlockBody();
        let handler = null;
        let finalizer = null;
        if (this.match(Token_1.TokenType.TANGKEP)) {
            this.consume(Token_1.TokenType.LEFT_PAREN, "Expected '(' after 'tangkep'");
            let param = null;
            if (this.match(Token_1.TokenType.ENTE)) {
                param = this.consume(Token_1.TokenType.IDENTIFIER, "Expected catch parameter name").value;
            }
            else if (this.check(Token_1.TokenType.IDENTIFIER)) {
                param = this.advance().value;
            }
            this.consume(Token_1.TokenType.RIGHT_PAREN, "Expected ')' after catch parameter");
            this.consume(Token_1.TokenType.LEFT_BRACE, "Expected '{' after catch");
            const catchBlock = this.parseBlockBody();
            handler = {
                type: "CatchClause",
                param,
                block: catchBlock,
                position: this.peek().position
            };
        }
        if (this.match(Token_1.TokenType.AKHIRNYE)) {
            this.consume(Token_1.TokenType.LEFT_BRACE, "Expected '{' after finally");
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
    returnStatement() {
        const arg = !this.check(Token_1.TokenType.SEMICOLON) && !this.check(Token_1.TokenType.RIGHT_BRACE) ? this.assignment() : null;
        return {
            type: "ReturnStatement",
            argument: arg,
            position: this.peek().position
        };
    }
    throwStatement() {
        const arg = this.assignment();
        return {
            type: "ThrowStatement",
            argument: arg,
            position: this.peek().position
        };
    }
    breakStatement() {
        return {
            type: "BreakStatement",
            position: this.peek().position
        };
    }
    continueStatement() {
        return {
            type: "ContinueStatement",
            position: this.peek().position
        };
    }
    blockStatement() {
        const start = this.previous();
        const statements = [];
        while (!this.check(Token_1.TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            statements.push(this.parseStatement());
        }
        this.consume(Token_1.TokenType.RIGHT_BRACE, "Expected '}' after block");
        return {
            type: "BlockStatement",
            statements,
            position: start.position
        };
    }
    expressionStatement() {
        const expr = this.call(this.assignment());
        this.match(Token_1.TokenType.SEMICOLON);
        return {
            type: "ExpressionStatement",
            expression: expr,
            position: expr.position
        };
    }
    importStatement() {
        let specifiers = [];
        let defaultImport = null;
        if (this.match(Token_1.TokenType.IDENTIFIER)) {
            defaultImport = this.previous().value;
            if (this.match(Token_1.TokenType.COMMA)) {
                specifiers = this.parseImportSpecifiers();
            }
        }
        else if (this.match(Token_1.TokenType.LEFT_BRACE)) {
            specifiers = this.parseImportSpecifiers();
        }
        this.consume(Token_1.TokenType.DARI, "Expected 'dari' in import statement");
        const source = this.consume(Token_1.TokenType.STRING, "Expected module specifier").value;
        return {
            type: "ImportStatement",
            specifiers,
            source,
            defaultImport,
            position: this.peek().position
        };
    }
    parseImportSpecifiers() {
        const specifiers = [];
        if (this.check(Token_1.TokenType.RIGHT_BRACE)) {
            this.advance();
            return specifiers;
        }
        do {
            specifiers.push(this.consume(Token_1.TokenType.IDENTIFIER, "Expected identifier").value);
        } while (this.match(Token_1.TokenType.COMMA));
        this.consume(Token_1.TokenType.RIGHT_BRACE, "Expected '}' after import specifiers");
        return specifiers;
    }
    exportStatement() {
        let declaration;
        if (this.match(Token_1.TokenType.BIKIN)) {
            declaration = this.functionDeclaration();
            declaration.isExported = true;
        }
        else if (this.match(Token_1.TokenType.CETAK)) {
            declaration = this.classDeclaration();
        }
        else if (this.match(Token_1.TokenType.ANE, Token_1.TokenType.TETEP)) {
            declaration = this.variableDeclaration();
        }
        else {
            throw BetaError_1.BetaError.expected("Expected declaration after 'kasoh'", this.peek().position);
        }
        return {
            type: "ExportStatement",
            declaration,
            position: this.peek().position
        };
    }
    assignment() {
        let expr = this.ternary();
        if (this.match(Token_1.TokenType.EQUAL, Token_1.TokenType.PLUS_ASSIGN, Token_1.TokenType.MINUS_ASSIGN, Token_1.TokenType.TIMES_ASSIGN, Token_1.TokenType.DIVIDE_ASSIGN)) {
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
    ternary() {
        const expr = this.nullish();
        if (this.match(Token_1.TokenType.QUESTION)) {
            const consequent = this.assignment();
            this.consume(Token_1.TokenType.COLON, "Expected ':' in ternary expression");
            const alternate = this.assignment();
            return {
                type: "ConditionalExpression",
                test: expr,
                consequent,
                alternate,
                position: this.peek().position
            };
        }
        return expr;
    }
    nullish() {
        let expr = this.or();
        while (this.match(Token_1.TokenType.NULLISH)) {
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
    or() {
        let expr = this.and();
        while (this.match(Token_1.TokenType.OR)) {
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
    and() {
        let expr = this.equality();
        while (this.match(Token_1.TokenType.AND)) {
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
    equality() {
        let expr = this.comparison();
        while (this.match(Token_1.TokenType.EQUAL_EQUAL, Token_1.TokenType.NOT_EQUAL, Token_1.TokenType.STRICT_EQUAL, Token_1.TokenType.STRICT_NOT_EQUAL)) {
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
    comparison() {
        let expr = this.addition();
        while (this.match(Token_1.TokenType.LESS, Token_1.TokenType.GREATER, Token_1.TokenType.LESS_EQUAL, Token_1.TokenType.GREATER_EQUAL)) {
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
    addition() {
        let expr = this.multiplication();
        while (this.match(Token_1.TokenType.PLUS, Token_1.TokenType.MINUS)) {
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
    multiplication() {
        let expr = this.power();
        while (this.match(Token_1.TokenType.TIMES, Token_1.TokenType.DIVIDE, Token_1.TokenType.MODULO)) {
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
    power() {
        let expr = this.unary();
        while (this.match(Token_1.TokenType.POWER)) {
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
    unary() {
        if (this.match(Token_1.TokenType.NOT, Token_1.TokenType.MINUS, Token_1.TokenType.INCREMENT, Token_1.TokenType.DECREMENT, Token_1.TokenType.SPREAD)) {
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
        if (this.match(Token_1.TokenType.ITUNGAN)) {
            const arg = this.unary();
            return {
                type: "UnaryExpression",
                operator: "await",
                argument: arg,
                prefix: true,
                position: this.peek().position
            };
        }
        if (this.match(Token_1.TokenType.SABUT)) {
            if (this.check(Token_1.TokenType.BABANG)) {
                return this.legacySuperCallExpression();
            }
            return this.unary();
        }
        // Handle 'babang' (super) expression
        if (this.match(Token_1.TokenType.BABANG)) {
            let property;
            let args = [];
            // Check for punye (.) after babang for super.property access
            if (this.match(Token_1.TokenType.PUNYE, Token_1.TokenType.DOT)) {
                const propName = this.consume(Token_1.TokenType.IDENTIFIER, "Expected property name after 'punye'").value;
                property = {
                    type: "Identifier",
                    name: propName,
                    position: this.peek().position
                };
            }
            else if (this.check(Token_1.TokenType.IDENTIFIER)) {
                this.advance();
                property = {
                    type: "Identifier",
                    name: this.previous().value,
                    position: this.peek().position
                };
            }
            if (this.match(Token_1.TokenType.LEFT_PAREN)) {
                if (!this.check(Token_1.TokenType.RIGHT_PAREN)) {
                    do {
                        args.push(this.assignment());
                    } while (this.match(Token_1.TokenType.COMMA));
                }
                this.consume(Token_1.TokenType.RIGHT_PAREN, "Expected ')' after super call arguments");
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
    postfix() {
        let expr = this.primary();
        while (this.match(Token_1.TokenType.INCREMENT, Token_1.TokenType.DECREMENT)) {
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
    call(expr) {
        let result = expr;
        while (true) {
            if (this.match(Token_1.TokenType.LEFT_PAREN)) {
                const args = [];
                if (!this.check(Token_1.TokenType.RIGHT_PAREN)) {
                    do {
                        args.push(this.assignment());
                    } while (this.match(Token_1.TokenType.COMMA));
                }
                this.consume(Token_1.TokenType.RIGHT_PAREN, "Expected ')' after arguments");
                result = {
                    type: "CallExpression",
                    callee: result,
                    arguments: args,
                    optional: false,
                    position: this.peek().position
                };
            }
            else if (this.match(Token_1.TokenType.DOT, Token_1.TokenType.PUNYE, Token_1.TokenType.QUESTION_DOT)) {
                const optional = this.previous().type === Token_1.TokenType.QUESTION_DOT;
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
            }
            else if (this.match(Token_1.TokenType.LEFT_BRACKET)) {
                const property = this.assignment();
                this.consume(Token_1.TokenType.RIGHT_BRACKET, "Expected ']' after computed property");
                result = {
                    type: "MemberExpression",
                    object: result,
                    property,
                    computed: true,
                    position: this.peek().position
                };
            }
            else {
                break;
            }
        }
        return result;
    }
    primary() {
        if (this.match(Token_1.TokenType.NUMBER)) {
            return {
                type: "Literal",
                value: parseFloat(this.previous().value),
                raw: this.previous().value,
                position: this.peek().position
            };
        }
        if (this.match(Token_1.TokenType.STRING)) {
            return {
                type: "Literal",
                value: this.previous().value,
                raw: this.previous().value,
                position: this.peek().position
            };
        }
        if (this.match(Token_1.TokenType.TEMPLATE)) {
            return {
                type: "Literal",
                value: this.previous().value,
                raw: this.previous().value,
                position: this.peek().position
            };
        }
        if (this.match(Token_1.TokenType.REGEX)) {
            return {
                type: "Literal",
                value: this.previous().value,
                raw: this.previous().value,
                position: this.peek().position
            };
        }
        if (this.match(Token_1.TokenType.BETOEL)) {
            return {
                type: "Literal",
                value: true,
                raw: "true",
                position: this.peek().position
            };
        }
        if (this.match(Token_1.TokenType.KAGA)) {
            return {
                type: "Literal",
                value: false,
                raw: "false",
                position: this.peek().position
            };
        }
        if (this.match(Token_1.TokenType.KOSONG)) {
            return {
                type: "Literal",
                value: null,
                raw: "null",
                position: this.peek().position
            };
        }
        if (this.match(Token_1.TokenType.ENTAH)) {
            return {
                type: "Literal",
                value: undefined,
                raw: "undefined",
                position: this.peek().position
            };
        }
        if (this.match(Token_1.TokenType.GUA)) {
            return {
                type: "Identifier",
                name: "this",
                position: this.peek().position
            };
        }
        // Handle 'anyar' (new) expression
        if (this.match(Token_1.TokenType.ANYAR)) {
            const callee = this.consume(Token_1.TokenType.IDENTIFIER, "Expected class name").value;
            let args = [];
            if (this.match(Token_1.TokenType.LEFT_PAREN)) {
                if (!this.check(Token_1.TokenType.RIGHT_PAREN)) {
                    do {
                        args.push(this.assignment());
                    } while (this.match(Token_1.TokenType.COMMA));
                }
                this.consume(Token_1.TokenType.RIGHT_PAREN, "Expected ')' after new arguments");
            }
            return {
                type: "NewExpression",
                callee,
                arguments: args,
                position: this.peek().position
            };
        }
        if (this.check(Token_1.TokenType.DERET) && this.current + 1 < this.tokens.length && this.tokens[this.current + 1].type === Token_1.TokenType.LEFT_BRACKET) {
            this.advance();
            this.consume(Token_1.TokenType.LEFT_BRACKET, "Expected '[' after 'deret'");
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
        if (this.match(Token_1.TokenType.IDENTIFIER)) {
            return {
                type: "Identifier",
                name: this.previous().value,
                position: this.peek().position
            };
        }
        if (this.match(Token_1.TokenType.LEFT_BRACKET)) {
            const elements = [];
            if (!this.check(Token_1.TokenType.RIGHT_BRACKET)) {
                do {
                    elements.push(this.assignment());
                } while (this.match(Token_1.TokenType.COMMA));
            }
            this.consume(Token_1.TokenType.RIGHT_BRACKET, "Expected ']' after array elements");
            return {
                type: "ArrayExpression",
                elements,
                position: this.peek().position
            };
        }
        if (this.match(Token_1.TokenType.LEFT_BRACE)) {
            return this.objectExpression();
        }
        if (this.match(Token_1.TokenType.LEFT_PAREN)) {
            const expr = this.assignment();
            this.consume(Token_1.TokenType.RIGHT_PAREN, "Expected ')' after expression");
            return expr;
        }
        throw BetaError_1.BetaError.expected("Expected expression", this.peek().position);
    }
    legacySuperCallExpression() {
        const token = this.consume(Token_1.TokenType.BABANG, "Expected 'babang' after 'panggil'");
        let property;
        if (this.match(Token_1.TokenType.PUNYE, Token_1.TokenType.DOT)) {
            if (this.match(Token_1.TokenType.BIKIN)) {
                if (this.match(Token_1.TokenType.ANYAR, Token_1.TokenType.MULA)) {
                    property = {
                        type: "Identifier",
                        name: "constructor",
                        position: this.peek().position
                    };
                }
                else {
                    property = {
                        type: "Identifier",
                        name: "bikin",
                        position: this.peek().position
                    };
                }
            }
            else if (this.match(Token_1.TokenType.MULA, Token_1.TokenType.ANYAR)) {
                property = {
                    type: "Identifier",
                    name: "constructor",
                    position: this.peek().position
                };
            }
            else {
                property = {
                    type: "Identifier",
                    name: this.propertyName(),
                    position: this.peek().position
                };
            }
        }
        const args = [];
        if (this.match(Token_1.TokenType.LEFT_PAREN)) {
            if (!this.check(Token_1.TokenType.RIGHT_PAREN)) {
                do {
                    args.push(this.assignment());
                } while (this.match(Token_1.TokenType.COMMA));
            }
            this.consume(Token_1.TokenType.RIGHT_PAREN, "Expected ')' after super arguments");
        }
        return {
            type: "SuperExpression",
            property,
            arguments: args,
            position: token.position
        };
    }
    isBuiltinIdentifier(type) {
        return type === Token_1.TokenType.TERIAK ||
            type === Token_1.TokenType.BISIK ||
            type === Token_1.TokenType.DENGERIN ||
            type === Token_1.TokenType.SEBRAPA ||
            type === Token_1.TokenType.APE ||
            type === Token_1.TokenType.ITUNGAN ||
            type === Token_1.TokenType.OMONGAN ||
            type === Token_1.TokenType.KUMPULIN ||
            type === Token_1.TokenType.ACAK ||
            type === Token_1.TokenType.TIDUR ||
            type === Token_1.TokenType.DERET ||
            type === Token_1.TokenType.ANGKA ||
            type === Token_1.TokenType.KATA;
    }
    propertyName() {
        if (this.check(Token_1.TokenType.IDENTIFIER))
            return this.advance().value;
        if (this.isBuiltinIdentifier(this.peek().type)) {
            const token = this.advance();
            return token.value || token.type;
        }
        throw BetaError_1.BetaError.expected("Expected property name", this.peek().position);
    }
    objectExpression() {
        const properties = [];
        if (!this.check(Token_1.TokenType.RIGHT_BRACE)) {
            do {
                if (this.match(Token_1.TokenType.SPREAD)) {
                    properties.push({
                        type: "ObjectProperty",
                        key: "__spread",
                        value: this.assignment(),
                        position: this.peek().position
                    });
                    continue;
                }
                let key;
                const keyToken = this.peek();
                if (keyToken.type === Token_1.TokenType.IDENTIFIER) {
                    this.advance();
                    key = keyToken.value;
                }
                else if (keyToken.type === Token_1.TokenType.STRING) {
                    this.advance();
                    key = keyToken.value;
                }
                else {
                    this.advance();
                    key = this.assignment();
                }
                this.consume(Token_1.TokenType.COLON, "Expected ':' in object property");
                const value = this.assignment();
                properties.push({
                    type: "ObjectProperty",
                    key,
                    value,
                    position: this.peek().position
                });
            } while (this.match(Token_1.TokenType.COMMA));
        }
        this.consume(Token_1.TokenType.RIGHT_BRACE, "Expected '}' after object properties");
        return {
            type: "ObjectExpression",
            properties,
            position: this.peek().position
        };
    }
    bindingPattern() {
        if (this.check(Token_1.TokenType.IDENTIFIER)) {
            return this.advance().value;
        }
        if (this.check(Token_1.TokenType.LEFT_BRACE) || this.check(Token_1.TokenType.LEFT_BRACKET)) {
            const opening = this.advance();
            const closing = opening.type === Token_1.TokenType.LEFT_BRACE ? Token_1.TokenType.RIGHT_BRACE : Token_1.TokenType.RIGHT_BRACKET;
            let depth = 1;
            const parts = [opening.value || opening.type];
            while (!this.isAtEnd() && depth > 0) {
                const token = this.advance();
                const value = token.value || token.type;
                parts.push(value);
                if (token.type === opening.type)
                    depth++;
                if (token.type === closing)
                    depth--;
            }
            if (depth !== 0) {
                throw BetaError_1.BetaError.expected("Expected closing destructuring pattern", this.peek().position);
            }
            return parts.join(" ")
                .replace(/\s*([{}[\],:])\s*/g, "$1")
                .replace(/\s+/g, " ");
        }
        throw BetaError_1.BetaError.expected("Expected variable name", this.peek().position);
    }
    skipGenericParameters() {
        if (!this.match(Token_1.TokenType.LESS))
            return;
        let depth = 1;
        while (!this.isAtEnd() && depth > 0) {
            if (this.match(Token_1.TokenType.LESS))
                depth++;
            else if (this.match(Token_1.TokenType.GREATER))
                depth--;
            else
                this.advance();
        }
    }
    arrayLiteralAfterLeftBracket() {
        const elements = [];
        if (!this.check(Token_1.TokenType.RIGHT_BRACKET)) {
            do {
                elements.push(this.assignment());
            } while (this.match(Token_1.TokenType.COMMA));
        }
        this.consume(Token_1.TokenType.RIGHT_BRACKET, "Expected ']' after array elements");
        return {
            type: "ArrayExpression",
            elements,
            position: this.peek().position
        };
    }
    getTypeAnnotation(token) {
        switch (token.type) {
            case Token_1.TokenType.ANGKA: return "angka";
            case Token_1.TokenType.KATA: return "kata";
            case Token_1.TokenType.BETOEL: return "betoel";
            case Token_1.TokenType.DERET: return "deret";
            case Token_1.TokenType.IDENTIFIER: return token.value;
            default: throw BetaError_1.BetaError.expected("Expected type annotation", token.position);
        }
    }
}
exports.Parser = Parser;
//# sourceMappingURL=Parser.js.map
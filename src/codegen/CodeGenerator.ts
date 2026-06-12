import { IRModule, IRStatement, IRExpression, IRType, IRVariableDeclaration,
  IRFunctionDeclaration, IRClassDeclaration, IRInterfaceDeclaration,
  IRTypeAliasDeclaration, IREnumDeclaration, IRDecoratorApplication,
  IRIfStatement, IRWhileStatement, IRForStatement, IRForEachStatement,
  IRReturnStatement, IRThrowStatement, IRTryStatement, IRCatchClause,
  IRBreakStatement, IRContinueStatement, IRExpressionStatement,
  IRBlockStatement, IRMethodDeclaration, IRFieldDeclaration,
  IRConstructorDeclaration, IRClassMember, SourceSpan
} from "../ir/IR";

export interface CodegenOptions {
  sourceMap?: boolean;
  sourceFilename?: string;
  target?: string;
}

export abstract class CodeGenerator {
  protected output = "";
  protected indent = 0;
  protected sourceMap?: Map<number, SourceSpan>;
  protected lines: { text: string; span: SourceSpan; line: number }[] = [];

  abstract generate(module: IRModule, options?: CodegenOptions): string;
  abstract name: string;

  protected emitLine(line = "") {
    const text = "  ".repeat(this.indent) + line;
    this.output += text + "\n";
    this.lines.push({ text, span: { start: { offset: 0, line: 1, column: 1, filename: "" }, end: { offset: 0, line: 1, column: 1, filename: "" } }, line: this.lines.length + 1 });
  }

  protected emitRuntimeHelpers() {}

  protected wrapBlock(body: () => void, opening: string, closing = "}") {
    this.emitLine(opening);
    this.indent++;
    body();
    this.indent--;
    this.emitLine(closing);
  }

  protected emitStatement(stmt: IRStatement) {
    switch (stmt.type) {
      case "VariableDeclaration": this.emitVariableDeclaration(stmt); break;
      case "FunctionDeclaration": this.emitFunctionDeclaration(stmt); break;
      case "ClassDeclaration": this.emitClassDeclaration(stmt); break;
      case "InterfaceDeclaration": this.emitInterfaceDeclaration(stmt); break;
      case "TypeAliasDeclaration": break;
      case "EnumDeclaration": break;
      case "DecoratorApplication": break;
      case "IfStatement": this.emitIfStatement(stmt); break;
      case "WhileStatement": this.emitWhileStatement(stmt); break;
      case "ForStatement": this.emitForStatement(stmt); break;
      case "ForEachStatement": this.emitForEachStatement(stmt); break;
      case "ReturnStatement": this.emitReturnStatement(stmt); break;
      case "ThrowStatement": this.emitThrowStatement(stmt); break;
      case "TryStatement": this.emitTryStatement(stmt); break;
      case "ExpressionStatement": this.emitExpressionStatement(stmt); break;
      case "BlockStatement": this.emitBlockStatement(stmt); break;
      case "BreakStatement": this.emitLine("break;"); break;
      case "ContinueStatement": this.emitLine("continue;"); break;
    }
  }

  protected emitExpression(expr: IRExpression): string {
    switch (expr.type) {
      case "Identifier": return expr.name;
      case "Literal": return this.emitLiteral(expr);
      case "BinaryExpression": return `(${this.emitExpression(expr.left)} ${expr.operator} ${this.emitExpression(expr.right)})`;
      case "UnaryExpression":
        return expr.prefix ? `${expr.operator}${this.emitExpression(expr.argument)}` : `${this.emitExpression(expr.argument)}${expr.operator}`;
      case "AssignmentExpression": return `(${this.emitExpression(expr.left)} ${expr.operator} ${this.emitExpression(expr.right)})`;
      case "CallExpression": {
        const callee = this.emitExpression(expr.callee);
        const args = expr.arguments.map(e => this.emitExpression(e)).join(", ");
        return `${callee}(${args})`;
      }
      case "MemberExpression": {
        const obj = this.emitExpression((expr as any).object);
        const prop = (expr as any).computed ? `[${this.emitExpression({ type: "Identifier", name: (expr as any).property, span: expr.span } as any)}]` : `.${(expr as any).property}`;
        return `${obj}${prop}`;
      }
      case "NewExpression": {
        const callee = this.emitExpression(expr.callee);
        const args = expr.arguments.map(e => this.emitExpression(e)).join(", ");
        return `new ${callee}(${args})`;
      }
      case "ArrayExpression": return `[${expr.elements.map(e => this.emitExpression(e)).join(", ")}]`;
      case "ObjectExpression": {
        const props = expr.properties.map(p => `${p.key}: ${this.emitExpression(p.value)}`).join(", ");
        return `{${props}}`;
      }
      case "ArrowFunction": {
        const params = expr.parameters.map(p => `${p.isRest ? "..." : ""}${p.name}`).join(", ");
        const body = expr.body.type === "BlockStatement" ? this.emitBlockBody(expr.body as IRBlockStatement) : this.emitExpression(expr.body as IRExpression);
        return expr.isAsync ? `async (${params}) => ${body}` : `(${params}) => ${body}`;
      }
      case "ConditionalExpression": return `(${this.emitExpression(expr.test)} ? ${this.emitExpression(expr.consequent)} : ${this.emitExpression(expr.alternate)})`;
      case "TemplateExpression": return expr.raw;
      case "SpreadExpression": return `...${this.emitExpression(expr.argument)}`;
      case "SuperExpression": {
        const args = expr.arguments.map(e => this.emitExpression(e)).join(", ");
        return expr.property ? `super.${expr.property}(${args})` : `super(${args})`;
      }
      default: return "";
    }
  }

  protected emitLiteral(lit: { type: "Literal"; value: any; raw: string; literalType: any; span: SourceSpan }) {
    if (lit.value === null) return "null";
    if (lit.value === undefined) return "undefined";
    if (typeof lit.value === "string") return JSON.stringify(lit.value);
    if (typeof lit.value === "number") return lit.raw;
    return String(lit.value);
  }

  protected emitVariableDeclaration(stmt: IRVariableDeclaration) {
    const kw = stmt.kind === "let" ? "let" : "const";
    const type = stmt.typeAnnotation ? `${this.emitType(stmt.typeAnnotation)}` : "";
    const init = stmt.initializer ? ` = ${this.emitExpression(stmt.initializer)}` : "";
    this.emitLine(`${kw} ${stmt.name}${type ? ": " + type : ""}${init};`);
  }

  protected emitFunctionDeclaration(stmt: IRFunctionDeclaration) {
    const params = stmt.parameters.map(p => `${p.isRest ? "..." : ""}${p.name}${p.type ? ": " + this.emitType(p.type) : ""}${p.optional ? "?" : ""}`).join(", ");
    const ret = stmt.returnType ? ": " + this.emitType(stmt.returnType) : "";
    const async = stmt.isAsync ? "async " : "";
    this.wrapBlock(() => {
      this.emitBlockBody(stmt.body);
    }, `${async}function ${stmt.name}(${params})${ret} {`);
  }

  protected emitClassDeclaration(stmt: IRClassDeclaration) {
    let head = "class " + stmt.name;
    if (stmt.superclass) head += ` extends ${stmt.superclass}`;
    if (stmt.interfaces.length) head += ` implements ${stmt.interfaces.join(", ")}`;
    this.wrapBlock(() => {
      for (const m of stmt.members) this.emitClassMember(m);
    }, head + " {");
  }

  protected emitInterfaceDeclaration(stmt: IRInterfaceDeclaration) {
    let head = `interface ${stmt.name}`;
    if (stmt.extends.length) head += ` extends ${stmt.extends.join(", ")}`;
    this.wrapBlock(() => {
      for (const m of stmt.methods) {
        const params = m.parameters.map(p => `${p.name}${p.type ? ": " + this.emitType(p.type) : ""}${p.optional ? "?" : ""}`).join(", ");
        const ret = m.returnType ? ": " + this.emitType(m.returnType) : "";
        this.emitLine(`${m.isStatic ? "static " : ""}${m.name}(${params})${ret};`);
      }
    }, head + " {");
  }

  protected emitClassMember(member: IRClassMember) {
    switch (member.type) {
      case "MethodDeclaration":
        this.emitMethodDeclaration(member as IRMethodDeclaration);
        break;
      case "FieldDeclaration":
        this.emitFieldDeclaration(member as IRFieldDeclaration);
        break;
      case "ConstructorDeclaration":
        this.emitConstructorDeclaration(member as IRConstructorDeclaration);
        break;
      case "PropertyDeclaration":
        break;
    }
  }

  protected emitMethodDeclaration(method: IRMethodDeclaration) {
    const staticKw = method.isStatic ? "static " : "";
    const asyncKw = (method as any).isAsync ? "async " : "";
    const params = method.parameters.map(p => `${p.isRest ? "..." : ""}${p.name}${p.type ? ": " + this.emitType(p.type) : ""}${p.optional ? "?" : ""}`).join(", ");
    const ret = method.returnType ? ": " + this.emitType(method.returnType) : "";
    this.wrapBlock(() => this.emitBlockBody(method.body), `${staticKw}${asyncKw}${method.name}(${params})${ret} {`);
  }

  protected emitFieldDeclaration(field: IRFieldDeclaration) {
    const staticKw = field.isStatic ? "static " : "";
    const vis = field.visibility === "private" ? "#" : field.visibility === "protected" ? "#" : "";
    const type = field.typeAnnotation ? ": " + this.emitType(field.typeAnnotation) : "";
    const init = field.initializer ? ` = ${this.emitExpression(field.initializer)}` : "";
    this.emitLine(`${staticKw}${vis}${field.name}${type}${init};`);
  }

  protected emitConstructorDeclaration(ctor: IRConstructorDeclaration) {
    const params = ctor.parameters.map(p => `${p.isRest ? "..." : ""}${p.name}${p.type ? ": " + this.emitType(p.type) : ""}${p.optional ? "?" : ""}`).join(", ");
    this.wrapBlock(() => this.emitBlockBody(ctor.body), `constructor(${params}) {`);
  }

  protected emitIfStatement(stmt: IRIfStatement) {
    this.wrapBlock(() => this.emitBlockBody(stmt.consequent), `if (${this.emitExpression(stmt.test)}) {`);
    if (stmt.alternate) {
      this.wrapBlock(() => this.emitBlockBody(stmt.alternate), "else {");
    }
  }

  protected emitWhileStatement(stmt: IRWhileStatement) {
    this.wrapBlock(() => this.emitBlockBody(stmt.body), `while (${this.emitExpression(stmt.test)}) {`);
  }

  protected emitForStatement(stmt: IRForStatement) {
    const init = `${stmt.init.kind === "let" ? "let" : "const"} ${stmt.init.name} = ${this.emitExpression(stmt.init.initializer ?? { type: "Literal", value: undefined, literalType: "undefined", raw: "undefined", span: stmt.init.span }) as any}`;
    this.wrapBlock(() => this.emitBlockBody(stmt.body), `for (${init}; ${this.emitExpression(stmt.test)}; ${this.emitExpression(stmt.update)}) {`);
  }

  protected emitForEachStatement(stmt: IRForEachStatement) {
    this.wrapBlock(() => this.emitBlockBody(stmt.body), `for (const ${stmt.variable} of ${this.emitExpression(stmt.iterable)}) {`);
  }

  protected emitReturnStatement(stmt: IRReturnStatement) {
    if (stmt.argument) this.emitLine(`return ${this.emitExpression(stmt.argument)};`);
    else this.emitLine("return;");
  }

  protected emitThrowStatement(stmt: IRThrowStatement) {
    this.emitLine(`throw ${this.emitExpression(stmt.argument)};`);
  }

  protected emitTryStatement(stmt: IRTryStatement) {
    this.wrapBlock(() => this.emitBlockBody(stmt.block), "try {");
    if (stmt.handler) {
      this.wrapBlock(() => this.emitBlockBody(stmt.handler.block), `catch (${stmt.handler.param ?? "e"}) {`);
    }
    if (stmt.finalizer) {
      this.wrapBlock(() => this.emitBlockBody(stmt.finalizer), "finally {");
    }
  }

  protected emitExpressionStatement(stmt: IRExpressionStatement) {
    this.emitLine(`${this.emitExpression(stmt.expression)};`);
  }

  protected emitBlockStatement(stmt: IRBlockStatement) {
    for (const s of stmt.statements) this.emitStatement(s);
  }

  protected emitBlockBody(stmt: IRBlockStatement) {
    for (const s of stmt.statements) this.emitStatement(s);
  }

  protected emitType(type: IRType): string {
    if (!type) return "";
    switch (type.kind) {
      case "Primitive": return (type as any).name;
      case "Array": return `${this.emitType((type as any).elementType)}[]`;
      case "Union": return (type as any).types.map((t: IRType) => this.emitType(t)).join(" | ");
      case "Tuple": return `[${(type as any).elementTypes.map((t: IRType) => this.emitType(t)).join(", ")}]`;
      case "Nullable": return `${this.emitType((type as any).type)} | null`;
      case "Named": {
        const name = (type as any).name;
        const args = (type as any).typeArguments;
        return args && args.length > 0 ? `${name}<${args.map((t: IRType) => this.emitType(t)).join(", ")}>` : name;
      }
      case "Generic": return (type as any).name;
      case "Function": return `(${(type as any).parameters.map((t: IRType) => this.emitType(t)).join(", ")} => ${this.emitType((type as any).returnType)})`;
      case "Object": {
        const props = (type as any).properties.map((p: any) => `${p.name}${p.optional ? "?" : ""}: ${this.emitType(p.type)}`).join("; ");
        return `{ ${props}${props ? "; " : ""} }`;
      }
      default: return "any";
    }
  }

  public getSourceMap(): string {
    if (!this.sourceMap) return "{}";
    const map: any = { version: 3, sources: [], sourcesContent: [], names: [], mappings: "" };
    let sourceIndex = 0;
    const inferred = this.lines.map((l) => l.text.length > 0 ? sourceIndex++ : -1);
    const generated = { line: 1, column: 0 };
    let mappings = "";
    for (let i = 0; i < this.lines.length; i++) {
      const genCol = 0;
      const srcIndex = inferred[i];
      const srcLine = 1;
      const srcCol = 0;
      if (srcIndex !== undefined && srcIndex >= 0) {
        mappings += `${i === 0 ? "" : ";"}${genCol},${srcIndex},${srcLine},${srcCol}`;
      } else if (i === 0) {
        mappings += `0`;
      }
    }
    map.mappings = mappings;
    return JSON.stringify(map);
  }
}

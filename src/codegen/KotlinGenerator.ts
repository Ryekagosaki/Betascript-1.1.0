import { IRModule, IRStatement, IRExpression, IRType, IRVariableDeclaration,
  IRFunctionDeclaration, IRClassDeclaration, IRInterfaceDeclaration,
  IRTypeAliasDeclaration, IREnumDeclaration, IRDecoratorApplication,
  IRIfStatement, IRWhileStatement, IRForStatement, IRForEachStatement,
  IRReturnStatement, IRThrowStatement, IRTryStatement, IRCatchClause,
  IRExpressionStatement, IRBlockStatement, IRClassMember,
  IRMethodDeclaration, IRFieldDeclaration, IRConstructorDeclaration
} from "../ir/IR";
import { CodeGenerator } from "./CodeGenerator";

export class KotlinGenerator extends CodeGenerator {
  name = "kt";
  private packageName = "com.betascript";
  generate(module: IRModule) {
    this.output = "";
    this.indent = 0;
    this.emitLine(`package ${this.packageName}`);
    this.emitLine("");
    for (const stmt of module.body) this.emitStatement(stmt);
    return this.output;
  }

  protected emitType(type: IRType): string {
    if (!type) return "Any";
    switch (type.kind) {
      case "Primitive": {
        const n = (type as any).name;
        switch (n) {
          case "number": return "Int";
          case "string": return "String";
          case "boolean": return "Boolean";
          case "void": return "Unit";
          case "null": return "Nothing";
          default: return "Any";
        }
      }
      case "Array": return `List<${this.emitType((type as any).elementType)}>`;
      case "Union": return `Any`;
      case "Nullable": return `${this.emitType((type as any).type)}?`;
      case "Named": return (type as any).name;
      default: return "Any";
    }
  }

  protected emitVariableDeclaration(stmt: IRVariableDeclaration) {
    const type = this.emitType(stmt.typeAnnotation ?? { kind: "Primitive", name: "unknown", span: stmt.span } as any);
    const init = stmt.initializer ? ` = ${this.emitExpression(stmt.initializer)}` : "";
    const kw = stmt.kind === "let" ? "var" : "val";
    this.emitLine(`${kw} ${stmt.name}: ${type}${init}`);
  }

  protected emitFunctionDeclaration(stmt: IRFunctionDeclaration) {
    const ret = this.emitType(stmt.returnType ?? { kind: "Primitive", name: "void", span: stmt.span } as any);
    const params = stmt.parameters.map(p => `${p.name}: ${this.emitType(p.type ?? { kind: "Primitive", name: "any", span: p.span } as any)}`).join(", ");
    const isSuspend = stmt.isAsync ? " suspend " : "";
    const isStatic = stmt.isStatic ? "companion object " : "fun ";
    this.wrapBlock(() => this.emitBlockBody(stmt.body), `${isStatic}${stmt.name}(${params}): ${ret} {`);
  }

  protected emitClassDeclaration(stmt: IRClassDeclaration) {
    let head = `class ${stmt.name}`;
    if (stmt.superclass) head += `(${stmt.superclass})`;
    if (stmt.interfaces.length) head += ` : ${stmt.interfaces.join(", ")}`;
    this.wrapBlock(() => {
      for (const m of stmt.members) this.emitClassMember(m);
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
      default:
        break;
    }
  }

  protected emitMethodDeclaration(method: IRMethodDeclaration) {
    const params = method.parameters.map(p => `${p.name}: ${this.emitType(p.type ?? { kind: "Primitive", name: "any", span: p.span } as any)}`).join(", ");
    const ret = this.emitType(method.returnType ?? { kind: "Primitive", name: "void", span: method.span } as any);
    const vis = method.visibility === "private" ? "private " : method.visibility === "protected" ? "protected " : "";
    this.wrapBlock(() => this.emitBlockBody(method.body), `${vis}fun ${method.name}(${params}): ${ret} {`);
  }

  protected emitFieldDeclaration(field: IRFieldDeclaration) {
    const type = this.emitType(field.typeAnnotation ?? { kind: "Primitive", name: "any", span: field.span } as any);
    const init = field.initializer ? ` = ${this.emitExpression(field.initializer)}` : "";
    const vis = field.visibility === "private" ? "private " : field.visibility === "protected" ? "protected " : "";
    const kw = field.isStatic ? "companion object " : "";
    this.emitLine(`${vis}${kw}val ${field.name}: ${type}${init}`);
  }

  protected emitConstructorDeclaration(ctor: IRConstructorDeclaration) {
    const params = ctor.parameters.map(p => `${p.name}: ${this.emitType(p.type ?? { kind: "Primitive", name: "any", span: p.span } as any)}`).join(", ");
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
    const init = `${stmt.init.name} = ${this.emitExpression(stmt.init.initializer ?? { type: "Literal" as any, value: 0, raw: "0", literalType: "number", span: stmt.init.span } as any)}`;
    this.wrapBlock(() => this.emitBlockBody(stmt.body), `for (${init}; ${this.emitExpression(stmt.test)}; ${this.emitExpression(stmt.update)}) {`);
  }

  protected emitForEachStatement(stmt: IRForEachStatement) {
    this.wrapBlock(() => this.emitBlockBody(stmt.body), `for (${stmt.variable} in ${this.emitExpression(stmt.iterable)}) {`);
  }

  protected emitReturnStatement(stmt: IRReturnStatement) {
    if (stmt.argument) this.emitLine(`return ${this.emitExpression(stmt.argument)}`);
    else this.emitLine("return");
  }

  protected emitThrowStatement(stmt: IRThrowStatement) {
    this.emitLine(`throw Exception(${this.emitExpression(stmt.argument)})`);
  }

  protected emitTryStatement(stmt: IRTryStatement) {
    this.wrapBlock(() => this.emitBlockBody(stmt.block), "try {");
    if (stmt.handler) {
      this.wrapBlock(() => this.emitBlockBody(stmt.handler.block), `catch (e: Exception) {`);
    }
  }

  protected emitExpressionStatement(stmt: IRExpressionStatement) {
    this.emitLine(`${this.emitExpression(stmt.expression)}`);
  }

  protected emitBlockStatement(stmt: IRBlockStatement) {
    for (const s of stmt.statements) this.emitStatement(s);
  }
}

import { IRModule, IRStatement, IRExpression, IRType, IRClassDeclaration,
  IRFunctionDeclaration, IRVariableDeclaration, IRIfStatement, IRWhileStatement,
  IRForStatement, IRForEachStatement, IRReturnStatement, IRThrowStatement,
  IRTryStatement, IRCatchClause, IRExpressionStatement, IRBlockStatement,
  IRClassMember, IRMethodDeclaration, IRFieldDeclaration, IRConstructorDeclaration,
  IRInterfaceDeclaration
} from "../ir/IR";
import { CodeGenerator } from "./CodeGenerator";

export class CppGenerator extends CodeGenerator {
  name = "cpp";
  generate(module: IRModule) {
    this.output = "";
    this.indent = 0;
    this.emitLine("#include <iostream>");
    this.emitLine("#include <vector>");
    this.emitLine("#include <string>");
    this.emitLine("#include <map>");
    this.emitLine("#include <set>");
    this.emitLine("#include <memory>");
    this.emitLine("#include <functional>");
    this.emitLine("#include <any>");
    this.emitLine("using namespace std;");
    this.emitLine("");
    for (const stmt of module.body) this.emitStatement(stmt);
    return this.output;
  }

  protected emitType(type: IRType): string {
    if (!type) return "auto";
    switch (type.kind) {
      case "Primitive": {
        const n = (type as any).name;
        switch (n) {
          case "number": return "double";
          case "string": return "string";
          case "boolean": return "bool";
          case "void": return "void";
          case "null": return "nullptr_t";
          default: return "any";
        }
      }
      case "Array": return `vector<${this.emitType((type as any).elementType)}>`;
      case "Union": return `any`;
      case "Named": return (type as any).name;
      default: return "auto";
    }
  }

  protected emitVariableDeclaration(stmt: IRVariableDeclaration) {
    const type = this.emitType(stmt.typeAnnotation ?? (stmt.initializer ? { kind: "Primitive", name: "unknown", span: stmt.span } : { kind: "Primitive", name: "unknown", span: stmt.span } as any));
    const init = stmt.initializer ? ` = ${this.emitExpression(stmt.initializer)}` : "";
    this.emitLine(`${type} ${stmt.name}${init};`);
  }

  protected emitFunctionDeclaration(stmt: IRFunctionDeclaration) {
    const ret = this.emitType(stmt.returnType ?? { kind: "Primitive", name: "void", span: stmt.span } as any);
    const params = stmt.parameters.map(p => `${this.emitType(p.type ?? { kind: "Primitive", name: "any", span: p.span } as any)} ${p.name}`).join(", ");
    this.wrapBlock(() => this.emitBlockBody(stmt.body), `${ret} ${stmt.name}(${params}) {`);
  }

  protected emitClassDeclaration(stmt: IRClassDeclaration) {
    let head = `class ${stmt.name}`;
    if (stmt.superclass) head += ` : public ${stmt.superclass}`;
    if (stmt.interfaces.length) head += `, public ${stmt.interfaces.join(", public ")}`;
    this.wrapBlock(() => {
      this.emitLine("public:");
      this.indent++;
      for (const m of stmt.members) this.emitClassMember(m);
      this.indent--;
    }, head + " {");
    this.emitLine("};");
    this.emitLine("");
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
    const params = method.parameters.map(p => `${this.emitType(p.type ?? { kind: "Primitive", name: "any", span: p.span } as any)} ${p.name}`).join(", ");
    const ret = this.emitType(method.returnType ?? { kind: "Primitive", name: "void", span: method.span } as any);
    this.wrapBlock(() => this.emitBlockBody(method.body), `${ret} ${method.name}(${params}) {`);
  }

  protected emitFieldDeclaration(field: IRFieldDeclaration) {
    const type = this.emitType(field.typeAnnotation ?? { kind: "Primitive", name: "any", span: field.span } as any);
    const init = field.initializer ? ` = ${this.emitExpression(field.initializer)}` : "";
    this.emitLine(`${type} ${field.name}${init};`);
  }

  protected emitConstructorDeclaration(ctor: IRConstructorDeclaration) {
    const params = ctor.parameters.map(p => `${this.emitType(p.type ?? { kind: "Primitive", name: "any", span: p.span } as any)} ${p.name}`).join(", ");
    this.wrapBlock(() => this.emitBlockBody(ctor.body), `${ctor.body ? "explicit " : ""}${ctor.parameters.length > 0 ? "" : ""}${ctor.parameters.length > 0 ? "" : ""}(${params}) {`);
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
    const init = `${this.emitType(stmt.init.typeAnnotation ?? { kind: "Primitive", name: "unknown", span: stmt.init.span } as any)} ${stmt.init.name} = ${this.emitExpression(stmt.init.initializer ?? { type: "Literal" as any, value: 0, raw: "0", literalType: "number", span: stmt.init.span } as any)}`;
    this.wrapBlock(() => this.emitBlockBody(stmt.body), `for (${init}; ${this.emitExpression(stmt.test)}; ${this.emitExpression(stmt.update)}) {`);
  }

  protected emitForEachStatement(stmt: IRForEachStatement) {
    this.wrapBlock(() => this.emitBlockBody(stmt.body), `for (const auto& ${stmt.variable} : ${this.emitExpression(stmt.iterable)}) {`);
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
  }

  protected emitExpressionStatement(stmt: IRExpressionStatement) {
    this.emitLine(`${this.emitExpression(stmt.expression)};`);
  }

  protected emitBlockStatement(stmt: IRBlockStatement) {
    for (const s of stmt.statements) this.emitStatement(s);
  }

  protected emitExpression(expr: IRExpression): string {
    switch (expr.type) {
      case "Literal": {
        const l = expr as any;
        if (l.value === null) return "nullptr";
        if (l.value === undefined) return "std::nullopt";
        if (typeof l.value === "string") return JSON.stringify(l.value);
        if (typeof l.value === "boolean") return l.value ? "true" : "false";
        if (typeof l.value === "number") return String(l.value);
        return String(l.value);
      }
      default: return super.emitExpression(expr);
    }
  }
}

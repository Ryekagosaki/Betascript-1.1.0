import { IRModule, IRStatement, IRExpression, IRType, IRVariableDeclaration,
  IRFunctionDeclaration, IRClassDeclaration, IRInterfaceDeclaration,
  IRTypeAliasDeclaration, IREnumDeclaration, IRDecoratorApplication,
  IRIfStatement, IRWhileStatement, IRForStatement, IRForEachStatement,
  IRReturnStatement, IRThrowStatement, IRTryStatement, IRCatchClause,
  IRBreakStatement, IRContinueStatement, IRExpressionStatement,
  IRBlockStatement, IRMethodDeclaration, IRFieldDeclaration,
  IRConstructorDeclaration, IRClassMember, SourceSpan
} from "../ir/IR";
import { JSXGenerator } from "./JSXGenerator";

export class TSXGenerator extends JSXGenerator {
  name = "tsx";
  private needsReactImport = false;

  generate(module: IRModule, options?: any): string {
    this.output = "";
    this.indent = 0;
    this.needsReactImport = false;
    this.emitRuntimeHelpers();
    if (this.needsReactImport) {
      this.emitLine("import * as React from \"react\";");
      this.emitLine("");
    }
    for (const stmt of module.body) this.emitStatement(stmt);
    return this.output;
  }

  protected emitType(type: IRType): string {
    if (!type) return "any";
    switch (type.kind) {
      case "Primitive":
        const n = (type as any).name;
        switch (n) {
          case "number": return "number";
          case "string": return "string";
          case "boolean": return "boolean";
          case "void": return "void";
          case "null": return "null";
          default: return "any";
        }
      case "Array": return `(${this.emitType((type as any).elementType)})[]`;
      case "Union": return (type as any).types.map((t: IRType) => this.emitType(t)).join(" | ");
      case "Nullable": return `${this.emitType((type as any).type)} | null`;
      case "Named": {
        const name = (type as any).name;
        const args = (type as any).typeArguments;
        return args && args.length > 0 ? `${name}<${args.map((t: IRType) => this.emitType(t)).join(", ")}>` : name;
      }
      case "Generic": return (type as any).name;
      case "Function": return `(${(type as any).parameters.map((p: IRType) => this.emitType(p)).join(", ")}) => ${this.emitType((type as any).returnType)}`;
      case "Object": {
        const props = (type as any).properties.map((p: any) => `${p.name}${p.optional ? "?" : ""}: ${this.emitType(p.type)}`).join("; ");
        return `{ ${props} }`;
      }
      default: return "any";
    }
  }

  protected emitVariableDeclaration(stmt: IRVariableDeclaration) {
    const kw = stmt.kind === "let" ? "let" : "const";
    const type = stmt.typeAnnotation ? `: ${this.emitType(stmt.typeAnnotation)}` : "";
    const init = stmt.initializer ? ` = ${this.emitExpression(stmt.initializer)}` : "";
    this.emitLine(`${kw} ${stmt.name}${type}${init};`);
  }

  protected emitFunctionDeclaration(stmt: IRFunctionDeclaration) {
    const params = stmt.parameters.map(p => {
      const optional = p.optional ? "?" : "";
      const type = p.type ? `: ${this.emitType(p.type)}` : "";
      return `${p.isRest ? "..." : ""}${p.name}${type}${optional}`;
    }).join(", ");
    const ret = stmt.returnType ? `: ${this.emitType(stmt.returnType)}` : "";
    const async = stmt.isAsync ? "async " : "";
    const exportKw = stmt.isExported ? "export " : "";
    this.wrapBlock(() => {
      this.emitBlockBody(stmt.body);
    }, `${exportKw}${async}function ${stmt.name}(${params})${ret} {`);
  }

  protected emitClassDeclaration(stmt: IRClassDeclaration) {
    const isComponent = /^komponen/i.test(stmt.name);
    if (isComponent) {
      this.needsReactImport = true;
      this.wrapBlock(() => {
        this.emitLine("return (");
        this.indent++;
        this.emitLine(`<div>Hello from ${stmt.name}</div>`);
        this.indent--;
        this.emitLine(");");
      }, `export function ${stmt.name}(props: any) {`);
    } else {
      let head = "class " + stmt.name;
      if (stmt.superclass) head += ` extends ${stmt.superclass}`;
      if (stmt.interfaces.length) head += ` implements ${stmt.interfaces.join(", ")}`;
      this.wrapBlock(() => {
        for (const m of stmt.members) this.emitClassMember(m);
      }, head + " {");
    }
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
    }
  }

  protected emitMethodDeclaration(method: IRMethodDeclaration) {
    const vis = method.visibility === "private" ? "private " : method.visibility === "protected" ? "protected " : "public ";
    const staticKw = method.isStatic ? "static " : "";
    const asyncKw = (method as any).isAsync ? "async " : "";
    const params = method.parameters.map(p => {
      const optional = p.optional ? "?" : "";
      const type = p.type ? `: ${this.emitType(p.type)}` : "";
      return `${p.isRest ? "..." : ""}${p.name}${type}${optional}`;
    }).join(", ");
    const ret = method.returnType ? `: ${this.emitType(method.returnType)}` : "";
    this.wrapBlock(() => this.emitBlockBody(method.body), `${vis}${staticKw}${asyncKw}${method.name}(${params})${ret} {`);
  }

  protected emitFieldDeclaration(field: IRFieldDeclaration) {
    const vis = field.visibility === "private" ? "private " : field.visibility === "protected" ? "protected " : "public ";
    const staticKw = field.isStatic ? "static " : "";
    const type = field.typeAnnotation ? `: ${this.emitType(field.typeAnnotation)}` : "";
    const init = field.initializer ? ` = ${this.emitExpression(field.initializer)}` : "";
    this.emitLine(`${vis}${staticKw}${field.name}${type}${init};`);
  }

  protected emitConstructorDeclaration(ctor: IRConstructorDeclaration) {
    const params = ctor.parameters.map(p => {
      const optional = p.optional ? "?" : "";
      const type = p.type ? `: ${this.emitType(p.type)}` : "";
      return `${p.isRest ? "..." : ""}${p.name}${type}${optional}`;
    }).join(", ");
    this.wrapBlock(() => this.emitBlockBody(ctor.body), `constructor(${params}) {`);
  }
}
import { IRModule, IRStatement, IRExpression, IRType, IRVariableDeclaration,
  IRFunctionDeclaration, IRClassDeclaration, IRInterfaceDeclaration,
  IRTypeAliasDeclaration, IREnumDeclaration, IRDecoratorApplication,
  IRIfStatement, IRWhileStatement, IRForStatement, IRForEachStatement,
  IRReturnStatement, IRThrowStatement, IRTryStatement, IRCatchClause,
  IRBreakStatement, IRContinueStatement, IRExpressionStatement,
  IRBlockStatement, IRMethodDeclaration, IRFieldDeclaration,
  IRConstructorDeclaration, IRClassMember, SourceSpan
} from "../ir/IR";
import { CodeGenerator } from "./CodeGenerator";

type BetawiType = "angka" | "tulisan" | "bener" | "deret" | "kosong" | "peta" | "gabungan" | "potongan" | string;

function betawiToTsType(t: IRType): string {
  if (!t) return "any";
  switch (t.kind) {
    case "Primitive": {
      const n = (t as any).name;
      switch (n) {
        case "number": return "number";
        case "string": return "string";
        case "boolean": return "boolean";
        case "void": return "void";
        case "null": return "null";
        case "undefined": return "undefined";
        default: return "unknown";
      }
    }
    case "Array": return `${betawiToTsType((t as any).elementType)}[]`;
    case "Union": return (t as any).types.map((x: IRType) => betawiToTsType(x)).join(" | ");
    case "Tuple": return `[${(t as any).elementTypes.map((x: IRType) => betawiToTsType(x)).join(", ")}]`;
    case "Nullable": return `${betawiToTsType((t as any).type)} | null`;
    case "Named": {
      const name = (t as any).name;
      const args = (t as any).typeArguments;
      return args && args.length > 0 ? `${name}<${args.map((x: IRType) => betawiToTsType(x)).join(", ")}>` : name;
    }
    case "Generic": return (t as any).name;
    case "Function": return `(${(t as any).parameters.map((x: IRType) => betawiToTsType(x)).join(", ")}) => ${betawiToTsType((t as any).returnType)}`;
    case "Object": return `{ ${(t as any).properties.map((p: any) => `${p.name}${p.optional ? "?" : ""}: ${betawiToTsType(p.type)}`).join("; ")} }`;
    default: return "any";
  }
}

export class TypeScriptGenerator extends CodeGenerator {
  name = "ts";
  generate(module: IRModule) {
    this.output = "";
    this.indent = 0;
    for (const stmt of module.body) this.emitStatement(stmt);
    return this.output;
  }

  protected emitType(type: IRType): string {
    return betawiToTsType(type);
  }

  protected emitClassDeclaration(stmt: IRClassDeclaration) {
    let head = `${stmt.isAbstract ? "abstract " : ""}class ${stmt.name}`;
    if (stmt.superclass) head += ` extends ${stmt.superclass}`;
    if (stmt.interfaces.length) head += ` implements ${stmt.interfaces.join(", ")}`;
    this.wrapBlock(() => {
      for (const m of stmt.members) this.emitClassMember(m);
    }, head + " {");
  }

  protected emitClassMember(member: IRClassMember) {
    switch (member.type) {
      case "MethodDeclaration":
        const staticKw = (member as IRMethodDeclaration).isStatic ? "static " : "";
        const asyncKw = ((member as IRMethodDeclaration) as any).isAsync ? "async " : "";
        const params = (member as IRMethodDeclaration).parameters.map(p => `${p.isRest ? "..." : ""}${p.name}${p.type ? ": " + this.emitType(p.type) : ""}${p.optional ? "?" : ""}`).join(", ");
        const ret = (member as IRMethodDeclaration).returnType ? ": " + this.emitType((member as IRMethodDeclaration).returnType) : "";
        this.wrapBlock(() => this.emitBlockBody((member as IRMethodDeclaration).body), `${staticKw}${asyncKw}${member.name}(${params})${ret} {`);
        break;
      case "FieldDeclaration":
        const vis = member.visibility === "private" ? "private " : member.visibility === "protected" ? "protected " : "public ";
        const s = (member as IRFieldDeclaration).isStatic ? "static " : "";
        const type = (member as IRFieldDeclaration).typeAnnotation ? ": " + this.emitType((member as IRFieldDeclaration).typeAnnotation!) : "";
        const init = (member as IRFieldDeclaration).initializer ? ` = ${this.emitExpression((member as IRFieldDeclaration).initializer!)}` : "";
        this.emitLine(`${vis}${s}${member.name}${type}${init};`);
        break;
      case "ConstructorDeclaration": {
        const params = (member as IRConstructorDeclaration).parameters.map(p => `${p.isRest ? "..." : ""}${p.name}${p.type ? ": " + this.emitType(p.type) : ""}${p.optional ? "?" : ""}`).join(", ");
        this.wrapBlock(() => this.emitBlockBody((member as IRConstructorDeclaration).body), `constructor(${params}) {`);
        break;
      }
      default: break;
    }
  }
}

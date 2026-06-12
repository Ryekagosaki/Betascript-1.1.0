"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeScriptGenerator = void 0;
const CodeGenerator_1 = require("./CodeGenerator");
function betawiToTsType(t) {
    if (!t)
        return "any";
    switch (t.kind) {
        case "Primitive": {
            const n = t.name;
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
        case "Array": return `${betawiToTsType(t.elementType)}[]`;
        case "Union": return t.types.map((x) => betawiToTsType(x)).join(" | ");
        case "Tuple": return `[${t.elementTypes.map((x) => betawiToTsType(x)).join(", ")}]`;
        case "Nullable": return `${betawiToTsType(t.type)} | null`;
        case "Named": {
            const name = t.name;
            const args = t.typeArguments;
            return args && args.length > 0 ? `${name}<${args.map((x) => betawiToTsType(x)).join(", ")}>` : name;
        }
        case "Generic": return t.name;
        case "Function": return `(${t.parameters.map((x) => betawiToTsType(x)).join(", ")}) => ${betawiToTsType(t.returnType)}`;
        case "Object": return `{ ${t.properties.map((p) => `${p.name}${p.optional ? "?" : ""}: ${betawiToTsType(p.type)}`).join("; ")} }`;
        default: return "any";
    }
}
class TypeScriptGenerator extends CodeGenerator_1.CodeGenerator {
    name = "ts";
    generate(module) {
        this.output = "";
        this.indent = 0;
        for (const stmt of module.body)
            this.emitStatement(stmt);
        return this.output;
    }
    emitType(type) {
        return betawiToTsType(type);
    }
    emitClassDeclaration(stmt) {
        let head = `${stmt.isAbstract ? "abstract " : ""}class ${stmt.name}`;
        if (stmt.superclass)
            head += ` extends ${stmt.superclass}`;
        if (stmt.interfaces.length)
            head += ` implements ${stmt.interfaces.join(", ")}`;
        this.wrapBlock(() => {
            for (const m of stmt.members)
                this.emitClassMember(m);
        }, head + " {");
    }
    emitClassMember(member) {
        switch (member.type) {
            case "MethodDeclaration":
                const staticKw = member.isStatic ? "static " : "";
                const asyncKw = member.isAsync ? "async " : "";
                const params = member.parameters.map(p => `${p.isRest ? "..." : ""}${p.name}${p.type ? ": " + this.emitType(p.type) : ""}${p.optional ? "?" : ""}`).join(", ");
                const ret = member.returnType ? ": " + this.emitType(member.returnType) : "";
                this.wrapBlock(() => this.emitBlockBody(member.body), `${staticKw}${asyncKw}${member.name}(${params})${ret} {`);
                break;
            case "FieldDeclaration":
                const vis = member.visibility === "private" ? "private " : member.visibility === "protected" ? "protected " : "public ";
                const s = member.isStatic ? "static " : "";
                const type = member.typeAnnotation ? ": " + this.emitType(member.typeAnnotation) : "";
                const init = member.initializer ? ` = ${this.emitExpression(member.initializer)}` : "";
                this.emitLine(`${vis}${s}${member.name}${type}${init};`);
                break;
            case "ConstructorDeclaration": {
                const params = member.parameters.map(p => `${p.isRest ? "..." : ""}${p.name}${p.type ? ": " + this.emitType(p.type) : ""}${p.optional ? "?" : ""}`).join(", ");
                this.wrapBlock(() => this.emitBlockBody(member.body), `constructor(${params}) {`);
                break;
            }
            default: break;
        }
    }
}
exports.TypeScriptGenerator = TypeScriptGenerator;
//# sourceMappingURL=TypeScriptGenerator.js.map
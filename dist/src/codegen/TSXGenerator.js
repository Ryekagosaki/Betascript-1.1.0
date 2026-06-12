"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TSXGenerator = void 0;
const JSXGenerator_1 = require("./JSXGenerator");
class TSXGenerator extends JSXGenerator_1.JSXGenerator {
    name = "tsx";
    needsReactImport = false;
    generate(module, options) {
        this.output = "";
        this.indent = 0;
        this.needsReactImport = false;
        this.emitRuntimeHelpers();
        if (this.needsReactImport) {
            this.emitLine("import * as React from \"react\";");
            this.emitLine("");
        }
        for (const stmt of module.body)
            this.emitStatement(stmt);
        return this.output;
    }
    emitType(type) {
        if (!type)
            return "any";
        switch (type.kind) {
            case "Primitive":
                const n = type.name;
                switch (n) {
                    case "number": return "number";
                    case "string": return "string";
                    case "boolean": return "boolean";
                    case "void": return "void";
                    case "null": return "null";
                    default: return "any";
                }
            case "Array": return `(${this.emitType(type.elementType)})[]`;
            case "Union": return type.types.map((t) => this.emitType(t)).join(" | ");
            case "Nullable": return `${this.emitType(type.type)} | null`;
            case "Named": {
                const name = type.name;
                const args = type.typeArguments;
                return args && args.length > 0 ? `${name}<${args.map((t) => this.emitType(t)).join(", ")}>` : name;
            }
            case "Generic": return type.name;
            case "Function": return `(${type.parameters.map((p) => this.emitType(p)).join(", ")}) => ${this.emitType(type.returnType)}`;
            case "Object": {
                const props = type.properties.map((p) => `${p.name}${p.optional ? "?" : ""}: ${this.emitType(p.type)}`).join("; ");
                return `{ ${props} }`;
            }
            default: return "any";
        }
    }
    emitVariableDeclaration(stmt) {
        const kw = stmt.kind === "let" ? "let" : "const";
        const type = stmt.typeAnnotation ? `: ${this.emitType(stmt.typeAnnotation)}` : "";
        const init = stmt.initializer ? ` = ${this.emitExpression(stmt.initializer)}` : "";
        this.emitLine(`${kw} ${stmt.name}${type}${init};`);
    }
    emitFunctionDeclaration(stmt) {
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
    emitClassDeclaration(stmt) {
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
        }
        else {
            let head = "class " + stmt.name;
            if (stmt.superclass)
                head += ` extends ${stmt.superclass}`;
            if (stmt.interfaces.length)
                head += ` implements ${stmt.interfaces.join(", ")}`;
            this.wrapBlock(() => {
                for (const m of stmt.members)
                    this.emitClassMember(m);
            }, head + " {");
        }
    }
    emitClassMember(member) {
        switch (member.type) {
            case "MethodDeclaration":
                this.emitMethodDeclaration(member);
                break;
            case "FieldDeclaration":
                this.emitFieldDeclaration(member);
                break;
            case "ConstructorDeclaration":
                this.emitConstructorDeclaration(member);
                break;
        }
    }
    emitMethodDeclaration(method) {
        const vis = method.visibility === "private" ? "private " : method.visibility === "protected" ? "protected " : "public ";
        const staticKw = method.isStatic ? "static " : "";
        const asyncKw = method.isAsync ? "async " : "";
        const params = method.parameters.map(p => {
            const optional = p.optional ? "?" : "";
            const type = p.type ? `: ${this.emitType(p.type)}` : "";
            return `${p.isRest ? "..." : ""}${p.name}${type}${optional}`;
        }).join(", ");
        const ret = method.returnType ? `: ${this.emitType(method.returnType)}` : "";
        this.wrapBlock(() => this.emitBlockBody(method.body), `${vis}${staticKw}${asyncKw}${method.name}(${params})${ret} {`);
    }
    emitFieldDeclaration(field) {
        const vis = field.visibility === "private" ? "private " : field.visibility === "protected" ? "protected " : "public ";
        const staticKw = field.isStatic ? "static " : "";
        const type = field.typeAnnotation ? `: ${this.emitType(field.typeAnnotation)}` : "";
        const init = field.initializer ? ` = ${this.emitExpression(field.initializer)}` : "";
        this.emitLine(`${vis}${staticKw}${field.name}${type}${init};`);
    }
    emitConstructorDeclaration(ctor) {
        const params = ctor.parameters.map(p => {
            const optional = p.optional ? "?" : "";
            const type = p.type ? `: ${this.emitType(p.type)}` : "";
            return `${p.isRest ? "..." : ""}${p.name}${type}${optional}`;
        }).join(", ");
        this.wrapBlock(() => this.emitBlockBody(ctor.body), `constructor(${params}) {`);
    }
}
exports.TSXGenerator = TSXGenerator;
//# sourceMappingURL=TSXGenerator.js.map
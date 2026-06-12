"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CppGenerator = void 0;
const CodeGenerator_1 = require("./CodeGenerator");
class CppGenerator extends CodeGenerator_1.CodeGenerator {
    name = "cpp";
    generate(module) {
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
        for (const stmt of module.body)
            this.emitStatement(stmt);
        return this.output;
    }
    emitType(type) {
        if (!type)
            return "auto";
        switch (type.kind) {
            case "Primitive": {
                const n = type.name;
                switch (n) {
                    case "number": return "double";
                    case "string": return "string";
                    case "boolean": return "bool";
                    case "void": return "void";
                    case "null": return "nullptr_t";
                    default: return "any";
                }
            }
            case "Array": return `vector<${this.emitType(type.elementType)}>`;
            case "Union": return `any`;
            case "Named": return type.name;
            default: return "auto";
        }
    }
    emitVariableDeclaration(stmt) {
        const type = this.emitType(stmt.typeAnnotation ?? (stmt.initializer ? { kind: "Primitive", name: "unknown", span: stmt.span } : { kind: "Primitive", name: "unknown", span: stmt.span }));
        const init = stmt.initializer ? ` = ${this.emitExpression(stmt.initializer)}` : "";
        this.emitLine(`${type} ${stmt.name}${init};`);
    }
    emitFunctionDeclaration(stmt) {
        const ret = this.emitType(stmt.returnType ?? { kind: "Primitive", name: "void", span: stmt.span });
        const params = stmt.parameters.map(p => `${this.emitType(p.type ?? { kind: "Primitive", name: "any", span: p.span })} ${p.name}`).join(", ");
        this.wrapBlock(() => this.emitBlockBody(stmt.body), `${ret} ${stmt.name}(${params}) {`);
    }
    emitClassDeclaration(stmt) {
        let head = `class ${stmt.name}`;
        if (stmt.superclass)
            head += ` : public ${stmt.superclass}`;
        if (stmt.interfaces.length)
            head += `, public ${stmt.interfaces.join(", public ")}`;
        this.wrapBlock(() => {
            this.emitLine("public:");
            this.indent++;
            for (const m of stmt.members)
                this.emitClassMember(m);
            this.indent--;
        }, head + " {");
        this.emitLine("};");
        this.emitLine("");
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
            default:
                break;
        }
    }
    emitMethodDeclaration(method) {
        const params = method.parameters.map(p => `${this.emitType(p.type ?? { kind: "Primitive", name: "any", span: p.span })} ${p.name}`).join(", ");
        const ret = this.emitType(method.returnType ?? { kind: "Primitive", name: "void", span: method.span });
        this.wrapBlock(() => this.emitBlockBody(method.body), `${ret} ${method.name}(${params}) {`);
    }
    emitFieldDeclaration(field) {
        const type = this.emitType(field.typeAnnotation ?? { kind: "Primitive", name: "any", span: field.span });
        const init = field.initializer ? ` = ${this.emitExpression(field.initializer)}` : "";
        this.emitLine(`${type} ${field.name}${init};`);
    }
    emitConstructorDeclaration(ctor) {
        const params = ctor.parameters.map(p => `${this.emitType(p.type ?? { kind: "Primitive", name: "any", span: p.span })} ${p.name}`).join(", ");
        this.wrapBlock(() => this.emitBlockBody(ctor.body), `${ctor.body ? "explicit " : ""}${ctor.parameters.length > 0 ? "" : ""}${ctor.parameters.length > 0 ? "" : ""}(${params}) {`);
    }
    emitIfStatement(stmt) {
        this.wrapBlock(() => this.emitBlockBody(stmt.consequent), `if (${this.emitExpression(stmt.test)}) {`);
        if (stmt.alternate) {
            this.wrapBlock(() => this.emitBlockBody(stmt.alternate), "else {");
        }
    }
    emitWhileStatement(stmt) {
        this.wrapBlock(() => this.emitBlockBody(stmt.body), `while (${this.emitExpression(stmt.test)}) {`);
    }
    emitForStatement(stmt) {
        const init = `${this.emitType(stmt.init.typeAnnotation ?? { kind: "Primitive", name: "unknown", span: stmt.init.span })} ${stmt.init.name} = ${this.emitExpression(stmt.init.initializer ?? { type: "Literal", value: 0, raw: "0", literalType: "number", span: stmt.init.span })}`;
        this.wrapBlock(() => this.emitBlockBody(stmt.body), `for (${init}; ${this.emitExpression(stmt.test)}; ${this.emitExpression(stmt.update)}) {`);
    }
    emitForEachStatement(stmt) {
        this.wrapBlock(() => this.emitBlockBody(stmt.body), `for (const auto& ${stmt.variable} : ${this.emitExpression(stmt.iterable)}) {`);
    }
    emitReturnStatement(stmt) {
        if (stmt.argument)
            this.emitLine(`return ${this.emitExpression(stmt.argument)};`);
        else
            this.emitLine("return;");
    }
    emitThrowStatement(stmt) {
        this.emitLine(`throw ${this.emitExpression(stmt.argument)};`);
    }
    emitTryStatement(stmt) {
        this.wrapBlock(() => this.emitBlockBody(stmt.block), "try {");
        if (stmt.handler) {
            this.wrapBlock(() => this.emitBlockBody(stmt.handler.block), `catch (${stmt.handler.param ?? "e"}) {`);
        }
    }
    emitExpressionStatement(stmt) {
        this.emitLine(`${this.emitExpression(stmt.expression)};`);
    }
    emitBlockStatement(stmt) {
        for (const s of stmt.statements)
            this.emitStatement(s);
    }
    emitExpression(expr) {
        switch (expr.type) {
            case "Literal": {
                const l = expr;
                if (l.value === null)
                    return "nullptr";
                if (l.value === undefined)
                    return "std::nullopt";
                if (typeof l.value === "string")
                    return JSON.stringify(l.value);
                if (typeof l.value === "boolean")
                    return l.value ? "true" : "false";
                if (typeof l.value === "number")
                    return String(l.value);
                return String(l.value);
            }
            default: return super.emitExpression(expr);
        }
    }
}
exports.CppGenerator = CppGenerator;
//# sourceMappingURL=CppGenerator.js.map
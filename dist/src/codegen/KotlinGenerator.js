"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KotlinGenerator = void 0;
const CodeGenerator_1 = require("./CodeGenerator");
class KotlinGenerator extends CodeGenerator_1.CodeGenerator {
    name = "kt";
    packageName = "com.betascript";
    generate(module) {
        this.output = "";
        this.indent = 0;
        this.emitLine(`package ${this.packageName}`);
        this.emitLine("");
        for (const stmt of module.body)
            this.emitStatement(stmt);
        return this.output;
    }
    emitType(type) {
        if (!type)
            return "Any";
        switch (type.kind) {
            case "Primitive": {
                const n = type.name;
                switch (n) {
                    case "number": return "Int";
                    case "string": return "String";
                    case "boolean": return "Boolean";
                    case "void": return "Unit";
                    case "null": return "Nothing";
                    default: return "Any";
                }
            }
            case "Array": return `List<${this.emitType(type.elementType)}>`;
            case "Union": return `Any`;
            case "Nullable": return `${this.emitType(type.type)}?`;
            case "Named": return type.name;
            default: return "Any";
        }
    }
    emitVariableDeclaration(stmt) {
        const type = this.emitType(stmt.typeAnnotation ?? { kind: "Primitive", name: "unknown", span: stmt.span });
        const init = stmt.initializer ? ` = ${this.emitExpression(stmt.initializer)}` : "";
        const kw = stmt.kind === "let" ? "var" : "val";
        this.emitLine(`${kw} ${stmt.name}: ${type}${init}`);
    }
    emitFunctionDeclaration(stmt) {
        const ret = this.emitType(stmt.returnType ?? { kind: "Primitive", name: "void", span: stmt.span });
        const params = stmt.parameters.map(p => `${p.name}: ${this.emitType(p.type ?? { kind: "Primitive", name: "any", span: p.span })}`).join(", ");
        const isSuspend = stmt.isAsync ? " suspend " : "";
        const isStatic = stmt.isStatic ? "companion object " : "fun ";
        this.wrapBlock(() => this.emitBlockBody(stmt.body), `${isStatic}${stmt.name}(${params}): ${ret} {`);
    }
    emitClassDeclaration(stmt) {
        let head = `class ${stmt.name}`;
        if (stmt.superclass)
            head += `(${stmt.superclass})`;
        if (stmt.interfaces.length)
            head += ` : ${stmt.interfaces.join(", ")}`;
        this.wrapBlock(() => {
            for (const m of stmt.members)
                this.emitClassMember(m);
        }, head + " {");
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
        const params = method.parameters.map(p => `${p.name}: ${this.emitType(p.type ?? { kind: "Primitive", name: "any", span: p.span })}`).join(", ");
        const ret = this.emitType(method.returnType ?? { kind: "Primitive", name: "void", span: method.span });
        const vis = method.visibility === "private" ? "private " : method.visibility === "protected" ? "protected " : "";
        this.wrapBlock(() => this.emitBlockBody(method.body), `${vis}fun ${method.name}(${params}): ${ret} {`);
    }
    emitFieldDeclaration(field) {
        const type = this.emitType(field.typeAnnotation ?? { kind: "Primitive", name: "any", span: field.span });
        const init = field.initializer ? ` = ${this.emitExpression(field.initializer)}` : "";
        const vis = field.visibility === "private" ? "private " : field.visibility === "protected" ? "protected " : "";
        const kw = field.isStatic ? "companion object " : "";
        this.emitLine(`${vis}${kw}val ${field.name}: ${type}${init}`);
    }
    emitConstructorDeclaration(ctor) {
        const params = ctor.parameters.map(p => `${p.name}: ${this.emitType(p.type ?? { kind: "Primitive", name: "any", span: p.span })}`).join(", ");
        this.wrapBlock(() => this.emitBlockBody(ctor.body), `constructor(${params}) {`);
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
        const init = `${stmt.init.name} = ${this.emitExpression(stmt.init.initializer ?? { type: "Literal", value: 0, raw: "0", literalType: "number", span: stmt.init.span })}`;
        this.wrapBlock(() => this.emitBlockBody(stmt.body), `for (${init}; ${this.emitExpression(stmt.test)}; ${this.emitExpression(stmt.update)}) {`);
    }
    emitForEachStatement(stmt) {
        this.wrapBlock(() => this.emitBlockBody(stmt.body), `for (${stmt.variable} in ${this.emitExpression(stmt.iterable)}) {`);
    }
    emitReturnStatement(stmt) {
        if (stmt.argument)
            this.emitLine(`return ${this.emitExpression(stmt.argument)}`);
        else
            this.emitLine("return");
    }
    emitThrowStatement(stmt) {
        this.emitLine(`throw Exception(${this.emitExpression(stmt.argument)})`);
    }
    emitTryStatement(stmt) {
        this.wrapBlock(() => this.emitBlockBody(stmt.block), "try {");
        if (stmt.handler) {
            this.wrapBlock(() => this.emitBlockBody(stmt.handler.block), `catch (e: Exception) {`);
        }
    }
    emitExpressionStatement(stmt) {
        this.emitLine(`${this.emitExpression(stmt.expression)}`);
    }
    emitBlockStatement(stmt) {
        for (const s of stmt.statements)
            this.emitStatement(s);
    }
}
exports.KotlinGenerator = KotlinGenerator;
//# sourceMappingURL=KotlinGenerator.js.map
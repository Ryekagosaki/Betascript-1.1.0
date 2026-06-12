"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JavaGenerator = void 0;
const CodeGenerator_1 = require("./CodeGenerator");
class JavaGenerator extends CodeGenerator_1.CodeGenerator {
    name = "java";
    packageName = "com.betascript";
    generate(module) {
        this.output = "";
        this.indent = 0;
        this.emitLine(`package ${this.packageName};`);
        this.emitLine("");
        this.emitLine("import java.util.*;");
        this.emitLine("import java.util.stream.*;");
        this.emitLine("");
        for (const stmt of module.body)
            this.emitStatement(stmt);
        return this.output;
    }
    emitType(type) {
        if (!type)
            return "Object";
        switch (type.kind) {
            case "Primitive": {
                const n = type.name;
                switch (n) {
                    case "number": return "double";
                    case "string": return "String";
                    case "boolean": return "boolean";
                    case "void": return "void";
                    case "null": return "null";
                    default: return "Object";
                }
            }
            case "Array": return `List<${this.emitType(type.elementType)}>`;
            case "Union": return `Object`;
            case "Nullable": return `${this.emitType(type.type)}`;
            case "Named": return type.name;
            default: return "Object";
        }
    }
    emitVariableDeclaration(stmt) {
        const type = this.emitType(stmt.typeAnnotation ?? { kind: "Primitive", name: "unknown", span: stmt.span });
        const init = stmt.initializer ? ` = ${this.emitExpression(stmt.initializer)}` : "";
        this.emitLine(`${type} ${stmt.name}${init};`);
    }
    emitFunctionDeclaration(stmt) {
        const ret = this.emitType(stmt.returnType ?? { kind: "Primitive", name: "void", span: stmt.span });
        const params = stmt.parameters.map(p => `${this.emitType(p.type ?? { kind: "Primitive", name: "any", span: p.span })} ${p.name}`).join(", ");
        const isStatic = stmt.isStatic ? "static " : "";
        this.wrapBlock(() => this.emitBlockBody(stmt.body), `${isStatic}${ret} ${stmt.name}(${params}) {`);
    }
    emitClassDeclaration(stmt) {
        let head = `public class ${stmt.name}`;
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
        const vis = method.visibility === "private" ? "private " : method.visibility === "protected" ? "protected " : "public ";
        this.wrapBlock(() => this.emitBlockBody(method.body), `${vis}${ret} ${method.name}(${params}) {`);
    }
    emitFieldDeclaration(field) {
        const type = this.emitType(field.typeAnnotation ?? { kind: "Primitive", name: "any", span: field.span });
        const init = field.initializer ? ` = ${this.emitExpression(field.initializer)}` : "";
        const vis = field.visibility === "private" ? "private " : field.visibility === "protected" ? "protected " : "public ";
        this.emitLine(`${vis}${type} ${field.name}${init};`);
    }
    emitConstructorDeclaration(ctor) {
        const params = ctor.parameters.map(p => `${this.emitType(p.type ?? { kind: "Primitive", name: "any", span: p.span })} ${p.name}`).join(", ");
        this.wrapBlock(() => this.emitBlockBody(ctor.body), `public ${ctor.parameters.length > 0 ? ctor.parameters[0].name : ""}(${params}) {`);
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
        this.wrapBlock(() => this.emitBlockBody(stmt.body), `for (${this.emitType({ kind: "Primitive", name: "unknown", span: stmt.span })} ${stmt.variable} : ${this.emitExpression(stmt.iterable)}) {`);
    }
    emitReturnStatement(stmt) {
        if (stmt.argument)
            this.emitLine(`return ${this.emitExpression(stmt.argument)};`);
        else
            this.emitLine("return;");
    }
    emitThrowStatement(stmt) {
        this.emitLine(`throw new Exception(${this.emitExpression(stmt.argument)});`);
    }
    emitTryStatement(stmt) {
        this.wrapBlock(() => this.emitBlockBody(stmt.block), "try {");
        if (stmt.handler) {
            this.wrapBlock(() => this.emitBlockBody(stmt.handler.block), `catch (Exception ${stmt.handler.param ?? "e"}) {`);
        }
    }
    emitExpressionStatement(stmt) {
        this.emitLine(`${this.emitExpression(stmt.expression)};`);
    }
    emitBlockStatement(stmt) {
        for (const s of stmt.statements)
            this.emitStatement(s);
    }
}
exports.JavaGenerator = JavaGenerator;
//# sourceMappingURL=JavaGenerator.js.map
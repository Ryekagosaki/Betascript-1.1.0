"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeChecker = void 0;
exports.checkTypes = checkTypes;
function makePos() {
    return { line: 0, column: 0 };
}
function anyType() {
    return { kind: "Primitive", name: "any", span: { start: makePos(), end: makePos() } };
}
class TypeChecker {
    stack = [];
    retType = null;
    check(mod) {
        this.stack = [{ variables: new Map() }];
        for (const s of mod.body) {
            this.visitStmt(s);
        }
        return true;
    }
    push() { this.stack.push({ variables: new Map() }); }
    pop() { this.stack.pop(); }
    cur() { return this.stack[this.stack.length - 1]; }
    decl(name, t) {
        this.cur().variables.set(name, t);
    }
    find(name) {
        for (let i = this.stack.length - 1; i >= 0; i--) {
            const v = this.stack[i].variables.get(name);
            if (v)
                return v;
        }
        return undefined;
    }
    visitStmt(s) {
        switch (s.type) {
            case "VariableDeclaration": {
                const d = s;
                const t = d.typeAnnotation ?? (d.initializer ? this.infer(d.initializer) : anyType());
                this.decl(d.name, t);
                if (d.initializer)
                    this.infer(d.initializer);
                break;
            }
            case "FunctionDeclaration": {
                const d = s;
                this.push();
                this.retType = d.returnType ?? anyType();
                for (const p of d.parameters)
                    this.decl(p.name, p.type ?? anyType());
                this.visitBlock(d.body);
                this.pop();
                this.retType = null;
                break;
            }
            case "ClassDeclaration": {
                const d = s;
                this.push();
                for (const m of d.members) {
                    if (m.type === "MethodDeclaration") {
                        const md = m;
                        this.push();
                        this.retType = md.returnType ?? anyType();
                        for (const p of md.parameters)
                            this.decl(p.name, p.type ?? anyType());
                        this.visitBlock(md.body);
                        this.pop();
                        this.retType = null;
                    }
                }
                this.pop();
                break;
            }
            case "IfStatement": {
                const d = s;
                this.infer(d.test);
                this.push();
                this.visitBlock(d.consequent);
                this.pop();
                if (d.alternate) {
                    this.push();
                    this.visitBlock(d.alternate);
                    this.pop();
                }
                break;
            }
            case "WhileStatement": {
                const d = s;
                this.infer(d.test);
                this.push();
                this.visitBlock(d.body);
                this.pop();
                break;
            }
            case "ForStatement": {
                const d = s;
                this.visitStmt(d.init);
                this.infer(d.test);
                this.infer(d.update);
                this.push();
                this.visitBlock(d.body);
                this.pop();
                break;
            }
            case "ForEachStatement": {
                const d = s;
                this.infer(d.iterable);
                this.push();
                this.decl(d.variable, anyType());
                this.visitBlock(d.body);
                this.pop();
                break;
            }
            case "ReturnStatement": {
                const d = s;
                if (d.argument) {
                    if (this.retType) {
                        const t = this.infer(d.argument);
                        // simplified: just record
                    }
                }
                break;
            }
            case "TryStatement": {
                const d = s;
                this.visitBlock(d.block);
                if (d.handler) {
                    this.push();
                    if (d.handler.param)
                        this.decl(d.handler.param, anyType());
                    this.visitBlock(d.handler.block);
                    this.pop();
                }
                if (d.finalizer)
                    this.visitBlock(d.finalizer);
                break;
            }
            case "ExpressionStatement":
                this.infer(s.expression);
                break;
            case "BlockStatement":
                this.visitBlock(s);
                break;
            default:
                break;
        }
    }
    visitBlock(b) {
        for (const s of b.statements)
            this.visitStmt(s);
    }
    infer(e) {
        switch (e.type) {
            case "Literal": {
                const l = e;
                if (typeof l.value === "number")
                    return { kind: "Primitive", name: "number", span: l.span };
                if (typeof l.value === "string")
                    return { kind: "Primitive", name: "string", span: l.span };
                if (typeof l.value === "boolean")
                    return { kind: "Primitive", name: "boolean", span: l.span };
                if (l.value === null)
                    return { kind: "Primitive", name: "null", span: l.span };
                return { kind: "Primitive", name: "undefined", span: l.span };
            }
            case "Identifier": {
                const name = e.name;
                const t = this.find(name);
                return t ?? anyType();
            }
            case "BinaryExpression": {
                const op = e.operator;
                if (["==", "===", "!==", "!=", "<", ">", "<=", ">=", "&&", "||", "??"].includes(op))
                    return { kind: "Primitive", name: "boolean", span: e.span };
                return this.infer(e.left);
            }
            case "UnaryExpression":
                return this.infer(e.argument);
            case "AssignmentExpression": {
                const a = e;
                if (a.left.type === "Identifier") {
                    this.decl(a.left.name, this.infer(a.right));
                }
                return this.infer(a.right);
            }
            case "CallExpression": {
                const c = e;
                return this.infer(c.callee);
            }
            case "MemberExpression":
                return anyType();
            case "NewExpression":
                return anyType();
            case "ArrayExpression": {
                const arr = e;
                if (arr.elements.length === 0)
                    return { kind: "Array", elementType: { kind: "Primitive", name: "never", span: arr.span }, span: arr.span };
                const base = this.infer(arr.elements[0]);
                const all = arr.elements.every(el => this.eq(base, this.infer(el)));
                return { kind: "Array", elementType: all ? base : { kind: "Union", types: arr.elements.map(el => this.infer(el)), span: arr.span }, span: arr.span };
            }
            case "ObjectExpression":
                return { kind: "Primitive", name: "any", span: e.span };
            case "ArrowFunction": {
                const a = e;
                return { kind: "Function", parameters: a.parameters.map(p => p.type ?? anyType()), returnType: anyType(), span: a.span };
            }
            case "ConditionalExpression":
                return this.infer(e.alternate);
            default:
                return anyType();
        }
    }
    eq(a, b) {
        if (a.kind !== b.kind)
            return false;
        switch (a.kind) {
            case "Primitive": return a.name === b.name;
            case "Array": return this.eq(a.elementType, b.elementType);
            case "Union": return a.types.length === b.types.length && a.types.every((t, i) => this.eq(t, b.types[i]));
            case "Named": return a.name === b.name;
            default: return true;
        }
    }
}
exports.TypeChecker = TypeChecker;
function checkTypes(mod) {
    new TypeChecker().check(mod);
}
//# sourceMappingURL=TypeChecker.js.map
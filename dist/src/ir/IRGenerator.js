"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IRGenerator = void 0;
function toSpan(pos) {
    const start = {
        offset: 0,
        line: pos.line,
        column: pos.column,
        filename: pos.filename,
    };
    return {
        start,
        end: { ...start },
    };
}
function fromIdentifier(name, pos) {
    return { type: "Identifier", name, span: toSpan(pos) };
}
function fromLiteral(lit, pos) {
    const literalType = (() => {
        if (typeof lit.value === "number")
            return "number";
        if (typeof lit.value === "string") {
            if (lit.raw.startsWith("`"))
                return "template";
            return "string";
        }
        if (typeof lit.value === "boolean")
            return "boolean";
        if (lit.value === null)
            return "null";
        return "undefined";
    })();
    return { type: "Literal", value: lit.value, literalType, raw: lit.raw, span: toSpan(pos) };
}
function fromBinary(left, op, right, pos) {
    return { type: "BinaryExpression", operator: op, left: fromExpr(left), right: fromExpr(right), span: toSpan(pos) };
}
function fromUnary(op, arg, prefix, pos) {
    return { type: "UnaryExpression", operator: op, argument: fromExpr(arg), prefix, span: toSpan(pos) };
}
function fromAssignment(left, op, right, pos) {
    return { type: "AssignmentExpression", operator: op, left: fromExpr(left), right: fromExpr(right), span: toSpan(pos) };
}
function fromCall(callee, args, pos) {
    return { type: "CallExpression", callee: fromExpr(callee), arguments: args.map(fromExpr), span: toSpan(pos) };
}
function fromMember(obj, property, computed, optional, pos) {
    return { type: "MemberExpression", object: fromExpr(obj), property, computed, optional, span: toSpan(pos) };
}
function fromNew(callee, args, pos) {
    return { type: "NewExpression", callee: fromIdentifier(callee, pos), arguments: args.map(fromExpr), span: toSpan(pos) };
}
function fromSuper(property, pos, args = []) {
    return { type: "SuperExpression", property: property ? fromIdentifier(property, pos).name : undefined, arguments: args.map(fromExpr), span: toSpan(pos) };
}
function fromArray(elements, pos) {
    return { type: "ArrayExpression", elements: elements.map(fromExpr), span: toSpan(pos) };
}
function fromObject(properties, pos) {
    return {
        type: "ObjectExpression",
        properties: properties.map(p => ({
            key: typeof p.key === "string" ? p.key : fromExpr(p.key).name,
            value: fromExpr(p.value),
            shorthand: false,
            span: toSpan(pos),
        })),
        span: toSpan(pos),
    };
}
function fromConditional(test, cons, alt, pos) {
    return { type: "ConditionalExpression", test: fromExpr(test), consequent: fromExpr(cons), alternate: fromExpr(alt), span: toSpan(pos) };
}
function fromArrow(params, body, isAsync, pos) {
    return {
        type: "ArrowFunction",
        parameters: params.map(p => ({ name: p.name, type: undefined, isRest: false, optional: false, span: toSpan(pos) })),
        body: body.type === "BlockStatement" ? fromBlock(body) : fromExpr(body),
        isAsync,
        span: toSpan(pos),
    };
}
function fromTemplate(raw, pos) {
    return {
        type: "TemplateExpression",
        quasis: raw.split(/\$\{.*?\}/),
        expressions: [],
        raw,
        span: toSpan(pos),
    };
}
function fromSpread(arg, pos) {
    return { type: "SpreadExpression", argument: fromExpr(arg), span: toSpan(pos) };
}
function fromExpr(expr) {
    switch (expr.type) {
        case "Identifier": return fromIdentifier(expr.name, expr.position);
        case "Literal": return fromLiteral(expr, expr.position);
        case "BinaryExpression": return fromBinary(expr.left, expr.operator, expr.right, expr.position);
        case "UnaryExpression": return fromUnary(expr.operator, expr.argument, expr.prefix, expr.position);
        case "AssignmentExpression": return fromAssignment(expr.left, expr.operator, expr.right, expr.position);
        case "CallExpression": return fromCall(expr.callee, expr.arguments, expr.position);
        case "MemberExpression": return fromMember(expr.object, expr.property.name, expr.computed, expr.optional ?? false, expr.position);
        case "NewExpression": return fromNew(expr.callee, expr.arguments, expr.position);
        case "SuperExpression": return fromSuper(expr.property?.name, expr.position, expr.arguments ?? []);
        case "ArrayExpression": return fromArray(expr.elements, expr.position);
        case "ObjectExpression": return fromObject(expr.properties.map(p => ({ key: p.key, value: p.value, spread: p.key === "__spread" })), expr.position);
        case "LambdaExpression": return fromArrow(expr.parameters, expr.body, false, expr.position);
        case "ConditionalExpression": return fromConditional(expr.test, expr.consequent, expr.alternate, expr.position);
    }
}
function fromType(anno) {
    if (!anno)
        return undefined;
    const pos = { line: 0, column: 0 };
    switch (anno) {
        case "angka": return { kind: "Primitive", name: "number", span: toSpan(pos) };
        case "kata": return { kind: "Primitive", name: "string", span: toSpan(pos) };
        case "betoel": return { kind: "Primitive", name: "boolean", span: toSpan(pos) };
        case "deret": return { kind: "Array", elementType: { kind: "Primitive", name: "any", span: toSpan(pos) }, span: toSpan(pos) };
        default: return { kind: "Named", name: anno, span: toSpan(pos) };
    }
}
function fromBlock(block) {
    return {
        type: "BlockStatement",
        statements: block.statements.map(fromStatement),
        span: toSpan(block.position),
    };
}
function fromStatement(stmt) {
    switch (stmt.type) {
        case "VariableDeclaration": return {
            type: "VariableDeclaration",
            kind: stmt.kind === "ane" ? "let" : "const",
            name: stmt.name,
            typeAnnotation: fromType(stmt.typeAnnotation),
            initializer: stmt.initializer ? fromExpr(stmt.initializer) : undefined,
            span: toSpan(stmt.position),
        };
        case "FunctionDeclaration": return {
            type: "FunctionDeclaration",
            name: stmt.name,
            parameters: stmt.parameters.map((p) => ({ name: p.name, type: fromType(p.type), isRest: p.isRest ?? false, optional: false, span: toSpan(p.position) })),
            returnType: fromType(stmt.returnType),
            body: fromBlock(stmt.body),
            isAsync: stmt.isAsync,
            isExported: stmt.isExported,
            isStatic: false,
            generators: [],
            decorators: [],
            span: toSpan(stmt.position),
        };
        case "ClassDeclaration": return {
            type: "ClassDeclaration",
            name: stmt.name,
            superclass: stmt.superclass,
            interfaces: stmt.interfaces,
            mixins: [],
            members: stmt.members.map(fromClassMember),
            decorators: [],
            isAbstract: false,
            span: toSpan(stmt.position),
        };
        case "InterfaceDeclaration": return {
            type: "InterfaceDeclaration",
            name: stmt.name,
            methods: stmt.methods.map((m) => ({ name: m.name, parameters: m.parameters.map((p) => ({ name: p.name, type: fromType(p.type), isRest: false, optional: false, span: toSpan(p.position) })), returnType: fromType(m.returnType), isStatic: false, span: toSpan(m.position) })),
            properties: [],
            extends: [],
            span: toSpan(stmt.position),
        };
        case "IfStatement": return {
            type: "IfStatement",
            test: fromExpr(stmt.test),
            consequent: fromBlock(stmt.consequent),
            alternate: stmt.alternate?.block ? fromBlock(stmt.alternate.block) : undefined,
            span: toSpan(stmt.position),
        };
        case "WhileStatement": return {
            type: "WhileStatement",
            test: fromExpr(stmt.test),
            body: fromBlock(stmt.body),
            span: toSpan(stmt.position),
        };
        case "DoWhileStatement": return {
            type: "WhileStatement",
            test: fromExpr(stmt.test),
            body: fromBlock(stmt.body),
            span: toSpan(stmt.position),
        };
        case "ForStatement": return {
            type: "ForStatement",
            init: fromStatement(stmt.init),
            test: fromExpr(stmt.test),
            update: fromExpr(stmt.update),
            body: fromBlock(stmt.body),
            span: toSpan(stmt.position),
        };
        case "ForEachStatement": return {
            type: "ForEachStatement",
            variable: stmt.variable,
            iterable: fromExpr(stmt.iterable),
            body: fromBlock(stmt.body),
            span: toSpan(stmt.position),
        };
        case "SwitchStatement": return {
            type: "IfStatement",
            test: fromExpr(stmt.discriminant),
            consequent: { type: "BlockStatement", statements: stmt.cases.flatMap(c => c.consequent.map(fromStatement)), span: toSpan(stmt.position) },
            span: toSpan(stmt.position),
        };
        case "TryStatement": return {
            type: "TryStatement",
            block: fromBlock(stmt.block),
            handler: stmt.handler ? { param: stmt.handler.param ?? undefined, block: fromBlock(stmt.handler.block), span: toSpan(stmt.handler.position) } : undefined,
            finalizer: stmt.finalizer ? fromBlock(stmt.finalizer) : undefined,
            span: toSpan(stmt.position),
        };
        case "ReturnStatement": return { type: "ReturnStatement", argument: stmt.argument ? fromExpr(stmt.argument) : undefined, span: toSpan(stmt.position) };
        case "ThrowStatement": return { type: "ThrowStatement", argument: fromExpr(stmt.argument), span: toSpan(stmt.position) };
        case "BreakStatement": return { type: "BreakStatement", span: toSpan(stmt.position) };
        case "ContinueStatement": return { type: "ContinueStatement", span: toSpan(stmt.position) };
        case "ExpressionStatement": return { type: "ExpressionStatement", expression: fromExpr(stmt.expression), span: toSpan(stmt.position) };
        case "BlockStatement": return fromBlock(stmt);
        default: return fromBlock({ type: "BlockStatement", statements: [stmt], position: stmt.position });
    }
}
function fromClassMember(member) {
    if (member.type === "MethodDeclaration") {
        return {
            type: "MethodDeclaration",
            name: member.name,
            visibility: member.visibility,
            span: toSpan(member.position),
            parameters: member.parameters.map((p) => ({ name: p.name, type: fromType(p.type), isRest: p.isRest ?? false, optional: false, span: toSpan(p.position) })),
            returnType: undefined,
            body: fromBlock(member.body),
            isStatic: member.isStatic,
            isAsync: false,
            abstract: false,
        };
    }
    return {
        type: "FieldDeclaration",
        name: member.name,
        visibility: member.visibility,
        span: toSpan(member.position),
        typeAnnotation: fromType(undefined),
        initializer: member.initializer ? fromExpr(member.initializer) : undefined,
        isStatic: member.isStatic,
    };
}
class IRGenerator {
    generate(program) {
        return {
            type: "Module",
            name: "main",
            body: program.body.map(fromStatement),
            imports: [],
            exports: [],
            span: { start: { offset: 0, line: 1, column: 1 }, end: { offset: program.body.length, line: 1, column: 1 } },
        };
    }
}
exports.IRGenerator = IRGenerator;
//# sourceMappingURL=IRGenerator.js.map
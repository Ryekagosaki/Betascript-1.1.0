import { Program, Statement, Expression, BinaryExpression, UnaryExpression,
  AssignmentExpression, CallExpression, MemberExpression, NewExpression,
  SuperExpression, ArrayExpression, ObjectExpression, Literal, Identifier, LambdaExpression,
  ConditionalExpression, SwitchStatement, SwitchCase, TryStatement,
  CatchClause, ForStatement, ForEachStatement, BlockStatement,
  VariableDeclaration, FunctionDeclaration, ClassDeclaration, MethodDeclaration,
  FieldDeclaration, InterfaceDeclaration, IfStatement, ElseClause,
  WhileStatement, ReturnStatement, ThrowStatement, BreakStatement,
  ContinueStatement, ImportStatement, ExportStatement, ExpressionStatement,
  DoWhileStatement, TypeAnnotation
} from "../parser/AST";

import { SourceLocation } from "../utils/SourceLocation";
import { SourceSpan, Position } from "./IR";

function toSpan(pos: SourceLocation): SourceSpan {
  const start: Position = {
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

function fromIdentifier(name: string, pos: SourceLocation) {
  return { type: "Identifier" as const, name, span: toSpan(pos) };
}

function fromLiteral(lit: Literal, pos: SourceLocation) {
  const literalType = (() => {
    if (typeof lit.value === "number") return "number" as const;
    if (typeof lit.value === "string") {
      if (lit.raw.startsWith("`")) return "template" as const;
      return "string" as const;
    }
    if (typeof lit.value === "boolean") return "boolean" as const;
    if (lit.value === null) return "null" as const;
    return "undefined" as const;
  })();
  return { type: "Literal" as const, value: lit.value, literalType, raw: lit.raw, span: toSpan(pos) };
}

function fromBinary(left: Expression, op: string, right: Expression, pos: SourceLocation) {
  return { type: "BinaryExpression" as const, operator: op, left: fromExpr(left), right: fromExpr(right), span: toSpan(pos) };
}

function fromUnary(op: string, arg: Expression, prefix: boolean, pos: SourceLocation) {
  return { type: "UnaryExpression" as const, operator: op, argument: fromExpr(arg), prefix, span: toSpan(pos) };
}

function fromAssignment(left: Expression, op: string, right: Expression, pos: SourceLocation) {
  return { type: "AssignmentExpression" as const, operator: op, left: fromExpr(left), right: fromExpr(right), span: toSpan(pos) };
}

function fromCall(callee: Expression, args: Expression[], pos: SourceLocation) {
  return { type: "CallExpression" as const, callee: fromExpr(callee), arguments: args.map(fromExpr), span: toSpan(pos) };
}

function fromMember(obj: Expression, property: string, computed: boolean, optional: boolean, pos: SourceLocation) {
  return { type: "MemberExpression" as const, object: fromExpr(obj), property, computed, optional, span: toSpan(pos) };
}

function fromNew(callee: string, args: Expression[], pos: SourceLocation) {
  return { type: "NewExpression" as const, callee: fromIdentifier(callee, pos), arguments: args.map(fromExpr), span: toSpan(pos) };
}

function fromSuper(property?: string, pos?: SourceLocation, args: Expression[] = []) {
  return { type: "SuperExpression" as const, property: property ? fromIdentifier(property, pos).name : undefined, arguments: args.map(fromExpr), span: toSpan(pos) };
}

function fromArray(elements: Expression[], pos: SourceLocation) {
  return { type: "ArrayExpression" as const, elements: elements.map(fromExpr), span: toSpan(pos) };
}

function fromObject(properties: { key: string | Expression; value: Expression; spread?: boolean }[], pos: SourceLocation) {
  return {
    type: "ObjectExpression" as const,
    properties: properties.map(p => ({
      key: typeof p.key === "string" ? p.key : fromExpr(p.key).name,
      value: fromExpr(p.value),
      shorthand: false,
      span: toSpan(pos),
    })),
    span: toSpan(pos),
  };
}

function fromConditional(test: Expression, cons: Expression, alt: Expression, pos: SourceLocation) {
  return { type: "ConditionalExpression" as const, test: fromExpr(test), consequent: fromExpr(cons), alternate: fromExpr(alt), span: toSpan(pos) };
}

function fromArrow(params: { name: string }[], body: Expression | BlockStatement, isAsync: boolean, pos: SourceLocation) {
  return {
    type: "ArrowFunction" as const,
    parameters: params.map(p => ({ name: p.name, type: undefined, isRest: false, optional: false, span: toSpan(pos) })),
    body: body.type === "BlockStatement" ? fromBlock(body) : fromExpr(body as Expression),
    isAsync,
    span: toSpan(pos),
  };
}

function fromTemplate(raw: string, pos: SourceLocation) {
  return {
    type: "TemplateExpression" as const,
    quasis: raw.split(/\$\{.*?\}/),
    expressions: [],
    raw,
    span: toSpan(pos),
  };
}

function fromSpread(arg: Expression, pos: SourceLocation) {
  return { type: "SpreadExpression" as const, argument: fromExpr(arg), span: toSpan(pos) };
}

function fromExpr(expr: Expression) {
  switch (expr.type) {
    case "Identifier": return fromIdentifier(expr.name, expr.position);
    case "Literal": return fromLiteral(expr, expr.position);
    case "BinaryExpression": return fromBinary(expr.left, expr.operator, expr.right, expr.position);
    case "UnaryExpression": return fromUnary(expr.operator, expr.argument, expr.prefix, expr.position);
    case "AssignmentExpression": return fromAssignment(expr.left, expr.operator, expr.right, expr.position);
    case "CallExpression": return fromCall(expr.callee, expr.arguments, expr.position);
    case "MemberExpression": return fromMember(expr.object, (expr.property as Identifier).name, expr.computed, expr.optional ?? false, expr.position);
    case "NewExpression": return fromNew(expr.callee, expr.arguments, expr.position);
    case "SuperExpression": return fromSuper(expr.property?.name, expr.position, expr.arguments ?? []);
    case "ArrayExpression": return fromArray(expr.elements, expr.position);
    case "ObjectExpression": return fromObject(expr.properties.map(p => ({ key: p.key, value: p.value, spread: (p as any).key === "__spread" })), expr.position);
    case "LambdaExpression": return fromArrow(expr.parameters, expr.body, false, expr.position);
    case "ConditionalExpression": return fromConditional(expr.test, expr.consequent, expr.alternate, expr.position);
  }
}

function fromType(anno: TypeAnnotation | undefined) {
  if (!anno) return undefined;
  const pos: SourceLocation = { line: 0, column: 0 };
  switch (anno) {
    case "angka": return { kind: "Primitive", name: "number", span: toSpan(pos) } as any;
    case "kata": return { kind: "Primitive", name: "string", span: toSpan(pos) } as any;
    case "betoel": return { kind: "Primitive", name: "boolean", span: toSpan(pos) } as any;
    case "deret": return { kind: "Array", elementType: { kind: "Primitive", name: "any", span: toSpan(pos) }, span: toSpan(pos) } as any;
    default: return { kind: "Named", name: anno, span: toSpan(pos) } as any;
  }
}

function fromBlock(block: BlockStatement) {
  return {
    type: "BlockStatement",
    statements: block.statements.map(fromStatement),
    span: toSpan(block.position),
  };
}

function fromStatement(stmt: any) {
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
      parameters: stmt.parameters.map((p: any) => ({ name: p.name, type: fromType(p.type), isRest: p.isRest ?? false, optional: false, span: toSpan(p.position) })),
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
      methods: stmt.methods.map((m: any) => ({ name: m.name, parameters: m.parameters.map((p: any) => ({ name: p.name, type: fromType(p.type), isRest: false, optional: false, span: toSpan(p.position) })), returnType: fromType(m.returnType), isStatic: false, span: toSpan(m.position) })),
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
      init: fromStatement(stmt.init) as any,
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

function fromClassMember(member: any) {
  if (member.type === "MethodDeclaration") {
    return {
      type: "MethodDeclaration" as const,
      name: member.name,
      visibility: member.visibility,
      span: toSpan(member.position),
      parameters: member.parameters.map((p: any) => ({ name: p.name, type: fromType(p.type), isRest: p.isRest ?? false, optional: false, span: toSpan(p.position) })),
      returnType: undefined,
      body: fromBlock(member.body),
      isStatic: member.isStatic,
      isAsync: false,
      abstract: false,
    };
  }
  return {
    type: "FieldDeclaration" as const,
    name: member.name,
    visibility: member.visibility,
    span: toSpan(member.position),
    typeAnnotation: fromType(undefined),
    initializer: member.initializer ? fromExpr(member.initializer) : undefined,
    isStatic: member.isStatic,
  };
}

export class IRGenerator {
  generate(program: Program) {
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

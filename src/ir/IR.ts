export interface Position {
  offset: number;
  line: number;
  column: number;
  filename?: string;
}

export interface SourceSpan {
  start: Position;
  end: Position;
}

export interface IRModule {
  name: string;
  body: IRStatement[];
  imports: IRImport[];
  exports: IRExport[];
  span: SourceSpan;
}

export interface IRImport {
  module: string;
  names: string[];
  defaultImport?: string;
  span: SourceSpan;
}

export interface IRExport {
  name: string;
  declaration: IRStatement | IRTypeAliasDeclaration | IREnumDeclaration;
  span: SourceSpan;
}

export type IRStatement = IRVariableDeclaration
  | IRFunctionDeclaration
  | IRClassDeclaration
  | IRInterfaceDeclaration
  | IRTypeAliasDeclaration
  | IREnumDeclaration
  | IRDecoratorApplication
  | IRIfStatement
  | IRWhileStatement
  | IRForStatement
  | IRForEachStatement
  | IRReturnStatement
  | IRThrowStatement
  | IRTryStatement
  | IRExpressionStatement
  | IRBlockStatement
  | IRBreakStatement
  | IRContinueStatement;

export interface IRVariableDeclaration {
  type: "VariableDeclaration";
  kind: "let" | "const";
  name: string;
  optional?: boolean;
  typeAnnotation?: IRType;
  initializer?: IRExpression;
  span: SourceSpan;
}

export interface IRFunctionDeclaration {
  type: "FunctionDeclaration";
  name: string;
  parameters: IRParameter[];
  returnType?: IRType;
  body: IRBlockStatement;
  isAsync: boolean;
  isExported: boolean;
  isStatic: boolean;
  generators: string[];
  decorators: IRDecorator[];
  span: SourceSpan;
}

export interface IRParameter {
  name: string;
  type?: IRType;
  isRest: boolean;
  optional: boolean;
  defaultValue?: IRExpression;
  span: SourceSpan;
}

export interface IRClassDeclaration {
  type: "ClassDeclaration";
  name: string;
  superclass?: string;
  interfaces: string[];
  mixins: string[];
  members: IRClassMember[];
  decorators: IRDecorator[];
  isAbstract: boolean;
  span: SourceSpan;
}

export interface IRTypeAliasDeclaration {
  type: "TypeAliasDeclaration";
  name: string;
  typeAnnotation: IRType;
  span: SourceSpan;
}

export interface IREnumDeclaration {
  type: "EnumDeclaration";
  name: string;
  members: IREnumMember[];
  span: SourceSpan;
}

export interface IREnumMember {
  name: string;
  value?: IRExpression;
  span: SourceSpan;
}

export interface IRDecoratorApplication {
  type: "DecoratorApplication";
  target: string;
  decorator: IRDecorator;
  span: SourceSpan;
}

export interface IRDecorator {
  name: string;
  arguments: IRExpression[];
  span: SourceSpan;
}

export interface IRInterfaceDeclaration {
  type: "InterfaceDeclaration";
  name: string;
  methods: IRInterfaceMethod[];
  properties: IRPropertyDeclaration[];
  extends: string[];
  span: SourceSpan;
}

export interface IRInterfaceMethod {
  name: string;
  parameters: IRParameter[];
  returnType?: IRType;
  isStatic: boolean;
  span: SourceSpan;
}

export interface IRPropertyDeclaration {
  name: string;
  type: IRType;
  isStatic: boolean;
  isOptional: boolean;
  defaultValue?: IRExpression;
  span: SourceSpan;
}

export interface IRClassMember {
  type: "MethodDeclaration" | "FieldDeclaration" | "PropertyDeclaration" | "ConstructorDeclaration";
  name: string;
  visibility: "public" | "private" | "protected";
  span: SourceSpan;
}

export interface IRMethodDeclaration extends IRClassMember {
  type: "MethodDeclaration";
  parameters: IRParameter[];
  returnType?: IRType;
  body: IRBlockStatement;
  isStatic: boolean;
  isAsync: boolean;
  abstract: boolean;
}

export interface IRConstructorDeclaration extends IRClassMember {
  type: "ConstructorDeclaration";
  parameters: IRParameter[];
  body: IRBlockStatement;
}

export interface IRFieldDeclaration extends IRClassMember {
  type: "FieldDeclaration";
  typeAnnotation?: IRType;
  initializer?: IRExpression;
  isStatic: boolean;
}

export interface IRIfStatement {
  type: "IfStatement";
  test: IRExpression;
  consequent: IRBlockStatement;
  alternate?: IRBlockStatement;
  span: SourceSpan;
}

export interface IRWhileStatement {
  type: "WhileStatement";
  test: IRExpression;
  body: IRBlockStatement;
  span: SourceSpan;
}

export interface IRForStatement {
  type: "ForStatement";
  init: IRVariableDeclaration;
  test: IRExpression;
  update: IRExpression;
  body: IRBlockStatement;
  span: SourceSpan;
}

export interface IRForEachStatement {
  type: "ForEachStatement";
  variable: string;
  iterable: IRExpression;
  body: IRBlockStatement;
  span: SourceSpan;
}

export interface IRReturnStatement {
  type: "ReturnStatement";
  argument?: IRExpression;
  span: SourceSpan;
}

export interface IRThrowStatement {
  type: "ThrowStatement";
  argument: IRExpression;
  span: SourceSpan;
}

export interface IRBreakStatement {
  type: "BreakStatement";
  span: SourceSpan;
}

export interface IRContinueStatement {
  type: "ContinueStatement";
  span: SourceSpan;
}

export interface IRTryStatement {
  type: "TryStatement";
  block: IRBlockStatement;
  handler?: IRCatchClause;
  finalizer?: IRBlockStatement;
  span: SourceSpan;
}

export interface IRCatchClause {
  param?: string;
  block: IRBlockStatement;
  span: SourceSpan;
}

export interface IRExpressionStatement {
  type: "ExpressionStatement";
  expression: IRExpression;
  span: SourceSpan;
}

export interface IRBlockStatement {
  type: "BlockStatement";
  statements: IRStatement[];
  span: SourceSpan;
}

export type IRType = IRPrimitiveType
  | IRArrayType
  | IRUnionType
  | IRTupleType
  | IRFunctionType
  | IRNullableType
  | IRObjectType
  | IRNamedType
  | IRGenericType
  | IRMappedType;

export interface IRPrimitiveType {
  kind: "Primitive";
  name: "number" | "string" | "boolean" | "void" | "any" | "unknown" | "never" | "null" | "undefined";
  span: SourceSpan;
}

export interface IRArrayType {
  kind: "Array";
  elementType: IRType;
  span: SourceSpan;
}

export interface IRUnionType {
  kind: "Union";
  types: IRType[];
  span: SourceSpan;
}

export interface IRTupleType {
  kind: "Tuple";
  elementTypes: IRType[];
  span: SourceSpan;
}

export interface IRFunctionType {
  kind: "Function";
  parameters: IRType[];
  returnType: IRType;
  span: SourceSpan;
}

export interface IRNullableType {
  kind: "Nullable";
  type: IRType;
  span: SourceSpan;
}

export interface IRObjectType {
  kind: "Object";
  properties: IRPropertyType[];
  span: SourceSpan;
}

export interface IRPropertyType {
  name: string;
  type: IRType;
  optional: boolean;
  span: SourceSpan;
}

export interface IRNamedType {
  kind: "Named";
  name: string;
  typeArguments?: IRType[];
  span: SourceSpan;
}

export interface IRGenericType {
  kind: "Generic";
  name: string;
  constraint?: IRType;
  span: SourceSpan;
}

export interface IRMappedType {
  kind: "Mapped";
  from: IRNamedType;
  to: IRNamedType;
  optional: boolean;
  readonly: boolean;
  span: SourceSpan;
}

export type IRExpression = IRLiteral
  | IRIdentifier
  | IRBinaryExpression
  | IRUnaryExpression
  | IRAssignmentExpression
  | IRCallExpression
  | IRMemberExpression
  | IRNewExpression
  | IRSuperExpression
  | IRArrayExpression
  | IRObjectExpression
  | IRArrowFunction
  | IRConditionalExpression
  | IRTemplateExpression
  | IRSpreadExpression;

export interface IRLiteral {
  type: "Literal";
  value: string | number | boolean | null | undefined;
  literalType: "number" | "string" | "boolean" | "null" | "undefined" | "regex" | "template";
  raw: string;
  span: SourceSpan;
}

export interface IRIdentifier {
  type: "Identifier";
  name: string;
  span: SourceSpan;
}

export interface IRBinaryExpression {
  type: "BinaryExpression";
  operator: string;
  left: IRExpression;
  right: IRExpression;
  span: SourceSpan;
}

export interface IRUnaryExpression {
  type: "UnaryExpression";
  operator: string;
  argument: IRExpression;
  prefix: boolean;
  span: SourceSpan;
}

export interface IRAssignmentExpression {
  type: "AssignmentExpression";
  operator: string;
  left: IRExpression;
  right: IRExpression;
  span: SourceSpan;
}

export interface IRCallExpression {
  type: "CallExpression";
  callee: IRExpression;
  arguments: IRExpression[];
  typeArguments?: IRType[];
  span: SourceSpan;
}

export interface IRMemberExpression {
  type: "MemberExpression";
  object: IRExpression;
  property: string;
  computed: boolean;
  optional: boolean;
  span: SourceSpan;
}

export interface IRNewExpression {
  type: "NewExpression";
  callee: IRExpression;
  arguments: IRExpression[];
  typeArguments?: IRType[];
  span: SourceSpan;
}

export interface IRSuperExpression {
  type: "SuperExpression";
  property?: string;
  arguments: IRExpression[];
  span: SourceSpan;
}

export interface IRArrayExpression {
  type: "ArrayExpression";
  elements: IRExpression[];
  span: SourceSpan;
}

export interface IRObjectExpression {
  type: "ObjectExpression";
  properties: IRPropertyValue[];
  span: SourceSpan;
}

export interface IRPropertyValue {
  key: string;
  value: IRExpression;
  shorthand: boolean;
  span: SourceSpan;
}

export interface IRArrowFunction {
  type: "ArrowFunction";
  parameters: IRParameter[];
  returnType?: IRType;
  body: IRExpression | IRBlockStatement;
  isAsync: boolean;
  span: SourceSpan;
}

export interface IRConditionalExpression {
  type: "ConditionalExpression";
  test: IRExpression;
  consequent: IRExpression;
  alternate: IRExpression;
  span: SourceSpan;
}

export interface IRTemplateExpression {
  type: "TemplateExpression";
  quasis: string[];
  expressions: IRExpression[];
  raw: string;
  span: SourceSpan;
}

export interface IRSpreadExpression {
  type: "SpreadExpression";
  argument: IRExpression;
  span: SourceSpan;
}

export interface IRClass {
  type: "ClassDeclaration";
  name: string;
  superclass?: string;
  interfaces: string[];
  members: IRClassMember[];
  span: SourceSpan;
}

export interface IRModuleDeclaration {
  type: "ModuleDeclaration";
  name: string;
  body: IRModule;
  span: SourceSpan;
}

export interface IRPackageDeclaration {
  type: "PackageDeclaration";
  name: string;
  span: SourceSpan;
}

export interface IRNamespaceDeclaration {
  type: "NamespaceDeclaration";
  name: string;
  body: IRBlockStatement;
  span: SourceSpan;
}

export interface IRMemoryInfo {
  ownership: "owned" | "borrowed" | "shared" | "managed";
  lifetime?: string;
}

export interface IRConcurrencyInfo {
  model: "single-threaded" | "multi-threaded" | "async-await" | "goroutine" | "coroutine";
  annotations?: string[];
}

export interface IROOPInfo {
  isClass: boolean;
  isInterface: boolean;
  isAbstract: boolean;
  isStatic: boolean;
  visibility: "public" | "private" | "protected";
  implements?: string[];
  extends?: string;
  decorators: string[];
}

export interface IRTypeInfo {
  isOptional: boolean;
  isNullable: boolean;
  isGeneric: boolean;
  typeParameters?: string[];
}

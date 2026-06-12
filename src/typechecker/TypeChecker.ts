import { IRModule, IRStatement, IRExpression, IRType, IRVariableDeclaration,
  IRFunctionDeclaration, IRClassDeclaration, IRInterfaceDeclaration,
  IRIfStatement, IRWhileStatement, IRForStatement, IRForEachStatement,
  IRReturnStatement, IRThrowStatement, IRTryStatement, IRCatchClause,
  IRBreakStatement, IRContinueStatement, IRExpressionStatement,
  IRBlockStatement, IRMethodDeclaration, IRFieldDeclaration,
  IRConstructorDeclaration, IRIdentifier, IRBinaryExpression, IRUnaryExpression,
  IRAssignmentExpression, IRCallExpression, IRArrayExpression, IRArrowFunction,
  IRConditionalExpression
} from "../ir/IR";
import { BetaError } from "../utils/BetaError";
import { SourceLocation } from "../utils/SourceLocation";

function makePos(): SourceLocation {
  return { line: 0, column: 0 };
}

function anyType() {
  return { kind: "Primitive", name: "any", span: { start: makePos(), end: makePos() } } as any;
}

interface Scope {
  variables: Map<string, IRType>;
}

export class TypeChecker {
  private stack: Scope[] = [];
  private retType: IRType | null = null;

  check(mod: IRModule): boolean {
    this.stack = [{ variables: new Map() }];
    for (const s of mod.body) {
      this.visitStmt(s);
    }
    return true;
  }

  private push() { this.stack.push({ variables: new Map() }); }
  private pop() { this.stack.pop(); }
  private cur() { return this.stack[this.stack.length - 1]; }

  private decl(name: string, t: IRType) {
    this.cur().variables.set(name, t);
  }

  private find(name: string): IRType | undefined {
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const v = this.stack[i].variables.get(name);
      if (v) return v;
    }
    return undefined;
  }

  private visitStmt(s: IRStatement) {
    switch (s.type) {
      case "VariableDeclaration": {
        const d = s as IRVariableDeclaration;
        const t = d.typeAnnotation ?? (d.initializer ? this.infer(d.initializer) : anyType());
        this.decl(d.name, t);
        if (d.initializer) this.infer(d.initializer);
        break;
      }
      case "FunctionDeclaration": {
        const d = s as IRFunctionDeclaration;
        this.push();
        this.retType = d.returnType ?? anyType();
        for (const p of d.parameters) this.decl(p.name, p.type ?? anyType());
        this.visitBlock(d.body);
        this.pop();
        this.retType = null;
        break;
      }
      case "ClassDeclaration": {
        const d = s as IRClassDeclaration;
        this.push();
        for (const m of d.members) {
          if (m.type === "MethodDeclaration") {
            const md = m as IRMethodDeclaration;
            this.push();
            this.retType = md.returnType ?? anyType();
            for (const p of md.parameters) this.decl(p.name, p.type ?? anyType());
            this.visitBlock(md.body);
            this.pop();
            this.retType = null;
          }
        }
        this.pop();
        break;
      }
      case "IfStatement": {
        const d = s as IRIfStatement;
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
        const d = s as IRWhileStatement;
        this.infer(d.test);
        this.push();
        this.visitBlock(d.body);
        this.pop();
        break;
      }
      case "ForStatement": {
        const d = s as IRForStatement;
        this.visitStmt(d.init);
        this.infer(d.test);
        this.infer(d.update);
        this.push();
        this.visitBlock(d.body);
        this.pop();
        break;
      }
      case "ForEachStatement": {
        const d = s as IRForEachStatement;
        this.infer(d.iterable);
        this.push();
        this.decl(d.variable, anyType());
        this.visitBlock(d.body);
        this.pop();
        break;
      }
      case "ReturnStatement": {
        const d = s as IRReturnStatement;
        if (d.argument) {
          if (this.retType) {
            const t = this.infer(d.argument);
            // simplified: just record
          }
        }
        break;
      }
      case "TryStatement": {
        const d = s as IRTryStatement;
        this.visitBlock(d.block);
        if (d.handler) {
          this.push();
          if (d.handler.param) this.decl(d.handler.param, anyType());
          this.visitBlock(d.handler.block);
          this.pop();
        }
        if (d.finalizer) this.visitBlock(d.finalizer);
        break;
      }
      case "ExpressionStatement":
        this.infer((s as IRExpressionStatement).expression);
        break;
      case "BlockStatement":
        this.visitBlock(s as IRBlockStatement);
        break;
      default:
        break;
    }
  }

  private visitBlock(b: IRBlockStatement) {
    for (const s of b.statements) this.visitStmt(s);
  }

  private infer(e: IRExpression): IRType {
    switch (e.type) {
      case "Literal": {
        const l = e as any;
        if (typeof l.value === "number") return { kind: "Primitive", name: "number", span: l.span } as any;
        if (typeof l.value === "string") return { kind: "Primitive", name: "string", span: l.span } as any;
        if (typeof l.value === "boolean") return { kind: "Primitive", name: "boolean", span: l.span } as any;
        if (l.value === null) return { kind: "Primitive", name: "null", span: l.span } as any;
        return { kind: "Primitive", name: "undefined", span: l.span } as any;
      }
      case "Identifier": {
        const name = (e as IRIdentifier).name;
        const t = this.find(name);
        return t ?? anyType();
      }
      case "BinaryExpression": {
        const op = (e as IRBinaryExpression).operator;
        if (["==","===","!==","!=","<",">","<=",">=","&&","||","??"].includes(op)) return { kind: "Primitive", name: "boolean", span: (e as any).span } as any;
        return this.infer((e as IRBinaryExpression).left);
      }
      case "UnaryExpression":
        return this.infer((e as IRUnaryExpression).argument);
      case "AssignmentExpression": {
        const a = e as IRAssignmentExpression;
        if (a.left.type === "Identifier") {
          this.decl((a.left as IRIdentifier).name, this.infer(a.right));
        }
        return this.infer(a.right);
      }
      case "CallExpression": {
        const c = e as IRCallExpression;
        return this.infer(c.callee);
      }
      case "MemberExpression":
        return anyType();
      case "NewExpression":
        return anyType();
      case "ArrayExpression": {
        const arr = e as IRArrayExpression;
        if (arr.elements.length === 0) return { kind: "Array", elementType: { kind: "Primitive", name: "never", span: arr.span }, span: arr.span } as any;
        const base = this.infer(arr.elements[0]);
        const all = arr.elements.every(el => this.eq(base, this.infer(el)));
        return { kind: "Array", elementType: all ? base : { kind: "Union", types: arr.elements.map(el => this.infer(el)), span: arr.span }, span: arr.span } as any;
      }
      case "ObjectExpression":
        return { kind: "Primitive", name: "any", span: (e as any).span } as any;
      case "ArrowFunction": {
        const a = e as IRArrowFunction;
        return { kind: "Function", parameters: a.parameters.map(p => p.type ?? anyType()), returnType: anyType(), span: a.span } as any;
      }
      case "ConditionalExpression":
        return this.infer((e as IRConditionalExpression).alternate);
      default:
        return anyType();
    }
  }

  private eq(a: IRType, b: IRType): boolean {
    if (a.kind !== b.kind) return false;
    switch (a.kind) {
      case "Primitive": return (a as any).name === (b as any).name;
      case "Array": return this.eq((a as any).elementType, (b as any).elementType);
      case "Union": return (a as any).types.length === (b as any).types.length && (a as any).types.every((t: any, i: number) => this.eq(t, (b as any).types[i]));
      case "Named": return (a as any).name === (b as any).name;
      default: return true;
    }
  }
}

export function checkTypes(mod: IRModule): void {
  new TypeChecker().check(mod);
}

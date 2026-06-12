import { IRStatement, IRFunctionDeclaration, IRExpression, IRCallExpression, IRIdentifier, IRBlockStatement, IRModule } from "../ir/IR";

export interface TestCase {
  name: string;
  body: any;
  setup?: any;
  teardown?: any;
}

export interface TestSuite {
  name: string;
  tests: TestCase[];
  setup?: any;
  teardown?: any;
}

export class UjianFramework {
  public suites: TestSuite[] = [];
  public currentSuite: TestSuite | null = null;
  private results: { name: string; passed: boolean; error?: string }[] = [];

  registerSuite(suite: TestSuite) {
    this.suites.push(suite);
  }

  registerTest(test: TestCase) {
    if (!this.currentSuite) {
      this.currentSuite = { name: "default", tests: [] };
      this.suites.push(this.currentSuite);
    }
    this.currentSuite.tests.push(test);
  }

  run() {
    this.results = [];
    for (const suite of this.suites) {
      if (suite.setup) this.executeBlock(suite.setup);
      for (const test of suite.tests) {
        try {
          if (test.setup) this.executeBlock(test.setup);
          this.executeBlock(test.body);
          if (test.teardown) this.executeBlock(test.teardown);
          this.results.push({ name: test.name, passed: true });
        } catch (e) {
          this.results.push({
            name: test.name,
            passed: false,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
      if (suite.teardown) this.executeBlock(suite.teardown);
    }
    return this.results;
  }

  getReport() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const lines: string[] = [];
    lines.push(`\n=== Laporan Ujian BetaScript ===`);
    lines.push(`Total: ${this.results.length} | Lulus: ${passed} | Gagal: ${failed}`);
    lines.push(``);
    for (const result of this.results) {
      const status = result.passed ? "✓" : "✗";
      lines.push(`${status} ${result.name}`);
      if (result.error) {
        lines.push(`  Error: ${result.error}`);
      }
    }
    return lines.join("\n");
  }

  private executeBlock(block: IRBlockStatement) {
    for (const stmt of block.statements) {
      if (stmt.type === "ExpressionStatement") {
        this.executeExpression(stmt.expression);
      }
    }
  }

  private executeExpression(expr: IRExpression) {
    if (expr.type === "CallExpression") {
      const call = expr as IRCallExpression;
      if (call.callee.type === "Identifier") {
        const name = (call.callee as IRIdentifier).name;
        if (name === "harapkan") {
          this.handleAssert(call.arguments[0]);
        }
      }
    }
  }

  private handleAssert(arg: IRExpression) {
    const value = this.evaluate(arg);
    if (!value) {
      throw new Error(`Assertion failed: ${JSON.stringify(this.evaluate(arg))}`);
    }
  }

  private evaluate(expr: IRExpression): any {
    switch (expr.type) {
      case "Literal":
        return (expr as any).value;
      case "BinaryExpression":
        return this.evaluateBinary(expr as any);
      case "Identifier":
        return undefined;
      default:
        return undefined;
    }
  }

  private evaluateBinary(expr: { operator: string; left: any; right: any }) {
    const left = this.evaluate(expr.left as any);
    const right = this.evaluate(expr.right as any);
    switch (expr.operator) {
      case "==": return left == right;
      case "===": return left === right;
      case "!=": return left != right;
      case "!==": return left !== right;
      case ">": return left > right;
      case "<": return left < right;
      case ">=": return left >= right;
      case "<=": return left <= right;
      default: return false;
    }
  }
}

export function parseUjianModule(module: IRModule): { suites: TestSuite[]; declarations: IRStatement[] } {
  const framework = new UjianFramework();
  const declarations: IRStatement[] = [];

  for (const stmt of module.body) {
    if (stmt.type === "FunctionDeclaration") {
      const fn = stmt as IRFunctionDeclaration;
      if (fn.name === "sebelum" || fn.name === "sesudah") {
        const block = fn.body;
        if (fn.name === "sebelum") {
          if (!framework.currentSuite) {
            framework.currentSuite = { name: "default", tests: [] };
            framework.registerSuite(framework.currentSuite);
          }
          framework.currentSuite.setup = block;
        } else {
          if (!framework.currentSuite) {
            framework.currentSuite = { name: "default", tests: [] };
            framework.registerSuite(framework.currentSuite);
          }
          framework.currentSuite.teardown = block;
        }
      } else if (fn.name === "uji") {
        const testName = fn.parameters[0]?.name || "anonymous";
        framework.registerTest({
          name: testName,
          body: fn.body,
        });
      } else {
        declarations.push(stmt);
      }
    } else {
      declarations.push(stmt);
    }
  }

  const suites = framework.suites;
  return { suites, declarations };
}

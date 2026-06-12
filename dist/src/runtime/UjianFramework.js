"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UjianFramework = void 0;
exports.parseUjianModule = parseUjianModule;
class UjianFramework {
    suites = [];
    currentSuite = null;
    results = [];
    registerSuite(suite) {
        this.suites.push(suite);
    }
    registerTest(test) {
        if (!this.currentSuite) {
            this.currentSuite = { name: "default", tests: [] };
            this.suites.push(this.currentSuite);
        }
        this.currentSuite.tests.push(test);
    }
    run() {
        this.results = [];
        for (const suite of this.suites) {
            if (suite.setup)
                this.executeBlock(suite.setup);
            for (const test of suite.tests) {
                try {
                    if (test.setup)
                        this.executeBlock(test.setup);
                    this.executeBlock(test.body);
                    if (test.teardown)
                        this.executeBlock(test.teardown);
                    this.results.push({ name: test.name, passed: true });
                }
                catch (e) {
                    this.results.push({
                        name: test.name,
                        passed: false,
                        error: e instanceof Error ? e.message : String(e),
                    });
                }
            }
            if (suite.teardown)
                this.executeBlock(suite.teardown);
        }
        return this.results;
    }
    getReport() {
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        const lines = [];
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
    executeBlock(block) {
        for (const stmt of block.statements) {
            if (stmt.type === "ExpressionStatement") {
                this.executeExpression(stmt.expression);
            }
        }
    }
    executeExpression(expr) {
        if (expr.type === "CallExpression") {
            const call = expr;
            if (call.callee.type === "Identifier") {
                const name = call.callee.name;
                if (name === "harapkan") {
                    this.handleAssert(call.arguments[0]);
                }
            }
        }
    }
    handleAssert(arg) {
        const value = this.evaluate(arg);
        if (!value) {
            throw new Error(`Assertion failed: ${JSON.stringify(this.evaluate(arg))}`);
        }
    }
    evaluate(expr) {
        switch (expr.type) {
            case "Literal":
                return expr.value;
            case "BinaryExpression":
                return this.evaluateBinary(expr);
            case "Identifier":
                return undefined;
            default:
                return undefined;
        }
    }
    evaluateBinary(expr) {
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);
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
exports.UjianFramework = UjianFramework;
function parseUjianModule(module) {
    const framework = new UjianFramework();
    const declarations = [];
    for (const stmt of module.body) {
        if (stmt.type === "FunctionDeclaration") {
            const fn = stmt;
            if (fn.name === "sebelum" || fn.name === "sesudah") {
                const block = fn.body;
                if (fn.name === "sebelum") {
                    if (!framework.currentSuite) {
                        framework.currentSuite = { name: "default", tests: [] };
                        framework.registerSuite(framework.currentSuite);
                    }
                    framework.currentSuite.setup = block;
                }
                else {
                    if (!framework.currentSuite) {
                        framework.currentSuite = { name: "default", tests: [] };
                        framework.registerSuite(framework.currentSuite);
                    }
                    framework.currentSuite.teardown = block;
                }
            }
            else if (fn.name === "uji") {
                const testName = fn.parameters[0]?.name || "anonymous";
                framework.registerTest({
                    name: testName,
                    body: fn.body,
                });
            }
            else {
                declarations.push(stmt);
            }
        }
        else {
            declarations.push(stmt);
        }
    }
    const suites = framework.suites;
    return { suites, declarations };
}
//# sourceMappingURL=UjianFramework.js.map
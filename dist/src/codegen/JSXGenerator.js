"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSXGenerator = void 0;
const JavaScriptGenerator_1 = require("./JavaScriptGenerator");
class JSXGenerator extends JavaScriptGenerator_1.JavaScriptGenerator {
    name = "jsx";
    generate(module, options) {
        this.output = "";
        this.indent = 0;
        this.emitRuntimeHelpers();
        for (const stmt of module.body)
            this.emitStatement(stmt);
        return this.output;
    }
    emitClassDeclaration(stmt) {
        const isComponent = /^komponen/i.test(stmt.name);
        if (isComponent) {
            this.wrapBlock(() => {
                this.emitLine("return (");
                this.indent++;
                this.emitLine(`<div>Hello from ${stmt.name}</div>`);
                this.indent--;
                this.emitLine(");");
            }, `export function ${stmt.name}(props) {`);
        }
        else {
            super.emitClassDeclaration(stmt);
        }
    }
    emitExpression(expr) {
        if (expr.type === "CallExpression") {
            const callee = this.emitExpression(expr.callee);
            const args = expr.arguments.map((e) => this.emitExpression(e)).join(", ");
            if (callee.startsWith("komponen")) {
                return `<${callee} ${args} />`;
            }
            return `${callee}(${args})`;
        }
        return super.emitExpression(expr);
    }
}
exports.JSXGenerator = JSXGenerator;
//# sourceMappingURL=JSXGenerator.js.map
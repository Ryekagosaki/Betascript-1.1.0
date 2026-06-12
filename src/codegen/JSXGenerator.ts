import { IRModule, IRClassDeclaration, IRExpression, IRType,
  IRFunctionDeclaration, IRBlockStatement
} from "../ir/IR";
import { JavaScriptGenerator } from "./JavaScriptGenerator";

export class JSXGenerator extends JavaScriptGenerator {
  name = "jsx";

  generate(module: IRModule, options?: any): string {
    this.output = "";
    this.indent = 0;
    this.emitRuntimeHelpers();
    for (const stmt of module.body) this.emitStatement(stmt);
    return this.output;
  }

  protected emitClassDeclaration(stmt: IRClassDeclaration) {
    const isComponent = /^komponen/i.test(stmt.name);
    if (isComponent) {
      this.wrapBlock(() => {
        this.emitLine("return (");
        this.indent++;
        this.emitLine(`<div>Hello from ${stmt.name}</div>`);
        this.indent--;
        this.emitLine(");");
      }, `export function ${stmt.name}(props) {`);
    } else {
      super.emitClassDeclaration(stmt);
    }
  }

  protected emitExpression(expr: IRExpression): string {
    if (expr.type === "CallExpression") {
      const callee = this.emitExpression((expr as any).callee);
      const args = (expr as any).arguments.map((e: IRExpression) => this.emitExpression(e)).join(", ");
      if (callee.startsWith("komponen")) {
        return `<${callee} ${args} />`;
      }
      return `${callee}(${args})`;
    }
    return super.emitExpression(expr);
  }
}
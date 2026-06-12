import { IRModule, IRClassDeclaration, IRExpression } from "../ir/IR";
import { JavaScriptGenerator } from "./JavaScriptGenerator";
export declare class JSXGenerator extends JavaScriptGenerator {
    name: string;
    generate(module: IRModule, options?: any): string;
    protected emitClassDeclaration(stmt: IRClassDeclaration): void;
    protected emitExpression(expr: IRExpression): string;
}
//# sourceMappingURL=JSXGenerator.d.ts.map
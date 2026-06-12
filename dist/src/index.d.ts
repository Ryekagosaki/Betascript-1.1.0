import { IRModule } from "./ir/IR";
import { Program } from "./parser/AST";
import { Target } from "./detection/SmartTargetDetector";
export interface CompileOptions {
    target?: "js" | "ts" | "tsx" | "jsx" | "py" | "cpp" | "java" | "kt";
    mode?: "html" | "css" | "full";
    sourceMap?: boolean;
    debug?: boolean;
    filePath?: string;
    projectRoot?: string;
}
export interface CompileResult {
    code: string;
    sourceMap?: string;
    ir?: IRModule;
    tokens?: any[];
    ast?: Program;
    target: Target;
    conditionalBlocks?: string[];
}
export declare class BetaCompiler {
    private pluginManager;
    private templateEngine;
    private detector;
    compile(source: string, filename?: string, options?: CompileOptions): string;
    compileDetailed(source: string, filename?: string, options?: CompileOptions): CompileResult;
    use(plugin: any): this;
    detectTarget(source: string, filePath: string): string;
    run(source: string, options?: CompileOptions): void;
}
export declare function compile(source: string, filePath?: string, options?: CompileOptions): string;
//# sourceMappingURL=index.d.ts.map
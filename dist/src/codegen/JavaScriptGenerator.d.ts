import { IRModule } from "../ir/IR";
import { CodeGenerator } from "./CodeGenerator";
export declare class JavaScriptGenerator extends CodeGenerator {
    name: string;
    generate(module: IRModule): string;
    private collectStdLibDependencies;
    protected emitRuntimeHelpers(): void;
}
//# sourceMappingURL=JavaScriptGenerator.d.ts.map
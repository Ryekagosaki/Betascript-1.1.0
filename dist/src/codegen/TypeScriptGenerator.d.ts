import { IRModule, IRType, IRClassDeclaration, IRClassMember } from "../ir/IR";
import { CodeGenerator } from "./CodeGenerator";
export declare class TypeScriptGenerator extends CodeGenerator {
    name: string;
    generate(module: IRModule): string;
    protected emitType(type: IRType): string;
    protected emitClassDeclaration(stmt: IRClassDeclaration): void;
    protected emitClassMember(member: IRClassMember): void;
}
//# sourceMappingURL=TypeScriptGenerator.d.ts.map
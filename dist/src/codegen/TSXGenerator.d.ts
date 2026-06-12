import { IRModule, IRType, IRVariableDeclaration, IRFunctionDeclaration, IRClassDeclaration, IRMethodDeclaration, IRFieldDeclaration, IRConstructorDeclaration, IRClassMember } from "../ir/IR";
import { JSXGenerator } from "./JSXGenerator";
export declare class TSXGenerator extends JSXGenerator {
    name: string;
    private needsReactImport;
    generate(module: IRModule, options?: any): string;
    protected emitType(type: IRType): string;
    protected emitVariableDeclaration(stmt: IRVariableDeclaration): void;
    protected emitFunctionDeclaration(stmt: IRFunctionDeclaration): void;
    protected emitClassDeclaration(stmt: IRClassDeclaration): void;
    protected emitClassMember(member: IRClassMember): void;
    protected emitMethodDeclaration(method: IRMethodDeclaration): void;
    protected emitFieldDeclaration(field: IRFieldDeclaration): void;
    protected emitConstructorDeclaration(ctor: IRConstructorDeclaration): void;
}
//# sourceMappingURL=TSXGenerator.d.ts.map
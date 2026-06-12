import { IRModule, IRType, IRVariableDeclaration, IRFunctionDeclaration, IRClassDeclaration, IRIfStatement, IRWhileStatement, IRForStatement, IRForEachStatement, IRReturnStatement, IRThrowStatement, IRMethodDeclaration, IRFieldDeclaration, IRConstructorDeclaration, IRClassMember } from "../ir/IR";
import { CodeGenerator } from "./CodeGenerator";
export declare class PythonGenerator extends CodeGenerator {
    name: string;
    private decorators;
    generate(module: IRModule, options?: any): string;
    protected emitType(type: IRType): string;
    protected emitVariableDeclaration(stmt: IRVariableDeclaration): void;
    protected emitFunctionDeclaration(stmt: IRFunctionDeclaration): void;
    protected emitClassDeclaration(stmt: IRClassDeclaration): void;
    protected emitClassMember(member: IRClassMember): void;
    protected emitMethodDeclaration(method: IRMethodDeclaration): void;
    protected emitFieldDeclaration(field: IRFieldDeclaration): void;
    protected emitConstructorDeclaration(ctor: IRConstructorDeclaration): void;
    protected emitIfStatement(stmt: IRIfStatement): void;
    protected emitWhileStatement(stmt: IRWhileStatement): void;
    protected emitForStatement(stmt: IRForStatement): void;
    protected emitForEachStatement(stmt: IRForEachStatement): void;
    protected emitReturnStatement(stmt: IRReturnStatement): void;
    protected emitThrowStatement(stmt: IRThrowStatement): void;
    protected wrapBlock(body: () => void, opening: string, closing?: string): void;
}
//# sourceMappingURL=PythonGenerator.d.ts.map
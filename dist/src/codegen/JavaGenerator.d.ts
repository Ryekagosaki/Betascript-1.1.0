import { IRModule, IRType, IRVariableDeclaration, IRFunctionDeclaration, IRClassDeclaration, IRIfStatement, IRWhileStatement, IRForStatement, IRForEachStatement, IRReturnStatement, IRThrowStatement, IRTryStatement, IRExpressionStatement, IRBlockStatement, IRClassMember, IRMethodDeclaration, IRFieldDeclaration, IRConstructorDeclaration } from "../ir/IR";
import { CodeGenerator } from "./CodeGenerator";
export declare class JavaGenerator extends CodeGenerator {
    name: string;
    private packageName;
    generate(module: IRModule): string;
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
    protected emitTryStatement(stmt: IRTryStatement): void;
    protected emitExpressionStatement(stmt: IRExpressionStatement): void;
    protected emitBlockStatement(stmt: IRBlockStatement): void;
}
//# sourceMappingURL=JavaGenerator.d.ts.map
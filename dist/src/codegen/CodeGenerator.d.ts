import { IRModule, IRStatement, IRExpression, IRType, IRVariableDeclaration, IRFunctionDeclaration, IRClassDeclaration, IRInterfaceDeclaration, IRIfStatement, IRWhileStatement, IRForStatement, IRForEachStatement, IRReturnStatement, IRThrowStatement, IRTryStatement, IRExpressionStatement, IRBlockStatement, IRMethodDeclaration, IRFieldDeclaration, IRConstructorDeclaration, IRClassMember, SourceSpan } from "../ir/IR";
export interface CodegenOptions {
    sourceMap?: boolean;
    sourceFilename?: string;
    target?: string;
}
export declare abstract class CodeGenerator {
    protected output: string;
    protected indent: number;
    protected sourceMap?: Map<number, SourceSpan>;
    protected lines: {
        text: string;
        span: SourceSpan;
        line: number;
    }[];
    abstract generate(module: IRModule, options?: CodegenOptions): string;
    abstract name: string;
    protected emitLine(line?: string): void;
    protected emitRuntimeHelpers(): void;
    protected wrapBlock(body: () => void, opening: string, closing?: string): void;
    protected emitStatement(stmt: IRStatement): void;
    protected emitExpression(expr: IRExpression): string;
    protected emitLiteral(lit: {
        type: "Literal";
        value: any;
        raw: string;
        literalType: any;
        span: SourceSpan;
    }): string;
    protected emitVariableDeclaration(stmt: IRVariableDeclaration): void;
    protected emitFunctionDeclaration(stmt: IRFunctionDeclaration): void;
    protected emitClassDeclaration(stmt: IRClassDeclaration): void;
    protected emitInterfaceDeclaration(stmt: IRInterfaceDeclaration): void;
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
    protected emitBlockBody(stmt: IRBlockStatement): void;
    protected emitType(type: IRType): string;
    getSourceMap(): string;
}
//# sourceMappingURL=CodeGenerator.d.ts.map
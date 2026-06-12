import { IRModule } from "../ir/IR";
export declare class TypeChecker {
    private stack;
    private retType;
    check(mod: IRModule): boolean;
    private push;
    private pop;
    private cur;
    private decl;
    private find;
    private visitStmt;
    private visitBlock;
    private infer;
    private eq;
}
export declare function checkTypes(mod: IRModule): void;
//# sourceMappingURL=TypeChecker.d.ts.map
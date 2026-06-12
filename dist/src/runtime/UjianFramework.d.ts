import { IRStatement, IRModule } from "../ir/IR";
export interface TestCase {
    name: string;
    body: any;
    setup?: any;
    teardown?: any;
}
export interface TestSuite {
    name: string;
    tests: TestCase[];
    setup?: any;
    teardown?: any;
}
export declare class UjianFramework {
    suites: TestSuite[];
    currentSuite: TestSuite | null;
    private results;
    registerSuite(suite: TestSuite): void;
    registerTest(test: TestCase): void;
    run(): {
        name: string;
        passed: boolean;
        error?: string;
    }[];
    getReport(): string;
    private executeBlock;
    private executeExpression;
    private handleAssert;
    private evaluate;
    private evaluateBinary;
}
export declare function parseUjianModule(module: IRModule): {
    suites: TestSuite[];
    declarations: IRStatement[];
};
//# sourceMappingURL=UjianFramework.d.ts.map
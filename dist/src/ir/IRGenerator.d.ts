import { Program } from "../parser/AST";
export declare class IRGenerator {
    generate(program: Program): {
        type: string;
        name: string;
        body: any[];
        imports: any[];
        exports: any[];
        span: {
            start: {
                offset: number;
                line: number;
                column: number;
            };
            end: {
                offset: number;
                line: number;
                column: number;
            };
        };
    };
}
//# sourceMappingURL=IRGenerator.d.ts.map
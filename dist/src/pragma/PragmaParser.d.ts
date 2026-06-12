export interface PragmaDirective {
    type: "tujuan" | "kalo";
    target?: string | string[];
    condition?: string;
    body?: string;
    line: number;
    raw: string;
}
export interface ParsedPragma {
    directives: PragmaDirective[];
    cleanedSource: string;
    explicitTargets: string[] | null;
}
export declare class PragmaParser {
    parse(source: string): ParsedPragma;
    private parseTujuan;
    private parseKaloBlock;
    filterByTarget(directives: PragmaDirective[], target: string): string[];
    hasTujuanDirective(source: string): boolean;
}
//# sourceMappingURL=PragmaParser.d.ts.map
import { SourceLocation } from "./SourceLocation";
export declare class BetaError extends Error {
    readonly message: string;
    readonly position: SourceLocation;
    readonly filename?: string;
    constructor(message: string, position: SourceLocation, filename?: string);
    static unexpectedToken(token: string, position: SourceLocation, filename?: string): BetaError;
    static expected(identifier: string, position: SourceLocation, filename?: string): BetaError;
    static undefinedVariable(name: string, position: SourceLocation, filename?: string): BetaError;
    static syntaxError(message: string, position: SourceLocation, filename?: string): BetaError;
}
//# sourceMappingURL=BetaError.d.ts.map
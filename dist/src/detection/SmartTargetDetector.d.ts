import { BetaConfig } from "./ProjectConfig";
export type Target = "js" | "ts" | "tsx" | "jsx" | "py" | "cpp" | "java" | "kt";
export interface DetectionContext {
    source: string;
    filePath: string;
    projectRoot: string;
    explicitTargets: string[] | null;
    config: BetaConfig | null;
    environment: {
        target: string;
        confidence: string;
        reason: string;
    } | null;
}
export declare class SmartTargetDetector {
    private pragmaParser;
    detect(source: string, filePath: string, projectRoot?: string): Target[];
    resolve(ctx: DetectionContext): Target[];
    getAllTargets(): Target[];
    normalizeTarget(value: string): Target;
    extractCleanedSource(source: string): string;
    extractDirectives(source: string): import("../pragma/PragmaParser").PragmaDirective[];
    getConditionalBlocks(source: string, target: Target): string[];
    private detectFromEnvironment;
    private findProjectRoot;
}
//# sourceMappingURL=SmartTargetDetector.d.ts.map
export interface DetectionResult {
    target: string;
    confidence: "high" | "medium" | "low";
    reason: string;
}
export declare class EnvironmentDetector {
    detect(workingDir: string): DetectionResult;
}
//# sourceMappingURL=EnvironmentDetector.d.ts.map
export type Target = "js" | "ts" | "tsx" | "jsx" | "py" | "cpp" | "java" | "kt";
export interface StdLibModule {
    name: string;
    description: string;
    emitImport(target: Target): string;
    emitUsage(module: string, func: string, args: string, target: Target): string;
    has(func: string): boolean;
}
export interface StdLibConfig {
    modules: Record<string, StdLibModule>;
    aliases: Record<string, string[]>;
}
declare const stdlibConfig: StdLibConfig;
export declare function getStdLibModule(name: string): StdLibModule | undefined;
export declare function resolveStdLibAlias(name: string): string;
export declare function getAllStdLibModules(): StdLibModule[];
export { stdlibConfig };
//# sourceMappingURL=StdLib.d.ts.map
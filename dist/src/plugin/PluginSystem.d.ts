import { IRModule } from "../ir/IR";
export interface Plugin {
    name: string;
    version: string;
    description?: string;
    beforeParse?(source: string): string;
    afterParse?(ast: IRModule): IRModule;
    beforeEmit?(ir: IRModule): IRModule;
    afterEmit?(code: string, target: string): string;
    hooks?: Record<string, Function>;
}
export interface PluginManifest {
    name: string;
    version: string;
    main: string;
    betascriptVersion?: string;
    keywords?: string[];
}
export declare class PluginManager {
    private plugins;
    private loadPaths;
    register(plugin: Plugin): void;
    unregister(name: string): boolean;
    loadFromManifest(manifest: PluginManifest, basePath: string): Plugin;
    get(name: string): Plugin | undefined;
    getAll(): Plugin[];
    hook<T extends any[]>(event: string, ...args: T): any;
    runBeforeParse(source: string): string;
    runAfterParse(module: IRModule): IRModule;
    runBeforeEmit(ir: IRModule): IRModule;
    runAfterEmit(code: string, target: string): string;
}
//# sourceMappingURL=PluginSystem.d.ts.map
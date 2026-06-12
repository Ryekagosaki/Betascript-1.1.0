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

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private loadPaths: string[] = [];

  register(plugin: Plugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  unregister(name: string): boolean {
    return this.plugins.delete(name);
  }

  loadFromManifest(manifest: PluginManifest, basePath: string): Plugin {
    const mainPath = require("path").join(basePath, manifest.main);
    const PluginClass = require(mainPath).default ?? require(mainPath);
    const plugin = new PluginClass() as Plugin;
    this.register(plugin);
    return plugin;
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  hook<T extends any[]>(event: string, ...args: T): any {
    const results: any[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.hooks && event in plugin.hooks) {
        const result = plugin.hooks[event](...args);
        if (result !== undefined) results.push(result);
      }
    }
    return results;
  }

  runBeforeParse(source: string): string {
    let result = source;
    for (const plugin of this.plugins.values()) {
      if (plugin.beforeParse) result = plugin.beforeParse(result);
    }
    return result;
  }

  runAfterParse(module: IRModule): IRModule {
    let result = module;
    for (const plugin of this.plugins.values()) {
      if (plugin.afterParse) result = plugin.afterParse(result);
    }
    return result;
  }

  runBeforeEmit(ir: IRModule): IRModule {
    let result = ir;
    for (const plugin of this.plugins.values()) {
      if (plugin.beforeEmit) result = plugin.beforeEmit(result);
    }
    return result;
  }

  runAfterEmit(code: string, target: string): string {
    let result = code;
    for (const plugin of this.plugins.values()) {
      if (plugin.afterEmit) result = plugin.afterEmit(result, target);
    }
    return result;
  }
}

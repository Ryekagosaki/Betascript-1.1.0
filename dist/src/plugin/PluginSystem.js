"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginManager = void 0;
class PluginManager {
    plugins = new Map();
    loadPaths = [];
    register(plugin) {
        this.plugins.set(plugin.name, plugin);
    }
    unregister(name) {
        return this.plugins.delete(name);
    }
    loadFromManifest(manifest, basePath) {
        const mainPath = require("path").join(basePath, manifest.main);
        const PluginClass = require(mainPath).default ?? require(mainPath);
        const plugin = new PluginClass();
        this.register(plugin);
        return plugin;
    }
    get(name) {
        return this.plugins.get(name);
    }
    getAll() {
        return Array.from(this.plugins.values());
    }
    hook(event, ...args) {
        const results = [];
        for (const plugin of this.plugins.values()) {
            if (plugin.hooks && event in plugin.hooks) {
                const result = plugin.hooks[event](...args);
                if (result !== undefined)
                    results.push(result);
            }
        }
        return results;
    }
    runBeforeParse(source) {
        let result = source;
        for (const plugin of this.plugins.values()) {
            if (plugin.beforeParse)
                result = plugin.beforeParse(result);
        }
        return result;
    }
    runAfterParse(module) {
        let result = module;
        for (const plugin of this.plugins.values()) {
            if (plugin.afterParse)
                result = plugin.afterParse(result);
        }
        return result;
    }
    runBeforeEmit(ir) {
        let result = ir;
        for (const plugin of this.plugins.values()) {
            if (plugin.beforeEmit)
                result = plugin.beforeEmit(result);
        }
        return result;
    }
    runAfterEmit(code, target) {
        let result = code;
        for (const plugin of this.plugins.values()) {
            if (plugin.afterEmit)
                result = plugin.afterEmit(result, target);
        }
        return result;
    }
}
exports.PluginManager = PluginManager;
//# sourceMappingURL=PluginSystem.js.map
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartTargetDetector = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const PragmaParser_1 = require("../pragma/PragmaParser");
const ProjectConfig_1 = require("./ProjectConfig");
class SmartTargetDetector {
    pragmaParser = new PragmaParser_1.PragmaParser();
    detect(source, filePath, projectRoot) {
        const root = projectRoot ?? this.findProjectRoot(filePath);
        const pragma = this.pragmaParser.parse(source);
        const config = (0, ProjectConfig_1.loadBetaConfig)(root);
        if (pragma.explicitTargets) {
            return pragma.explicitTargets.map((t) => this.normalizeTarget(t));
        }
        if (config?.tujuan) {
            return [this.normalizeTarget(config.tujuan)];
        }
        return [this.detectFromEnvironment(root)];
    }
    resolve(ctx) {
        if (ctx.explicitTargets) {
            return ctx.explicitTargets.map((t) => this.normalizeTarget(t));
        }
        if (ctx.config?.tujuan) {
            return [this.normalizeTarget(ctx.config.tujuan)];
        }
        if (ctx.environment) {
            return [this.normalizeTarget(ctx.environment.target)];
        }
        return ["js"];
    }
    getAllTargets() {
        return ["js", "ts", "tsx", "jsx", "py", "cpp", "java", "kt"];
    }
    normalizeTarget(value) {
        const map = {
            javascript: "js",
            js: "js",
            typescript: "ts",
            ts: "ts",
            tsx: "tsx",
            jsx: "jsx",
            python: "py",
            py: "py",
            cpp: "cpp",
            "c++": "cpp",
            java: "java",
            kotlin: "kt",
            kt: "kt",
        };
        return map[value.toLowerCase().trim()] ?? "js";
    }
    extractCleanedSource(source) {
        return this.pragmaParser.parse(source).cleanedSource;
    }
    extractDirectives(source) {
        return this.pragmaParser.parse(source).directives;
    }
    getConditionalBlocks(source, target) {
        const directives = this.pragmaParser.parse(source).directives;
        return directives
            .filter((d) => d.type === "kalo" && d.condition === target && d.body)
            .map((d) => d.body);
    }
    detectFromEnvironment(projectRoot) {
        const has = (name) => fs.existsSync(path.join(projectRoot, name));
        if (has("tsconfig.json"))
            return "ts";
        const packageJsonPath = path.join(projectRoot, "package.json");
        if (has("package.json")) {
            try {
                const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
                const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
                if (deps.react || deps["react-dom"] || deps.preact) {
                    return "tsx";
                }
                return "js";
            }
            catch {
                return "js";
            }
        }
        if (has("requirements.txt") || has("pyproject.toml"))
            return "py";
        if (has("pom.xml") || has("build.gradle"))
            return "java";
        const gradleKts = path.join(projectRoot, "build.gradle.kts");
        if (has("build.gradle.kts")) {
            try {
                const content = fs.readFileSync(gradleKts, "utf-8");
                if (/kotlin\(".gradle.kts"\)|kotlin-android|kotlin\(/.test(content))
                    return "kt";
                return "java";
            }
            catch {
                return "java";
            }
        }
        if (has("CMakeLists.txt") || has("Makefile"))
            return "cpp";
        return "js";
    }
    findProjectRoot(filePath) {
        let current = path.dirname(path.resolve(filePath));
        while (true) {
            if (fs.existsSync(path.join(current, "beta.config.json")))
                return current;
            if (fs.existsSync(path.join(current, "package.json")))
                return current;
            if (fs.existsSync(path.join(current, "tsconfig.json")))
                return current;
            const parent = path.dirname(current);
            if (parent === current)
                break;
            current = parent;
        }
        return path.dirname(path.resolve(filePath));
    }
}
exports.SmartTargetDetector = SmartTargetDetector;
//# sourceMappingURL=SmartTargetDetector.js.map
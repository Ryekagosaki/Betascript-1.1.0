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
exports.EnvironmentDetector = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class EnvironmentDetector {
    detect(workingDir) {
        const has = (name) => fs.existsSync(path.join(workingDir, name));
        if (has("tsconfig.json")) {
            return { target: "typescript", confidence: "high", reason: "Found tsconfig.json" };
        }
        const packageJsonPath = path.join(workingDir, "package.json");
        if (has("package.json")) {
            try {
                const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
                const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                if (deps.react || deps["react-dom"] || deps.preact || deps["@angular/core"]) {
                    return { target: "tsx", confidence: "high", reason: "Found package.json with UI framework dependency" };
                }
                return { target: "javascript", confidence: "high", reason: "Found package.json (no UI framework)" };
            }
            catch {
                return { target: "javascript", confidence: "medium", reason: "package.json unreadable" };
            }
        }
        if (has("requirements.txt") || has("pyproject.toml")) {
            return { target: "python", confidence: "high", reason: "Found Python project file" };
        }
        if (has("pom.xml")) {
            return { target: "java", confidence: "high", reason: "Found Maven pom.xml" };
        }
        const gradlePath = path.join(workingDir, "build.gradle.kts");
        if (has("build.gradle.kts") || has("build.gradle")) {
            try {
                if (has("build.gradle.kts")) {
                    const content = fs.readFileSync(gradlePath, "utf-8");
                    if (/kotlin\(".gradle.kts"\)|kotlin-android|kotlin\(/.test(content)) {
                        return { target: "kotlin", confidence: "high", reason: "Found Gradle Kotlin project" };
                    }
                }
                return { target: "java", confidence: "medium", reason: "Found Gradle build file" };
            }
            catch {
                return { target: "java", confidence: "low", reason: "Gradle file unreadable" };
            }
        }
        if (has("CMakeLists.txt") || has("Makefile")) {
            return { target: "cpp", confidence: "high", reason: "Found C++ build config" };
        }
        return { target: "javascript", confidence: "low", reason: "Default fallback" };
    }
}
exports.EnvironmentDetector = EnvironmentDetector;
//# sourceMappingURL=EnvironmentDetector.js.map
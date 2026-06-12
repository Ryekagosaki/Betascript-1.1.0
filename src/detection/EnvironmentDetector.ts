import * as fs from "fs";
import * as path from "path";

export interface DetectionResult {
  target: string;
  confidence: "high" | "medium" | "low";
  reason: string;
}

export class EnvironmentDetector {
  detect(workingDir: string): DetectionResult {
    const has = (name: string) => fs.existsSync(path.join(workingDir, name));

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
      } catch {
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
      } catch {
        return { target: "java", confidence: "low", reason: "Gradle file unreadable" };
      }
    }

    if (has("CMakeLists.txt") || has("Makefile")) {
      return { target: "cpp", confidence: "high", reason: "Found C++ build config" };
    }

    return { target: "javascript", confidence: "low", reason: "Default fallback" };
  }
}

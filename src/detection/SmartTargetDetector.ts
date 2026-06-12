import * as fs from "fs";
import * as path from "path";
import { PragmaParser } from "../pragma/PragmaParser";
import { loadBetaConfig, BetaConfig } from "./ProjectConfig";

export type Target = "js" | "ts" | "tsx" | "jsx" | "py" | "cpp" | "java" | "kt";

export interface DetectionContext {
  source: string;
  filePath: string;
  projectRoot: string;
  explicitTargets: string[] | null;
  config: BetaConfig | null;
  environment: { target: string; confidence: string; reason: string } | null;
}

export class SmartTargetDetector {
  private pragmaParser = new PragmaParser();

  detect(source: string, filePath: string, projectRoot?: string): Target[] {
    const root = projectRoot ?? this.findProjectRoot(filePath);
    const pragma = this.pragmaParser.parse(source);
    const config = loadBetaConfig(root);

    if (pragma.explicitTargets) {
      return pragma.explicitTargets.map((t) => this.normalizeTarget(t));
    }

    if (config?.tujuan) {
      return [this.normalizeTarget(config.tujuan)];
    }

    return [this.detectFromEnvironment(root)];
  }

  resolve(ctx: DetectionContext): Target[] {
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

  getAllTargets(): Target[] {
    return ["js", "ts", "tsx", "jsx", "py", "cpp", "java", "kt"];
  }

  normalizeTarget(value: string): Target {
    const map: Record<string, Target> = {
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

  extractCleanedSource(source: string): string {
    return this.pragmaParser.parse(source).cleanedSource;
  }

  extractDirectives(source: string) {
    return this.pragmaParser.parse(source).directives;
  }

  getConditionalBlocks(source: string, target: Target): string[] {
    const directives = this.pragmaParser.parse(source).directives;
    return directives
      .filter((d) => d.type === "kalo" && d.condition === target && d.body)
      .map((d) => d.body as string);
  }

  private detectFromEnvironment(projectRoot: string): Target {
    const has = (name: string) => fs.existsSync(path.join(projectRoot, name));

    if (has("tsconfig.json")) return "ts";

    const packageJsonPath = path.join(projectRoot, "package.json");
    if (has("package.json")) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
        if (deps.react || deps["react-dom"] || deps.preact) {
          return "tsx";
        }
        return "js";
      } catch {
        return "js";
      }
    }

    if (has("requirements.txt") || has("pyproject.toml")) return "py";
    if (has("pom.xml") || has("build.gradle")) return "java";

    const gradleKts = path.join(projectRoot, "build.gradle.kts");
    if (has("build.gradle.kts")) {
      try {
        const content = fs.readFileSync(gradleKts, "utf-8");
        if (/kotlin\(".gradle.kts"\)|kotlin-android|kotlin\(/.test(content)) return "kt";
        return "java";
      } catch {
        return "java";
      }
    }

    if (has("CMakeLists.txt") || has("Makefile")) return "cpp";

    return "js";
  }

  private findProjectRoot(filePath: string): string {
    let current = path.dirname(path.resolve(filePath));
    while (true) {
      if (fs.existsSync(path.join(current, "beta.config.json"))) return current;
      if (fs.existsSync(path.join(current, "package.json"))) return current;
      if (fs.existsSync(path.join(current, "tsconfig.json"))) return current;
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
    return path.dirname(path.resolve(filePath));
  }
}

import { Lexer } from "../lexer/Lexer";
import { Parser } from "../parser/Parser";
import { SemanticAnalyzer } from "../analyzer/SemanticAnalyzer";
import { IRGenerator } from "../ir/IRGenerator";
import { checkTypes } from "../typechecker/TypeChecker";
import { PluginManager } from "../plugin/PluginSystem";
import { SourceMapGenerator } from "../sourcemap/SourceMapGenerator";
import { TemplateEngine } from "../template/TemplateEngine";
import { CodeGenerator } from "../codegen/CodeGenerator";
import { JavaScriptGenerator } from "../codegen/JavaScriptGenerator";
import { TypeScriptGenerator } from "../codegen/TypeScriptGenerator";
import { JSXGenerator } from "../codegen/JSXGenerator";
import { TSXGenerator } from "../codegen/TSXGenerator";
import { PythonGenerator } from "../codegen/PythonGenerator";
import { CppGenerator } from "../codegen/CppGenerator";
import { JavaGenerator } from "../codegen/JavaGenerator";
import { KotlinGenerator } from "../codegen/KotlinGenerator";
import { IRModule } from "../ir/IR";
import { Program } from "../parser/AST";
import { SmartTargetDetector, Target } from "../detection/SmartTargetDetector";
import { PragmaParser } from "../pragma/PragmaParser";
import { EmbeddedBlockParser } from "../embedded/EmbeddedBlockParser";

export interface CompileOptions {
  target?: "js" | "ts" | "tsx" | "jsx" | "py" | "cpp" | "java" | "kt" | "web";
  mode?: "html" | "css" | "full" | "compile";
  sourceMap?: boolean;
  debug?: boolean;
  filePath?: string;
  projectRoot?: string;
}

export interface CompileResult {
  code: string;
  sourceMap?: string;
  ir?: IRModule;
  tokens?: any[];
  ast?: Program;
  target: Target | "web";
  conditionalBlocks?: string[];
  embeddedBlocks?: any[];
}

const GENERATORS: Record<string, CodeGenerator> = {
  js: new JavaScriptGenerator(),
  ts: new TypeScriptGenerator(),
  tsx: new TSXGenerator(),
  jsx: new JSXGenerator(),
  py: new PythonGenerator(),
  cpp: new CppGenerator(),
  java: new JavaGenerator(),
  kt: new KotlinGenerator(),
};

export class Compiler {
  private pluginManager = new PluginManager();
  private templateEngine = new TemplateEngine();
  private detector = new SmartTargetDetector();
  private pragmaParser = new PragmaParser();
  private embeddedParser = new EmbeddedBlockParser();

  compile(source: string, filename: string = "unknown", options: CompileOptions = {}): string {
    return this.compileDetailed(source, filename, options).code;
  }

  compileDetailed(source: string, filename: string = "unknown", options: CompileOptions = {}): CompileResult {
    const pragma = this.pragmaParser.parse(source);
    const hasEmbedded = /sisipkan\s+\w+\s+sebagai\s+\w+\s*@\{/.test(source);
    const detectedTargets = this.detector.detect(source, options.filePath ?? filename, options.projectRoot);
    const target = options.target ?? (hasEmbedded ? "web" : detectedTargets[0] ?? "js");
    const cleanedSource = pragma.cleanedSource;
    const conditionalBlocks = pragma.directives.filter(d => d.type === "kalo" && d.condition === target && d.body).map(d => d.body as string);

    if (target === "web" || options.mode === "html") {
      const processedSource = this.pluginManager.runBeforeParse(cleanedSource);
      const { html, blocks } = this.generateWebsite(processedSource);
      return { code: html, target: "web", embeddedBlocks: blocks, conditionalBlocks } as any;
    }

    const mode = options.mode ?? "full";
    let processedSource = this.pluginManager.runBeforeParse(cleanedSource);
    const embeddedCleaned = this.embeddedParser.ekstrakBlok(processedSource);

    const lexer = new Lexer(embeddedCleaned);
    const tokens = lexer.tokenize();

    const parser = new Parser(embeddedCleaned);
    const ast = parser.parse(tokens);

    const analyzer = new SemanticAnalyzer();
    analyzer.analyze(ast);

    const irGenerator = new IRGenerator();
    const ir = irGenerator.generate(ast);

    try {
      checkTypes(ir);
    } catch (e) {
      if (options.debug) console.warn("Type check warning:", e);
    }

    const processedIR = this.pluginManager.runBeforeEmit(ir);
    const generator = GENERATORS[target] ?? GENERATORS["js"];
    let code = generator.generate(processedIR);

    code = this.pluginManager.runAfterEmit(code, target);

    const sourceMapGen = new SourceMapGenerator();
    if (options.sourceMap) sourceMapGen.setSource(embeddedCleaned, filename);

    return {
      code,
      sourceMap: options.sourceMap ? sourceMapGen.toJSON() : undefined,
      ir,
      tokens,
      ast,
      target,
      conditionalBlocks,
    };
  }

  private trim(value: string): string {
    if (!value) return value;
    return value
      .replace(/^\s+/gm, "")
      .split("\n")
      .map(line => line.trimEnd())
      .join("\n")
      .trim();
  }

  private generateWebsite(source: string): { html: string; blocks: any[] } {
    const blocks = this.embeddedParser.ekstrakBlok(source);
    const extracted = this.embeddedParser.ambilSemuaBlok();

    let html = "";
    let css = "";
    let js = "";

    for (const block of extracted) {
      const normalized = block.bahasa.toLowerCase();
      if (normalized === "html" || normalized === "xhtml") {
        html = this.trim(block.kodeMentah);
      } else if (normalized === "css" || normalized === "style") {
        css = this.trim(block.kodeMentah);
      } else if (normalized === "js" || normalized === "javascript") {
        js = this.trim(block.kodeMentah);
      }
    }

    const looksLikeFullHtml = html.includes("<!DOCTYPE html>") || html.includes("<html");
    if (looksLikeFullHtml) {
      const jsBlock = js ? `\n<script>\n${js}\n</script>\n` : "";
      const injectHead = css ? `\n<style>\n${css}\n</style>\n` : "";
      const injected = injectHead
        ? html.replace("</head>", `${injectHead}</head>`)
        : html;
      return { html: `${injected}${jsBlock}`, blocks: extracted };
    }

    const cssBlock = css
      ? `\n<style>\n${css}\n</style>\n`
      : "\n<style>\n  body { font-family: system-ui, sans-serif; }\n</style>\n";
    const jsBlock = js
      ? `\n<script>\n${js}\n</script>\n`
      : "";

    const fullHtml = `<!DOCTYPE html>\n<html lang="id">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Website BetaScript</title>${cssBlock}</head>\n<body>\n${html}\n${jsBlock}</body>\n</html>`;

    return { html: fullHtml, blocks: extracted };
  }

  private dedent(value: string): string {
    const lines = value.split(/\r?\n/);
    const indent = lines.reduce((min, line) => {
      const match = line.match(/^(\s*)/);
      const spaces = match ? match[1].length : 0;
      const nonEmpty = line.trim().length > 0;
      return nonEmpty ? Math.min(min, spaces) : min;
    }, Infinity);
    if (!Number.isFinite(indent) || indent <= 0) return value;
    const stripRe = new RegExp(`^ {1,${indent}}`);
    const dedented = lines.map(line => line.replace(stripRe, "")).join("\n");
    return dedented.trim();
  }

  run(source: string, options: CompileOptions = {}) {
    const code = this.compile(source, "repl", { ...options, target: "js" });
    if (options.debug) console.log(code);
    eval(code);
  }
}

export function compile(source: string, filename?: string, options?: CompileOptions): string {
  const compiler = new Compiler();
  return compiler.compile(source, filename ?? "unknown", options ?? ({} as any));
}

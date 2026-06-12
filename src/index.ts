import { Lexer } from "./lexer/Lexer";
import { Parser } from "./parser/Parser";
import { SemanticAnalyzer } from "./analyzer/SemanticAnalyzer";
import { IRGenerator } from "./ir/IRGenerator";
import { checkTypes } from "./typechecker/TypeChecker";
import { PluginManager } from "./plugin/PluginSystem";
import { SourceMapGenerator } from "./sourcemap/SourceMapGenerator";
import { TemplateEngine } from "./template/TemplateEngine";
import { CodeGenerator, CodegenOptions } from "./codegen/CodeGenerator";
import { JavaScriptGenerator } from "./codegen/JavaScriptGenerator";
import { TypeScriptGenerator } from "./codegen/TypeScriptGenerator";
import { JSXGenerator } from "./codegen/JSXGenerator";
import { TSXGenerator } from "./codegen/TSXGenerator";
import { PythonGenerator } from "./codegen/PythonGenerator";
import { CppGenerator } from "./codegen/CppGenerator";
import { JavaGenerator } from "./codegen/JavaGenerator";
import { KotlinGenerator } from "./codegen/KotlinGenerator";
import { IRModule } from "./ir/IR";
import { Program } from "./parser/AST";
import { SmartTargetDetector, Target } from "./detection/SmartTargetDetector";
import { PragmaParser } from "./pragma/PragmaParser";

export interface CompileOptions {
  target?: "js" | "ts" | "tsx" | "jsx" | "py" | "cpp" | "java" | "kt";
  mode?: "html" | "css" | "full";
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
  target: Target;
  conditionalBlocks?: string[];
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

export class BetaCompiler {
  private pluginManager = new PluginManager();
  private templateEngine = new TemplateEngine();
  private detector = new SmartTargetDetector();

  compile(source: string, filename: string = "unknown", options: CompileOptions = {}): string {
    return this.compileDetailed(source, filename, options).code;
  }

  compileDetailed(source: string, filename: string = "unknown", options: CompileOptions = {}): CompileResult {
    const detectedTargets = this.detector.detect(source, options.filePath ?? filename, options.projectRoot);
    const target = options.target ?? detectedTargets[0] ?? "js";
    const cleanedSource = this.detector.extractCleanedSource(source);
    const conditionalBlocks = this.detector.getConditionalBlocks(source, target);

    const mode = options.mode ?? "full";

    let processedSource = this.pluginManager.runBeforeParse(cleanedSource);

    const lexer = new Lexer(processedSource);
    const tokens = lexer.tokenize();

    const parser = new Parser(processedSource);
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
    if (options.sourceMap) {
      sourceMapGen.setSource(processedSource, filename);
    }

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

  use(plugin: any) {
    this.pluginManager.register(plugin);
    return this;
  }

  detectTarget(source: string, filePath: string): string {
    return this.detector.detect(source, filePath)[0] ?? "js";
  }

  run(source: string, options?: CompileOptions) {
    const result = this.compileDetailed(source, "repl", { ...options, target: "js" });
    if (options?.debug) console.log(result.code);
    eval(result.code);
  }
}

export function compile(source: string, filePath?: string, options?: CompileOptions): string {
  const compiler = new BetaCompiler();
  return compiler.compile(source, filePath ?? "unknown", { ...options, filePath });
}

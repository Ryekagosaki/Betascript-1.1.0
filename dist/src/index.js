"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetaCompiler = void 0;
exports.compile = compile;
const Lexer_1 = require("./lexer/Lexer");
const Parser_1 = require("./parser/Parser");
const SemanticAnalyzer_1 = require("./analyzer/SemanticAnalyzer");
const IRGenerator_1 = require("./ir/IRGenerator");
const TypeChecker_1 = require("./typechecker/TypeChecker");
const PluginSystem_1 = require("./plugin/PluginSystem");
const SourceMapGenerator_1 = require("./sourcemap/SourceMapGenerator");
const TemplateEngine_1 = require("./template/TemplateEngine");
const JavaScriptGenerator_1 = require("./codegen/JavaScriptGenerator");
const TypeScriptGenerator_1 = require("./codegen/TypeScriptGenerator");
const JSXGenerator_1 = require("./codegen/JSXGenerator");
const TSXGenerator_1 = require("./codegen/TSXGenerator");
const PythonGenerator_1 = require("./codegen/PythonGenerator");
const CppGenerator_1 = require("./codegen/CppGenerator");
const JavaGenerator_1 = require("./codegen/JavaGenerator");
const KotlinGenerator_1 = require("./codegen/KotlinGenerator");
const SmartTargetDetector_1 = require("./detection/SmartTargetDetector");
const GENERATORS = {
    js: new JavaScriptGenerator_1.JavaScriptGenerator(),
    ts: new TypeScriptGenerator_1.TypeScriptGenerator(),
    tsx: new TSXGenerator_1.TSXGenerator(),
    jsx: new JSXGenerator_1.JSXGenerator(),
    py: new PythonGenerator_1.PythonGenerator(),
    cpp: new CppGenerator_1.CppGenerator(),
    java: new JavaGenerator_1.JavaGenerator(),
    kt: new KotlinGenerator_1.KotlinGenerator(),
};
class BetaCompiler {
    pluginManager = new PluginSystem_1.PluginManager();
    templateEngine = new TemplateEngine_1.TemplateEngine();
    detector = new SmartTargetDetector_1.SmartTargetDetector();
    compile(source, filename = "unknown", options = {}) {
        return this.compileDetailed(source, filename, options).code;
    }
    compileDetailed(source, filename = "unknown", options = {}) {
        const detectedTargets = this.detector.detect(source, options.filePath ?? filename, options.projectRoot);
        const target = options.target ?? detectedTargets[0] ?? "js";
        const cleanedSource = this.detector.extractCleanedSource(source);
        const conditionalBlocks = this.detector.getConditionalBlocks(source, target);
        const mode = options.mode ?? "full";
        let processedSource = this.pluginManager.runBeforeParse(cleanedSource);
        const lexer = new Lexer_1.Lexer(processedSource);
        const tokens = lexer.tokenize();
        const parser = new Parser_1.Parser(processedSource);
        const ast = parser.parse(tokens);
        const analyzer = new SemanticAnalyzer_1.SemanticAnalyzer();
        analyzer.analyze(ast);
        const irGenerator = new IRGenerator_1.IRGenerator();
        const ir = irGenerator.generate(ast);
        try {
            (0, TypeChecker_1.checkTypes)(ir);
        }
        catch (e) {
            if (options.debug)
                console.warn("Type check warning:", e);
        }
        const processedIR = this.pluginManager.runBeforeEmit(ir);
        const generator = GENERATORS[target] ?? GENERATORS["js"];
        let code = generator.generate(processedIR);
        code = this.pluginManager.runAfterEmit(code, target);
        const sourceMapGen = new SourceMapGenerator_1.SourceMapGenerator();
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
    use(plugin) {
        this.pluginManager.register(plugin);
        return this;
    }
    detectTarget(source, filePath) {
        return this.detector.detect(source, filePath)[0] ?? "js";
    }
    run(source, options) {
        const result = this.compileDetailed(source, "repl", { ...options, target: "js" });
        if (options?.debug)
            console.log(result.code);
        eval(result.code);
    }
}
exports.BetaCompiler = BetaCompiler;
function compile(source, filePath, options) {
    const compiler = new BetaCompiler();
    return compiler.compile(source, filePath ?? "unknown", { ...options, filePath });
}
//# sourceMappingURL=index.js.map
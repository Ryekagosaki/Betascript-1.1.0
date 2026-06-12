#!/usr/bin/env node
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const commander_1 = require("commander");
const readline_1 = __importDefault(require("readline"));
const SmartTargetDetector_1 = require("./detection/SmartTargetDetector");
const program = new commander_1.Command();
const compiler = new index_1.BetaCompiler();
const detector = new SmartTargetDetector_1.SmartTargetDetector();
function printUsage() {
    console.log(`BetaScript 2.0 - Smart Target Detection - Ngoding rasa Betawi, kagak ribet!
  
Usage:
  betascript <command> [options]

Commands:
  compile <file.beta>       Compile BetaScript (auto-detect target or use --target)
  run <file.beta>           Compile to JS and run immediately
  repl                      Interactive BetaScript shell
  format <file.beta>        Format BetaScript file
  lint <file.beta>          Validate BetaScript file
  lain <package>         Install beta-* community package
  help                      Show this help message
`);
}
function detectAndCompile(filepath, options = {}, defaultTarget) {
    const absolutePath = path.resolve(filepath);
    if (!fs.existsSync(absolutePath)) {
        console.error(`Error: File '${filepath}' not found`);
        process.exit(1);
    }
    const source = fs.readFileSync(absolutePath, "utf-8");
    const targets = options.target
        ? [options.target]
        : options.semua
            ? detector.getAllTargets()
            : detector.detect(source, absolutePath);
    const firstTarget = typeof targets[0] === "string" ? targets[0] : "js";
    const compileOpts = {
        debug: options.debug,
        mode: options.mode ?? "full",
    };
    if (defaultTarget)
        compileOpts.target = defaultTarget;
    if (options.semua) {
        const outDir = path.resolve("dist");
        fs.mkdirSync(outDir, { recursive: true });
        for (const t of targets) {
            const result = compiler.compileDetailed(source, absolutePath, { ...compileOpts, target: t });
            const ext = `.${t}`;
            const outPath = path.join(outDir, path.basename(absolutePath, ".beta") + ext);
            fs.writeFileSync(outPath, result.code, "utf-8");
            console.log(`Compiled to ${outPath}`);
        }
        return;
    }
    const result = compiler.compileDetailed(source, absolutePath, compileOpts);
    const outPath = absolutePath.replace(".beta", `.${firstTarget}`);
    fs.writeFileSync(outPath, result.code, "utf-8");
    if (options.debug)
        printDebug(result);
    console.log(`Compiled to ${outPath}`);
}
function compileFile(filepath, options = {}) {
    detectAndCompile(filepath, options);
}
function runFile(filepath, options = {}) {
    const absolutePath = path.resolve(filepath);
    if (!fs.existsSync(absolutePath)) {
        console.error(`Error: File '${filepath}' not found`);
        process.exit(1);
    }
    const source = fs.readFileSync(absolutePath, "utf-8");
    const rawTarget = options.target ?? (detector.detect(source, absolutePath)[0] ?? "js");
    const target = rawTarget;
    const execute = () => {
        const result = compiler.compileDetailed(source, absolutePath, {
            target,
            mode: options.mode ?? "full",
            debug: options.debug,
        });
        if (options.tampilkanKode) {
            console.log("\n=== HASIL TRANSPILE ===\n");
            console.log(result.code);
            console.log("\n========================\n");
        }
        if (target === "js" || target === "ts" || target === "tsx" || target === "jsx") {
            const module = { exports: {} };
            const fn = new Function("module", "exports", "require", "__runtime", result.code);
            fn(module, module.exports, require, result.code);
        }
        else {
            console.log(`Output is ${target}. Tidak bisa langsung dijalankan.`);
        }
    };
    execute();
    if (options.watch) {
        console.log(`Watching ${absolutePath}...`);
        fs.watchFile(absolutePath, { interval: 500 }, () => {
            console.log("\nFile berubah, jalanin ulang...");
            try {
                execute();
            }
            catch (error) {
                console.error(error instanceof Error ? error.message : error);
            }
        });
    }
}
function printDebug(result) {
    console.log("\n=== IR ===");
    console.log(JSON.stringify(result.ir, null, 2));
    console.log("\n=== OUTPUT ===");
    console.log(result.code);
}
function repl() {
    const rl = readline_1.default.createInterface({ input: process.stdin, output: process.stdout, prompt: "beta> " });
    console.log("BetaScript 2.0 REPL. Ketik .keluar buat selesai.");
    rl.prompt();
    rl.on("line", (line) => {
        const input = line.trim();
        if (input === ".keluar" || input === ".exit") {
            rl.close();
            return;
        }
        if (!input) {
            rl.prompt();
            return;
        }
        try {
            compiler.run(input, { target: "js" });
        }
        catch (error) {
            console.error(error instanceof Error ? error.message : error);
        }
        rl.prompt();
    });
}
function formatFile(filepath) {
    const absolutePath = path.resolve(filepath);
    const source = fs.readFileSync(absolutePath, "utf-8");
    let indent = 0;
    const formatted = source.split(/\r?\n/).map((line) => {
        const trimmed = line.trim();
        if (!trimmed)
            return "";
        if (trimmed.startsWith("}"))
            indent = Math.max(0, indent - 1);
        const output = `${"  ".repeat(indent)}${trimmed}`;
        if (trimmed.endsWith("{") || (trimmed.includes("{") && !trimmed.includes("}")))
            indent++;
        return output;
    }).join("\n").trimEnd() + "\n";
    fs.writeFileSync(absolutePath, formatted, "utf-8");
    console.log(`Formatted ${absolutePath}`);
}
function lintFile(filepath) {
    const absolutePath = path.resolve(filepath);
    const source = fs.readFileSync(absolutePath, "utf-8");
    try {
        compiler.compile(source, absolutePath, { target: "js" });
        console.log("Lint bersih, bang.");
    }
    catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    }
}
function initProject() {
    const config = {
        tujuan: "typescript",
        keluaran: "./dist",
        opsi: {
            minifikasi: false,
            sumber_peta: false,
            ketat_tipe: false,
        },
    };
    fs.writeFileSync("beta.config.json", JSON.stringify(config, null, 2), "utf-8");
    console.log("Created beta.config.json");
}
function run() {
    program
        .name('betascript')
        .description('BetaScript 2.0 Compiler - Smart Target Detection')
        .version('2.0.0');
    program
        .command('compile <file>')
        .description('Compile BetaScript to target language (auto-detected unless --target)')
        .option('--debug', 'Print IR and compiled output')
        .option('--target <lang>', 'Target language: js|ts|tsx|jsx|py|cpp|java|kt', "js")
        .option('--mode <mode>', 'Compilation mode: html|css|full', 'full')
        .option('--semua', 'Compile to ALL targets')
        .action(compileFile);
    program
        .command('run <file>')
        .description('Compile to JS and run immediately')
        .option('--watch', 'Auto-reload when file changes')
        .option('--debug', 'Print IR and compiled output')
        .option('--target <lang>', 'Target language', 'js')
        .option('--tampilkan-kode', 'Show transpiled code before running')
        .action(runFile);
    program
        .command('repl')
        .description('Start interactive BetaScript REPL')
        .action(repl);
    program
        .command('format <file>')
        .description('Format a BetaScript file')
        .action(formatFile);
    program
        .command('lint <file>')
        .description('Lint a BetaScript file')
        .action(lintFile);
    program
        .command('init')
        .description('Initialize beta.config.json')
        .action(initProject);
    program.parse();
}
run();
//# sourceMappingURL=cli.js.map
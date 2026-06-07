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
const child_process_1 = require("child_process");
const program = new commander_1.Command();
const compiler = new index_1.BetaCompiler();
function printUsage() {
    console.log(`BetaScript Compiler - Ngoding rasa Betawi, kagak ribet!
  
Usage:
  betascript <command> [options]

Commands:
  compile <file.beta>    Compile BetaScript to JavaScript
  run <file.beta>      Compile and run BetaScript
  help                 Show this help message
`);
}
function compileFile(filepath, options = {}) {
    const absolutePath = path.resolve(filepath);
    if (!fs.existsSync(absolutePath)) {
        console.error(`Error: File '${filepath}' not found`);
        process.exit(1);
    }
    const source = fs.readFileSync(absolutePath, "utf-8");
    const result = compiler.compileDetailed(source, absolutePath);
    const outPath = absolutePath.replace(".beta", ".js");
    fs.writeFileSync(outPath, result.code, "utf-8");
    if (options.debug)
        printDebug(result);
    console.log(`Compiled to ${outPath}`);
}
function runFile(filepath, options = {}) {
    const absolutePath = path.resolve(filepath);
    if (!fs.existsSync(absolutePath)) {
        console.error(`Error: File '${filepath}' not found`);
        process.exit(1);
    }
    const execute = () => {
        const jsPath = absolutePath.replace(".beta", ".js");
        const source = fs.readFileSync(absolutePath, "utf-8");
        const result = compiler.compileDetailed(source, absolutePath);
        fs.writeFileSync(jsPath, result.code, "utf-8");
        if (options.debug)
            printDebug(result);
        delete require.cache[require.resolve(jsPath)];
        require(jsPath);
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
    console.log("\n=== TOKENS ===");
    console.log(JSON.stringify(result.tokens, null, 2));
    console.log("\n=== AST ===");
    console.log(JSON.stringify(result.ast, null, 2));
    console.log("\n=== JAVASCRIPT ===");
    console.log(result.code);
}
function repl() {
    const rl = readline_1.default.createInterface({ input: process.stdin, output: process.stdout, prompt: "beta> " });
    console.log("BetaScript REPL. Ketik .keluar buat selesai.");
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
            compiler.run(input);
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
        if (trimmed.endsWith("{") || trimmed.includes("{") && !trimmed.includes("}"))
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
        compiler.compile(source, absolutePath);
        console.log("Lint bersih, bang.");
    }
    catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    }
}
function installPackage(name) {
    const packageName = name.startsWith("beta-") ? name : `beta-${name}`;
    (0, child_process_1.execSync)(`npm install ${packageName}`, { stdio: "inherit" });
}
function run() {
    program
        .name('betascript')
        .description('BetaScript Compiler - Ngoding rasa Betawi, kagak ribet!')
        .version('1.0.1');
    program
        .command('compile <file>')
        .description('Compile BetaScript to JavaScript')
        .option('--debug', 'Print tokens, AST, and compiled JavaScript')
        .action(compileFile);
    program
        .command('run <file>')
        .description('Compile and run BetaScript')
        .option('--watch', 'Auto-reload when file changes')
        .option('--debug', 'Print tokens, AST, and compiled JavaScript')
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
        .command('install <package>')
        .description('Install a beta-* package from npm')
        .action(installPackage);
    program.parse();
}
run();
//# sourceMappingURL=cli.js.map
#!/usr/bin/env node
import { BetaCompiler } from "./index";
import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";
import readline from "readline";
import { execSync } from "child_process";
import { SmartTargetDetector, Target } from "./detection/SmartTargetDetector";

const program = new Command();
const compiler = new BetaCompiler();
const detector = new SmartTargetDetector();

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

interface CommandOptions {
  debug?: boolean;
  watch?: boolean;
  target?: string;
  mode?: string;
  semua?: boolean;
  tampilkanKode?: boolean;
}

function detectAndCompile(filepath: string, options: CommandOptions = {}, defaultTarget?: string) {
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
  const compileOpts: any = {
    debug: options.debug,
    mode: (options.mode as any) ?? "full",
  };
  if (defaultTarget) compileOpts.target = defaultTarget;

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
  if (options.debug) printDebug(result);
  console.log(`Compiled to ${outPath}`);
}

function compileFile(filepath: string, options: CommandOptions = {}) {
  detectAndCompile(filepath, options);
}

function runFile(filepath: string, options: CommandOptions = {}) {
  const absolutePath = path.resolve(filepath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File '${filepath}' not found`);
    process.exit(1);
  }

  const source = fs.readFileSync(absolutePath, "utf-8");
  const rawTarget = options.target ?? (detector.detect(source, absolutePath)[0] ?? "js");
  const target = rawTarget as Target;
  const execute = () => {
    const result = compiler.compileDetailed(source, absolutePath, {
      target,
      mode: (options.mode as any) ?? "full",
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
    } else {
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
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
      }
    });
  }
}

function printDebug(result: any) {
  console.log("\n=== IR ===");
  console.log(JSON.stringify(result.ir, null, 2));
  console.log("\n=== OUTPUT ===");
  console.log(result.code);
}

function repl() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "beta> " });
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
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
    }
    rl.prompt();
  });
}

function formatFile(filepath: string) {
  const absolutePath = path.resolve(filepath);
  const source = fs.readFileSync(absolutePath, "utf-8");
  let indent = 0;
  const formatted = source.split(/\r?\n/).map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("}")) indent = Math.max(0, indent - 1);
    const output = `${"  ".repeat(indent)}${trimmed}`;
    if (trimmed.endsWith("{") || (trimmed.includes("{") && !trimmed.includes("}"))) indent++;
    return output;
  }).join("\n").trimEnd() + "\n";
  fs.writeFileSync(absolutePath, formatted, "utf-8");
  console.log(`Formatted ${absolutePath}`);
}

function lintFile(filepath: string) {
  const absolutePath = path.resolve(filepath);
  const source = fs.readFileSync(absolutePath, "utf-8");
  try {
    compiler.compile(source, absolutePath, { target: "js" });
    console.log("Lint bersih, bang.");
  } catch (error) {
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

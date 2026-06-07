#!/usr/bin/env node
import { BetaCompiler } from "./index";
import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";
import readline from "readline";
import { execSync } from "child_process";

const program = new Command();
const compiler = new BetaCompiler();

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

interface CommandOptions {
  debug?: boolean;
  watch?: boolean;
}

function compileFile(filepath: string, options: CommandOptions = {}) {
  const absolutePath = path.resolve(filepath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File '${filepath}' not found`);
    process.exit(1);
  }
  
  const source = fs.readFileSync(absolutePath, "utf-8");
  const result = compiler.compileDetailed(source, absolutePath);
  const outPath = absolutePath.replace(".beta", ".js");
  fs.writeFileSync(outPath, result.code, "utf-8");
  if (options.debug) printDebug(result);
  console.log(`Compiled to ${outPath}`);
}

function runFile(filepath: string, options: CommandOptions = {}) {
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
    if (options.debug) printDebug(result);
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
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
      }
    });
  }
}

function printDebug(result: ReturnType<BetaCompiler["compileDetailed"]>) {
  console.log("\n=== TOKENS ===");
  console.log(JSON.stringify(result.tokens, null, 2));
  console.log("\n=== AST ===");
  console.log(JSON.stringify(result.ast, null, 2));
  console.log("\n=== JAVASCRIPT ===");
  console.log(result.code);
}

function repl() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "beta> " });
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
    if (trimmed.endsWith("{") || trimmed.includes("{") && !trimmed.includes("}")) indent++;
    return output;
  }).join("\n").trimEnd() + "\n";
  fs.writeFileSync(absolutePath, formatted, "utf-8");
  console.log(`Formatted ${absolutePath}`);
}

function lintFile(filepath: string) {
  const absolutePath = path.resolve(filepath);
  const source = fs.readFileSync(absolutePath, "utf-8");
  try {
    compiler.compile(source, absolutePath);
    console.log("Lint bersih, bang.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

function installPackage(name: string) {
  const packageName = name.startsWith("beta-") ? name : `beta-${name}`;
  execSync(`npm install ${packageName}`, { stdio: "inherit" });
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

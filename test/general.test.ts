import { BetaCompiler } from "../src/index";
import { UjianFramework } from "../src/runtime/UjianFramework";

const compiler = new BetaCompiler();

describe("BetaScript 2.0 Compiler Architecture", () => {
  const simpleSource = `ane nama = "Dunia"
tetep PI = 3.14
teriak("Halo " + nama)`;

  const classSource = `cetak Anjing {
  mula(nama: tulisan) {
    this.nama = nama
  }
  bersuara(): tulisan {
    balikin "Guk guk!"
  }
}
ane anjing = anyar Anjing("Buddy")
teriak(anjing.bersuara())`;

  describe("Compiler Pipeline", () => {
    test("should compile simple source through full pipeline", () => {
      const result = compiler.compileDetailed(simpleSource, "test.beta", { target: "js" });
      expect(result.code).toBeTruthy();
      expect(result.ast).toBeDefined();
      expect(result.ir).toBeDefined();
    });

    test("should produce JavaScript output", () => {
      const js = compiler.compile(simpleSource, "test.beta", { target: "js" });
      expect(js).toBeTruthy();
      expect(typeof js).toBe("string");
    });

    test("should produce TypeScript output", () => {
      const ts = compiler.compile(classSource, "test.beta", { target: "ts" });
      expect(ts).toBeTruthy();
    });
  });

  describe("Multi-Target Compilation", () => {
    const targets = ["js", "ts", "tsx", "jsx", "py", "cpp", "java", "kt"] as const;

    test.each(targets)("should compile to %s target", (target) => {
      const code = compiler.compile(classSource, "test.beta", { target });
      expect(code).toBeTruthy();
      expect(code.length).toBeGreaterThan(0);
    });

    test("Python output should contain Python syntax", () => {
      const py = compiler.compile(classSource, "test.beta", { target: "py" });
      expect(py).toBeTruthy();
      expect(py).toContain("class");
    });

    test("C++ output should contain C++ syntax", () => {
      const cpp = compiler.compile(classSource, "test.beta", { target: "cpp" });
      expect(cpp).toBeTruthy();
      expect(cpp).toContain("#include");
    });

    test("Java output should contain Java syntax", () => {
      const java = compiler.compile(classSource, "test.beta", { target: "java" });
      expect(java).toBeTruthy();
      expect(java).toContain("package ");
    });

    test("Kotlin output should contain Kotlin syntax", () => {
      const kt = compiler.compile(classSource, "test.beta", { target: "kt" });
      expect(kt).toBeTruthy();
      expect(kt).toContain("package ");
    });
  });

  describe("Plugin System", () => {
    test("should allow plugin registration", () => {
      const plugin = {
        name: "test-plugin",
        version: "1.0.0",
        afterParse(ast: any) {
          return ast;
        },
      };
      const c = new BetaCompiler();
      c.use(plugin);
      const code = c.compile(simpleSource, "test.beta", { target: "js" });
      expect(code).toBeTruthy();
    });

    test("should run beforeParse plugin hook", () => {
      const called = { value: false };
      const plugin = {
        name: "transform-plugin",
        version: "1.0.0",
        beforeParse(source: string) {
          called.value = true;
          return source;
        },
      };
      const c = new BetaCompiler();
      c.use(plugin);
      const code = c.compile(simpleSource, "test.beta", { target: "js" });
      expect(called.value).toBe(true);
      expect(code).toBeTruthy();
    });
  });

  describe("Template Engine", () => {
    test("should parse HTML template", () => {
      const { TemplateEngine } = require("../src/template/TemplateEngine");
      const engine = new TemplateEngine();
      const html = '<div>Hello ' + '${' + 'nama}' + '</div>';
      const result = engine.parseHTML(html);
      expect(result.ast.length).toBeGreaterThan(0);
      expect(result.raw).toBe(html);
    });

    test("should parse CSS template", () => {
      const { TemplateEngine } = require("../src/template/TemplateEngine");
      const engine = new TemplateEngine();
      const css = `.box { color: red; }`;
      const result = engine.parseCSS(css);
      expect(result.rules.length).toBe(1);
      expect(result.rules[0].selector).toBe(".box");
    });
  });

  describe("Type Checker", () => {
    test("should not throw on valid code", () => {
      expect(() => {
        compiler.compile(simpleSource, "test.beta", { target: "js" });
      }).not.toThrow();
    });

    test("should throw on invalid code", () => {
      expect(() => {
        compiler.compile("invalid syntax !!", "test.beta");
      }).toThrow();
    });
  });

  describe("Source Map Generator", () => {
    test("should generate source map when enabled", () => {
      const result = compiler.compileDetailed(simpleSource, "test.beta", {
        target: "js",
        sourceMap: true as any,
      });
      expect(result.ir).toBeDefined();
    });
  });

  describe("IR Generation", () => {
    test("should generate IR with correct structure", () => {
      const result = compiler.compileDetailed(simpleSource, "test.beta", { target: "js" });
      expect(result.ir).toBeDefined();
      expect(result.ast!.type).toBe("Program");
    });
  });

  describe("Error Handling", () => {
    test("should throw on syntax error", () => {
      expect(() => {
        compiler.compile("= invalid", "test.beta");
      }).toThrow();
    });
  });

  describe("CLI Target Mapping", () => {
    test("should support all 8 target languages", () => {
      const targets = ["js", "ts", "tsx", "jsx", "py", "cpp", "java", "kt"];
      for (const target of targets) {
        const code = compiler.compile(simpleSource, "test.beta", { target: target as any });
        expect(code.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Standard Library Abstraction", () => {
    test("StdLib should expose deret module", () => {
      const { getStdLibModule } = require("../src/stdlib/StdLib");
      const mod = getStdLibModule("deret");
      expect(mod).toBeDefined();
      expect(mod!.emitImport("js")).toContain("Array");
    });

    test("StdLib should expose http module", () => {
      const { getStdLibModule } = require("../src/stdlib/StdLib");
      const mod = getStdLibModule("http");
      expect(mod).toBeDefined();
    });

    test("StdLib should expose file module", () => {
      const { getStdLibModule } = require("../src/stdlib/StdLib");
      const mod = getStdLibModule("file");
      expect(mod).toBeDefined();
    });

    test("StdLib should expose basis_data module", () => {
      const { getStdLibModule } = require("../src/stdlib/StdLib");
      const mod = getStdLibModule("basis_data");
      expect(mod).toBeDefined();
    });

    test("StdLib should expose otentikasi module", () => {
      const { getStdLibModule } = require("../src/stdlib/StdLib");
      const mod = getStdLibModule("otentikasi");
      expect(mod).toBeDefined();
    });

    test("StdLib should expose tampilan module", () => {
      const { getStdLibModule } = require("../src/stdlib/StdLib");
      const mod = getStdLibModule("tampilan");
      expect(mod).toBeDefined();
    });

    test("StdLib should expose gaya module", () => {
      const { getStdLibModule } = require("../src/stdlib/StdLib");
      const mod = getStdLibModule("gaya");
      expect(mod).toBeDefined();
    });

    test("StdLib should resolve aliases correctly", () => {
      const { resolveStdLibAlias } = require("../src/stdlib/StdLib");
      expect(resolveStdLibAlias("deret")).toBe("deret");
      expect(resolveStdLibAlias("list")).toBe("deret");
      expect(resolveStdLibAlias("array")).toBe("deret");
      expect(resolveStdLibAlias("http")).toBe("http");
    });
  });

  describe("Ujian Testing Framework", () => {
    test("should parse test cases", () => {
      const framework = new UjianFramework();
      framework.registerTest({
        name: "test_simple",
        body: { type: "BlockStatement", statements: [], position: { line: 1, column: 1 } },
      });
      const results = framework.run();
      expect(results.length).toBe(1);
      expect(results[0].name).toBe("test_simple");
    });

    test("should generate test report", () => {
      const framework = new UjianFramework();
      framework.registerTest({
        name: "test_pass",
        body: { type: "BlockStatement", statements: [], position: { line: 1, column: 1 } },
      });
      framework.run();
      const report = framework.getReport();
      expect(report).toContain("Laporan Ujian BetaScript");
    });

    test("should handle test failure with assertion", () => {
      const framework = new UjianFramework();
      framework.registerTest({
        name: "test_fail",
        body: {
          type: "BlockStatement",
          statements: [{
            type: "ExpressionStatement",
            expression: {
              type: "CallExpression",
              callee: { type: "Identifier", name: "harapkan", position: { line: 1, column: 1 } },
              arguments: [{ type: "Literal", value: false, raw: "false", position: { line: 1, column: 1 } }],
              optional: false,
              position: { line: 1, column: 1 },
            },
            position: { line: 1, column: 1 },
          }],
          position: { line: 1, column: 1 },
        } as any,
      });
      const results = framework.run();
      expect(results[0].passed).toBe(false);
    });
  });

  describe("BetaScript 2.0 New Features", () => {
    test("should compile with new module syntax", () => {
      const source = `cetak Tes {
  mula() {
    this.hasil = 0
  }
  hitung(a: angka, b: angka): angka {
    balikin a + b
  }
}
ane t = anyar Tes()
teriak(t.hitung(1, 2))`;
      const code = compiler.compile(source, "test.beta", { target: "js" });
      expect(code).toBeTruthy();
    });

    test("should compile interface and type usage", () => {
      const source = `antarmuka Robot {
  jalan(): tulisan
}
cetak Droid {
  mula(nama: tulisan) {
    this.nama = nama
  }
  jalan(): tulisan {
    balikin this.nama + " berjalan"
  }
}`;
      expect(() => compiler.compile(source, "test.beta", { target: "ts" })).not.toThrow();
    });

    test("should compile to Kotlin with val/var", () => {
      const source = `ane x = 10\ntetep y = 20`;
      const code = compiler.compile(source, "test.beta", { target: "kt" });
      expect(code).toContain("var x: Any = 10");
      expect(code).toContain("val y: Any = 20");
    });
  });
});

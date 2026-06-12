export type Target = "js" | "ts" | "tsx" | "jsx" | "py" | "cpp" | "java" | "kt";

export interface StdLibModule {
  name: string;
  description: string;
  emitImport(target: Target): string;
  emitUsage(module: string, func: string, args: string, target: Target): string;
  has(func: string): boolean;
}

export interface StdLibConfig {
  modules: Record<string, StdLibModule>;
  aliases: Record<string, string[]>;
}

const stdlibConfig: StdLibConfig = {
  modules: {
    deret: {
      name: "deret",
      description: "Array/List collection abstraction",
      emitImport(target: Target) {
        switch (target) {
          case "js":
          case "ts":
          case "tsx":
          case "jsx":
            return "// deret maps to native Array";
          case "py":
            return "from typing import List";
          case "cpp":
            return "#include <vector>\nusing namespace std;";
          case "java":
            return "import java.util.ArrayList;\nimport java.util.List;";
          case "kt":
            return "import kotlin.collections.List";
        }
      },
      emitUsage(module: string, func: string, args: string, target: Target) {
        switch (target) {
          case "js":
          case "ts":
          case "tsx":
          case "jsx":
            return `${func}(${args})`;
          case "py":
            if (func === "petakan") return `list(map(lambda x: x, ${args}))`;
            return `${args}`;
          case "cpp":
            if (func === "petakan")
              return `[&](const auto& v) { std::transform(v.begin(), v.end(), std::back_inserter(result), [](auto x) { return x; }); }(${args})`;
            return `${args}`;
          case "java":
            return `new ArrayList<>(${args})`;
          case "kt":
            return `${args}.toList()`;
        }
      },
      has(func: string) {
        return ["petakan", "saring", "kurangi", "urutin", "gabung"].includes(func);
      },
    },
    http: {
      name: "http",
      description: "HTTP client abstraction",
      emitImport(target: Target) {
        switch (target) {
          case "js":
          case "ts":
          case "tsx":
          case "jsx":
            return "// http uses native fetch";
          case "py":
            return "import requests\nimport json";
          case "cpp":
            return "#include <cpp-httplib/httplib.h>";
          case "java":
            return "import java.net.http.HttpClient;\nimport java.net.http.HttpRequest;\nimport java.net.http.HttpResponse;";
          case "kt":
            return "import okhttp3.*";
        }
      },
      emitUsage(module: string, func: string, args: string, target: Target) {
        switch (target) {
          case "js":
          case "ts":
          case "tsx":
          case "jsx":
            if (func === "ambil") return `fetch(${args})`;
            if (func === "kirim") return `fetch(${args.split(",")[0]}, { method: "POST", body: ${args.split(",")[1]}, headers: { "Content-Type": "application/json" } })`;
            return `${func}(${args})`;
          case "py":
            if (func === "ambil") return `requests.get(${args.split(",")[0]})`;
            if (func === "kirim")
              return `requests.post(${args.split(",")[0]}, json=${args.split(",")[1]}, headers={"Content-Type": "application/json"})`;
            return `${func}(${args})`;
          case "cpp":
            return `${func}(${args})`;
          case "java":
            if (func === "ambil") return `HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create(${args.split(",")[0]}).build(), HttpResponse.BodyHandlers.ofString())`;
            return `${func}(${args})`;
          case "kt":
            return `${func}(${args})`;
        }
      },
      has(func: string) {
        return ["ambil", "kirim"].includes(func);
      },
    },
    file: {
      name: "file",
      description: "File system abstraction",
      emitImport(target: Target) {
        switch (target) {
          case "js":
          case "ts":
          case "tsx":
          case "jsx":
            return "import * as fs from 'fs';\nimport * as path from 'path';";
          case "py":
            return "import os\nimport json\nfrom pathlib import Path";
          case "cpp":
            return "#include <fstream>\n#include <filesystem>";
          case "java":
            return "import java.nio.file.*;\nimport java.io.*;";
          case "kt":
            return "import java.io.File\nimport kotlin.io.*";
        }
      },
      emitUsage(module: string, func: string, args: string, target: Target) {
        switch (target) {
          case "js":
          case "ts":
          case "tsx":
          case "jsx":
            if (func === "baca") return `fs.promises.readFile(${args}, "utf8")`;
            if (func === "tulis") return `fs.promises.writeFile(${args.split(",")[0]}, ${args.split(",")[1]})`;
            if (func === "ada") return `fs.existsSync(${args})`;
            return `${func}(${args})`;
          case "py":
            if (func === "baca") return `Path(${args}).read_text()`;
            if (func === "tulis") return `Path(${args.split(",")[0]}).write_text(${args.split(",")[1]})`;
            if (func === "ada") return `Path(${args}).exists()`;
            return `${func}(${args})`;
          case "cpp":
            if (func === "baca") return `std::ifstream(${args}).rdbuf()->str()`;
            if (func === "tulis") return `{ std::ofstream(${args.split(",")[0]}); ${args.split(",")[1]}; }`;
            if (func === "ada") return `std::filesystem::exists(${args})`;
            return `${func}(${args})`;
          case "java":
            if (func === "baca") return `new String(Files.readAllBytes(Paths.get(${args})))`;
            if (func === "tulis") return `Files.write(Paths.get(${args.split(",")[0]}), ${args.split(",")[1]}.getBytes())`;
            if (func === "ada") return `Files.exists(Paths.get(${args}))`;
            return `${func}(${args})`;
          case "kt":
            if (func === "baca") return `File(${args}).readText()`;
            if (func === "tulis") return `File(${args.split(",")[0]}).writeText(${args.split(",")[1]})`;
            if (func === "ada") return `File(${args}).exists()`;
            return `${func}(${args})`;
        }
      },
      has(func: string) {
        return ["baca", "tulis", "ada"].includes(func);
      },
    },
    basis_data: {
      name: "basis_data",
      description: "Database abstraction layer",
      emitImport(target: Target) {
        switch (target) {
          case "js":
          case "ts":
          case "tsx":
          case "jsx":
            return "// Database module - use appropriate ORM/query builder";
          case "py":
            return "import sqlite3\nimport json";
          case "cpp":
            return "#include <sqlite3.h>";
          case "java":
            return "import java.sql.*;";
          case "kt":
            return "import java.sql.*";
        }
      },
      emitUsage(module: string, func: string, args: string, target: Target) {
        const parts = args.split(",");
        switch (target) {
          case "js":
          case "ts":
          case "tsx":
          case "jsx":
            return `// ${func}(${args}) - implement with chosen ORM`;
          case "py":
            return `sqlite3.connect(${parts[0]})`;
          case "cpp":
            return `${func}(${args})`;
          case "java":
            return `DriverManager.getConnection(${parts[0]})`;
          case "kt":
            return `DriverManager.getConnection(${parts[0]})`;
        }
      },
      has(func: string) {
        return ["hubungi", "jalanin", "tutup", "kueri"].includes(func);
      },
    },
    otentikasi: {
      name: "otentikasi",
      description: "Authentication abstraction",
      emitImport(target: Target) {
        switch (target) {
          case "js":
          case "ts":
          case "tsx":
          case "jsx":
            return "// Auth module - implement with chosen auth provider";
          case "py":
            return "import jwt\nimport hashlib";
          case "cpp":
            return "#include <openssl/sha.h>";
          case "java":
            return "import java.security.*;\nimport javax.crypto.*;";
          case "kt":
            return "import java.security.*";
        }
      },
      emitUsage(module: string, func: string, args: string, target: Target) {
        return `// ${func}(${args}) - implement auth logic`;
      },
      has(func: string) {
        return ["masuk", "keluar", "daftar", "verifikasi", "token"].includes(func);
      },
    },
    tampilan: {
      name: "tampilan",
      description: "UI Rendering abstraction (HTML/JSX/Compose)",
      emitImport(target: Target) {
        switch (target) {
          case "js":
            return "// Native DOM rendering";
          case "ts":
            return "// Type-safe DOM rendering";
          case "tsx":
          case "jsx":
            return "import * as React from 'react';\nimport { createElement } from 'react';";
          case "py":
            return "# UI rendering not directly supported in Python";
          case "cpp":
            return "// UI rendering platform-specific";
          case "java":
            return "// UI rendering platform-specific";
          case "kt":
            return "import androidx.compose.ui.*\nimport androidx.compose.material.*";
        }
      },
      emitUsage(module: string, func: string, args: string, target: Target) {
        return `// ${func}(${args}) - render UI`;
      },
      has(func: string) {
        return ["render", "elemen", "tampilkan", "sembunyikan"].includes(func);
      },
    },
    gaya: {
      name: "gaya",
      description: "CSS-in-JS / Styling abstraction",
      emitImport(target: Target) {
        switch (target) {
          case "js":
          case "ts":
          case "tsx":
          case "jsx":
            return "// CSS-in-JS styling";
          case "py":
            return "# Styling not directly supported in Python";
          case "cpp":
            return "// Styling platform-specific";
          case "java":
            return "// Styling platform-specific";
          case "kt":
            return "// Compose styling";
        }
      },
      emitUsage(module: string, func: string, args: string, target: Target) {
        return `// ${func}(${args}) - styling`;
      },
      has(func: string) {
        return ["ganti", "tambah", "hapus", "terapkan"].includes(func);
      },
    },
  },
  aliases: {
    deret: ["deret", "daftar", "list", "array"],
    http: ["http", "ambil", "kirim"],
    file: ["file", "baca", "tulis", "ada"],
    basis_data: ["basis_data", "peta", "himpunan"],
    otentikasi: ["otentikasi", "masuk", "keluar"],
    tampilan: ["tampilan", "render", "elemen", "halaman"],
    gaya: ["gaya", "warna", "ganti", "tampilkan"],
  },
};

export function getStdLibModule(name: string): StdLibModule | undefined {
  for (const [key, aliases] of Object.entries(stdlibConfig.aliases)) {
    if (key === name || aliases.includes(name)) {
      return stdlibConfig.modules[key];
    }
  }
  return undefined;
}

export function resolveStdLibAlias(name: string): string {
  for (const [key, aliases] of Object.entries(stdlibConfig.aliases)) {
    if (key === name || aliases.includes(name)) {
      return key;
    }
  }
  return name;
}

export function getAllStdLibModules(): StdLibModule[] {
  return Object.values(stdlibConfig.modules);
}

export { stdlibConfig };

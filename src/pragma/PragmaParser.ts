import { Position } from "../utils/Position";

export interface PragmaDirective {
  type: "tujuan" | "kalo";
  target?: string | string[];
  condition?: string;
  body?: string;
  line: number;
  raw: string;
}

export interface ParsedPragma {
  directives: PragmaDirective[];
  cleanedSource: string;
  explicitTargets: string[] | null;
}

export class PragmaParser {
  parse(source: string): ParsedPragma {
    const lines = source.split(/\r\n|\n|\r/);
    const directives: PragmaDirective[] = [];
    let explicitTargets: string[] | null = null;
    const cleanedLines: string[] = [];

    let i = 0;
    while (i < lines.length) {
      const line = lines[i] ?? "";
      const trimmed = line.trim();

      if (trimmed.startsWith("@tujuan:")) {
        const directive = this.parseTujuan(trimmed, i + 1);
        directives.push(directive);
        if (directive.type === "tujuan" && Array.isArray(directive.target)) {
          explicitTargets = directive.target;
        } else if (directive.type === "tujuan" && typeof directive.target === "string") {
          explicitTargets = [directive.target];
        }
        i++;
        continue;
      }

      if (trimmed.startsWith("@kalo:")) {
        const result = this.parseKaloBlock(lines, i);
        directives.push(result.directive);
        cleanedLines.push(result.body);
        i = result.endLine;
        continue;
      }

      cleanedLines.push(line);
      i++;
    }

    return {
      directives,
      cleanedSource: cleanedLines.join("\n"),
      explicitTargets,
    };
  }

  private parseTujuan(line: string, lineNumber: number): PragmaDirective {
    const value = line.slice("@tujuan:".length).trim();
    let target: string | string[] | undefined;

    if (value.startsWith("[") && value.endsWith("]")) {
      target = value.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
    } else {
      target = value;
    }

    return {
      type: "tujuan",
      target,
      line: lineNumber,
      raw: line,
    };
  }

  private parseKaloBlock(lines: string[], startIndex: number): { directive: PragmaDirective; body: string; endLine: number } {
    const header = lines[startIndex] ?? "";
    const condition = header.slice("@kalo:".length).trim();

    let endIndex = startIndex + 1;
    while (endIndex < lines.length) {
      const trimmed = lines[endIndex]?.trim() ?? "";
      if (trimmed.startsWith("@kalo:") || trimmed.startsWith("@tujuan:")) {
        break;
      }
      if (trimmed === "}" || trimmed === "};") {
        endIndex++;
        break;
      }
      endIndex++;
    }

    const body = lines.slice(startIndex + 1, endIndex).join("\n");

    return {
      directive: {
        type: "kalo",
        condition,
        body,
        line: startIndex + 1,
        raw: header,
      },
      body,
      endLine: endIndex + 1,
    };
  }

  filterByTarget(directives: PragmaDirective[], target: string): string[] {
    return directives
      .filter((d) => d.type === "kalo" && d.condition === target && d.body)
      .map((d) => d.body as string);
  }

  hasTujuanDirective(source: string): boolean {
    return /@tujuan\s*:/i.test(source);
  }
}

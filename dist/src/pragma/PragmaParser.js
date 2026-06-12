"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PragmaParser = void 0;
class PragmaParser {
    parse(source) {
        const lines = source.split(/\r\n|\n|\r/);
        const directives = [];
        let explicitTargets = null;
        const cleanedLines = [];
        let i = 0;
        while (i < lines.length) {
            const line = lines[i] ?? "";
            const trimmed = line.trim();
            if (trimmed.startsWith("@tujuan:")) {
                const directive = this.parseTujuan(trimmed, i + 1);
                directives.push(directive);
                if (directive.type === "tujuan" && Array.isArray(directive.target)) {
                    explicitTargets = directive.target;
                }
                else if (directive.type === "tujuan" && typeof directive.target === "string") {
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
    parseTujuan(line, lineNumber) {
        const value = line.slice("@tujuan:".length).trim();
        let target;
        if (value.startsWith("[") && value.endsWith("]")) {
            target = value.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
        }
        else {
            target = value;
        }
        return {
            type: "tujuan",
            target,
            line: lineNumber,
            raw: line,
        };
    }
    parseKaloBlock(lines, startIndex) {
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
    filterByTarget(directives, target) {
        return directives
            .filter((d) => d.type === "kalo" && d.condition === target && d.body)
            .map((d) => d.body);
    }
    hasTujuanDirective(source) {
        return /@tujuan\s*:/i.test(source);
    }
}
exports.PragmaParser = PragmaParser;
//# sourceMappingURL=PragmaParser.js.map
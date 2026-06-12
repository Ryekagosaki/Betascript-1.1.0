export interface SourceMapEntry {
  generatedLine: number;
  generatedColumn: number;
  sourceLine: number;
  sourceColumn: number;
  source?: string;
}

export class SourceMapGenerator {
  private entries: SourceMapEntry[] = [];
  private sourceContent!: string;
  private sourceName!: string;

  setSource(source: string, name: string) {
    this.sourceContent = source;
    this.sourceName = name;
  }

  addMapping(generatedLine: number, generatedColumn: number, sourceLine: number, sourceColumn: number, source?: string) {
    this.entries.push({
      generatedLine,
      generatedColumn,
      sourceLine,
      sourceColumn,
      source: source ?? this.sourceName,
    });
  }

  toJSON(): string {
    const map: any = {
      version: 3,
      sources: [this.sourceName],
      sourcesContent: [this.sourceContent],
      names: [],
      mappings: this.encodeMappings(),
    };
    return JSON.stringify(map);
  }

  private encodeMappings() {
    if (this.entries.length === 0) return "";
    const lines: string[][] = [];
    let currentLine: string[] = [];
    let lastGenLine = 0;
    let lastGenCol = 0;
    let lastSrcLine = 0;
    let lastSrcCol = 0;

    for (const entry of this.entries) {
      const genLine = entry.generatedLine;
      const genCol = entry.generatedColumn;
      const srcLine = entry.sourceLine;
      const srcCol = entry.sourceColumn;
      const dst = [genLine, genCol, srcLine, srcCol];
      const rels = [genLine - lastGenLine, genCol - lastGenCol, srcLine - lastSrcLine, srcCol - lastSrcCol];
      while (rels.length > 1 && rels[rels.length - 1] === 0) rels.pop();
      const encoded = rels.map(r => this.encodeVLQ(r)).join(",");
      if (genLine > lastGenLine) {
        while (lastGenLine < genLine) {
          lines.push(currentLine);
          currentLine = [];
          lastGenLine++;
        }
      }
      currentLine.push(encoded);
      [lastGenLine, lastGenCol, lastSrcLine, lastSrcCol] = [genLine, genCol, srcLine, srcCol];
    }
    if (currentLine.length > 0 || lines.length === 0) lines.push(currentLine);
    return lines.map(line => line.join(";")).join(";");
  }

  private encodeVLQ(value: number) {
    const signed = value < 0 ? ((-value) << 1) | 1 : value << 1;
    let result = "";
    let vlq = signed;
    do {
      let digit = vlq & 31;
      vlq = Math.floor(vlq / 32);
      if (vlq > 0) digit |= 32;
      result += this.base64Encode(digit);
    } while (vlq > 0);
    return result;
  }

  private base64Encode(value: number) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    return alphabet[value];
  }
}

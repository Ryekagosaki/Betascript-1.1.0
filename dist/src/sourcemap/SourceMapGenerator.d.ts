export interface SourceMapEntry {
    generatedLine: number;
    generatedColumn: number;
    sourceLine: number;
    sourceColumn: number;
    source?: string;
}
export declare class SourceMapGenerator {
    private entries;
    private sourceContent;
    private sourceName;
    setSource(source: string, name: string): void;
    addMapping(generatedLine: number, generatedColumn: number, sourceLine: number, sourceColumn: number, source?: string): void;
    toJSON(): string;
    private encodeMappings;
    private encodeVLQ;
    private base64Encode;
}
//# sourceMappingURL=SourceMapGenerator.d.ts.map
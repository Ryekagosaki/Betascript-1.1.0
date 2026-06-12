export interface BetaErrorOptions {
    filename?: string;
    line?: number;
    column?: number;
    original?: Error;
}
export declare class BetaRuntimeError extends Error {
    readonly filename?: string;
    readonly line?: number;
    readonly column?: number;
    readonly original?: Error;
    constructor(message: string, options?: BetaErrorOptions);
    static unexpectedToken(token: string, options?: BetaErrorOptions): BetaRuntimeError;
    static expected(identifier: string, options?: BetaErrorOptions): BetaRuntimeError;
    static undefinedVariable(name: string, options?: BetaErrorOptions): BetaRuntimeError;
    static syntaxError(message: string, options?: BetaErrorOptions): BetaRuntimeError;
    static runtime(message: string, options?: BetaErrorOptions): BetaRuntimeError;
}
export declare function wrapError(message: string, options?: BetaErrorOptions): BetaRuntimeError;
export declare function withOriginalLine(error: unknown, line: number, column: number, filename?: string): BetaRuntimeError;
export declare const stdlib: {
    dengerin(prompt: string): Promise<string>;
    dengerinSync(prompt: string): string;
    teriak(...args: any[]): void;
    bisik(msg: any): void;
    sebrapa(arr: any[] | string | null | undefined): number;
    ape(val: any): string;
    itungan(val: any): number;
    omongan(val: any): string;
    kumpulin(...items: any[]): any[];
    acak(): number;
    tidur(ms: number): Promise<void>;
    semua<T>(promises: Promise<T>[]): Promise<T[]>;
    balap<T>(promises: Promise<T>[]): Promise<T>;
    peta<K, V>(entries?: Iterable<readonly [K, V]>): Map<K, V>;
    himpunan<T>(values?: Iterable<T>): Set<T>;
    peta_lemah<K extends object, V>(entries?: readonly (readonly [K, V])[] | null): WeakMap<K, V>;
    himpunan_lemah<T extends object>(values?: readonly T[] | null): WeakSet<T>;
};
export declare const http: {
    ambil: (url: string, options?: RequestInit) => Promise<Response>;
    kirim: (url: string, data: unknown, options?: RequestInit) => Promise<Response>;
};
export declare const file: {
    baca: (p: string) => Promise<string>;
    tulis: (p: string, data: string) => Promise<void>;
    ada: (p: string) => boolean;
};
export declare const matematika: {
    pi: number;
    akar: (x: number) => number;
    acak: () => number;
    bulat: (x: number) => number;
    lantai: (x: number) => number;
    atap: (x: number) => number;
    mutlak: (x: number) => number;
    maksimal: (...values: number[]) => number;
    minimal: (...values: number[]) => number;
};
export declare const teks: {
    gede: (v: unknown) => string;
    kecil: (v: unknown) => string;
    pisah: (v: unknown, separator: string | RegExp) => string[];
    ganti: (v: unknown, search: string | RegExp, replace: string) => string;
    cocok: (v: unknown, pattern: RegExp) => RegExpMatchArray;
};
export declare const deret: {
    petakan: <T, U>(v: T[], fn: (item: T, index: number, array: T[]) => U) => U[];
    saring: <T>(v: T[], fn: (item: T, index: number, array: T[]) => boolean) => T[];
    kurangi: <T, U>(v: T[], fn: (previous: U, current: T, index: number, array: T[]) => U, init: U) => U;
    urutin: <T>(v: T[], fn?: (a: T, b: T) => number) => T[];
    gabung: <T>(v: T[], separator?: string) => string;
};
export declare const waktu: {
    sekarang: () => Date;
    format: (v: Date | string | number) => string;
    tahun: (v?: Date | string | number) => number;
    bulan: (v?: Date | string | number) => number;
    tanggal: (v?: Date | string | number) => number;
};
export declare const json: {
    parse: (text: string, reviver?: (this: any, key: string, value: any) => any) => any;
    stringify: {
        (value: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number): string;
        (value: any, replacer?: (number | string)[] | null, space?: string | number): string;
    };
};
export declare const teriak: (...args: any[]) => void;
export declare const bisik: (msg: any) => void;
export declare const dengerin: (prompt: string) => Promise<string>;
export declare const sebrapa: (arr: any[] | string | null | undefined) => number;
export declare const ape: (val: any) => string;
export declare const itungan: (val: any) => number;
export declare const omongan: (val: any) => string;
export declare const kumpulin: (...items: any[]) => any[];
export declare const acak: () => number;
export declare const tidur: (ms: number) => Promise<void>;
export declare const semua: <T>(promises: Promise<T>[]) => Promise<T[]>;
export declare const balap: <T>(promises: Promise<T>[]) => Promise<T>;
export declare const peta: <K, V>(entries?: Iterable<readonly [K, V]>) => Map<K, V>;
export declare const himpunan: <T>(values?: Iterable<T>) => Set<T>;
export declare const peta_lemah: <K extends object, V>(entries?: readonly (readonly [K, V])[] | null) => WeakMap<K, V>;
export declare const himpunan_lemah: <T extends object>(values?: readonly T[] | null) => WeakSet<T>;
export declare const ngomong: (msg: any) => void;
export declare const panjang: (arr: any[] | string | null | undefined) => number;
export declare const tipe: (val: any) => string;
export declare const angka: (val: any) => number;
export declare const kata: (val: any) => string;
export default stdlib;
//# sourceMappingURL=stdlib.d.ts.map
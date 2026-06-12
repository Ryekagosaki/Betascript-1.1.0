export interface BetaConfig {
    tujuan?: string;
    keluaran?: string;
    opsi?: {
        minifikasi?: boolean;
        sumber_peta?: boolean;
        ketat_tipe?: boolean;
    };
}
export declare const DEFAULT_BETA_CONFIG: BetaConfig;
export declare function loadBetaConfig(projectRoot: string): BetaConfig | null;
export declare function saveBetaConfig(projectRoot: string, config: BetaConfig): void;
export declare function hasBetaConfig(projectRoot: string): boolean;
//# sourceMappingURL=ProjectConfig.d.ts.map
import * as fs from "fs";
import * as path from "path";

export interface BetaConfig {
  tujuan?: string;
  keluaran?: string;
  opsi?: {
    minifikasi?: boolean;
    sumber_peta?: boolean;
    ketat_tipe?: boolean;
  };
}

export const DEFAULT_BETA_CONFIG: BetaConfig = {
  keluaran: "./dist",
  opsi: {
    minifikasi: false,
    sumber_peta: false,
    ketat_tipe: false,
  },
};

export function loadBetaConfig(projectRoot: string): BetaConfig | null {
  const configPath = path.join(projectRoot, "beta.config.json");
  if (!fs.existsSync(configPath)) return null;
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    return { ...DEFAULT_BETA_CONFIG, ...JSON.parse(raw) } as BetaConfig;
  } catch {
    return null;
  }
}

export function saveBetaConfig(projectRoot: string, config: BetaConfig): void {
  const configPath = path.join(projectRoot, "beta.config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

export function hasBetaConfig(projectRoot: string): boolean {
  return fs.existsSync(path.join(projectRoot, "beta.config.json"));
}

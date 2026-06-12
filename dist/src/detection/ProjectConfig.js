"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_BETA_CONFIG = void 0;
exports.loadBetaConfig = loadBetaConfig;
exports.saveBetaConfig = saveBetaConfig;
exports.hasBetaConfig = hasBetaConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
exports.DEFAULT_BETA_CONFIG = {
    keluaran: "./dist",
    opsi: {
        minifikasi: false,
        sumber_peta: false,
        ketat_tipe: false,
    },
};
function loadBetaConfig(projectRoot) {
    const configPath = path.join(projectRoot, "beta.config.json");
    if (!fs.existsSync(configPath))
        return null;
    try {
        const raw = fs.readFileSync(configPath, "utf-8");
        return { ...exports.DEFAULT_BETA_CONFIG, ...JSON.parse(raw) };
    }
    catch {
        return null;
    }
}
function saveBetaConfig(projectRoot, config) {
    const configPath = path.join(projectRoot, "beta.config.json");
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}
function hasBetaConfig(projectRoot) {
    return fs.existsSync(path.join(projectRoot, "beta.config.json"));
}
//# sourceMappingURL=ProjectConfig.js.map
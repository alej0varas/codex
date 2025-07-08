import { existsSync, readFileSync } from "fs";
import type { AppConfig, StoredConfig } from "./config";
import {
  CONFIG_FILEPATH,
  CONFIG_YAML_FILEPATH,
  CONFIG_YML_FILEPATH,
  DEFAULT_APPROVAL_MODE,
  DEFAULT_REASONING_EFFORT,
} from "./config";
import { extname } from "path";
import { load as loadYaml } from "js-yaml";

export type EnvInfo = {
  usedConfigPath: string;
  keyValue: string;
  keySource: string;
  displayKey: string;
  /** All config fields with their values and sources */
  configFields: Array<{ key: string; value: string; source: string }>;
};

/**
 * Format EnvInfo into an array of display lines grouped by source.
 */
export function formatEnvInfo(info: EnvInfo): string[] {
  const { usedConfigPath, configFields } = info;
  const lines: string[] = [];
  lines.push("Configuration:");
  // Group fields by source
  const groups: Record<string, Array<{ key: string; value: string }>> = {};
  for (const { key, value, source } of configFields) {
    groups[source] = groups[source] || [];
    groups[source].push({ key, value });
  }
  // Print in order: config file, environment, default
  const order = [`config (${usedConfigPath})`, "environment", "default"];
  for (const source of order) {
    const items = groups[source];
    if (items) {
      lines.push(`  From ${source}:`);
      // Sort alphabetically by key
      items.sort((a, b) => a.key.localeCompare(b.key));
      for (const { key, value } of items) {
        lines.push(`    ${key}: ${value}`);
      }
    }
  }
  lines.push("");
  lines.push(`Config file: ${usedConfigPath}`);
  return lines;
}

export function getEnvInfo(cfg: AppConfig): EnvInfo {
  // Determine which config file (JSON/YAML/YML) is in use
  let usedConfigPath: string;
  if (existsSync(CONFIG_FILEPATH)) {
    usedConfigPath = CONFIG_FILEPATH;
  } else if (existsSync(CONFIG_YAML_FILEPATH)) {
    usedConfigPath = CONFIG_YAML_FILEPATH;
  } else if (existsSync(CONFIG_YML_FILEPATH)) {
    usedConfigPath = CONFIG_YML_FILEPATH;
  } else {
    usedConfigPath = "<not found>";
  }

  // API key info
  let keyValue = "";
  let keySource = "not set";
  if (cfg.apiKey) {
    keyValue = cfg.apiKey;
    keySource = `config (${usedConfigPath})`;
  } else if (process.env.OPENAI_API_KEY) {
    keyValue = process.env.OPENAI_API_KEY;
    keySource = "environment";
  }
  const displayKey = keyValue
    ? keyValue.length > 10
      ? `${keyValue.slice(0, 10)}…${keyValue.slice(-4)}`
      : keyValue
    : "<not set>";

  // Load stored config to detect which values came from file
  let stored: StoredConfig = {};
  if (usedConfigPath !== "<not found>" && existsSync(usedConfigPath)) {
    try {
      const raw = readFileSync(usedConfigPath, "utf-8");
      const ext = extname(usedConfigPath).toLowerCase();
      stored = ext === ".yaml" || ext === ".yml"
        ? (loadYaml(raw) as StoredConfig)
        : (JSON.parse(raw) as StoredConfig);
    } catch {
      stored = {};
    }
  }

  // Build complete list of config keys and sources
  const fields: Array<{ key: string; value: string; source: string }> = [];

  // Helper to push a field
  function push(key: string, value: string, from: string) {
    fields.push({ key, value, source: from });
  }

  // Model
  push(
    "model",
    cfg.model,
    stored.model !== undefined ? `config (${usedConfigPath})` : "default",
  );
  // Provider
  push(
    "provider",
    cfg.provider ?? "",
    stored.provider !== undefined ? `config (${usedConfigPath})` : "default",
  );
  // Approval Mode
  push(
    "approvalMode",
    String(cfg.approvalMode ?? DEFAULT_APPROVAL_MODE),
    stored.approvalMode !== undefined
      ? `config (${usedConfigPath})`
      : "default",
  );
  // Full Auto Error Mode
  push(
    "fullAutoErrorMode",
    String(cfg.fullAutoErrorMode ?? ""),
    stored.fullAutoErrorMode !== undefined
      ? `config (${usedConfigPath})`
      : "default",
  );
  // Memory enabled
  push(
    "memory.enabled",
    String(cfg.memory?.enabled ?? false),
    stored.memory?.enabled !== undefined
      ? `config (${usedConfigPath})`
      : "default",
  );
  // Reasoning Effort
  push(
    "reasoningEffort",
    String(cfg.reasoningEffort ?? DEFAULT_REASONING_EFFORT),
    stored.reasoningEffort !== undefined
      ? `config (${usedConfigPath})`
      : "default",
  );
  // Notify
  push(
    "notify",
    String(cfg.notify ?? false),
    stored.notify !== undefined ? `config (${usedConfigPath})` : "default",
  );
  // Disable Response Storage
  push(
    "disableResponseStorage",
    String(cfg.disableResponseStorage ?? false),
    stored.disableResponseStorage !== undefined
      ? `config (${usedConfigPath})`
      : "default",
  );
  // Flex Mode
  push(
    "flexMode",
    String(cfg.flexMode ?? false),
    stored.flexMode !== undefined ? `config (${usedConfigPath})` : "default",
  );
  // File Opener
  push(
    "fileOpener",
    cfg.fileOpener ?? "",
    stored.fileOpener !== undefined
      ? `config (${usedConfigPath})`
      : "default",
  );

  // Debug
  const debugVal = cfg.debug !== undefined ? cfg.debug : Boolean(process.env.DEBUG);
  const debugSrc = cfg.debug !== undefined
    ? `config (${usedConfigPath})`
    : process.env.DEBUG
      ? "environment"
      : "default";
  push("debug", String(debugVal), debugSrc);
  // API Key
  push("apiKey", displayKey, keySource);

  return {
    usedConfigPath,
    keyValue,
    keySource,
    displayKey,
    configFields: fields,
  };
}
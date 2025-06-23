import fs from "fs";
import type { AppConfig } from "./config";
import { CONFIG_FILEPATH, CONFIG_YAML_FILEPATH, CONFIG_YML_FILEPATH } from "./config";

export type EnvInfo = {
  usedConfigPath: string;
  keyValue: string;
  keySource: string;
  displayKey: string;
  model: string;
  provider: string;
  flexMode: boolean;
  notify: boolean;
  disableResponseStorage: boolean;
};

export function getEnvInfo(cfg: AppConfig): EnvInfo {
  let usedConfigPath: string;
  if (fs.existsSync(CONFIG_FILEPATH)) {
    usedConfigPath = CONFIG_FILEPATH;
  } else if (fs.existsSync(CONFIG_YAML_FILEPATH)) {
    usedConfigPath = CONFIG_YAML_FILEPATH;
  } else if (fs.existsSync(CONFIG_YML_FILEPATH)) {
    usedConfigPath = CONFIG_YML_FILEPATH;
  } else {
    usedConfigPath = "<not found>";
  }

  let keyValue = "";
  let keySource = "not set";
  if (cfg.apiKey) {
    keyValue = cfg.apiKey;
    keySource = `config (${usedConfigPath})`;
  } else if (process.env.OPENAI_API_KEY) {
    keyValue = process.env.OPENAI_API_KEY;
    keySource = "environment (process.env)";
  }

  const displayKey = keyValue
    ? keyValue.length > 10
      ? `${keyValue.slice(0, 10)}…${keyValue.slice(-4)}`
      : keyValue
    : "<not set>";

  return {
    usedConfigPath,
    keyValue,
    keySource,
    displayKey,
    model: cfg.model,
    provider: cfg.provider ?? "<default>",
    flexMode: cfg.flexMode,
    notify: cfg.notify,
    disableResponseStorage: cfg.disableResponseStorage,
  };
}
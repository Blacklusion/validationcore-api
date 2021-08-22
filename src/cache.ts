import { chainsConfig } from "./validationcore-database-scheme/common";
import { DatabaseConnector } from "./datasources/DatabaseConnector";

export const guildCache = [];

export function start() {
  updateGuildCache();

  setInterval(updateGuildCache, 60000);
}

function updateGuildCache() {
  for (const chainId in chainsConfig) {
    if (chainId)
      guildCache[chainId] = new DatabaseConnector().generateGuildList(chainsConfig[chainId].name);
  }
}
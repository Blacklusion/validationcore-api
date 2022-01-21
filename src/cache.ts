import { logger } from "./validationcore-database-scheme/common";
import { DatabaseConnector } from "./datasources/postgres/DatabaseConnector";

export let guildListCache: unknown;

/**
 * Starts the cache
 */
export function start(): void {
  logger.info("Started cache!");

  /**
   * GuildList Cache
   */
  updateGuildListCache().then(() => logger.info("[Cache] Update GuildList"));
  setInterval(updateGuildListCache, 60000);
}

/**
 * Updates the GuildListCache for all chains
 */
async function updateGuildListCache() {
  const databaseConnector = new DatabaseConnector();
      guildListCache = await databaseConnector.generateGuildList();
}

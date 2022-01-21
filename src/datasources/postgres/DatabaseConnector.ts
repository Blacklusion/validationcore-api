import { Validation } from "../../validationcore-database-scheme/entity/Validation";
import { DataSource } from "apollo-datasource";
import { getConnection } from "typeorm";
import * as config from "config";
import { logger } from "../../validationcore-database-scheme/common";
import { Guild } from "../../validationcore-database-scheme/entity/Guild";
import { guildListCache } from "../../cache";
import { JsonRpc } from "eosjs";
import * as fetch from "node-fetch";
import { mapValidationObjectToSchema } from "./entity-types/validation";
import { mapGuildToSchema } from "./entity-types/guild";
import { getLastValidationId } from "./queries/getLastValidationId";
import { getAllWorkingApiEndpoints } from "./queries/getAllEndpoints/onlyWorkingEndpoints/getAllWorkingApiEndpoints";
import { getAllWorkingSeedEndpoints } from "./queries/getAllEndpoints/onlyWorkingEndpoints/getAllWorkingSeedEndpoints";
import { getAllWorkingWalletEndpoints } from "./queries/getAllEndpoints/onlyWorkingEndpoints/getAllWorkingWalletEndpoints";
import { getAllWorkingHistoryEndpoints } from "./queries/getAllEndpoints/onlyWorkingEndpoints/getAllWorkingHistoryEndpoints";
import { getAllWorkingHyperionEndpoints } from "./queries/getAllEndpoints/onlyWorkingEndpoints/getAllWorkingHyperionEndpoints";
import { getAllWorkingAtomicEndpoints } from "./queries/getAllEndpoints/onlyWorkingEndpoints/getAllWorkingAtomicEndpoints";
import { ApolloError } from "apollo-server-errors";
import { getAllSeedEndpoints } from "./queries/getAllEndpoints/allEndpoints/getAllSeedEndpoints";
import { getAllApiEndpoints } from "./queries/getAllEndpoints/allEndpoints/getAllApiEndpoints";
import { getAllWalletEndpoints } from "./queries/getAllEndpoints/allEndpoints/getAllWalletEndpoints";
import { getAllHistoryEndpoints } from "./queries/getAllEndpoints/allEndpoints/getAllHistoryEndpoints";
import { getAllHyperionEndpoints } from "./queries/getAllEndpoints/allEndpoints/getAllHyperionEndpoints";
import { getAllAtomicEndpoints } from "./queries/getAllEndpoints/allEndpoints/getAllAtomicEndpoints";
import { getChainsConfigItemWrapper } from "./helper-functions";

export const timeOffset = 3000;

/**
 * Handles the connection to the postgres Database filled by the Validationcore
 * Custom DataSource implementation via TypeORM is used instead of off the shelve SQL Connectors, to streamline
 * The Development across the Validationcore project
 */
export class DatabaseConnector extends DataSource {
  /**
   * Constructor
   */
  constructor() {
    super();
  }

  /**
   * Returns the validation of a guild formatted as a Validation object as described in GraphQl Schema
   * @param {string} id
   * @return {Promise<unknown>}
   */
  async getValidationById(id: string): Promise<unknown> {
    const database = getConnection();
    const validation = await database.manager.findOne(Validation, {
      where: {
        id: id,
      },
    });

    if (!validation) return null;
    return await mapValidationObjectToSchema(validation);
  }

  /**
   * Returns the last validation of a guild formatted as a Validation object as described in GraphQl Schema
   * @param {string} guildName
   * @return {Promise<unknown>}
   */
  async getValidationByGuild(guildName: string): Promise<unknown> {
    return await this.getValidationById(await getLastValidationId(guildName))
  }

  /**
   * Returns the List of Guilds, by first checking if it is already Cached otherwise a List will first be generated and then returned
   * @return {Promise<unknown>}
   */
  async getGuilds(): Promise<unknown> {
    if (guildListCache) return guildListCache;

    return this.generateGuildList();
  }

  /**
   * Returns the list of Guilds
   * Called by Cache or when Request is handled and Cache is empty
   * @return {Promise<unknown>}
   */
  async generateGuildList(): Promise<unknown> {
    const database = getConnection();
    const guilds = await database.manager.find(Guild);

    if (!guilds) return null;

    // Prepare NodeApi Access
    const rpc = new JsonRpc(getChainsConfigItemWrapper( "api_endpoint"), {
      fetch,
    });

    const guildRanks = {};
    try {
      // Get producers from NodeApi
      let results = await rpc.get_producers(true, "", config.get("validation.producer_limit"));
      results = { ...results.rows };

      const guilds = [];
      for (const i in results) {
        if (i) {
        const producer = results[i];
        guilds.push([producer.owner, Number(producer.total_votes)]);
        }
      }

      guilds.sort((x, y) => y[1] - x[1]);

      for (let i = 0; i < guilds.length; i++) {
        guildRanks[guilds[i][0]] = i + 1;
      }
    } catch (e) {
      logger.error("Error during calculating guild rank: ", e);
    }

    const guildObjects = [];

    guilds.forEach((x) => {
      if (x.name && guildRanks[x.name]) guildObjects.push(mapGuildToSchema(x, guildRanks[x.name]));
      else guildObjects.push(mapGuildToSchema(x, null));
    });
    return guildObjects;
  }

  /**
   * Returns a list of endpoints
   * @param {string} nodeType = node category in nodeSeed, nodeApi etc. format
   * @param {number} timeOffsetInMs = all validations from time.now() - timeOffset will be taken into consideration
   *                                  -> The larger timeOffset the longer the node has to work
   * @param {string} queryMethod = method used to create list
   * @param {boolean} getOnlyWorking = if true, only working endpoints will be returned in the list
   * @return {Promise<unknown>}
   */
  async getEndpoints(nodeType: string, timeOffsetInMs = 3600000, queryMethod: string, getOnlyWorking = true): Promise<unknown> {
    switch (nodeType) {
      case "NODE_SEED":
        if (getOnlyWorking)
          return getAllWorkingSeedEndpoints(timeOffsetInMs);
        else
          return getAllSeedEndpoints(timeOffsetInMs)
      case "NODE_API":
        if (getOnlyWorking)
          return getAllWorkingApiEndpoints(timeOffsetInMs);
        else
          return getAllApiEndpoints(timeOffsetInMs);
      case "NODE_WALLET":
        if (getOnlyWorking)
          return getAllWorkingWalletEndpoints(timeOffsetInMs);
        else
          return getAllWalletEndpoints(timeOffsetInMs)
      case "NODE_HISTORY":
        if (getOnlyWorking)
          return getAllWorkingHistoryEndpoints(timeOffsetInMs);
        else
          return getAllHistoryEndpoints(timeOffsetInMs)
      case "NODE_HYPERION":
        if (getOnlyWorking)
          return getAllWorkingHyperionEndpoints(timeOffsetInMs);
        else
          return getAllHyperionEndpoints(timeOffsetInMs)
      case "NODE_ATOMIC":
        if (getOnlyWorking)
          return getAllWorkingAtomicEndpoints(timeOffsetInMs);
        else
          return getAllAtomicEndpoints(timeOffsetInMs)
      default:
        throw new ApolloError("nodeType invalid")
    }
  }
}

import { Guild } from "../../../validationcore-database-scheme/entity/Guild";
import { getLastValidationId } from "../queries/getLastValidationId";
import { DatabaseConnector } from "../DatabaseConnector";

/**
 * Maps an Guild Array returned by the Database to the Schema used by the GraphQl Api
 * @param {Guild} guild = Guild Object as returned by Database
 * @param {number} rank = rank of guild on chain
 * @return {Promise<unknown>}
 */
export async function mapGuildToSchema(guild: Guild, rank: number): Promise<unknown> {
  const databaseConnector = new DatabaseConnector();
  const lastValidationId = await getLastValidationId(guild.name);
  return {
    name: guild.name,
    tracked_since: guild.tracked_since,
    location: guild.location,
    location_alpha: guild.locationAlpha,
    rank: rank,
    url: guild.url,
    url_logo_256: guild.url_logo_256,
    last_validation_id: lastValidationId,
    last_validation: await databaseConnector.getValidationById(lastValidationId)
  };
}

import { getManager } from "typeorm";

/**
 * Returns the id of the latest Validation for a guild
 * @param {string} guildName
 */
export async function getLastValidationId(guildName: string): Promise<string | undefined> {
  const entityManager = getManager();
  const query = await entityManager.query(`
      SELECT id
      FROM validation
               JOIN (SELECT guild, max(validation_date) maxDate
                     FROM validation
                     WHERE guild = $1
                     GROUP BY guild) as b
                    ON validation.validation_date = b.maxDate AND validation.guild = b.guild
  `, [guildName]);

  return Array.isArray(query) && query.length === 1 ? query[0].id : undefined;
}
import { getManager } from "typeorm";

/**
 * Returns all ids of the validations of a single guild
 * @param {string} guildName
 * @return {Promise<unknown>}
 */
export async function getAllValidationIdsOfGuild(guildName: string): Promise<unknown> {
  const param = [guildName];

  const entityManager = getManager();
  return await entityManager.query(
    `
        select id, validation_date
        from validation
        where guild=$1
        `,
    param
  );
}
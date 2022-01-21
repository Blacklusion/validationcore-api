import { getManager } from "typeorm";

/**
 * Returns all working NodeSeed endpoints
 * @param {number} timeOffsetInMs
 * @return {Promise<unknown>}
 */
export async function getAllWorkingSeedEndpoints(timeOffsetInMs: number): Promise<unknown> {
  const param = [new Date(Date.now() - timeOffsetInMs).toUTCString()];

  const entityManager = getManager();
  return await entityManager.query(
    `select distinct guild, endpoint_url, location_longitude, location_latitude, all_checks_ok 
                from node_seed
                where all_checks_ok = '4' and validation_date >= $1`, param);
}
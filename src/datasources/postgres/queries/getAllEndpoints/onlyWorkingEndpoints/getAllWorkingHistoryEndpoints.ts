import { getManager } from "typeorm";

/**
 * Returns all working NodeHistory endpoints
 * @param {number} timeOffsetInMs
 * @return {Promise<unknown>}
 */
export async function getAllWorkingHistoryEndpoints(timeOffsetInMs: number): Promise<unknown> {
  const param = [new Date(Date.now() - timeOffsetInMs).toUTCString()];

  const entityManager = getManager();
  return await entityManager.query(
    `select distinct guild, endpoint_url, location_longitude, location_latitude, is_ssl, all_checks_ok
from node_history
where all_checks_ok = '4' and validation_date >= $1 and endpoint_url not in (
    select endpoint_url
    from node_history
    where validation_date >= $1
      and all_checks_ok < '4'
)`, param);
}
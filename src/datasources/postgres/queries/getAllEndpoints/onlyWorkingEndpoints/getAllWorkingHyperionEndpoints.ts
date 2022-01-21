import { getManager } from "typeorm";

/**
 * Returns all working NodeHyperion endpoints
 * @param {number} timeOffsetInMs
 * @return {Promise<unknown>}
 */
export async function getAllWorkingHyperionEndpoints(timeOffsetInMs: number): Promise<unknown> {
  const param = [new Date(Date.now() - timeOffsetInMs).toUTCString()];

  const entityManager = getManager();
  return await entityManager.query(
    `select distinct guild, endpoint_url, location_longitude, location_latitude, is_ssl, server_version, all_checks_ok
from node_hyperion
where all_checks_ok = '4' and validation_date >= $1 and endpoint_url not in (
    select endpoint_url
    from node_hyperion
    where validation_date >= $1
      and all_checks_ok < '4'
)`, param);
}
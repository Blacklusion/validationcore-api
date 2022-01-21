import { getManager } from "typeorm";

/**
 * Returns all working NodeSeed endpoints
 * @param {number} timeOffsetInMs
 */
export async function getAllSeedEndpoints(timeOffsetInMs: number) {
  const param = [new Date(Date.now() - timeOffsetInMs).toUTCString()];

  const entityManager = getManager();
  const query = await entityManager.query(
    `select guild, endpoint_url, location_longitude, location_latitude, MAX(all_checks_ok) as all_checks_ok
     from node_seed
where validation_date >= $1
group by endpoint_url, guild, location_longitude, location_latitude
order by guild asc`, param);

  return query;
}
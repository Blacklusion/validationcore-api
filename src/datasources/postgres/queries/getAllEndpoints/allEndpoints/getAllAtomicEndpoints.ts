import { getManager } from "typeorm";

/**
 * Returns all working NodeAtomic endpoints
 * @param {number} timeOffsetInMs
 */
export async function getAllAtomicEndpoints(timeOffsetInMs: number) {

  const param = [new Date(Date.now() - timeOffsetInMs).toUTCString()];

  const entityManager = getManager();
  const query = await entityManager.query(
    `select guild, endpoint_url, location_longitude, location_latitude, is_ssl, MIN(all_checks_ok) as all_checks_ok, string_agg(distinct server_version, ', ') as server_version
     from node_atomic
where validation_date >= $1
group by endpoint_url, guild, is_ssl, location_longitude, location_latitude
order by guild asc, is_ssl desc`, param);

  return query;
}
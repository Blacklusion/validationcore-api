import { getManager } from "typeorm";

/**
 * Returns the AvailabilityPercentage for NodeHistory nodes
 * @param {string} guildName
 * @param {string} endpointUrl
 * @return {Promise<unknown>}
 */
export async function getAvailabilityNodeHistory(guildName: string, endpointUrl: string): Promise<unknown> {
  const param = [guildName, endpointUrl];

  const entityManager = getManager();
  return await entityManager.query(
    `
            with successCount(validation_date, count) as (
                select date(validation_date), count(all_checks_ok)
                from node_history
                where guild = $1 and endpoint_url = $2
                and all_checks_ok='4'
                group by date(validation_date)),

            totalCount(validation_date, count) as (
                select date(validation_date), count(all_checks_ok)
                from node_history
                where guild = $1 and endpoint_url = $2
                group by date(validation_date))

            select totalCount.validation_date as date, (coalesce(successCount.count, 0) * 100 / coalesce(totalCount.count, 1)) as availability
                from successCount
                full outer join totalCount
                on successCount.validation_date = totalCount.validation_date
                order by date asc;
        `,
    param
  );
}
import { JsonRpc } from "eosjs";
import * as fetch from "node-fetch";
import { getChainsConfigItem, readConfig } from "./validationcore-database-scheme/common";
import * as config from "config";

/**
 *
 */
export async function test() {

  await readConfig()

// Prepare NodeApi Access
  const rpc = new JsonRpc(getChainsConfigItem("1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4", "api_endpoint"), {
    fetch,
  });

  try {
    // Get producers from NodeApi
    let results = await rpc.get_producers(true, "", config.get("validation.producer_limit"));
    results = { ...results.rows };

    /*
    results.sort((x,y) => {
        return (Number.parseInt(x.total_votes) - Number.parseInt(y.total_votes))
      }
    )
     */

    const guilds = [];
    for (const i in results) {
      const producer = results[i];
      console.log(results[i])
        guilds.push([producer.owner, Number(producer.total_votes)]);
    }

    guilds.sort((x,y) =>  y[1] - x[1]);

    const guildRanks = {};
    for (let i = 0; i < guilds.length; i++) {
      guildRanks[guilds[i][0]] = i + 1;
    }

    console.log(guildRanks)
  } catch (e) {
    console.log(e)
  }
}
test();
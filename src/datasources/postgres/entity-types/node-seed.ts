import { NodeSeed } from "../../../validationcore-database-scheme/entity/NodeSeed";
import { getConnection, MoreThan } from "typeorm";
import {
  compareToPreviousValidationLevels,
  createValidationObject,
  getChainsConfigItemWrapper
} from "../helper-functions";
import { timeOffset } from "../DatabaseConnector";
import * as config from "config";
import { getAvailabilityNodeSeed } from "../queries/availability/getAvailabilityNodeSeed";

/**
 * Maps an NodeSeed Array returned by the Database to the Schema used by the GraphQl Api
 * @param {NodeSeed[]} validations = array of NodeSeed Objects returned by database
 * @return {Promise<unknown>}
 */
export async function mapMultipleNodeSeedToSchema(validations: NodeSeed[]): Promise<unknown> {
  return {
    node_type: "NodeSeed",
    nodes: validations.map(async (x) => await mapNodeSeedToSchema(x))
  }
}

/**
 * Maps the NodeSeed Object returned by the Database to the NodeSeed Schema used by the GraphQl Api
 * @param {NodeSeed} validation = single NodeSeed Object returned by database
 * @return {Promise<unknown>}
 */
export async function mapNodeSeedToSchema(validation: NodeSeed): Promise<unknown> {
  const database = getConnection();
  const previousValidations = await database.manager.find(NodeSeed, {
    where: {
      guild: validation.guild,
      endpoint_url: validation.endpoint_url,
      validation_date: MoreThan(new Date(validation.validation_date.valueOf() - timeOffset)),
    },
  });

  const validations = [];

  if (getChainsConfigItemWrapper("nodeSeed_location")) {
    validations.push(
      createValidationObject(
        "location_ok",
        validation.location_ok,
        previousValidations.map((x) => x.location_ok),
        "general",
        "Provided location in bp.json is",
        "valid",
        "invalid"
      )
    );
  }

  if (getChainsConfigItemWrapper("nodeSeed_endpoint_url_ok")) {
    validations.push(
      createValidationObject(
        "endpoint_url_ok",
        validation.endpoint_url_ok,
        previousValidations.map((x) => x.endpoint_url_ok),
        "general",
        "Provided P2P address is",
        "valid",
        "invalid"
      )
    );
  }

  if (getChainsConfigItemWrapper("nodeSeed_p2p_connection_possible")) {
    validations.push(
      createValidationObject(
        "p2p_connection_possible",
        validation.p2p_connection_possible,
        previousValidations.map((x) => x.p2p_connection_possible),
        "validation",
        "P2P connection was",
        "possible",
        "not possible",
        validation.p2p_connection_possible_message
      )
    );
  }

  if (getChainsConfigItemWrapper("nodeSeed_block_transmission_speed_ok")) {
    validations.push(
      createValidationObject(
        "block_transmission_speed",
        validation.block_transmission_speed_ok,
        previousValidations.map((x) => x.block_transmission_speed_ok),
        "validation",
        "Block transmission speed is",
        "OK (" + validation.block_transmission_speed_ms + "blocks / s)",
        "too slow (" + validation.block_transmission_speed_ms + "blocks / s)",
        "The tolerated limit is " + config.get("validation.seed_ok_speed") + "blocks / s"
      )
    );
  }

  return {
    node_type: "NodeSeed",

    id: validation.id,
    guild: validation.guild,
    validation_date: validation.validation_date,
    endpoint_url: validation.endpoint_url,
    server_version: null,
    is_ssl: null,
    location_longitude: validation.location_longitude,
    location_latitude: validation.location_latitude,

    all_checks_ok: compareToPreviousValidationLevels(
      validation.all_checks_ok,
      previousValidations.map((x) => x.all_checks_ok)
    ),

    validations: validations,

    statistics: {
      availability: await getAvailabilityNodeSeed(validation.guild, validation.endpoint_url)
    }
  };
}

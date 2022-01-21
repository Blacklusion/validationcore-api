import { NodeWallet } from "../../../validationcore-database-scheme/entity/NodeWallet";
import { getConnection, MoreThan } from "typeorm";
import { timeOffset } from "../DatabaseConnector";
import {
  compareToPreviousValidationLevels,
  createRequestObjectFromConfig,
  createValidationObject,
  createHttpErrorMessage, getChainsConfigItemWrapper
} from "../helper-functions";
import { getAvailabilityNodeWallet } from "../queries/availability/getAvailabilityNodeWallet";

/**
 * Maps an NodeWallet Array returned by the Database to the Schema used by the GraphQl Api
 * @param {NodeWallet} validations = array of NodeWallet Objects returned by database
 * @return {Promise<unknown>}
 */
export async function mapMultipleNodeWalletToSchema(validations: NodeWallet[]): Promise<unknown> {
  return {
    node_type: "NodeWallet",
    nodes: validations.map(async (x) => await mapNodeWalletToSchema(x))
}
}
/**
 * Maps the NodeWallet Object returned by the Database to the Schema used by the GraphQl Api
 * @param {NodeWallet} validation = single NodeWallet Object returned by database
 * @return {Promise<unknown>}
 */
export async function mapNodeWalletToSchema(validation: NodeWallet): Promise<unknown> {
  const database = getConnection();
  const previousValidations = await database.manager.find(NodeWallet, {
    where: {
      guild: validation.guild,
      endpoint_url: validation.endpoint_url,
      validation_date: MoreThan(new Date(validation.validation_date.valueOf() - timeOffset)),
    },
  });

  const validations = [];

  if (getChainsConfigItemWrapper( "nodeWallet_location")) {
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

  if (getChainsConfigItemWrapper( "nodeWallet_endpoint_url_ok")) {
    validations.push(
      createValidationObject(
        "endpoint_url_ok",
        validation.endpoint_url_ok,
        previousValidations.map((x) => x.endpoint_url_ok),
        "general",
        "Provided endpoint url is",
        "valid",
        "invalid"
      )
    );
  }

    if (validation.is_ssl && getChainsConfigItemWrapper( "nodeWallet_ssl")) {
    validations.push(
      createValidationObject(
        "ssl_ok",
        validation.ssl_ok,
        previousValidations.map((x) => x.ssl_ok),
        "general",
        "TLS test",
        "passed",
        "not passed",
        createHttpErrorMessage(validation.ssl_errortype)
      )
    );
  }

  if (getChainsConfigItemWrapper("nodeWallet_accounts")) {
    validations.push(
      createRequestObjectFromConfig(
        "get_accounts",
        validation.accounts_ok,
        previousValidations.map((x) => x.accounts_ok),
        "validation",
        "get_accounts by name test",
        "passed",
        "not passed",
        "nodeWallet_accounts",
        validation.endpoint_url,
        validation.accounts_ms,
        validation.accounts_httpcode,
        validation.accounts_errortype
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeWallet_keys")) {
    validations.push(
      createRequestObjectFromConfig(
        "get_accounts_by_key",
        validation.keys_ok,
        previousValidations.map((x) => x.keys_ok),
        "validation",
        "get_accounts by key test",
        "passed",
        "not passed",
        "nodeWallet_keys",
        validation.endpoint_url,
        validation.keys_ms,
        validation.keys_httpcode,
        validation.keys_errortype
      )
    );
  }

  return {
    node_type: "NodeWallet",

    id: validation.id,
    guild: validation.guild,
    validation_date: validation.validation_date,
    endpoint_url: validation.endpoint_url,
    is_ssl: validation.is_ssl,
    location_longitude: validation.location_longitude,
    location_latitude: validation.location_latitude,
    server_version: null,

    all_checks_ok: compareToPreviousValidationLevels(
      validation.all_checks_ok,
      previousValidations.map((x) => x.all_checks_ok)
    ),

    validations: validations,

    statistics: {
      availability: await getAvailabilityNodeWallet(validation.guild, validation.endpoint_url)
    }
  };
}

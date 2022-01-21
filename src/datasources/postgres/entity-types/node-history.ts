import { NodeHistory } from "../../../validationcore-database-scheme/entity/NodeHistory";
import { getConnection, MoreThan } from "typeorm";
import { timeOffset } from "../DatabaseConnector";
import {
  compareToPreviousValidationLevels,
  createRequestObjectFromConfig,
  createValidationObject,
  createHttpErrorMessage, getChainsConfigItemWrapper
} from "../helper-functions";
import { getAvailabilityNodeHistory } from "../queries/availability/getAvailabilityNodeHistory";


/**
 * Maps an NodeHistory Array returned by the Database to the Schema used by the GraphQl Api
 * @param {NodeHistory[]} validations = array of NodeHistory Objects returned by database
 * @return {Promise<unknown>}
 */
export async function mapMultipleNodeHistoryToSchema(validations: NodeHistory[]): Promise<unknown> {
  return {
    node_type: "NodeHistory",
    nodes: validations.map(async (x) => await mapNodeHistoryToSchema(x))
  }
}

/**
 * Maps the NodeHistory Object returned by the Database to the Schema used by the GraphQl Api
 * @param {NodeHistory} validation = single NodeHistory Object returned by database
 * @return {Promise<unknown>}
 */
export async function mapNodeHistoryToSchema(validation: NodeHistory): Promise<unknown> {
  const database = getConnection();
  const previousValidations = await database.manager.find(NodeHistory, {
    where: {
      guild: validation.guild,
      endpoint_url: validation.endpoint_url,
      validation_date: MoreThan(new Date(validation.validation_date.valueOf() - timeOffset)),
    },
  });

  const validations = [];

  if (getChainsConfigItemWrapper("nodeHistory_location")) {
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

  if (getChainsConfigItemWrapper("nodeHistory_endpoint_url_ok")) {
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

  if (validation.is_ssl && getChainsConfigItemWrapper("nodeHistory_ssl")) {
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

  if (getChainsConfigItemWrapper("nodeHistory_get_transaction")) {
    validations.push(
      createRequestObjectFromConfig(
        "get_transaction",
        validation.get_transaction_ok,
        previousValidations.map((x) => x.get_transaction_ok),
        "validation",
        "get_transaction test",
        "passed",
        "not passed",
        "nodeHistory_get_transaction",
        validation.endpoint_url,
        validation.get_transaction_ms,
        validation.get_transaction_httpcode,
        validation.get_transaction_errortype
      )
    );
  }

  if (getChainsConfigItemWrapper("nodeHistory_get_actions")) {
    validations.push(
      createRequestObjectFromConfig(
        "get_actions",
        validation.get_actions_ok,
        previousValidations.map((x) => x.get_actions_ok),
        "validation",
        "get_actions test",
        "passed",
        "not passed",
        "nodeHistory_get_actions",
        validation.endpoint_url,
        validation.get_actions_ms,
        validation.get_actions_httpcode,
        validation.get_actions_errortype,
        validation.get_actions_message
      )
    );
  }

  if (getChainsConfigItemWrapper("nodeHistory_get_key_accounts")) {
    validations.push(
      createRequestObjectFromConfig(
        "get_key_accounts",
        validation.get_key_accounts_ok,
        previousValidations.map((x) => x.get_key_accounts_ok),
        "validation",
        "get_key_accounts test",
        "passed",
        "not passed",
        "nodeHistory_get_key_accounts",
        validation.endpoint_url,
        validation.get_key_accounts_ms,
        validation.get_key_accounts_httpcode,
        validation.get_key_accounts_errortype
      )
    );
  }

  if (getChainsConfigItemWrapper("nodeHistory_get_controlled_accounts")) {
    validations.push(
      createRequestObjectFromConfig(
        "get_controlled_accounts",
        validation.get_controlled_accounts_ok,
        previousValidations.map((x) => x.get_controlled_accounts_ok),
        "validation",
        "get_controlled_accounts test",
        "passed",
        "not passed",
        "nodeHistory_get_controlled_accounts",
        validation.endpoint_url,
        validation.get_controlled_accounts_ms,
        validation.get_controlled_accounts_httpcode,
        validation.get_controlled_accounts_errortype
      )
    );
  }

  return {
    node_type: "NodeHistory",

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
      availability: await getAvailabilityNodeHistory(validation.guild, validation.endpoint_url)
    }
  };
}

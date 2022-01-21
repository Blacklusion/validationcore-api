import { NodeHyperion } from "../../../validationcore-database-scheme/entity/NodeHyperion";
import { getConnection, MoreThan } from "typeorm";
import { timeOffset } from "../DatabaseConnector";
import {
  compareToPreviousValidationLevels,
  createHttpErrorMessage,
  createRequestObjectFromConfig,
  createValidationObject, getChainsConfigItemWrapper
} from "../helper-functions";
import * as config from "config";
import { ValidationLevel } from "../../../validationcore-database-scheme/enum/ValidationLevel";
import { getAvailabilityNodeHyperion } from "../queries/availability/getAvailabilityNodeHyperion";


/**
 * Maps an NodeHyperion Array returned by the Database to the Schema used by the GraphQl Api
 * @param {NodeHyperion[]} validations = array of NodeHyperion Objects returned by database
 * @return {Promise<unknown>}
 */
export async function mapMultipleNodeHyperionToSchema(validations: NodeHyperion[]): Promise<unknown> {
  return {
    node_type: "NodeHyperion",
    nodes: validations.map(async (x) => await mapNodeHyperionToSchema(x))
  }
}

/**
 * Maps the NodeHyperion Object returned by the Database to the Schema used by the GraphQl Api
 * @param {NodeHyperion} validation = single NodeHyperion Object returned by database
 * @return {Promise<unknown>}
 */
export async function mapNodeHyperionToSchema(validation: NodeHyperion): Promise<unknown> {
  const database = getConnection();
  const previousValidations = await database.manager.find(NodeHyperion, {
    where: {
      guild: validation.guild,
      endpoint_url: validation.endpoint_url,
      validation_date: MoreThan(new Date(validation.validation_date.valueOf() - timeOffset)),
    },
  });

  const validations = [];

  if (getChainsConfigItemWrapper("nodeHyperion_location")) {
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

  if (getChainsConfigItemWrapper("nodeHyperion_endpoint_url_ok")) {
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

    if (validation.is_ssl && getChainsConfigItemWrapper("nodeHyperion_ssl")) {
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

  if (getChainsConfigItemWrapper("nodeHyperion_health")) {
    validations.push(
      createRequestObjectFromConfig(
        "health",
        validation.health_found,
        previousValidations.map((x) => x.health_found),
        "health",
        "Hyperion Health",
        "was found",
        "was not found",
        "nodeHyperion_health",
        validation.endpoint_url,
        validation.health_ms,
        validation.health_httpcode,
        validation.health_errortype
      )
    );
  }

  if (getChainsConfigItemWrapper("nodeHyperion_health_version")) {
    validations.push(
      createValidationObject(
        "health_version",
        validation.health_version_ok,
        previousValidations.map((x) => x.health_version_ok),
        "health",
        "Hyperion version",
        "is valid",
        "is invalid",
        (validation.health_found < ValidationLevel.SUCCESS ? "Could not be read from api" : undefined)
      )
    );
  }

  if (getChainsConfigItemWrapper("nodeHyperion_health_host")) {
    validations.push(
      createValidationObject(
        "health_host",
        validation.health_host_ok,
        previousValidations.map((x) => x.health_host_ok),
        "health",
        "Hyperion Host",
        "was provided",
        "was not provided",
        (validation.health_found < ValidationLevel.SUCCESS ? "Could not be read from api" : undefined)
      )
    );
  }

  if (getChainsConfigItemWrapper("nodeHyperion_health_query_time")) {
    validations.push(
      createValidationObject(
        "health_query_time",
        validation.health_query_time_ok,
        previousValidations.map((x) => x.health_query_time_ok),
        "health",
        "Hyperion query time",
        "is OK",
        "is not OK",
        validation.health_query_time_ms === null
          ? "Was not provided"
          : "Query time is too high (" +
          validation.health_query_time_ms +
          "ms > " +
          config.get("validation.hyperion_query_time_ms") +
          "ms)"
      )
    );
  }

  if (getChainsConfigItemWrapper("nodeHyperion_health_features_tables_proposals") && validation.health_features_tables_proposals !== ValidationLevel.SUCCESS) {
    validations.push(
      createValidationObject(
        "health_features_tables_proposals",
        validation.health_features_tables_proposals,
        previousValidations.map((x) => x.health_features_tables_proposals),
        "health",
        "Hyperion feature tables/proposals",
        "is " + getChainsConfigItemWrapper( "nodeHyperion_health_features_tables_proposals") ? "enabled" : "disabled",
        (validation.health_found < ValidationLevel.SUCCESS ? "status could not be read from api" : ("is " + getChainsConfigItemWrapper("nodeHyperion_health_features_tables_proposals") ? "disabled" : "enabled"))
      )
    );
  }

  if (getChainsConfigItemWrapper("nodeHyperion_health_features_tables_accounts") && validation.health_features_tables_accounts !== ValidationLevel.SUCCESS) {
    validations.push(
      createValidationObject(
        "health_features_tables_accounts",
        validation.health_features_tables_accounts,
        previousValidations.map((x) => x.health_features_tables_accounts),
        "health",
        "Hyperion feature tables/accounts",
        "is " + getChainsConfigItemWrapper("nodeHyperion_health_features_tables_accounts") ? "enabled" : "disabled",
        (validation.health_found < ValidationLevel.SUCCESS ? "status could not be read from api" : ("is " + getChainsConfigItemWrapper( "nodeHyperion_health_features_tables_accounts") ? "disabled" : "enabled"))
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeHyperion_health_features_tables_voters") && validation.health_features_tables_voters !== ValidationLevel.SUCCESS) {
    validations.push(
      createValidationObject(
        "health_features_tables_voters",
        validation.health_features_tables_voters,
        previousValidations.map((x) => x.health_features_tables_voters),
        "health",
        "Hyperion feature tables/voters",
        "is " + getChainsConfigItemWrapper( "nodeHyperion_health_features_tables_voters") ? "enabled" : "disabled",
        (validation.health_found < ValidationLevel.SUCCESS ? "status could not be read from api" : ("is " + getChainsConfigItemWrapper( "nodeHyperion_health_features_tables_voters") ? "disabled" : "enabled"))
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeHyperion_health_features_index_deltas") && validation.health_features_index_deltas !== ValidationLevel.SUCCESS) {
    validations.push(
      createValidationObject(
        "health_features_index_deltas",
        validation.health_features_index_deltas,
        previousValidations.map((x) => x.health_features_index_deltas),
        "health",
        "Hyperion feature index_deltas",
        "is " + getChainsConfigItemWrapper( "nodeHyperion_health_features_index_deltas") ? "enabled" : "disabled",
        (validation.health_found < ValidationLevel.SUCCESS ? "status could not be read from api" : ("is " + getChainsConfigItemWrapper( "nodeHyperion_health_features_index_deltas") ? "disabled" : "enabled"))
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeHyperion_health_features_index_transfer_memo") && validation.health_features_index_transfer_memo !== ValidationLevel.SUCCESS) {
    validations.push(
      createValidationObject(
        "health_features_index_transfer_memo",
        validation.health_features_index_transfer_memo,
        previousValidations.map((x) => x.health_features_index_transfer_memo),
        "health",
        "Hyperion feature index_transfer_memo",
        "is " + getChainsConfigItemWrapper( "nodeHyperion_health_features_index_transfer_memo") ? "enabled" : "disabled",
        (validation.health_found < ValidationLevel.SUCCESS ? "status could not be read from api" : ("is " + getChainsConfigItemWrapper( "nodeHyperion_health_features_index_transfer_memo") ? "disabled" : "enabled"))
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeHyperion_health_features_index_all_deltas") && validation.health_features_index_all_deltas !== ValidationLevel.SUCCESS) {
    validations.push(
      createValidationObject(
        "health_features_index_all_deltas",
        validation.health_features_index_all_deltas,
        previousValidations.map((x) => x.health_features_index_all_deltas),
        "health",
        "Hyperion feature index_all_deltas",
        "is " + getChainsConfigItemWrapper( "nodeHyperion_health_features_index_all_deltas") ? "enabled" : "disabled",
        (validation.health_found < ValidationLevel.SUCCESS ? "status could not be read from api" : ("is " + getChainsConfigItemWrapper( "nodeHyperion_health_features_index_all_deltas") ? "disabled" : "enabled"))
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeHyperion_health_features_deferred_trx") && validation.health_features_deferred_trx !== ValidationLevel.SUCCESS) {
    validations.push(
      createValidationObject(
        "health_features_deferred_trx",
        validation.health_features_deferred_trx,
        previousValidations.map((x) => x.health_features_deferred_trx),
        "health",
        "Hyperion feature deferred_trx",
        "is " + getChainsConfigItemWrapper( "nodeHyperion_health_features_deferred_trx") ? "enabled" : "disabled",
        (validation.health_found < ValidationLevel.SUCCESS ? "status could not be read from api" : ("is " + getChainsConfigItemWrapper("nodeHyperion_health_features_deferred_trx") ? "disabled" : "enabled"))
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeHyperion_health_features_failed_trx") && validation.health_features_failed_trx !== ValidationLevel.SUCCESS) {
    validations.push(
      createValidationObject(
        "health_features_failed_trx",
        validation.health_features_failed_trx,
        previousValidations.map((x) => x.health_features_failed_trx),
        "health",
        "Hyperion feature failed_trx",
        "is " + getChainsConfigItemWrapper( "nodeHyperion_health_features_failed_trx") ? "enabled" : "disabled",
        (validation.health_found < ValidationLevel.SUCCESS ? "status could not be read from api" : ("is " + getChainsConfigItemWrapper( "nodeHyperion_health_features_failed_trx") ? "disabled" : "enabled"))
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeHyperion_health_features_resource_limits") && validation.health_features_resource_limits !== ValidationLevel.SUCCESS)  {
    validations.push(
      createValidationObject(
        "health_features_resource_limits",
        validation.health_features_resource_limits,
        previousValidations.map((x) => x.health_features_resource_limits),
        "health",
        "Hyperion feature resource_limits",
        "is " + getChainsConfigItemWrapper( "nodeHyperion_health_features_resource_limits") ? "enabled" : "disabled",
        (validation.health_found < ValidationLevel.SUCCESS ? "status could not be read from api" : ("is " + getChainsConfigItemWrapper( "nodeHyperion_health_features_resource_limits") ? "disabled" : "enabled"))
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeHyperion_health_features_resource_usage") && validation.health_features_resource_usage !== ValidationLevel.SUCCESS) {
    validations.push(
      createValidationObject(
        "health_features_resource_usage",
        validation.health_features_resource_usage,
        previousValidations.map((x) => x.health_features_resource_usage),
        "health",
        "Hyperion feature resource_usage",
        "is " + getChainsConfigItemWrapper( "nodeHyperion_health_features_resource_usage") ? "enabled" : "disabled",
        (validation.health_found < ValidationLevel.SUCCESS ? "status could not be read from api" : ("is " + getChainsConfigItemWrapper( "nodeHyperion_health_features_resource_usage") ? "disabled" : "enabled"))
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeHyperion_health_features")) {
    validations.push(
      createValidationObject(
        "health_all_features",
        validation.health_all_features_ok,
        previousValidations.map((x) => x.health_all_features_ok),
        "health",
        "Hyperion features are",
        "OK",
        "not OK"
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeHyperion_health_services_elastic")) {
    validations.push(
      createValidationObject(
        "health_elastic",
        validation.health_elastic_ok,
        previousValidations.map((x) => x.health_elastic_ok),
        "health",
        "Hyperion Elastic status is",
        "OK",
        "not OK",
        (validation.health_found < ValidationLevel.SUCCESS ? "Could not be read from api" : undefined)
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeHyperion_health_services_rabbitmq")) {
    validations.push(
      createValidationObject(
        "health_rabbitmq",
        validation.health_rabbitmq_ok,
        previousValidations.map((x) => x.health_rabbitmq_ok),
        "health",
        "Hyperion RabbitMq status is",
        "OK",
        "not OK",
        (validation.health_found < ValidationLevel.SUCCESS ? "Could not be read from api" : undefined)
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeHyperion_health_services_nodeosrpc")) {
    validations.push(
      createValidationObject(
        "health_nodeosrpc",
        validation.health_nodeosrpc_ok,
        previousValidations.map((x) => x.health_nodeosrpc_ok),
        "health",
        "Hyperion NodesRpc status is",
        "OK",
        "not OK",
        (validation.health_nodeosrpc_message ? validation.health_nodeosrpc_message : (validation.health_found < ValidationLevel.SUCCESS ? "Could not be read from api" : undefined))
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeHyperion_health_total_indexed_blocks")) {
    validations.push(
      createValidationObject(
        "health_total_indexed_blocks",
        validation.health_total_indexed_blocks_ok,
        previousValidations.map((x) => x.health_total_indexed_blocks_ok),
        "health",
        "Hyperion",
        "total indexed block == last indexed block",
        "total indexed block != last indexed block",
        (validation.health_missing_blocks === null ? "Could not be read from api" : ("Hyperion is missing " + validation.health_missing_blocks + " blocks"))
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeHyperion_get_transaction")) {
    validations.push(
      createRequestObjectFromConfig(
        "get_transaction",
        validation.get_transaction_ok,
        previousValidations.map((x) => x.get_transaction_ok),
        "validation",
        "get_transaction test",
        "passed",
        "not passed",
        "nodeHyperion_get_transaction",
        validation.endpoint_url,
        validation.get_transaction_ms,
        validation.get_transaction_httpcode,
        validation.get_transaction_errortype
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeHyperion_get_actions")) {
    validations.push(
      createRequestObjectFromConfig(
        "get_actions",
        validation.get_actions_ok,
        previousValidations.map((x) => x.get_actions_ok),
        "validation",
        "get_actions test",
        "passed",
        "not passed",
        "nodeHyperion_get_actions",
        validation.endpoint_url,
        validation.get_actions_ms,
        validation.get_actions_httpcode,
        validation.get_actions_errortype,
        validation.get_key_accounts_ok < ValidationLevel.SUCCESS ? null : "Action is older than 5min"
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeHyperion_get_key_accounts")) {
    validations.push(
      createRequestObjectFromConfig(
        "key_accounts",
        validation.get_key_accounts_ok,
        previousValidations.map((x) => x.get_key_accounts_ok),
        "validation",
        "get_key_accounts test",
        "passed",
        "not passed",
        "nodeHyperion_get_key_accounts",
        validation.endpoint_url,
        validation.get_key_accounts_ms,
        validation.get_key_accounts_httpcode,
        validation.get_key_accounts_errortype
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeHyperion_get_created_accounts")) {
    validations.push(
      createRequestObjectFromConfig(
        "created_accounts",
        validation.get_created_accounts_ok,
        previousValidations.map((x) => x.get_created_accounts_ok),
        "validation",
        "get_created_accounts test",
        "passed",
        "not passed",
        "nodeHyperion_get_created_accounts",
        validation.endpoint_url,
        validation.get_created_accounts_ms,
        validation.get_created_accounts_httpcode,
        validation.get_created_accounts_errortype
      )
    );
  }

  return {
    node_type: "NodeHyperion",

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
      availability: await getAvailabilityNodeHyperion(validation.guild, validation.endpoint_url)
    }
  };
}

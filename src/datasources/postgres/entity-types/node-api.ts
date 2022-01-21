import { getConnection, MoreThan } from "typeorm";
import { HttpErrorType } from "../../../validationcore-database-scheme/enum/HttpErrorType";
import {
  compareToPreviousValidationLevels,
  createRequestObjectFromConfig,
  createValidationObject,
  createHttpErrorMessage, getChainsConfigItemWrapper
} from "../helper-functions";
import { timeOffset } from "../DatabaseConnector";
import * as config from "config";
import { NodeApi } from "../../../validationcore-database-scheme/entity/NodeApi";
import { ValidationLevel } from "../../../validationcore-database-scheme/enum/ValidationLevel";
import { getAvailabilityNodeApi } from "../queries/availability/getAvailabilityNodeApi";

/**
 * Maps an NodeApi Array returned by the Database to the Schema used by the GraphQl Api
 * @param {NodeAtomic[]} validations = array of NodeApi Objects returned by database
 * @return {Promise<unknown>}
 */
export async function mapMultipleNodeApiToSchema(validations: NodeApi[]): Promise<unknown> {
  return {
    node_type: "NodeApi",
    nodes: validations.map(async (x) => await mapNodeApiToSchema(x))
  }
}

/**
 * Maps the NodeApi Object returned by the Database to the Schema used by the GraphQl Api
 * @param {NodeAtomic} validation = single NodeApi Object returned by database
 * @return {Promise<unknown>}
 */
export async function mapNodeApiToSchema(validation: NodeApi): Promise<unknown> {
  const database = getConnection();
  const previousValidations = await database.manager.find(NodeApi, {
    where: {
      guild: validation.guild,
      endpoint_url: validation.endpoint_url,
      validation_date: MoreThan(new Date(validation.validation_date.valueOf() - timeOffset)),
    },
  });

  const validations = [];

  if (getChainsConfigItemWrapper("nodeApi_location")) {
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

  if (getChainsConfigItemWrapper( "nodeApi_endpoint_url_ok")) {
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

  if (validation.is_ssl && getChainsConfigItemWrapper( "nodeApi_ssl")) {
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

  if (getChainsConfigItemWrapper("nodeApi_get_info")) {

    validations.push(
      createRequestObjectFromConfig(
        "get_info",
        validation.get_info_ok,
        previousValidations.map((x) => x.get_info_ok),
        "get_info",
        "Get_info request",
        "was successful",
        "was not successful",
        "nodeApi_get_info",
        validation.endpoint_url,
        validation.get_info_ms,
        validation.get_info_httpcode,
        validation.get_info_errortype
      )
    );
  }

  if (getChainsConfigItemWrapper("nodeApi_server_version")) {

    validations.push(
      createValidationObject(
        "server_version_ok",
        validation.server_version_ok,
        previousValidations.map((x) => x.server_version_ok),
        "get_info",
        "Server version",
        "(" + validation.server_version + ") is valid",
        "is invalid",
        (validation.server_version === null ? "Could not be read from api" : validation.server_version + " is not supported")
      )
    );
  }

  if (getChainsConfigItemWrapper("nodeApi_correct_chain")) {

    validations.push(
      createValidationObject(
        "correct_chain",
        validation.correct_chain,
        previousValidations.map((x) => x.correct_chain),
        "get_info",
        "Node is provided for the",
        "correct chain",
        "wrong chain",
        (validation.get_info_ok < ValidationLevel.SUCCESS ? "Could not be read from api" : null)
      )
    );
  }
  if (getChainsConfigItemWrapper("nodeApi_head_block_delta")) {
    validations.push(
      createValidationObject(
        "head_block_delta",
        validation.head_block_delta_ok,
        previousValidations.map((x) => x.head_block_delta_ok),
        "get_info",
        "Head block",
        "is up-to-date",
        "is not up-to-date",
        validation.head_block_delta_ms === null
          ? "Could not be read from api"
          : "The head block is " + validation.head_block_delta_ms / 1000 +
          "sec behind. Only a delta of " +
          config.get("validation.api_head_block_time_delta") / 1000 +
          "sec is tolerated"
      )
    );
  }

  if (getChainsConfigItemWrapper("nodeApi_block_one")) {
    validations.push(
    createRequestObjectFromConfig(
      "block_one",
      validation.block_one_ok,
      previousValidations.map((x) => x.block_one_ok),
      "validation",
      "Block one test",
      "passed",
      "not passed",
      "nodeApi_block_one",
      validation.endpoint_url,
      validation.block_one_ms,
      validation.block_one_httpcode,
      validation.block_one_errortype
    )
  );
}

  if (getChainsConfigItemWrapper("nodeApi_verbose_error")) {
    validations.push(
      createRequestObjectFromConfig(
        "verbose_error",
        validation.verbose_error_ok,
        previousValidations.map((x) => x.verbose_error_ok),
        "validation",
        "Error test",
        "passed",
        "not passed",
        "nodeApi_verbose_error",
        validation.endpoint_url,
        validation.verbose_error_ms,
        validation.verbose_error_httpcode,
        validation.verbose_error_errortype
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeApi_abi_serializer")) {
    validations.push(
      createRequestObjectFromConfig(
        "abi_serializer",
        validation.abi_serializer_ok,
        previousValidations.map((x) => x.abi_serializer_ok),
        "validation",
        "Abi serializer test",
        "passed",
        "not passed",
        "nodeApi_abi_serializer",
        validation.endpoint_url,
        validation.abi_serializer_ms,
        validation.abi_serializer_httpcode,
        validation.abi_serializer_errortype
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeApi_basic_symbol")) {
    validations.push(
      createRequestObjectFromConfig(
        "basic_symbol",
        validation.basic_symbol_ok,
        previousValidations.map((x) => x.basic_symbol_ok),
        "validation",
        "Basic symbol test",
        "passed",
        "not passed",
        "nodeApi_basic_symbol",
        validation.endpoint_url,
        validation.basic_symbol_ms,
        validation.basic_symbol_httpcode,
        validation.basic_symbol_errortype
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeApi_producer_api")) {
    validations.push(
      createRequestObjectFromConfig(
        "producer_api",
        validation.producer_api_off,
        previousValidations.map((x) => x.producer_api_off),
        "validation",
        "Producer api",
        "is not accessible",
        (validation.producer_api_errortype !== HttpErrorType.HTTP && validation.producer_api_httpcode !== 200) ? "could not be validated" : "is accessible",
        "nodeApi_producer_api",
        validation.endpoint_url,
        validation.producer_api_ms,
        validation.producer_api_httpcode,
        validation.producer_api_errortype
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeApi_db_size_api")) {
    validations.push(
      createRequestObjectFromConfig(
        "db_size_api",
        validation.db_size_api_off,
        previousValidations.map((x) => x.db_size_api_off),
        "validation",
        "Db_size api",
        "is not accessible",
        (validation.db_size_api_errortype !== HttpErrorType.HTTP && validation.db_size_api_httpcode !== 200) ? "could not be validated" : "is accessible",
        "nodeApi_db_size_api",
        validation.endpoint_url,
        validation.db_size_api_ms,
        validation.db_size_api_httpcode,
        validation.db_size_api_errortype
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeApi_net_api")) {
    validations.push(
      createRequestObjectFromConfig(
        "net_api",
        validation.net_api_off,
        previousValidations.map((x) => x.net_api_off),
        "validation",
        "Net api",
        "is not accessible",
        (validation.net_api_errortype !== HttpErrorType.HTTP && validation.net_api_httpcode !== 200) ? "could not be validated" : "is accessible",
        "nodeApi_net_api",
        validation.endpoint_url,
        validation.net_api_ms,
        validation.net_api_httpcode,
        validation.net_api_errortype
      )
    );
  }

  return {
    node_type: "NodeApi",

    id: validation.id,
    guild: validation.guild,
    validation_date: validation.validation_date,

    endpoint_url: validation.endpoint_url,
    is_ssl: validation.is_ssl,
    location_longitude: validation.location_longitude,
    location_latitude: validation.location_latitude,
    server_version: validation.server_version,

    all_checks_ok: compareToPreviousValidationLevels(
      validation.all_checks_ok,
      previousValidations.map((x) => x.all_checks_ok)
    ),

    validations: validations,

    statistics: {
      availability: await getAvailabilityNodeApi(validation.guild, validation.endpoint_url)
    }
  };
}

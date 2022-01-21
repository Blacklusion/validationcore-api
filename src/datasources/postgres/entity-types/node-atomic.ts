import { getConnection, MoreThan } from "typeorm";
import { timeOffset } from "../DatabaseConnector";
import {
  compareToPreviousValidationLevels,
  createRequestObjectFromConfig,
  createValidationObject,
  createHttpErrorMessage, getChainsConfigItemWrapper
} from "../helper-functions";
import { NodeAtomic } from "../../../validationcore-database-scheme/entity/NodeAtomic";
import { ValidationLevel } from "../../../validationcore-database-scheme/enum/ValidationLevel";
import { getAvailabilityNodeAtomic } from "../queries/availability/getAvailabilityNodeAtomic";

/**
 * Maps an NodeAtomic Array returned by the Database to the Schema used by the GraphQl Api
 * @param {NodeAtomic[]} validations = array of NodeAtomic Objects returned by database
 * @return {Promise<unknown>}
 */
export async function mapMultipleNodeAtomicToSchema(validations: NodeAtomic[]): Promise<unknown> {
  return {
    node_type: "NodeAtomic",
    nodes: validations.map(async (x) => await mapNodeAtomicToSchema(x))
  }
}

/**
 * Maps the NodeAtomic Object returned by the Database to the Schema used by the GraphQl Api
 * @param {NodeWallet} validation = single NodeAtomic Object returned by database
 * @return {Promise<unknown>}
 */
export async function mapNodeAtomicToSchema(validation: NodeAtomic): Promise<unknown> {
  const database = getConnection();
  const previousValidations = await database.manager.find(NodeAtomic, {
    where: {
      guild: validation.guild,
      endpoint_url: validation.endpoint_url,
      validation_date: MoreThan(new Date(validation.validation_date.valueOf() - timeOffset)),
    },
  });

  const validations = [];

  if (getChainsConfigItemWrapper( "nodeAtomic_location")) {
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

  if (getChainsConfigItemWrapper( "nodeAtomic_endpoint_url_ok")) {
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

  if (validation.is_ssl && getChainsConfigItemWrapper( "nodeAtomic_ssl")) {
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

  if (getChainsConfigItemWrapper( "nodeAtomic_health")) {
    validations.push(
      createRequestObjectFromConfig(
        "health_found",
        validation.health_found,
        previousValidations.map((x) => x.health_found),
        "health",
        "Atomic health is",
        "reachable",
        "not reachable",
        "nodeAtomic_health",
        validation.endpoint_url,
        validation.health_ms,
        validation.health_httpcode,
        validation.health_errortype
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeAtomic_health_access_control_header")) {
    validations.push(
      createValidationObject(
        "access_control_header",
        validation.health_access_control_header_ok,
        previousValidations.map((x) => x.health_access_control_header_ok),
        "health",
        "Access-Control-Allow-Headers configured",
        "properly",
        "not properly",
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeAtomic_health_postgres")) {
    validations.push(
      createValidationObject(
        "health_postgres",
        validation.health_postgres_ok,
        previousValidations.map((x) => x.health_postgres_ok),
        "health",
        "Atomic Postgres status is",
        "OK",
        "not OK"
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeAtomic_health_redis")) {
    validations.push(
      createValidationObject(
        "health_redis",
        validation.health_redis_ok,
        previousValidations.map((x) => x.health_redis_ok),
        "health",
        "Atomic Redis status is",
        "OK",
        "not OK"
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeAtomic_health_chain")) {
    validations.push(
      createValidationObject(
        "health_chain",
        validation.health_chain_ok,
        previousValidations.map((x) => x.health_chain_ok),
        "health",
        "Atomic provided for",
        "correct chain",
        "wrong chain",
        (validation.health_found < ValidationLevel.SUCCESS ? "Could not be read from api" : null)
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeAtomic_health_total_indexed_blocks")) {
    validations.push(
      createValidationObject(
        "health_total_indexed_blocks",
        validation.health_total_indexed_blocks_ok,
        previousValidations.map((x) => x.health_total_indexed_blocks_ok),
        "health",
        "Atomic",
        "total indexed block == last indexed block",
        "total indexed block != last indexed block",
        (validation.health_missing_blocks === null ? "Could not be read from api" : ("Atomic is missing " + validation.health_missing_blocks + " blocks"))
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeAtomic_assets")) {
    validations.push(
      createRequestObjectFromConfig(
        "assets",
        validation.assets_ok,
        previousValidations.map((x) => x.assets_ok),
        "validation",
        "Atomicassets assets test",
        "passed",
        "not passed",
        "nodeAtomic_assets",
        validation.endpoint_url,
        validation.assets_ms,
        validation.assets_httpcode,
        validation.assets_errortype
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeAtomic_collections")) {
    validations.push(
      createRequestObjectFromConfig(
        "collections",
        validation.collections_ok,
        previousValidations.map((x) => x.collections_ok),
        "validation",
        "Atomicassets collections test",
        "passed",
        "not passed",
        "nodeAtomic_collections",
        validation.endpoint_url,
        validation.collections_ms,
        validation.collections_httpcode,
        validation.assets_errortype
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeAtomic_schemas")) {
    validations.push(
      createRequestObjectFromConfig(
        "schemas",
        validation.schemas_ok,
        previousValidations.map((x) => x.schemas_ok),
        "validation",
        "Atomicassets schemas test",
        "passed",
        "not passed",
        "nodeAtomic_schemas",
        validation.endpoint_url,
        validation.schemas_ms,
        validation.schemas_httpcode,
        validation.schemas_errortype
      )
    );
  }

  if (getChainsConfigItemWrapper( "nodeAtomic_templates")) {
    validations.push(
      createRequestObjectFromConfig(
        "templates",
        validation.templates_ok,
        previousValidations.map((x) => x.templates_ok),
        "validation",
        "Atomicassets templates test",
        "passed",
        "not passed",
        "nodeAtomic_templates",
        validation.endpoint_url,
        validation.templates_ms,
        validation.templates_httpcode,
        validation.templates_errortype
      )
    );
  }

  return {
    node_type: "NodeAtomic",

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
      availability: await getAvailabilityNodeAtomic(validation.guild, validation.endpoint_url)
    }
  };
}

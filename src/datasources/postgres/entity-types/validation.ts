import { Validation } from "../../../validationcore-database-scheme/entity/Validation";
import { getConnection, MoreThan } from "typeorm";
import { Guild } from "../../../validationcore-database-scheme/entity/Guild";
import { timeOffset } from "../DatabaseConnector";
import { compareToPreviousValidationLevels, createRequestObject, createValidationObject } from "../helper-functions";
import { mapMultipleNodeSeedToSchema } from "./node-seed";
import { mapMultipleNodeApiToSchema } from "./node-api";
import { mapMultipleNodeWalletToSchema } from "./node-wallet";
import { mapMultipleNodeHistoryToSchema } from "./node-history";
import { mapMultipleNodeHyperionToSchema } from "./node-hyperion";
import { mapMultipleNodeAtomicToSchema } from "./node-atomic";

/**
 * Maps the Validation Object returned by the Database to the Schema used by the GraphQl Api
 * @param {Validation} validation = ValidationObject as returned by Database
 * @return {Promise<any>}
 */
export async function mapValidationObjectToSchema(validation: Validation): Promise<unknown> {
  const database = getConnection();
  const previousValidations = await database.manager.find(Validation, {
    where: {
      guild: validation.guild,
      validation_date: MoreThan(new Date(validation.validation_date.valueOf() - timeOffset)),
    },
  });

  const guild = await database.manager.findOne(Guild, {
    where: {
      name: validation.guild,
    },
  });

  const validations = [];

  validations.push(
    createValidationObject(
      "reg_location",
      validation.reg_location_ok,
      previousValidations.map((x) => x.reg_location_ok),
      "regproducer",
      "Location (" + validation.reg_location + ") on Chain is",
      "valid",
      "invalid"
    )
  );
  validations.push(
    createRequestObject(
      "reg_website",
      validation.reg_website_ok,
      previousValidations.map((x) => x.reg_website_ok),
      "regproducer",
      "Website registered on Chain is",
      "reachable",
      "was not provided or not reachable",
      { base: validation.reg_website_url },
      validation.reg_website_ms,
      validation.reg_website_httpcode,
      validation.reg_website_errortype
    )
  );

  validations.push(
    createRequestObject(
      "chains_json",
      validation.chains_json_ok,
      previousValidations.map((x) => x.chains_json_ok),
      "chains.json",
      "Chains.json",
      "with valid json formatting was found",
      "is not valid (not provided, reachable or invalid json formatting)",
      { base: validation.reg_website_url, path: "/chains.json" },
      validation.chains_json_ms,
      validation.chains_json_httpcode,
      validation.chains_json_errortype
    )
  );

  validations.push(
    createValidationObject(
      "chains_json_access_control_header",
      validation.chains_json_access_control_header_ok,
      previousValidations.map((x) => x.chains_json_access_control_header_ok),
      "chains.json",
      "Chains.json Access-control-allow-origin header",
      "configured properly",
      "not configured properly"
    )
  );

  validations.push(
    createRequestObject(
      "bpjson_found",
      validation.bpjson_ok,
      previousValidations.map((x) => x.bpjson_ok),
      "bp.json",
      "Bp.json",
      "found at " + validation.bpjson_path,
      "not found or not reachable",
      { base: validation.reg_website_url, path: validation.bpjson_path },
      validation.bpjson_ms,
      validation.bpjson_httpcode,
      validation.bpjson_errortype
    )
  );
  validations.push(
    createValidationObject(
      "bpjson_producer_account_name",
      validation.bpjson_producer_account_name_ok,
      previousValidations.map((x) => x.bpjson_producer_account_name_ok),
      "bp.json",
      "Producer account name",
      "is valid",
      "is not valid",
      validation.bpjson_producer_account_name_message
    )
  );
  validations.push(
    createValidationObject(
      "bpjson_candidate_name",
      validation.bpjson_candidate_name_ok,
      previousValidations.map((x) => x.bpjson_candidate_name_ok),
      "bp.json",
      "Candidate name",
      "is valid",
      "is not valid"
    )
  );
  validations.push(
    createRequestObject(
      "bpjson_website",
      validation.bpjson_website_ok,
      previousValidations.map((x) => x.bpjson_website_ok),
      "bp.json",
      "Website",
      "is reachable",
      "is not valid",
      { base: validation.bpjson_website_url },
      validation.bpjson_website_ms,
      validation.bpjson_website_httpcode,
      validation.bpjson_errortype
    )
  );
  validations.push(
    createRequestObject(
      "bpjson_code_of_conduct",
      validation.bpjson_code_of_conduct_ok,
      previousValidations.map((x) => x.bpjson_code_of_conduct_ok),
      "bp.json",
      "Code of conduct",
      "is reachable",
      "is not valid",
      { base: validation.bpjson_code_of_conduct_url },
      validation.bpjson_code_of_conduct_ms,
      validation.bpjson_code_of_conduct_httpcode,
      validation.bpjson_code_of_conduct_errortype
    )
  );
  validations.push(
    createRequestObject(
      "bpjson_ownership_disclosure",
      validation.bpjson_ownership_disclosure_ok,
      previousValidations.map((x) => x.bpjson_ownership_disclosure_ok),
      "bp.json",
      "Ownership Disclosure",
      "is reachable",
      "is not valid",
      { base: validation.bpjson_ownership_disclosure_url },
      validation.bpjson_ownership_disclosure_ms,
      validation.bpjson_ownership_disclosure_httpcode,
      validation.bpjson_ownership_disclosure_errortype
    )
  );
  validations.push(
    createValidationObject(
      "bpjson_email",
      validation.bpjson_email_ok,
      previousValidations.map((x) => x.bpjson_email_ok),
      "bp.json",
      "Email",
      "is valid",
      "is not valid",
      validation.bpjson_email_message
    )
  );
  validations.push(
    createValidationObject(
      "bpjson_github_user",
      validation.bpjson_github_user_ok,
      previousValidations.map((x) => x.bpjson_github_user_ok),
      "bp.json",
      "GitHub user",
      "was provided",
      "is not valid",
      validation.bpjson_github_user_message
    )
  );
  validations.push(
    createValidationObject(
      "bpjson_chain_resources",
      validation.bpjson_chain_resources_ok,
      previousValidations.map((x) => x.bpjson_chain_resources_ok),
      "bp.json",
      "Chain resources",
      "are valid",
      "are not valid",
      validation.bpjson_chain_resources_message
    )
  );
  validations.push(
    createValidationObject(
      "bpjson_other_resources",
      validation.bpjson_other_resources_ok,
      previousValidations.map((x) => x.bpjson_other_resources_ok),
      "bp.json",
      "Other resources",
      "are valid",
      "are not valid",
      validation.bpjson_other_resources_message
    )
  );
  validations.push(
    createValidationObject(
      "bpjson_branding",
      validation.bpjson_branding_ok,
      previousValidations.map((x) => x.bpjson_branding_ok),
      "bp.json",
      "Branding",
      "is provided in all three formats",
      "is not valid",
      validation.bpjson_branding_message
    )
  );
  validations.push(
    createValidationObject(
      "bpjson_location",
      validation.bpjson_location_ok,
      previousValidations.map((x) => x.bpjson_location_ok),
      "bp.json",
      "Location of the organization",
      "is valid",
      "is invalid"
    )
  );
  validations.push(
    createValidationObject(
      "bpjson_social",
      validation.bpjson_social_ok,
      previousValidations.map((x) => x.bpjson_social_ok),
      "bp.json",
      "Social Services",
      "are valid",
      "are either not provided (min. 4 required) or some are invalid (no urls or @ before username allowed)"
    )
  );

  validations.push(
    createValidationObject(
      "nodes_producer",
      validation.nodes_producer_found,
      previousValidations.map((x) => x.nodes_producer_found),
      "bp.json",
      "",
      "At least one producer node with valid location was found",
      "No producer node with valid location was found"
    )
  );

  /* Currently not implemented
  bpjson_matches_onchain: createValidationObject(
    validation.,
    previousValidations.map(x => x.),
    "",
    "",
    ""
  ),
   */
  const nodes = [];

  nodes.push(await mapMultipleNodeSeedToSchema(validation.nodes_seed))
  nodes.push(await mapMultipleNodeApiToSchema(validation.nodes_api))
  nodes.push(await mapMultipleNodeWalletToSchema(validation.nodes_wallet))
  nodes.push(await mapMultipleNodeHistoryToSchema(validation.nodes_history))
  nodes.push(await mapMultipleNodeHyperionToSchema(validation.nodes_hyperion))
  nodes.push(await mapMultipleNodeAtomicToSchema(validation.nodes_atomic))

  return {
    id: validation.id,
    guild: validation.guild,
    validation_date: validation.validation_date,
    guild_logo_256_url: guild === null ? null : guild.url_logo_256,

    all_checks_ok: compareToPreviousValidationLevels(
      validation.all_checks_ok,
      previousValidations.map((x) => x.all_checks_ok)
    ),

    validations: validations,

    nodes: nodes
  };
}

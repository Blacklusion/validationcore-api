import { Validation } from "../validationcore-database-scheme/entity/Validation";
import { NodeSeed } from "../validationcore-database-scheme/entity/NodeSeed";
import { NodeApi } from "../validationcore-database-scheme/entity/NodeApi";
import { NodeHistory } from "../validationcore-database-scheme/entity/NodeHistory";
import { NodeHyperion } from "../validationcore-database-scheme/entity/NodeHyperion";
import { DataSource } from "apollo-datasource";
import { getConnection, MoreThan } from "typeorm";
import { ValidationLevel } from "../validationcore-database-scheme/enum/ValidationLevel";
import { HttpErrorType } from "../validationcore-database-scheme/enum/HttpErrorType";
import * as config from "config";
import {
  getChainIdFromName,
  getChainsConfigItem,
  logger,
  validationConfig
} from "../validationcore-database-scheme/common";
import { NodeWallet } from "../validationcore-database-scheme/entity/NodeWallet";
import { NodeAtomic } from "../validationcore-database-scheme/entity/NodeAtomic";
import { Guild } from "../validationcore-database-scheme/entity/Guild";
import { guildCache } from "../cache";

/**
 * Handles the connection to the postgres Database filled by the Validationcore
 * Custom DataSource implementation via TypeORM is used instead of off the shelve SQL Connectors, to streamline
 * The Development across the Validationcore project
 */
export class DatabaseConnector extends DataSource {
  timeOffset: number;

  /**
   * Constructor
   */
  constructor() {
    super();
    this.timeOffset = 3000;
  }

  // todo: check what happens if id is accessed that does not exist
  /**
   * Returns the validation of a guild formatted as an Validation object as described in /src/schemas.ts
   * @param {Number} id = ID of the Validation
   */
  async getValidationById(id: string, chainName: string) {
    const chainId = getChainIdFromName(chainName);
    if (!chainId)
      return {};

    const database = getConnection(chainId);
    const validation = await database.manager.findOne(Validation, {
      where: {
        id: id,
      },
    });

    if (!validation) return {};
    return await this.mapValidationObjectToSchema(validation, chainId);
  }

  /**
   * Maps the Validation Object returned by the Database to the Schema used by the GraphQl Api
   * ⚠️ ATTENTION: This code has to be adjusted whenever the database or GraphQL schema changes
   * @param {Validation} validation = ValidationObject as returned by Database
   */
  async mapValidationObjectToSchema(validation: Validation, chainId: string) {
    const database = getConnection(chainId);
    const previousValidations = await database.manager.find(Validation, {
      where: {
        guild: validation.guild,
        validation_date: MoreThan(new Date(validation.validation_date.valueOf() - this.timeOffset)),
      },
    });

    const guild = await database.manager.findOne(Guild, {
      where: {
        name: validation.guild,
      },
    });

    const validations = [];

    validations.push(this.createValidationObject(
      "reg_location",
      validation.reg_location_ok,
      previousValidations.map((x) => x.reg_location_ok),
      "regproducer",
      "Location (" + validation.reg_location + ") on Chain is",
      "valid",
      "invalid"
    ))
    validations.push(this.createRequestObject(
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
    ))

    validations.push(this.createRequestObject(
      "chains_json",
      validation.chains_json_ok,
      previousValidations.map((x) => x.chains_json_ok),
      "chains.json",
      "Chains.json",
      "found and has valid json formatting",
      "not found or not reachable",
      { base: validation.reg_website_url },
      validation.chains_json_ms,
      validation.chains_json_httpcode,
      validation.chains_json_errortype
    ))

    validations.push(this.createValidationObject(
      "chains_json_access_control_header",
      validation.chains_json_access_control_header_ok,
      previousValidations.map((x) => x.chains_json_access_control_header_ok),
      "chains.json",
      "Chains.json Access-control-allow-origin header",
      "configured properly",
      "not configured properly"
    ))

    validations.push(this.createRequestObject(
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
    ))
    validations.push(this.createValidationObject(
      "bpjson_producer_account_name",
      validation.bpjson_producer_account_name_ok,
      previousValidations.map((x) => x.bpjson_producer_account_name_ok),
      "bp.json",
      "Producer account name",
      "is valid",
      "is not valid",
      validation.bpjson_producer_account_name_message
    ))
    validations.push(this.createValidationObject(
      "bpjson_candidate_name",
      validation.bpjson_candidate_name_ok,
      previousValidations.map((x) => x.bpjson_candidate_name_ok),
      "bp.json",
      "Candidate name",
      "is valid",
      "is not valid"
    ))
    validations.push(this.createRequestObject(
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
    ))
    validations.push(this.createRequestObject(
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
    ))
    validations.push(this.createRequestObject(
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
    ))
    validations.push(this.createValidationObject(
      "bpjson_email",
      validation.bpjson_email_ok,
      previousValidations.map((x) => x.bpjson_email_ok),
      "bp.json",
      "Email",
      "is valid",
      "is not valid",
      validation.bpjson_email_message
    ))
    validations.push(this.createValidationObject(
      "bpjson_github_user",
      validation.bpjson_github_user_ok,
      previousValidations.map((x) => x.bpjson_github_user_ok),
      "bp.json",
      "GitHub user",
      "was provided (min. 1)",
      "is not valid",
      validation.bpjson_github_user_message
    ))
    validations.push(this.createValidationObject(
      "bpjson_chain_resources",
      validation.bpjson_chain_resources_ok,
      previousValidations.map((x) => x.bpjson_chain_resources_ok),
      "bp.json",
      "Chain resources",
      "are valid",
      "are not valid",
      validation.bpjson_chain_resources_message
    ))
    validations.push(this.createValidationObject(
      "bpjson_other_resources",
      validation.bpjson_other_resources_ok,
      previousValidations.map((x) => x.bpjson_other_resources_ok),
      "bp.json",
      "Other resources",
      "are valid",
      "are not valid",
      validation.bpjson_other_resources_message
    ))
    validations.push(this.createValidationObject(
      "bpjson_branding",
      validation.bpjson_branding_ok,
      previousValidations.map((x) => x.bpjson_branding_ok),
      "bp.json",
      "Branding",
      "was provided in all three formats",
      "is not valid",
      validation.bpjson_branding_message
    ))
    validations.push(this.createValidationObject(
      "bpjson_location",
      validation.bpjson_location_ok,
      previousValidations.map((x) => x.bpjson_location_ok),
      "bp.json",
      "Location of your organization",
      "is valid",
      "is invalid"
    ))
    validations.push(this.createValidationObject(
      "bpjson_social",
      validation.bpjson_social_ok,
      previousValidations.map((x) => x.bpjson_social_ok),
      "bp.json",
      "Social Services",
      "are valid",
      "are either not provided (min. 4 required) or some are invalid (no urls or @ before username allowed)."
    ))

    validations.push(this.createValidationObject(
      "nodes_producer",
      validation.nodes_producer_found,
      previousValidations.map((x) => x.nodes_producer_found),
      "bp.json",
      "",
      "At least one producer node with valid location was found",
      "No producer node with valid location was found"
    ))

    /* Currently not implemented
    bpjson_matches_onchain: createValidationObject(
      validation.,
      previousValidations.map(x => x.),
      "",
      "",
      ""
    ),
     */

    return {
      id: validation.id,
      guild: validation.guild,
      validation_date: validation.validation_date,
      guild_logo_256_url: (guild === null ? null : guild.url_logo_256),

      all_checks_ok: this.calculateValidationLevel(
        validation.all_checks_ok,
        previousValidations.map((x) => x.all_checks_ok)
      ),

      validations: validations,

      nodes_seed: validation.nodes_seed.map(async (x) => await this.mapNodeSeedToSchema(x, chainId)),
      nodes_api: validation.nodes_api.map(async (x) => await this.mapNodeApiToSchema(x, chainId)),
      nodes_wallet: validation.nodes_wallet.map(async (x) => await this.mapNodeWalletToSchema(x, chainId)),
      nodes_history: validation.nodes_history.map(async (x) => await this.mapNodeHistoryToSchema(x, chainId)),
      nodes_hyperion: validation.nodes_hyperion.map(async (x) => await this.mapNodeHyperionToSchema(x, chainId)),
      nodes_atomic: validation.nodes_atomic.map(async (x) => await this.mapNodeAtomicToSchema(x, chainId)),
    };
  }

  /**
   * Maps the NodeSeed Object returned by the Database to the NodeSeed Schema used by the GraphQl Api
   * ⚠️ ATTENTION: This code has to be adjusted whenever the database or GraphQL schema changes
   * @param {NodeSeed} validation = single NodeSeed Object returned by database
   */
  async mapNodeSeedToSchema(validation: NodeSeed, chainId: string) {
    const database = getConnection(chainId);
    const previousValidations = await database.manager.find(NodeSeed, {
      where: {
        guild: validation.guild,
        endpoint_url: validation.endpoint_url,
        validation_date: MoreThan(new Date(validation.validation_date.valueOf() - this.timeOffset)),
      },
    });

    const validations = []

    validations.push(this.createValidationObject(
      "location_ok",
      validation.location_ok,
      previousValidations.map((x) => x.location_ok),
      "general",
      "Provided location in bp.json is",
      "valid",
      "invalid"
    ))

    validations.push(this.createValidationObject(
        "endpoint_url_ok",
      validation.endpoint_url_ok,
      previousValidations.map((x) => x.endpoint_url_ok),
      "general",
      "Provided P2P address is",
      "valid",
      "invalid"
    ))

    validations.push(this.createValidationObject(
        "p2p_connection_possible",
      validation.p2p_connection_possible,
      previousValidations.map((x) => x.p2p_connection_possible),
      "connection",
      "P2P connection was",
      "possible",
      "not possible",
      validation.p2p_connection_possible_message
    ))

    validations.push(this.createValidationObject(
        "block_transmission_speed",
      validation.block_transmission_speed_ok,
      previousValidations.map((x) => x.block_transmission_speed_ok),
      "connection",
      "Block transmission speed is",
      "OK (" + validation.block_transmission_speed_ms + "ms)",
      "too slow (" + validation.block_transmission_speed_ms + "ms)",
      "The tolerated limit is " + config.get("validation.p2p_ok_speed") + "ms"
    ))

    return {
      id: validation.id,
      guild: validation.guild,
      validation_date: validation.validation_date,
      endpoint_url: validation.endpoint_url,

      all_checks_ok: this.calculateValidationLevel(
        validation.all_checks_ok,
        previousValidations.map((x) => x.all_checks_ok)
      ),

      validations: validations
    };
  }

  /**
   * Maps the NodeApi Object returned by the Database to the Schema used by the GraphQl Api
   * ⚠️ ATTENTION: This code has to be adjusted whenever the database or GraphQL schema changes
   * @param {NodeApi} validation = single NodeApi Object returned by database
   */
  async mapNodeApiToSchema(validation: NodeApi, chainId: string) {
    const database = getConnection(chainId);
    const previousValidations = await database.manager.find(NodeApi, {
      where: {
        guild: validation.guild,
        endpoint_url: validation.endpoint_url,
        validation_date: MoreThan(new Date(validation.validation_date.valueOf() - this.timeOffset)),
      },
    });

    const validations = [];

    validations.push(this.createValidationObject(
      "endpoint_url_ok",
      validation.endpoint_url_ok,
      previousValidations.map((x) => x.endpoint_url_ok),
      "general",
      "Endpoint url is",
      "a valid url",
      "not a valid url"
    ))

    if (validation.is_ssl) {
      validations.push(this.createValidationObject(
        "ssl_ok",
        validation.ssl_ok,
        previousValidations.map((x) => x.ssl_ok),
        "general",
        "TLS is",
        "OK",
        "not OK",
        this.decodeHttpErrorMessage(validation.ssl_errortype)
      ))
    }

    validations.push(this.createValidationObject(
        "location_ok",
      validation.location_ok,
      previousValidations.map((x) => x.location_ok),
      "general",
      "Provided location in bp.json is",
      "valid",
      "invalid"
    ))
    validations.push(this.createRequestObjectFromConfig(
        "get_info",
      validation.get_info_ok,
      previousValidations.map((x) => x.get_info_ok),
      "get_info",
      "Get_info request",
      "successful",
      "not successful",
      "nodeApi_get_info",
      chainId,
      validation.get_info_ms,
      validation.get_info_httpcode,
      validation.get_info_errortype
    ))

    validations.push(this.createValidationObject(
        "server_version_ok",
      validation.server_version_ok,
      previousValidations.map((x) => x.server_version_ok),
      "get_info",
      "Server version (" + validation.server_version + ") is",
      "valid",
      "invalid"
    ))
    validations.push(this.createValidationObject(
        "correct_chain",
      validation.correct_chain,
      previousValidations.map((x) => x.correct_chain),
      "get_info",
      "API-Node is provided for the",
      "correct chain",
      "wrong chain"
    ))
    validations.push(this.createValidationObject(
        "head_block_delta",
      validation.head_block_delta_ok,
      previousValidations.map((x) => x.head_block_delta_ok),
      "get_info",
      "Head block",
      "is up-to-date",
      "is not up-to-date",
      validation.head_block_delta_ms === null
        ? "could not be read from api"
        : validation.head_block_delta_ms / 1000 +
        "sec behind. Only a delta of " +
        config.get("validation.api_head_block_time_delta") / 1000 +
        "sec is tolerated"
    ))

    validations.push(this.createRequestObjectFromConfig(
        "block_one",
      validation.block_one_ok,
      previousValidations.map((x) => x.block_one_ok),
      "validation",
      "Block one test",
      "passed",
      "not passed",
      "nodeApi_block_one",
      chainId,
      validation.block_one_ms,
      validation.block_one_httpcode,
      validation.block_one_errortype
    ))

    validations.push(this.createRequestObjectFromConfig(
        "verbose_error",
      validation.verbose_error_ok,
      previousValidations.map((x) => x.verbose_error_ok),
      "validation",
      "Verbose Error test",
      "passed",
      "not passed",
      "nodeApi_verbose_error",
      chainId,
      validation.verbose_error_ms,
      validation.verbose_error_httpcode,
      validation.verbose_error_errortype
    ))

    validations.push(this.createRequestObjectFromConfig(
        "abi_serializer",
      validation.abi_serializer_ok,
      previousValidations.map((x) => x.abi_serializer_ok),
      "validation",
      "Abi serializer test",
      "passed",
      "not passed",
      "nodeApi_verbose_error",
      chainId,
      validation.abi_serializer_ms,
      validation.abi_serializer_httpcode,
      validation.abi_serializer_errortype
    ))

    validations.push(this.createRequestObjectFromConfig(
        "basic_symbol",
      validation.basic_symbol_ok,
      previousValidations.map((x) => x.basic_symbol_ok),
      "validation",
      "Basic symbol test",
      "passed",
      "not passed",
      "nodeApi_basic_symbol",
      chainId,
      validation.basic_symbol_ms,
      validation.basic_symbol_httpcode,
      validation.basic_symbol_errortype
    ))

    validations.push(this.createRequestObjectFromConfig(
        "producer_api",
      validation.producer_api_off,
      previousValidations.map((x) => x.producer_api_off),
      "validation",
      "Producer api",
      "is disabled",
      validation.producer_api_errortype !== HttpErrorType.HTTP ? "could not be validated" : "is not disabled",
      "nodeApi_producer_api",
      chainId,
      validation.producer_api_ms,
      validation.producer_api_httpcode,
      validation.producer_api_errortype
    ))

    validations.push(this.createRequestObjectFromConfig(
        "db_size_api",
      validation.db_size_api_off,
      previousValidations.map((x) => x.db_size_api_off),
      "validation",
      "Db_size api",
      "is disabled",
      validation.db_size_api_errortype !== HttpErrorType.HTTP ? "could not be validated" : "is not disabled",
      "nodeApi_db_size_api",
      chainId,
      validation.db_size_api_ms,
      validation.db_size_api_httpcode,
      validation.db_size_api_errortype
    ))

    validations.push(this.createRequestObjectFromConfig(
        "net_api",
      validation.net_api_off,
      previousValidations.map((x) => x.net_api_off),
      "validation",
      "Net api",
      "is disabled",
      validation.net_api_errortype !== HttpErrorType.HTTP ? "could not be validated" : "is not disabled",
      "nodeApi_net_api",
      chainId,
      validation.net_api_ms,
      validation.net_api_httpcode,
      validation.net_api_errortype
    ))

    return {
      id: validation.id,
      guild: validation.guild,
      validation_date: validation.validation_date,

      all_checks_ok: this.calculateValidationLevel(
        validation.all_checks_ok,
        previousValidations.map((x) => x.all_checks_ok)
      ),

      endpoint_url: validation.endpoint_url,
      is_ssl: validation.is_ssl,
      server_version: validation.server_version,

      validations: validations
    };
  }

  /**
   * Maps the NodeWallet Object returned by the Database to the Schema used by the GraphQl Api
   * ⚠️ ATTENTION: This code has to be adjusted whenever the database or GraphQL schema changes
   * @param {NodeWallet} validation = single NodeWallet Object returned by database
   * @param {string} chainId = chainId of the current chain
   */
  async mapNodeWalletToSchema(validation: NodeWallet, chainId: string) {
    const database = getConnection(chainId);
    const previousValidations = await database.manager.find(NodeWallet, {
      where: {
        guild: validation.guild,
        endpoint_url: validation.endpoint_url,
        validation_date: MoreThan(new Date(validation.validation_date.valueOf() - this.timeOffset)),
      },
    });

    const validations = [];

    validations.push(this.createValidationObject(
      "endpoint_url_ok",
      validation.endpoint_url_ok,
      previousValidations.map((x) => x.endpoint_url_ok),
      "general",
      "Endpoint url is",
      "a valid url",
      "not a valid url"
    ))

    if (validation.is_ssl) {
      validations.push(this.createValidationObject(
        "ssl_ok",
        validation.ssl_ok,
        previousValidations.map((x) => x.ssl_ok),
        "general",
        "TLS is",
        "OK",
        "not OK",
        this.decodeHttpErrorMessage(validation.ssl_errortype)
      ))
    }

    validations.push(this.createValidationObject(
        "location_ok",
      validation.location_ok,
      previousValidations.map((x) => x.location_ok),
      "general",
      "Provided location in bp.json is",
      "valid",
      "invalid"
    ))

    validations.push(this.createRequestObjectFromConfig(
        "get_accounts",
      validation.accounts_ok,
      previousValidations.map((x) => x.accounts_ok),
      "validation",
      "Wallet get_accounts test",
      "passed",
      "not passed",
      "nodeWallet_accounts",
      chainId,
      validation.accounts_ms,
      validation.accounts_httpcode,
      validation.accounts_errortype
    ))
    validations.push(this.createRequestObjectFromConfig(
        "get_accounts",
      validation.keys_ok,
      previousValidations.map((x) => x.keys_ok),
      "validation",
      "Wallet get_accounts by key test",
      "passed",
      "not passed",
      "nodeWallet_keys",
      chainId,
      validation.keys_ms,
      validation.keys_httpcode,
      validation.keys_errortype
    ))

    return {
      id: validation.id,
      guild: validation.guild,
      validation_date: validation.validation_date,

      all_checks_ok: this.calculateValidationLevel(
        validation.all_checks_ok,
        previousValidations.map((x) => x.all_checks_ok)
      ),

      endpoint_url: validation.endpoint_url,
      is_ssl: validation.is_ssl,

      validations: validations
    };
  }

  /**
   * Maps the NodeHistory Object returned by the Database to the Schema used by the GraphQl Api
   * ⚠️ ATTENTION: This code has to be adjusted whenever the database or GraphQL schema changes
   * @param {NodeHistory} validation = single NodeHistory Object returned by database
   */
  async mapNodeHistoryToSchema(validation: NodeHistory, chainId: string) {
    const database = getConnection(chainId);
    const previousValidations = await database.manager.find(NodeHistory, {
      where: {
        guild: validation.guild,
        endpoint_url: validation.endpoint_url,
        validation_date: MoreThan(new Date(validation.validation_date.valueOf() - this.timeOffset)),
      },
    });

    const validations = [];

    validations.push(this.createValidationObject(
      "endpoint_url_ok",
      validation.endpoint_url_ok,
      previousValidations.map((x) => x.endpoint_url_ok),
      "general",
      "Endpoint url is",
      "a valid url",
      "not a valid url"
    ))

    if (validation.is_ssl) {
      validations.push(this.createValidationObject(
        "ssl_ok",
        validation.ssl_ok,
        previousValidations.map((x) => x.ssl_ok),
        "general",
        "TLS is",
        "OK",
        "not OK",
        this.decodeHttpErrorMessage(validation.ssl_errortype)
      ))
    }

    validations.push(this.createValidationObject(
        "location_ok",
      validation.location_ok,
      previousValidations.map((x) => x.location_ok),
      "general",
      "Provided location in bp.json is",
      "valid",
      "invalid"
    ))

    validations.push(this.createRequestObjectFromConfig(
        "get_transactionget_transaction",
      validation.get_transaction_ok,
      previousValidations.map((x) => x.get_transaction_ok),
      "validation",
      "get_transaction test",
      "passed",
      "not passed",
      "nodeHistory_get_transaction",
      chainId,
      validation.get_transaction_ms,
      validation.get_transaction_httpcode,
      validation.get_transaction_errortype
    ))
    validations.push(this.createRequestObjectFromConfig(
        "get_actions",
      validation.get_actions_ok,
      previousValidations.map((x) => x.get_actions_ok),
      "validation",
      "get_actions test",
      "passed",
      "not passed",
      "nodeHistory_get_actions",
      chainId,
      validation.get_actions_ms,
      validation.get_actions_httpcode,
      validation.get_actions_errortype
    ))

    validations.push(this.createRequestObjectFromConfig(
        "get_key_accounts",
      validation.get_key_accounts_ok,
      previousValidations.map((x) => x.get_key_accounts_ok),
      "validation",
      "History get_key_accounts test",
      "passed",
      "not passed",
      "nodeHistory_get_key_accounts",
      chainId,
      validation.get_key_accounts_ms,
      validation.get_key_accounts_httpcode,
      validation.get_key_accounts_errortype
    ))

    return {
      id: validation.id,
      guild: validation.guild,
      validation_date: validation.validation_date,

      all_checks_ok: this.calculateValidationLevel(
        validation.all_checks_ok,
        previousValidations.map((x) => x.all_checks_ok)
      ),

      endpoint_url: validation.endpoint_url,
      is_ssl: validation.is_ssl,

      validations: validations
    };
  }

  /**
   * Maps the NodeHyperion Object returned by the Database to the Schema used by the GraphQl Api
   * ⚠️ ATTENTION: This code has to be adjusted whenever the database or GraphQL schema changes
   * @param {NodeHyperion} validation = single NodeHyperion Object returned by database
   */
  async mapNodeHyperionToSchema(validation: NodeHyperion, chainId: string) {
    const database = getConnection(chainId);
    const previousValidations = await database.manager.find(NodeHyperion, {
      where: {
        guild: validation.guild,
        endpoint_url: validation.endpoint_url,
        validation_date: MoreThan(new Date(validation.validation_date.valueOf() - this.timeOffset)),
      },
    });

    const validations = [];

    validations.push(this.createValidationObject(
      "endpoint_url_ok",
      validation.endpoint_url_ok,
      previousValidations.map((x) => x.endpoint_url_ok),
      "general",
      "Endpoint url is",
      "a valid url",
      "not a valid url"
    ))

    if (validation.is_ssl) {
      validations.push(this.createValidationObject(
        "ssl_ok",
        validation.ssl_ok,
        previousValidations.map((x) => x.ssl_ok),
        "general",
        "TLS is",
        "OK",
        "not OK",
        this.decodeHttpErrorMessage(validation.ssl_errortype)
      ))
    }

    validations.push(this.createValidationObject(
        "location_ok",
      validation.location_ok,
      previousValidations.map((x) => x.location_ok),
      "general",
      "Provided location in bp.json is",
      "valid",
      "invalid"
    ))

    validations.push(this.createRequestObjectFromConfig(
        "health",
      validation.health_found,
      previousValidations.map((x) => x.health_found),
      "health",
      "Hyperion Health",
      "found",
      "not found",
      "nodeHyperion_health",
      chainId,
      validation.health_ms,
      validation.health_httpcode,
      validation.health_errortype
    ))

    validations.push(this.createValidationObject(
        "health_version",
      validation.health_version_ok,
      previousValidations.map((x) => x.health_version_ok),
      "health",
      "Hyperion version",
      "is valid",
      "is not valid"
    ))

    validations.push(this.createValidationObject(
        "health_host",
      validation.health_host_ok,
      previousValidations.map((x) => x.health_host_ok),
      "health",
      "Hyperion Host",
      "was provided",
      "was not provided"
    ))

    validations.push(this.createValidationObject(
        "health_query_time",
      validation.health_query_time_ok,
      previousValidations.map((x) => x.health_query_time_ok),
      "health",
      "Hyperion query time",
      "is OK",
      "is not OK",
      validation.health_query_time_ms === null
        ? "was not provided"
        : "Query time is too high (" +
        validation.health_query_time_ms +
        "ms > " +
        config.get("validation.hyperion_query_time_ms") +
        "ms)"
    ))

    validations.push(this.createValidationObject(
        "health_features_tables_proposals",
      validation.health_features_tables_proposals,
      previousValidations.map((x) => x.health_features_tables_proposals),
      "health",
      "Hyperion feature tables/proposals is",
      getChainsConfigItem(chainId, "nodeHyperion_health_features_tables_proposals")
        ? "enabled"
        : "disabled",
      getChainsConfigItem(chainId, "nodeHyperion_health_features_tables_proposals")
        ? "disabled"
        : "enabled"
    ))

    validations.push(this.createValidationObject(
        "health_features_tables_accounts",
      validation.health_features_tables_accounts,
      previousValidations.map((x) => x.health_features_tables_accounts),
      "health",
      "Hyperion feature tables/accounts is",
      getChainsConfigItem(chainId, "nodeHyperion_health_features_tables_accounts")
        ? "enabled"
        : "disabled",
      getChainsConfigItem(chainId, "nodeHyperion_health_features_tables_accounts")
        ? "disabled"
        : "enabled"
    ))

    validations.push(this.createValidationObject(
        "health_features_tables_voters",
      validation.health_features_tables_voters,
      previousValidations.map((x) => x.health_features_tables_voters),
      "health",
      "Hyperion feature tables/voters is",
      getChainsConfigItem(chainId, "nodeHyperion_health_features_tables_voters")
        ? "enabled"
        : "disabled",
      getChainsConfigItem(chainId, "nodeHyperion_health_features_tables_voters")
        ? "disabled"
        : "enabled"
    ))

    validations.push(this.createValidationObject(
        "health_features_index_deltas",
      validation.health_features_index_deltas,
      previousValidations.map((x) => x.health_features_index_deltas),
      "health",
      "Hyperion feature index_deltas is",
      getChainsConfigItem(chainId, "nodeHyperion_health_features_index_deltas")
        ? "enabled"
        : "disabled",
      getChainsConfigItem(chainId, "nodeHyperion_health_features_index_deltas")
        ? "disabled"
        : "enabled"
    ))

    validations.push(this.createValidationObject(
        "health_features_index_transfer_memo",
      validation.health_features_index_transfer_memo,
      previousValidations.map((x) => x.health_features_index_transfer_memo),
      "health",
      "Hyperion feature index_transfer_memo is",
      getChainsConfigItem(chainId, "nodeHyperion_health_features_index_transfer_memo")
        ? "enabled"
        : "disabled",
      getChainsConfigItem(chainId, "nodeHyperion_health_features_index_transfer_memo")
        ? "disabled"
        : "enabled"
    ))

    validations.push(this.createValidationObject(
        "health_features_index_all_deltas",
      validation.health_features_index_all_deltas,
      previousValidations.map((x) => x.health_features_index_all_deltas),
      "health",
      "Hyperion feature index_all_deltas is",
      getChainsConfigItem(chainId, "nodeHyperion_health_features_index_all_deltas")
        ? "enabled"
        : "disabled",
      getChainsConfigItem(chainId, "nodeHyperion_health_features_index_all_deltas")
        ? "disabled"
        : "enabled"
    ))

    validations.push(this.createValidationObject(
        "health_features_deferred_trx",
      validation.health_features_deferred_trx,
      previousValidations.map((x) => x.health_features_deferred_trx),
      "health",
      "Hyperion feature deferred_trx is",
      getChainsConfigItem(chainId, "nodeHyperion_health_features_deferred_trx")
        ? "enabled"
        : "disabled",
      getChainsConfigItem(chainId, "nodeHyperion_health_features_deferred_trx")
        ? "disabled"
        : "enabled"
    ))

    validations.push(this.createValidationObject(
        "health_features_failed_trx",
      validation.health_features_failed_trx,
      previousValidations.map((x) => x.health_features_failed_trx),
      "health",
      "Hyperion feature failed_trx is",
      getChainsConfigItem(chainId, "nodeHyperion_health_features_failed_trx")
        ? "enabled"
        : "disabled",
      getChainsConfigItem(chainId, "nodeHyperion_health_features_failed_trx")
        ? "disabled"
        : "enabled"
    ))

    validations.push(this.createValidationObject(
        "health_features_resource_limits",
      validation.health_features_resource_limits,
      previousValidations.map((x) => x.health_features_resource_limits),
      "health",
      "Hyperion feature resource_limits is",
      getChainsConfigItem(chainId, "nodeHyperion_health_features_resource_limits")
        ? "enabled"
        : "disabled",
      getChainsConfigItem(chainId, "nodeHyperion_health_features_resource_limits")
        ? "disabled"
        : "enabled"
    ))

    validations.push(this.createValidationObject(
        "health_features_resource_usage",
      validation.health_features_resource_usage,
      previousValidations.map((x) => x.health_features_resource_usage),
      "health",
      "Hyperion feature resource_usage is",
      getChainsConfigItem(chainId, "nodeHyperion_health_features_resource_usage")
        ? "enabled"
        : "disabled",
      getChainsConfigItem(chainId, "nodeHyperion_health_features_resource_usage")
        ? "disabled"
        : "enabled"
    ))

    validations.push(this.createValidationObject(
        "health_all_features",
      validation.health_all_features_ok,
      previousValidations.map((x) => x.health_all_features_ok),
      "health",
      "Hyperion features are",
      "ok",
      "not ok"
    ))

    validations.push(this.createValidationObject(
        "health_elastic",
      validation.health_elastic_ok,
      previousValidations.map((x) => x.health_elastic_ok),
      "health",
      "Hyperion Elastic status is",
      "ok",
      "not ok"
    ))

    validations.push(this.createValidationObject(
        "health_rabbitmq",
      validation.health_rabbitmq_ok,
      previousValidations.map((x) => x.health_rabbitmq_ok),
      "health",
      "Hyperion RabbitMq status is",
      "ok",
      "not ok"
    ))

    validations.push(this.createValidationObject(
        "health_nodeosrpc",
      validation.health_nodeosrpc_ok,
      previousValidations.map((x) => x.health_nodeosrpc_ok),
      "health",
      "Hyperion NodesRpc status is",
      "ok",
      "not ok",
      validation.health_nodeosrpc_message
    ))

    validations.push(this.createValidationObject(
        "health_total_indexed_blocks",
      validation.health_total_indexed_blocks_ok,
      previousValidations.map((x) => x.health_total_indexed_blocks_ok),
      "health",
      "Hyperion",
      "total indexed block == last indexed block",
      "total indexed block != last indexed block",
      "Hyperion is missing " + validation.health_missing_blocks + " blocks"
    ))

    validations.push(this.createRequestObjectFromConfig(
        "get_transaction",
      validation.get_transaction_ok,
      previousValidations.map((x) => x.get_transaction_ok),
      "validation",
      "Hyperion get_transaction test",
      "passed",
      "not passed",
      "nodeHyperion_get_transaction",
      chainId,
      validation.get_transaction_ms,
      validation.get_transaction_httpcode,
      validation.get_transaction_errortype
    ))

    validations.push(this.createRequestObjectFromConfig(
        "get_actions",
      validation.get_actions_ok,
      previousValidations.map((x) => x.get_actions_ok),
      "validation",
      "Hyperion get_actions test",
      "passed",
      "not passed",
      "nodeHyperion_get_actions",
      chainId,
      validation.get_actions_ms,
      validation.get_actions_httpcode,
      validation.get_actions_errortype,
      validation.get_key_accounts_ok ? "" : "Action is older than 5min"
    ))

    validations.push(this.createRequestObjectFromConfig(
        "key_accounts",
      validation.get_key_accounts_ok,
      previousValidations.map((x) => x.get_key_accounts_ok),
      "validation",
      "Hyperion get_key_accounts test",
      "passed",
      "not passed",
      "nodeHyperion_get_key_accounts",
      chainId,
      validation.get_key_accounts_ms,
      validation.get_key_accounts_httpcode,
      validation.get_key_accounts_errortype
    ))

    return {
      id: validation.id,
      guild: validation.guild,
      validation_date: validation.validation_date,

      all_checks_ok: this.calculateValidationLevel(
        validation.all_checks_ok,
        previousValidations.map((x) => x.all_checks_ok)
      ),
      endpoint_url: validation.endpoint_url,
      is_ssl: validation.is_ssl,

      validations: validations
    };
  }

  /**
   * Maps the NodeAtomic Object returned by the Database to the Schema used by the GraphQl Api
   * ⚠️ ATTENTION: This code has to be adjusted whenever the database or GraphQL schema changes
   * @param {NodeWallet} validation = single NodeAtomic Object returned by database
   * @param {string} chainId = name of the current chain
   */
  async mapNodeAtomicToSchema(validation: NodeAtomic, chainId: string) {
    const database = getConnection(chainId);
    const previousValidations = await database.manager.find(NodeAtomic, {
      where: {
        guild: validation.guild,
        endpoint_url: validation.endpoint_url,
        validation_date: MoreThan(new Date(validation.validation_date.valueOf() - this.timeOffset)),
      },
    });

    const  validations = [];

    validations.push(this.createValidationObject(
      "ndpoint_url_ok",
      validation.endpoint_url_ok,
      previousValidations.map((x) => x.endpoint_url_ok),
      "general",
      "Endpoint url is",
      "a valid url",
      "not a valid url"
    ))

    if (validation.is_ssl) {
      validations.push(this.createValidationObject(
        "ssl_ok",
        validation.ssl_ok,
        previousValidations.map((x) => x.ssl_ok),
        "general",
        "TLS is",
        "OK",
        "not OK",
        this.decodeHttpErrorMessage(validation.ssl_errortype)
      ))
    }

    validations.push(this.createValidationObject(
        "location_ok",
      validation.location_ok,
      previousValidations.map((x) => x.location_ok),
      "general",
      "Provided location in bp.json is",
      "valid",
      "invalid"
    ))

    validations.push(this.createRequestObjectFromConfig(
        "health_found",
      validation.health_found,
      previousValidations.map((x) => x.health_found),
      "health",
      "Atomic health is",
      "reachable",
      "not reachable",
      "nodeAtomic_health",
      chainId,
      validation.health_ms,
      validation.health_httpcode,
      validation.health_errortype
    ))

    validations.push(this.createValidationObject(
        "health_postgres",
      validation.health_postgres_ok,
      previousValidations.map((x) => x.health_postgres_ok),
      "health",
      "Atomic Postgres status",
      "ok",
      "not ok"
    ))

    validations.push(this.createValidationObject(
        "health_redis",
      validation.health_redis_ok,
      previousValidations.map((x) => x.health_redis_ok),
      "health",
      "Atomic Redis status",
      "ok",
      "not ok"
    ))

    validations.push(this.createValidationObject(
        "health_chain",
      validation.health_chain_ok,
      previousValidations.map((x) => x.health_chain_ok),
      "health",
      "Atomic provided for",
      "correct chain",
      "wrong chain"
    ))

    validations.push(this.createValidationObject(
        "health_total_indexed_blocks",
      validation.health_total_indexed_blocks_ok,
      previousValidations.map((x) => x.health_total_indexed_blocks_ok),
      "health",
      "Atomic",
      "total indexed block == last indexed block",
      "total indexed block != last indexed block",
      "Atomic is " + validation.health_missing_blocks + " blocks behind"
    ))

    validations.push(this.createRequestObjectFromConfig(
        "alive",
      validation.alive_ok,
      previousValidations.map((x) => x.alive_ok),
      "health",
      "Atomic alive check",
      "successful",
      "not successful",
      "nodeAtomic_alive",
      chainId,
      validation.alive_ms,
      validation.alive_httpcode,
      validation.alive_errortype,
      validation.alive_message
    ))

    validations.push(this.createRequestObjectFromConfig(
        "assets",
      validation.assets_ok,
      previousValidations.map((x) => x.assets_ok),
      "validation",
      "Atomic assets test",
      "passed",
      "not passed",
      "nodeAtomic_assets",
      chainId,
      validation.assets_ms,
      validation.assets_httpcode,
      validation.assets_errortype
    ))
    validations.push(this.createRequestObjectFromConfig(
        "collections",
      validation.collections_ok,
      previousValidations.map((x) => x.collections_ok),
      "validation",
      "Atomic collections test",
      "passed",
      "not passed",
      "nodeAtomic_collections",
      chainId,
      validation.collections_ms,
      validation.collections_httpcode,
      validation.assets_errortype
    ))
    validations.push(this.createRequestObjectFromConfig(
        "schemas",
      validation.schemas_ok,
      previousValidations.map((x) => x.schemas_ok),
      "validation",
      "Atomic schemas test",
      "passed",
      "not passed",
      "nodeAtomic_schemas",
      chainId,
      validation.schemas_ms,
      validation.schemas_httpcode,
      validation.schemas_errortype
    ))

    return {
      id: validation.id,
      guild: validation.guild,
      validation_date: validation.validation_date,

      all_checks_ok: this.calculateValidationLevel(
        validation.all_checks_ok,
        previousValidations.map((x) => x.all_checks_ok)
      ),

      endpoint_url: validation.endpoint_url,

      is_ssl: validation.is_ssl,

      validations: validations
    };
  }

  async getGuilds(chainName: string) {
    const chainId = getChainIdFromName(chainName);
    if (!chainId)
      return {};

    if (guildCache[chainId])
      return guildCache[chainId];

    return this.generateGuildList(chainName);
  }

  async generateGuildList(chainName: string) {
    const chainId = getChainIdFromName(chainName);
    if (!chainId)
      return {};

    const database = getConnection(chainId);
    const guilds = await database.manager.find(Guild);

    if (!guilds) return {};

    const guildObjects = [];

    guilds.forEach(x => {
      guildObjects.push(this.mapGuildToSchema(x, chainId));
    })

    return guildObjects;
  }

  async mapGuildToSchema(guild: Guild, chainId: string) {
    const database = getConnection(chainId);

    const infrastructureStatus = []

    const validation = await database.manager.findOne(Validation, {
      where: {
        id: guild.last_validation_id,
      },
    });

    if (validation) {
      const previousValidations = await database.manager.find(Validation, {
        where: {
          guild: guild.name,
          validation_date: MoreThan(new Date(validation.validation_date.valueOf() - this.timeOffset)),
        },
      });

      infrastructureStatus.push({
        name: "organization",
        status: this.calculateValidationLevel(validation.all_checks_ok,
          previousValidations.map((x) => x.all_checks_ok))
      })

      infrastructureStatus.push({
        name: "seed",
        status: this.combineValidationLevels(
          validation.nodes_seed.map((x) => x.all_checks_ok))
      })

      infrastructureStatus.push({
        name: "api",
        status: this.combineValidationLevels(
          validation.nodes_api.map((x) => x.all_checks_ok))
      })

      infrastructureStatus.push({
        name: "wallet",
        status: this.combineValidationLevels(
          validation.nodes_wallet.map((x) => x.all_checks_ok))
      })

      infrastructureStatus.push({
        name: "history",
        status: this.combineValidationLevels(
          validation.nodes_history.map((x) => x.all_checks_ok))
      })

      infrastructureStatus.push({
        name: "hyperion",
        status: this.combineValidationLevels(
          validation.nodes_hyperion.map((x) => x.all_checks_ok))
      })

      infrastructureStatus.push({
        name: "atomic",
        status: this.combineValidationLevels(
          validation.nodes_atomic.map((x) => x.all_checks_ok))
      })
    }

    return {
      name: guild.name,
      tracked_since: guild.tracked_since,
      location: guild.location,
      url: guild.url,
      url_logo_256: guild.url_logo_256,
      last_validation_id: guild.last_validation_id,

      infrastructureStatus: infrastructureStatus
    }
  }

  /**
   * Create ValidationObject as described in /src/schemas.ts with status and message field
   * ⚠️ ATTENTION: This code has to be adjusted whenever the GraphQL schema for ValidationObject changes
   * @param {boolean} validationLevelCurrent = Status of the current validation (false -> validation is failing)
   * @param {boolean []} validationLevelPrevious = Statuses of the previous validations. No limit on amount of previous validations
   * @param {string} header = category of the validation. Displayed next to the message
   * @param {string} message = Start of the message. At the end the either the correct of incorrect message will be added
   * @param {string} correctMessage = Message added in case the validation is working
   * @param {string} incorrectMessage = Message added in case the validation is failing
   * @param {string} details = Details of the validation (displayed under the message)
   * @return {{status: number, message: string}} = Status and message formatted as ValidationObject as described in /src/schemas.ts
   */
  createValidationObject(
    validationName: string,
    validationLevelCurrent: ValidationLevel,
    validationLevelPrevious: ValidationLevel[],
    header: string,
    message: string,
    correctMessage: string,
    incorrectMessage: string,
    details: string = null
  ): {validationName: string; status: number; header: string; message: string; details: string } {
    const validationLevel = this.calculateValidationLevel(validationLevelCurrent, validationLevelPrevious);

    return {
      validationName: validationName,
      status: validationLevel,
      header: header,
      message:
        message +
        (message === "" ? "" : " ") +
        (validationLevel >= ValidationLevel.SUCCESS ? correctMessage : incorrectMessage),
      details: (validationLevel < ValidationLevel.SUCCESS ? details : null),
    };
  }

  createRequestObject(
    validationName: string,
    validationLevelCurrent: ValidationLevel,
    validationLevelPrevious: ValidationLevel[],
    header: string,
    message: string,
    correctMessage: string,
    incorrectMessage: string,
    url: { base: string; path?: string },
    requestMs: number,
    httpCode: number,
    errorType: HttpErrorType,
    details: string = null
  ): {
    validationName: string;
    status: number;
    header: string;
    message: string;
    details: string;
    url: string;
    payload: string;
    method: string;
    requestTimeoutMs: number;
    requestMs: number;
    httpCode: number;
    errorType: HttpErrorType;
    errorMessage: string;
  } {
    const validationObject = this.createValidationObject(
      validationName,
      validationLevelCurrent,
      validationLevelPrevious,
      header,
      message,
      correctMessage,
      incorrectMessage,
      details
    );

    // todo: combine url and path
    return {
      validationName: validationObject.validationName,
      status: validationObject.status,
      header: validationObject.header,
      message: validationObject.message,
      details: validationObject.details,
      url: url.base,
      payload: null,
      method: "GET",
      requestTimeoutMs: config.get("validation.request_timeout_ms"),
      requestMs: requestMs,
      httpCode: httpCode,
      errorType: errorType,
      errorMessage: this.decodeHttpErrorMessage(errorType)
    };
  }

  createRequestObjectFromConfig(
    validationName: string,
    validationLevelCurrent: ValidationLevel,
    validationLevelPrevious: ValidationLevel[],
    header: string,
    message: string,
    correctMessage: string,
    incorrectMessage: string,
    validationKey: string,
    chainId: string,
    requestMs: number,
    httpCode: number,
    errorType: HttpErrorType,
    details: string = null
  ): {
    validationName: string;
    status: number;
    header: string;
    message: string;
    details: string;
    url: string;
    payload: string;
    method: string;
    requestTimeoutMs: number;
    requestMs: number;
    httpCode: number;
    errorType: HttpErrorType;
    errorMessage: string;
  } {
    const validationObject = this.createValidationObject(
      validationName,
      validationLevelCurrent,
      validationLevelPrevious,
      header,
      message,
      correctMessage,
      incorrectMessage,
      details
    );

    let path = validationConfig[validationKey].path;
    let payload = validationConfig[validationKey].payload;
    try {
      if (validationConfig[validationKey].variables !== null) {
        validationConfig[validationKey].variables.forEach((x) => {
          if (path) path = path.replace(x, getChainsConfigItem(chainId, x));
          if (payload) payload = payload.replace(x, getChainsConfigItem(chainId, x));
        });
      }
    } catch (e) {
      logger.fatal(
        "Error during reading path and payload from config. Likely an error in ./config/chains.csv or ./config/validation-config/*.json \nPath: " +
          path +
          "\nPayload: " +
          payload +
          e
      );
    }

    return {
      validationName: validationObject.validationName,
      status: validationObject.status,
      header: validationObject.header,
      message: validationObject.message,
      details: validationObject.details,
      url: path,
      payload: payload,
      method: validationConfig[validationKey].requestMethod,
      requestTimeoutMs: config.get("validation.request_timeout_ms"),
      requestMs: requestMs,
      httpCode: httpCode,
      errorType: errorType,
      errorMessage:this.decodeHttpErrorMessage(errorType)
    };
  }

  /**
   * Returns status of validationLevel
   * @param {boolean} validationLevelCurrent = status of current validations
   * @param {boolean[]} validationLevelPrevious = Statuses of the previous validations. No limit on amount of previous validations
   * @return {number} = Status calculated from current and previous validations
   */
  calculateValidationLevel(
    validationLevelCurrent: ValidationLevel,
    validationLevelPrevious: ValidationLevel[]
  ): ValidationLevel {
    switch (validationLevelCurrent) {
      // If current validationLevel is success check if previous Validations are success as well
      case ValidationLevel.SUCCESS: {
        let allPreviousSuccess = true;
        validationLevelPrevious.forEach((x) => {
          if (x !== ValidationLevel.SUCCESS) allPreviousSuccess = false;
        });

        if (allPreviousSuccess) return ValidationLevel.SUCCESSALL;
        else return ValidationLevel.SUCCESS;
      }
      case ValidationLevel.WARN:
        return ValidationLevel.WARN;
      case ValidationLevel.INFO:
        return ValidationLevel.INFO;
      default:
        return ValidationLevel.ERROR;
    }
  }

  combineValidationLevels(validationLevels: ValidationLevel[]) {
    if (validationLevels.length === 0)
      return ValidationLevel.ERROR;
    else {
      let maxLevel = ValidationLevel.SUCCESSALL;
      validationLevels.forEach(x => {
        if (x < maxLevel)
          maxLevel = x;
      })

      return maxLevel;
    }
  }

  decodeHttpErrorMessage(httpError: HttpErrorType): string {
    switch (httpError) {
      case HttpErrorType.SSL:
        return "Invalid SSL certificate";
      case HttpErrorType.TIMEOUT:
        return "Timeout during request";
      case HttpErrorType.DNS:
        return "DNS Error: Host could not be resolved";
      case HttpErrorType.HTTP:
        return "Http Error during request";
      case HttpErrorType.INVALIDURL:
        return "Invalid URL";
      case HttpErrorType.OTHER:
        return "An unspecified error occurred (most likely ECONNREFUSED, EPROTO or ECONNRESET)";
      case HttpErrorType.UNKNOWN:
        return "An unspecified error occurred (most likely ECONNREFUSED, EPROTO or ECONNRESET)";
      default:
        return null;
    }
  }
}

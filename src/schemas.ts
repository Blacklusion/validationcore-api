import { gql } from "apollo-server-express";

// language=GraphQL
export const typeDefs = gql`
    type Query {
        hello: String!
        getValidationById(id: String!, chainName: String!): Validation
        getGuilds(chainName: String!): [Guild]
    }

    type ValidationObject {
        validationName: String!
        status: Int!
        header: String!
        message: String!
        details: String
    }

    type RequestObject {
        validationName: String!
        status: Int!
        header: String!
        message: String!
        details: String
        url: String!
        payload: String
        method: String!
        requestTimeoutMs: Int
        requestMs: Int
        httpCode: Int
        errorType: Int
        errorMessage: String
    }

    union ValidationObjectUnion = ValidationObject | RequestObject
    
    type InfrastructureObject {
        name: String!
        status: Int!
        uptimePercentage: Int
    }

  type Guild {
        name: String!
        tracked_since: Date!
        location: Int
        url: String
        url_logo_256: String
        last_validation_id: String
        
        infrastructureStatus: [InfrastructureObject]
        }
        
    type Validation {
        id: String!
        guild: String!
        guild_logo_256_url: String
        validation_date: Date!

        all_checks_ok: Int!

        validations: [ValidationObjectUnion]

        #    reg_location: ValidationObject
        #    reg_website: RequestObject
        #
        #    chains_json: RequestObject
        #    chains_json_access_control_header: ValidationObject
        #
        #    bpjson: RequestObject
        #    bpjson_producer_account_name: ValidationObject
        #    bpjson_candidate_name: ValidationObject
        #    bpjson_website: RequestObject
        #    bpjson_code_of_conduct: RequestObject
        #    bpjson_ownership_disclosure: RequestObject
        #    bpjson_email: ValidationObject
        #    bpjson_github_user: ValidationObject
        #    bpjson_chain_resources: ValidationObject
        #    bpjson_other_resources: ValidationObject
        #    bpjson_branding: ValidationObject
        #    bpjson_location: ValidationObject
        #    bpjson_social: ValidationObject
        #    bpjson_matches_onchain: ValidationObject
        #
        #    nodes_producer: ValidationObject
        nodes_seed: [NodeSeed]
        nodes_api: [NodeApi]
        nodes_wallet: [NodeWallet]
        nodes_history: [NodeHistory]
        nodes_hyperion: [NodeHyperion]
        nodes_atomic: [NodeAtomic]
    }

    type NodeSeed {
        id: String!
        guild: String!
        validation_date: Date!
        endpoint_url: String!

        all_checks_ok: Int!

        validations: [ValidationObjectUnion]

#        location_ok: ValidationObject
#        endpoint_url_ok: ValidationObject
#        p2p_connection_possible: ValidationObject
#        block_transmission_speed_ok: ValidationObject
    }

    type NodeApi {
        id: String!
        guild: String!
        validation_date: Date!
        is_ssl: Boolean!
        endpoint_url: String!
        server_version: String
        
        all_checks_ok: Int!

        validations: [ValidationObjectUnion]

#        location_ok: ValidationObject
#        endpoint_url_ok: ValidationObject
#
#        ssl_ok: ValidationObject
#
#        get_info: ValidationObject
#        server_version_ok: ValidationObject
#        correct_chain: ValidationObject
#        head_block_delta: ValidationObject
#        block_one: ValidationObject
#        verbose_error: ValidationObject
#        abi_serializer: ValidationObject
#        basic_symbol: ValidationObject
#        producer_api: ValidationObject
#        db_size_api: ValidationObject
#        net_api: ValidationObject
    }
    type NodeWallet {
        id: String!
        guild: String!
        validation_date: Date!
        endpoint_url: String!
        is_ssl: Boolean!

        all_checks_ok: Int!

        validations: [ValidationObjectUnion]

#        location_ok: ValidationObject
#
#        endpoint_url_ok: ValidationObject
#
#        ssl_ok: ValidationObject
#
#        get_accounts: ValidationObject
#        get_keys: ValidationObject
    }

    type NodeHistory {
        id: String!
        guild: String!
        validation_date: Date!
        endpoint_url: String!
        is_ssl: Boolean!

        all_checks_ok: Int!

        validations: [ValidationObjectUnion]
        
#        location_ok: ValidationObject
#
#        endpoint_url_ok: ValidationObject
#        ssl_ok: ValidationObject
#
#        get_transaction: ValidationObject
#        get_actions: ValidationObject
#        get_key_accounts: ValidationObject
    }

    type NodeHyperion {
        id: String!
        guild: String!
        validation_date: Date!
        endpoint_url: String
        is_ssl: Boolean!

        all_checks_ok: Int!

        validations: [ValidationObjectUnion]

#        location_ok: ValidationObject
#        endpoint_url_ok: ValidationObject

#        ssl_ok: ValidationObject

#        health: ValidationObject
#        health_version: ValidationObject
#        health_host: ValidationObject
#        health_query_time: ValidationObject
#        health_features_tables_proposals: ValidationObject
#        health_features_tables_accounts: ValidationObject
#        health_features_tables_voters: ValidationObject
#        health_features_index_deltas: ValidationObject
#        health_features_index_transfer_memo: ValidationObject
#        health_features_index_all_deltas: ValidationObject
#        health_features_deferred_trx: ValidationObject
#        health_features_failed_trx: ValidationObject
#        health_features_resource_limits: ValidationObject
#        health_features_resource_usage: ValidationObject
#        health_all_features: ValidationObject
#        health_nodeosrpc: ValidationObject
#        health_elastic: ValidationObject
#        health_rabbitmq: ValidationObject
#        health_total_indexed_blocks: ValidationObject
#
#        get_transaction: ValidationObject
#        get_actions: ValidationObject
#        get_key_accounts: ValidationObject
    }

    type NodeAtomic {
        id: String!
        guild: String!
        validation_date: Date!
        endpoint_url: String!
        is_ssl: Boolean!

        all_checks_ok: Int!

        validations: [ValidationObjectUnion]

#        location_ok: ValidationObject
#        endpoint_url_ok: ValidationObject
#
#        ssl_ok: ValidationObject
#
#        health_found: ValidationObject
#        health_postgres: ValidationObject
#        health_redis: ValidationObject
#        health_chain: ValidationObject
#        health_total_indexed_blocks: ValidationObject
#        alive: ValidationObject
#        assets: ValidationObject
#        collections: ValidationObject
#        schemas: ValidationObject
    }

    scalar Date
`;

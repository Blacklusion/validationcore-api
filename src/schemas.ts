import { gql } from "apollo-server-express"

// language=GraphQL
export const typeDefs = gql`
    
    type Query {
        hello: String!
        getValidationById: Validation
    }

    type Validation {
        id: Int
        guild: String
        validation_date: Date
        chain_id: String

        reg_location: ValidationObject
        reg_website: ValidationObject

        chains_json: ValidationObject
        chains_json_access_control_header: ValidationObject

        bpjson_found: ValidationObject
        bpjson_producer_account_name: ValidationObject
        bpjson_candidate_name: ValidationObject
        bpjson_website: ValidationObject
        bpjson_code_of_conduct: ValidationObject
        bpjson_ownership_disclosure: ValidationObject
        bpjson_email: ValidationObject
        bpjson_github_user: ValidationObject
        bpjson_chain_resources: ValidationObject
        bpjson_other_resources: ValidationObject
        bpjson_branding: ValidationObject
        bpjson_location: ValidationObject
        bpjson_social: ValidationObject
        bpjson_matches_onchain: ValidationObject

        nodes_producer: ValidationObject
        nodes_seed: [NodeSeed]
        nodes_api: [NodeApi]
        nodes_history: [NodeHistory]
        nodes_hyperion: [NodeHyperion]
        nodes_atomic: [NodeAtomic]
    }
    
    type ValidationObject {
        status: Boolean
        message: String
    }

    type NodeSeed {
        id: Int
        guild: String
        validation_date: Date
        chain_id: String

        p2p_endpoint: String

        location: ValidationObject
    
        all_checks_ok: Boolean

        p2p_endpoint_address_ok: ValidationObject
        p2p_connection_possible: ValidationObject
        block_transmission_speed: ValidationObject
    }

    type NodeApi {
        id: Int
        guild: String
        validation_date: Date
        chain_id: String
        
        all_checks_ok: Boolean
        api_endpoint: String
        is_ssl: Boolean
        
        ssl_ok: ValidationObject
        location: ValidationObject
        get_info: ValidationObject
        server_version: ValidationObject
        correct_chain: ValidationObject
        head_block_delta: ValidationObject
        block_one: ValidationObject
        verbose_error: ValidationObject
        abi_serializer: ValidationObject
        basic_symbol: ValidationObject
        producer_api: ValidationObject
        db_size_api: ValidationObject
        net_api: ValidationObject
        wallet_accounts: ValidationObject
        wallet_keys: ValidationObject
        wallet_all_checks: ValidationObject
        bp_json_all_features: ValidationObject
    }
    
    type NodeHistory {
        id: Int
        guild: String
        validation_date: Date
        chain_id: String
    
        all_checks_ok: Boolean
        api_endpoint: String
        is_ssl: Boolean
    
        ssl: ValidationObject
        transaction: ValidationObject
        actions: ValidationObject
        key_accounts: ValidationObject
    }
    
    type NodeHyperion {
        id: Int
        guild: String
        validation_date: Date
        chain_id: String
        
        all_checks_ok: Boolean
        api_endpoint: String
        is_ssl: Boolean
        
        ssl: ValidationObject
        health_found: ValidationObject
        health_version: ValidationObject
        health_host: ValidationObject
        health_query_time: ValidationObject
        health_all_features: ValidationObject
        health_elastic: ValidationObject
        health_rabbitmq: ValidationObject
        health_nodeosrpc: ValidationObject
        health_total_indexed_blocks: ValidationObject
        transaction: ValidationObject
        actions: ValidationObject
        key_accounts: ValidationObject
    }
    
    type NodeAtomic {
        id: Int
        guild: String
        validation_date: Date
        chain_id: String
        
        all_checks_ok: Boolean
        api_endpoint: String
        is_ssl: Boolean
        
        ssl: ValidationObject
        location: ValidationObject
        health_found: ValidationObject
        health_postgres: ValidationObject
        health_redis: ValidationObject
        health_chain: ValidationObject
        health_services: ValidationObject
        health_total_indexed_blocks: ValidationObject
        assets: ValidationObject
        collections: ValidationObject
        schemas: ValidationObject
    }

    scalar Date
`;

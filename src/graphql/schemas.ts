import { gql } from "apollo-server-express";

// language=GraphQL
export const typeDefs = gql`
    type Query {
        hello: String!
        getValidationById(id: String!): Validation
        getValidationByGuild(guild: String!): Validation
        getGuilds: [Guild]
        getEndpoints(nodeType: NodeType!, timeOffsetInMs: Int, queryMethod: QueryMethod, getOnlyWorking: Boolean): [Node]
    }

    scalar Date

    type ValidationObject {
        validation_name: String!
        status: Int!
        header: String
        message: String
        details: String
    }

    type RequestObject {
        validation_name: String!
        status: Int!
        header: String
        message: String
        details: String
        url: String
        payload: String
        method: String
        request_timeout_ms: Int
        request_ms: Int
        http_code: Int
        error_type: Int
        error_message: String
    }

    union ValidationObjectUnion = ValidationObject | RequestObject

    type AvailabilityValue {
        date: Date!
        availability: Int!
    }

    type Statistics {
        availability: [AvailabilityValue]
    }

    type Guild {
        name: String!
        tracked_since: Date
        location: Int
        location_alpha: String
        rank: Int
        website_url: String
        url_logo_256: String
        last_validation_id: String
        last_validation: Validation
    }

    type Validation {
        id: String!
        guild: String!
        guild_logo_256_url: String
        validation_date: Date!

        all_checks_ok: Int!

        validations: [ValidationObjectUnion]
        nodes: [NodeValidationArray]
    }

    type NodeValidation {
        node_type: String!

        id: String
        guild: String
        validation_date: Date
        endpoint_url: String!
        server_version: String
        is_ssl: Boolean
        location_longitude: Float
        location_latitude: Float

        all_checks_ok: Int

        validations: [ValidationObjectUnion]

        statistics: Statistics
    }

    type NodeValidationArray {
        node_type: String!
        nodes: [NodeValidation]
    }

    type Node {
        endpoint_url: String!
        guild: String
        is_ssl: Boolean
        location_longitude: Float
        location_latitude: Float
        server_version: String
        all_checks_ok: Int
    }
    
    enum NodeType {
        NODE_SEED
        NODE_API
        NODE_WALLET
        NODE_HISTORY
        NODE_HYPERION
        NODE_ATOMIC
    }

    enum QueryMethod {
        ATLEAST_ONE_SUCCESSFUL_VALIDATION
        ALL_SUCCESSFUL_VALIDATION
    }
`;

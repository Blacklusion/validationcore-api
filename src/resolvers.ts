import { gql } from "apollo-server-express"

// language=GraphQL
export const resolvers = {
  Query: {
    hello: () => 'Hello world from Blacklusion',
    getValidationById: () => null
  },
};
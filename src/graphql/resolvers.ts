// language=GraphQL
import { logger } from "../validationcore-database-scheme/common";

export const resolvers = {
  ValidationObjectUnion: {
    __resolveType(obj, context, info) {
      if (obj.url) return "RequestObject";

      return "ValidationObject";
    },
  },

  Query: {
    hello: (): string => {
      return "Hello from Blacklusion";
    },
    getValidationById: async (_, { id }, { dataSources }) => {
      logger.info("[request] getValidationById for " + id);
      return await dataSources.databaseConnector.getValidationById(id);
    },
    getValidationByGuild: async (_, { guild, chainName }, { dataSources }) => {
      logger.info("[request] getValidationByGuild for " + guild);
      return await dataSources.databaseConnector.getValidationByGuild(guild);
    },
    getGuilds: async (_, __, { dataSources }) => {
      logger.info("[request] getGuilds");
      return await dataSources.databaseConnector.getGuilds();
    },
    getEndpoints: async (_, {nodeType, timeOffsetInMs, queryMethod, getOnlyWorking}, {dataSources}) => {
      logger.info("[request] getEndpoints -> " + nodeType);
      return await dataSources.databaseConnector.getEndpoints(nodeType, timeOffsetInMs, queryMethod, getOnlyWorking);
    }
  },
};

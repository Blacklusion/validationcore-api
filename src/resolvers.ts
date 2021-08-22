
// language=GraphQL
export const resolvers = {
  ValidationObjectUnion: {
    __resolveType(obj, context, info) {
      if(obj.url)
      return 'RequestObject';

      return 'ValidationObject';
      },
  },

  Query: {
    hello: (): string => {
      return "Hello from Blacklusion";
    },
    getValidationById: async (_, { id, chainName }, { dataSources }) => {
      return await dataSources.databaseConnector.getValidationById(id, chainName);
    },
    getGuilds: async (_, { chainName }, { dataSources }) => {
      return await dataSources.databaseConnector.getGuilds(chainName);
    },
  },
};

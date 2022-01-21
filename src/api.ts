import { logger } from "./validationcore-database-scheme/common";
import * as express from "express";
import { ApolloServer } from "apollo-server-express";
import { resolvers } from "./graphql/resolvers";
import { typeDefs } from "./graphql/schemas";
import { DatabaseConnector } from "./datasources/postgres/DatabaseConnector";

/**
 * Starts the API as Express server
 */
export function start(): void {
  // Express configuration
  const app = express();
  const port = 8080;

  // Apollo configuration
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    playground: true,
    dataSources: () => ({
      databaseConnector: new DatabaseConnector(),
    }),
  });

  // Add Apollo Server to Express Server
  server.applyMiddleware({ app });

  // Start server
  app.listen(port, () => {
    logger.info(
      "Api started! Accepting incoming requests on port " +
        port +
        "..." +
        " Use " +
        server.graphqlPath +
        " for graphql queries"
    );
  });
}

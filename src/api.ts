import { logger } from "./validationcore-database-scheme/common";
import * as express from "express";
import { ApolloServer, gql } from "apollo-server-express";
import { resolvers } from "./resolvers";
import { typeDefs } from "./schemas";
import { DatabaseConnector } from "./datasources/DatabaseConnector";

/**
 * Starts the API as Express server
 */
export function start(): void {
  // Express configuration
  const app = express();
  const port = 8080;

  /*
  // Default Route: All requests that don't match a route will be handled here
  app.use(function (req, res) {
    res.status(404).send("Invalid route.");
  });

   */

  // Apollo configuration
  const server = new ApolloServer({
    typeDefs,
    resolvers,
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

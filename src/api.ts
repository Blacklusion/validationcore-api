import { getConnection } from "typeorm";
import { logger } from "./common";
import * as express from "express";
import { buildSchema } from "graphql";
import { ApolloServer, gql } from "apollo-server-express";
import { resolvers } from "./resolvers";
import { typeDefs } from "./schemas";

/**
 * Starts the API as Express server
 */
export function start() {



//  const database = getConnection();

  /**
   * DEFAULT ROUTE: All requests that don't match a route will be handled here
   */
  /*
  api.post("/", (req, res) => {
    res.status(404).send("Invalid route.");
  });
*/

  /**
   * Returns all working Api Endpoints
   *
   * Requests have to have the following format: /get_validation_by_id?guild=value&validation=value
   */

  /**
   * START Express Server
   */

  const app = express();
  const server = new ApolloServer({ typeDefs, resolvers });
  const port = 8080;

  server.applyMiddleware({ app })
  app.listen(port, () => {
    logger.info(
      "Api started! Accepting incoming requests on port " + port + "..." + "\n use " + server.graphqlPath + " for graphql queries"
    );
  });
}

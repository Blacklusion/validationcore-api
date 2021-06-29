import { logger } from "./common";
import { createConnection } from "typeorm";
import * as config from "config";
import * as api from "./api"

/**
 * Responsible for API startup. Validates the config and exposes the API
 */
export function main(): void {
  // Text generated by https://patorjk.com/software/taag/#p=display&f=Slant&t=Validationcore%20Api
  console.log(
    " _    __      ___     __      __  _                                     ___          _ \n" +
      "| |  / /___ _/ (_)___/ /___ _/ /_(_)___  ____  _________  ________     /   |  ____  (_)\n" +
      "| | / / __ `/ / / __  / __ `/ __/ / __ \\/ __ \\/ ___/ __ \\/ ___/ _ \\   / /| | / __ \\/ / \n" +
      "| |/ / /_/ / / / /_/ / /_/ / /_/ / /_/ / / / / /__/ /_/ / /  /  __/  / ___ |/ /_/ / /  \n" +
      "|___/\\__,_/_/_/\\__,_/\\__,_/\\__/_/\\____/_/ /_/\\___/\\____/_/   \\___/  /_/  |_/ .___/_/   \n" +
      "                                                                          /_/          "
  );
  console.log("    by Blacklusion - 2021\n\n");

  logger.info("Starting up Validationcore api...");

  if (!checkConfig()) {
    logger.fatal("Not all variables were set, aborting startup!");
    return;
  }


  // createConnection({
  //   type: "postgres",
  //   host: config.get("database.postgres_host"),
  //   port: config.get("database.postgres_port"),
  //   username: config.get("database.postgres_user"),
  //   password: config.get("database.postgres_password"),
  //   database: config.get("database.postgres_db"),
  //   entities: [__dirname + "/database/entity/*{.js,.ts}"],
  //   synchronize: true,
  // })
  //   .then(async (database) => {
  //     logger.info("Successfully connected to database");
  //
  //     logger.info("++++++++  STARTUP COMPLETE  ++++++++");
  //
  //     /**
  //      * START API (express server)
  //      */
  //     api.start();
  //   })
  //   .catch((error) => {
  //     logger.error("Error while connecting to database ", error);
  //   });

  api.start()
}

/**
 * Checks if all necessary settings are provided in config/local.toml
 * @return {boolean} = if true all settings are set correctly. Otherwise false is returned
 */
function checkConfig(): boolean {
  let allVariablesSet = true;

  const settings = [
    // Logging_level must not be provided -> defaults to info
    ["database.postgres_host", "string"],
    ["database.postgres_port", "number"],
    ["database.postgres_user", "string"],
    ["database.postgres_password", "string"],
    ["database.postgres_db", "string"],
  ];

  settings.forEach((setting) => {
    try {
      const configItem = config.get(setting[0]);
      if (setting[1] === "url") {
        try {
          new URL(configItem);
        } catch (e) {
          logger.error(setting[0] + " was provided. But it is not a valid url.");
          allVariablesSet = false;
        }
      } else if (
        (setting[1] === "array" && !Array.isArray(configItem)) ||
        (setting[1] !== "array" && !(typeof configItem === setting[1]))
      ) {
        logger.error(setting[0] + " was provided. But it is not of type " + setting[1]);
        allVariablesSet = false;
      }
    } catch (e) {
      logger.error(setting[0] + " was not provided!");
      allVariablesSet = false;
    }
  });

  return allVariablesSet;
}
main();

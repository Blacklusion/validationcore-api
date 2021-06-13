import { Logger } from "tslog";

/**
 * Global logger settings
 */
export const logger: Logger = new Logger({
    name: "General",
    minLevel: "info",
    displayLoggerName: true,
    displayFilePath: "hidden",
});
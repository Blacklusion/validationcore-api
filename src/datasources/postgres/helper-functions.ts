import { ValidationLevel } from "../../validationcore-database-scheme/enum/ValidationLevel";
import { HttpErrorType } from "../../validationcore-database-scheme/enum/HttpErrorType";
import * as config from "config";
import { getChainsConfigItem, validationConfig } from "../../validationcore-database-scheme/readConfig";
import { logger } from "../../validationcore-database-scheme/common";
import { CHAIN_ID } from "../../index";

/**
 * Create ValidationObject as described in /src/schemas.ts with status and message field
 * @param {string} validationName = internal Key of the validation
 * @param {boolean} validationLevelCurrent = Status of the current validation
 * @param {boolean []} validationLevelPrevious = Statuses of the previous validations
 * @param {string} header = category of the validation. Displayed next to the message
 * @param {string} message = Start of the message. At the end the either the correct of incorrect message will be added
 * @param {string} correctMessage = Message added in case the validation is working
 * @param {string} incorrectMessage = Message added in case the validation is failing
 * @param {string} details = Details of the validation (displayed under the message)
 * @return {{ validation_name: string, status: number, header: string, message: string, details: string }} = ValidationObject as described in /src/schemas.ts
 */
export function createValidationObject(
  validationName: string,
  validationLevelCurrent: ValidationLevel,
  validationLevelPrevious: ValidationLevel[],
  header: string,
  message: string,
  correctMessage: string,
  incorrectMessage: string,
  details: string = null
): { validation_name: string; status: number; header: string; message: string; details: string } {
  const validationLevel = compareToPreviousValidationLevels(validationLevelCurrent, validationLevelPrevious);

  return {
    validation_name: validationName,
    status: validationLevel,
    header: header,
    message:
      message +
      (message === "" ? "" : " ") +
      (validationLevel >= ValidationLevel.SUCCESS ? correctMessage : incorrectMessage),
    details: validationLevel < ValidationLevel.SUCCESS ? details : null,
  };
}

/**
 * Returns a RequestObject as defined in schema, without using data from config
 */
// eslint-disable-next-line require-jsdoc
export function createRequestObject(
  validationName: string,
  validationLevelCurrent: ValidationLevel,
  validationLevelPrevious: ValidationLevel[],
  header: string,
  message: string,
  correctMessage: string,
  incorrectMessage: string,
  url: { base: string; path?: string },
  requestMs: number,
  httpCode: number,
  errorType: HttpErrorType,
  details: string = null
): {
  validation_name: string;
  status: number;
  header: string;
  message: string;
  details: string;
  url: string;
  payload: string;
  method: string;
  request_timeout_ms: number;
  request_ms: number;
  http_code: number;
  error_type: HttpErrorType;
  error_message: string;
} {
  const validationObject = createValidationObject(
    validationName,
    validationLevelCurrent,
    validationLevelPrevious,
    header,
    message,
    correctMessage,
    incorrectMessage,
    details
  );

  return {
    validation_name: validationObject.validation_name,
    status: validationObject.status,
    header: validationObject.header,
    message: validationObject.message,
    details: validationObject.details,
    url: combineUrlWithPath(url.base, url.path ? url.path : "/"),
    payload: null,
    method: "GET",
    request_timeout_ms: config.get("validation.request_timeout_ms"),
    request_ms: requestMs,
    http_code: httpCode,
    error_type: errorType,
    error_message: createHttpErrorMessage(errorType),
  };
}

/**
 * Returns a RequestObject as defined in schema, by using data from config
 */
// eslint-disable-next-line require-jsdoc
export function createRequestObjectFromConfig(
  validationName: string,
  validationLevelCurrent: ValidationLevel,
  validationLevelPrevious: ValidationLevel[],
  header: string,
  message: string,
  correctMessage: string,
  incorrectMessage: string,
  validationKey: string,
  url: string,
  requestMs: number,
  httpCode: number,
  errorType: HttpErrorType,
  details: string = null
): {
  validation_name: string;
  status: number;
  header: string;
  message: string;
  details: string;
  url: string;
  payload: string;
  method: string;
  request_timeout_ms: number;
  request_ms: number;
  http_code: number;
  error_type: HttpErrorType;
  error_message: string;
} {
  const validationObject = createValidationObject(
    validationName,
    validationLevelCurrent,
    validationLevelPrevious,
    header,
    message,
    correctMessage,
    incorrectMessage,
    details
  );

  let path = validationConfig[validationKey].path;
  let payload = validationConfig[validationKey].payload;
  try {
    if (validationConfig[validationKey].variables !== null) {
      validationConfig[validationKey].variables.forEach((x) => {
        if (path) path = path.replace(x, getChainsConfigItemWrapper( x));
        if (payload) payload = payload.replace(x, getChainsConfigItemWrapper( x));
      });
    }
  } catch (e) {
    logger.fatal(
      "Error during reading path and payload from config. Likely an error in ./config/chains.csv or ./config/validation-config/*.json \nPath: " +
        path +
        "\nPayload: " +
        payload +
        e
    );
  }

  return {
    validation_name: validationObject.validation_name,
    status: validationObject.status,
    header: validationObject.header,
    message: validationObject.message,
    details: validationObject.details,
    url: combineUrlWithPath(url, path),
    payload: payload,
    method: validationConfig[validationKey].requestMethod,
    request_timeout_ms: config.get("validation.request_timeout_ms"),
    request_ms: requestMs,
    http_code: httpCode,
    error_type: errorType,
    error_message: createHttpErrorMessage(errorType),
  };
}

/**
 * Compares the current ValidationLevel to all previous ValidationLevels
 * @param {boolean} validationLevelCurrent
 * @param {boolean[]} validationLevelPrevious
 * @return {ValidationLevel} = Returns SUCCESSALL if current + previous validations are success. Returns SUCCESS if only current is success
 */
export function compareToPreviousValidationLevels(
  validationLevelCurrent: ValidationLevel,
  validationLevelPrevious: ValidationLevel[]
): ValidationLevel {
  switch (validationLevelCurrent) {
    case ValidationLevel.SUCCESS: {
      if (getMinValidationLevel(validationLevelPrevious) !== ValidationLevel.SUCCESSALL)  {
        return ValidationLevel.SUCCESS;
      } else {
        return ValidationLevel.SUCCESSALL;
      }
    }
    case ValidationLevel.WARN:
      return ValidationLevel.WARN;
    case ValidationLevel.INFO:
      return ValidationLevel.INFO;
    default:
      return ValidationLevel.ERROR;
  }
}

/**
 * Returns the minimum ValidationLevel, since a Validation is only considered as healthy as the minimum level
 * @param {ValidationLevel} validationLevels = a set of ValidationLevels as defined in Database Enum
 * @return {ValidationLevel} = minimum of all ValidationLevels
 */
export function getMinValidationLevel(validationLevels: ValidationLevel[]): ValidationLevel {
  if (validationLevels.length === 0) {
    return ValidationLevel.ERROR;
  } else {
    let maxLevel = ValidationLevel.SUCCESSALL;
    validationLevels.forEach((x) => {
      // Exclude ValidationLevel.SUCCESS because otherwise this would result in SUCCESS being the maxLevel and not SUCCESSALL
      if (x < ValidationLevel.SUCCESS && x < maxLevel) maxLevel = x;
    });

    return maxLevel;
  }
}

/**
 * Creates Error Message String for HttpErrorType
 * @param {HttpErrorType} httpError = ErrorType as Enum from database
 * @return {string} = Error message
 */
export function createHttpErrorMessage(httpError: HttpErrorType): string {
  switch (httpError) {
    case HttpErrorType.SSL:
      return "Invalid SSL certificate";
    case HttpErrorType.TIMEOUT:
      return "Timeout during request";
    case HttpErrorType.DNS:
      return "DNS Error: Host could not be resolved";
    case HttpErrorType.HTTP:
      return "Http Error during request";
    case HttpErrorType.INVALIDURL:
      return "Invalid URL";
    case HttpErrorType.OTHER:
      return "ECONNREFUSED, EPROTO, ECONNRESET or another error occurred";
    case HttpErrorType.UNKNOWN:
      return "An unknown error occurred";
    default:
      return null;
  }
}

/**
 * Combines a path to an existing url
 * Code is copied from validationcore/HttpRequest
 * @param {string} base = initial url
 * @param {string} path = that should be added to the end
 * @return {string} = combined url or in case it fails only the path will be returned
 */
function combineUrlWithPath(base: string, path: string): string {
  // Combine base and path to url
  let urlWithPath: URL;
  try {
    // Extract original path (needs to be done, since new URL(path, base) would overwrite the original path)
    const originalPath = new URL(base).pathname;

    if (originalPath.length >= 1 && path.length >= 1) {
      const combinedPath =
        originalPath +
        (originalPath.charAt(originalPath.length - 1) === "/" ? "" : "/") +
        (path.charAt(0) === "/" ? path.substring(1, path.length) : path);
      urlWithPath = new URL(combinedPath, base);
    } else {
      urlWithPath = new URL(path, base);
    }
  } catch (e) {
    return path;
  }

  return urlWithPath.toString();
}

/**
 * Wraps the getChainsConfigItem function supplied by the common repo to use the CHAIN_ID supplied by the environmental variables
 * @param {string} configItemKey
 * @return {any} configItem
 */
export function getChainsConfigItemWrapper(configItemKey: string): any {
  return getChainsConfigItem(CHAIN_ID, configItemKey)
}
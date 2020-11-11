const CustomError = require("../../util/custom-error");

/**
 * Helper to throw CustomError objects
 * @param {String} message error message
 */
function throwError(message) {
  throw new CustomError(message);
}

module.exports = throwError;

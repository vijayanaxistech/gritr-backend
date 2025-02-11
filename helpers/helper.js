const bcrypt = require("bcrypt");
const path = require("path");
const uuid = require("uuid").v4;
const uniqueId = uuid();
const KJUR = require("jsrsasign");
const { getEncKey } = require("../utils/authHelper");
const AdminUser = require("../models/admin/AdminUser");
let aes256 = require("aes256");
const constants = require("../config/constants");

module.exports = {
  /**
   * Handles errors and sends the response.
   * @param {Object} res - The response object.
   * @param {Object|string} err - The error to be sent.
   */
  error: function (res, err) {
    let code = typeof err === "object" ? (err.statusCode || err.code || 403) : 403;
    let message = typeof err === "object" ? err.message : err;

    let resObj = {
      success: false,
      error: message,
      code: code,
      data: {},
    };
    res.status(code).json(resObj); // Return error response
  },

  /**
   * Sends a successful response.
   * @param {Object} res - The response object.
   * @param {string} message - Success message.
   * @param {Object} body - Data to be sent in the response.
   */
  success: function (res, message = "", body = {}) {
    let resObj = {
      success: true,
      code: 200,
      message: message,
      data: body,
    };
    return res.status(200).json(resObj); // Return success response
  },

  /**
   * Sends a paginated successful response.
   * @param {Object} res - The response object.
   * @param {string} message - Success message.
   * @param {Object} body - Paginated data to be sent.
   */
  successWithPagination: function (res, message = "", body = {}) {
    return res.status(200).json({
      success: true,
      code: 200,
      message: message,
      page: body.page,
      size: body.size,
      data: body.data,
      previous: body.previous_pages,
      next: body.next_pages,
      total_pages: body.total_pages,
    });
  },

  /**
   * Returns pagination options for queries.
   * @param {Object} req - The request object.
   * @returns {Object} Pagination options including page, limit, and sort.
   */
  getPaginationOptions: (req) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    return {
      page: page,
      limit: limit,
      sort: { createdAt: -1 },
    };
  },


  // Function to generate a 6-digit random code
  generateVerificationCode : () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
  },

  /**
   * Validates if a user has enough credits.
   * @param {number} requiredCredit - The credit amount required.
   * @param {number} userCredit - The user's available credits.
   * @returns {boolean} True if user has enough credit, otherwise false.
   */
  validateCredit: async (requiredCredit, userCredit) => {
    return requiredCredit <= userCredit;
  },

  /**
   * Hashes a password using bcrypt.
   * @param {string} data - The password to be hashed.
   * @returns {string} The hashed password.
   */
  passwordEncrypt: async (data) => {
    const saltRounds = 10; // Adjust salt rounds for security
    try {
      return await bcrypt.hash(data, saltRounds); // Hash the password
    } catch (err) {
      throw new Error("Error encrypting password: " + err.message);
    }
  },

  /**
   * Compares the input password with the stored hashed password.
   * @param {string} inputPassword - The input password to be compared.
   * @param {string} storedHashedPassword - The stored hashed password.
   * @returns {boolean} True if passwords match, otherwise false.
   */
  comparePass: async (inputPassword, storedHashedPassword) => {
    if (!storedHashedPassword) return false; // If no password is stored, return false

    try {
      return await bcrypt.compare(inputPassword, storedHashedPassword); // Compare passwords
    } catch (err) {
      throw new Error("Error comparing passwords: " + err.message);
    }
  },

  /**
   * Checks the validation errors and returns formatted error messages.
   * @param {Object} v - Validator object.
   * @returns {string} Validation error messages.
   */
  checkValidation: async (v) => {
    var errorsResponse;
    await v.check().then(function (matched) {
      if (!matched) {
        var valdErrors = v.errors;
        var respErrors = [];
        Object.keys(valdErrors).forEach(function (key) {
          if (valdErrors[key] && valdErrors[key].message) {
            respErrors.push(valdErrors[key].message);
          }
        });
        errorsResponse = respErrors.join(""); // Join error messages into one string
      }
    });

    return errorsResponse;
  },

  /**
   * Generates a random string of a specified length.
   * @param {number} num - The length of the generated string.
   * @returns {string} The generated string.
   */
  AutoStringGen: async (num) => {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for (var i = 0; i < num; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text; // Return generated random string
  },

  /**
   * Uploads a file to the server and returns the file path.
   * @param {Object} fileName - The file object to be uploaded.
   * @param {string} name - Folder name where file will be stored.
   * @returns {string} The file path.
   */
  fileUpload: async (fileName, name = "images") => {
    let extension = path.extname(fileName.name);
    let fileImage = uuid() + extension;
    fileName.mv(
      process.cwd() + `/public/uploads/${name}/` + fileImage,
      function (err) {
        if (err) throw err;
      }
    );
    return `/uploads/${name}/${fileImage}`; // Return the file path
  },

  /**
   * Generates a bcrypt hash for a given keyword.
   * @param {string} keyword - The keyword to be hashed.
   * @returns {string} The generated bcrypt hash.
   */
  getBcryptHash: async (keyword) => {
    const saltRounds = 10;
    try {
      return await bcrypt.hash(keyword, saltRounds); // Hash the keyword
    } catch (err) {
      throw new Error("Error hashing keyword: " + err.message);
    }
  },

  /**
   * Generates a bcrypt hash using a unique identifier (UUID).
   * @param {string} keyword - The keyword to be hashed.
   * @returns {string} The generated bcrypt hash.
   */
  getGenerateBcryptHashLink: async (keyword) => {
    try {
      return await bcrypt.hash(uniqueId, saltRounds); // Hash the uniqueId
    } catch (err) {
      throw new Error("Error hashing unique identifier: " + err.message);
    }
  },

  /**
   * Logs a message.
   * @param {string} message - The message to be logged.
   */
  logger: async (message) => {
    const { method, url, status, contentLength, responseTime } = JSON.parse(message);
    // Implement logging logic here if necessary
  },

  /**
   * Generates a JWT signature.
   * @param {Object} data - Data to be included in the payload.
   * @param {string} password - Session password for signature generation.
   * @returns {string} The generated JWT signature.
   */
  generateSignature: async (data, password) => {
    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 24;
    const oHeader = { alg: "HS256", typ: "JWT" };

    const oPayload = {
      sdkKey: "6d7_g5hpRgANV6u3f1eCg",
      appKey: "6d7_g5hpRgANV6u3f1eCg",
      mn: data?.id,
      role: "0",
      iat: iat,
      exp: exp,
      tokenExp: exp,
      tpc: data?.fullName || data?.topic,
      session_key: password,
      user_identity: data?._id,
    };

    const sHeader = JSON.stringify(oHeader);
    const sPayload = JSON.stringify(oPayload);

    return KJUR.jws.JWS.sign("HS256", sHeader, sPayload, "56GKWj1E61hYG7TRrucSwEtKlsJ2fi7W");
  },

  /**
   * Parses an expiration string (e.g., "1d", "2h") into milliseconds.
   * @param {string} expiresIn - The expiration string.
   * @returns {number} The parsed expiration in milliseconds.
   */
  parseExpiresIn: (expiresIn) => {
    const regex = /(\d+)([smhd])/;
    const match = expiresIn.match(regex);

    if (!match) {
      throw new Error("Invalid expiration format. Expected format: <number><unit>, e.g., '1d', '2h'.");
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "s": return value * 1000;
      case "m": return value * 60 * 1000;
      case "h": return value * 60 * 60 * 1000;
      case "d": return value * 24 * 60 * 60 * 1000;
      default: throw new Error("Unsupported time unit.");
    }
  },
};

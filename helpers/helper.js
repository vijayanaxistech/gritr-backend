import bcrypt from "bcrypt";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import KJUR from "jsrsasign";
import AdminUser from "../models/admin/AdminUser.js"; // ✅ Now works
import aes256 from "aes256";
import constants from "../config/constants.js";

const helper = {
  error: function (res, err) {
    let code =
      typeof err === "object" ? err.statusCode || err.code || 403 : 403;
    let message = typeof err === "object" ? err.message : err;

    let resObj = {
      success: false,
      error: message,
      code: code,
      data: {},
    };
    res.status(code).json(resObj);
  },

  success: function (res, message = "", body = {}) {
    let resObj = {
      success: true,
      code: 200,
      message: message,
      data: body,
    };
    return res.status(200).json(resObj);
  },

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

  getPaginationOptions: (req) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    return {
      page: page,
      limit: limit,
      sort: { createdAt: -1 },
    };
  },

  generateVerificationCode: () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  validateCredit: async (requiredCredit, userCredit) => {
    return requiredCredit <= userCredit;
  },

  passwordEncrypt: async (data) => {
    const saltRounds = 10;
    try {
      return await bcrypt.hash(data, saltRounds);
    } catch (err) {
      throw new Error("Error encrypting password: " + err.message);
    }
  },

  comparePass: async (inputPassword, storedHashedPassword) => {
    if (!storedHashedPassword) return false;
    console.log(inputPassword);
    try {
      return await bcrypt.compare(inputPassword, storedHashedPassword);
    } catch (err) {
      throw new Error("Error comparing passwords: " + err.message);
    }
  },

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
        errorsResponse = respErrors.join("");
      }
    });

    return errorsResponse;
  },

  AutoStringGen: async (num) => {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for (var i = 0; i < num; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  },

  fileUpload: async (fileName, name = "images") => {
    let extension = path.extname(fileName.name);
    let fileImage = uuidv4() + extension;
    fileName.mv(
      process.cwd() + `/public/uploads/${name}/` + fileImage,
      function (err) {
        if (err) throw err;
      }
    );
    return `/uploads/${name}/${fileImage}`;
  },

  getBcryptHash: async (keyword) => {
    const saltRounds = 10;
    try {
      return await bcrypt.hash(keyword, saltRounds);
    } catch (err) {
      throw new Error("Error hashing keyword: " + err.message);
    }
  },

  getGenerateBcryptHashLink: async (keyword) => {
    const saltRounds = 10;
    try {
      return await bcrypt.hash(uuidv4(), saltRounds);
    } catch (err) {
      throw new Error("Error hashing unique identifier: " + err.message);
    }
  },

  logger: async (message) => {
    const { method, url, status, contentLength, responseTime } =
      JSON.parse(message);
  },

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

    return KJUR.jws.JWS.sign(
      "HS256",
      sHeader,
      sPayload,
      "56GKWj1E61hYG7TRrucSwEtKlsJ2fi7W"
    );
  },

  parseExpiresIn: (expiresIn) => {
    const regex = /(\d+)([smhd])/;
    const match = expiresIn.match(regex);

    if (!match) {
      throw new Error(
        "Invalid expiration format. Expected format: <number><unit>, e.g., '1d', '2h'."
      );
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value * 1000;
      case "m":
        return value * 60 * 1000;
      case "h":
        return value * 60 * 60 * 1000;
      case "d":
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new Error("Unsupported time unit.");
    }
  },
};

export default helper;

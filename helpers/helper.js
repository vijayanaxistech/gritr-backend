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
  error: function (res, err) {
    let code =
      typeof err === "object"
        ? err.statusCode
          ? err.statusCode
          : err.code
          ? err.code
          : 403
        : 403;
    let message = typeof err === "object" ? err.message : err;

    let resObj = {
      success: false,
      error: message,
      code: code,
      data: {},
    };

    // res.status(code).json({ auth: getEncKey(resObj) });
    res.status(code).json(resObj);
  },

  success: function (res, message = "", body = {}) {
    let resObj = {
      success: true,
      code: 200,
      message: message,
      data: body,
    };
    // return res.status(200).json({ auth: getEncKey(resObj) });
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

  // comparePass: async (requestPass, dbPass) => {
  //   const match = await bcrypt.compare(requestPass, dbPass);
  //   return match;
  // },

  validateCredit: async (requiredCredit, userCredit) => {
    if (requiredCredit > userCredit) {
      return false;
    }
    return true;
  },

  // Encrypt data
  passwordEncrypt: (data) => {
    let key = constants.secret;
    let encrypted = aes256.encrypt(key, data);
    return encrypted;
  },

  // Decrypt data
  passwordDecrypt: (data) => {
    let key = constants.secret;
    let decrypt = aes256.decrypt(key, data);
    return decrypt;
  },

  // Compare password
  comparePass: async (inputPassword, storedEncryptedPassword) => {
    const decryptedPassword = module.exports.passwordDecrypt(
      storedEncryptedPassword
    );
    return inputPassword === decryptedPassword;
  },

  checkValidation: async (v) => {
    var errorsResponse;
    await v.check().then(function (matched) {
      if (!matched) {
        var valdErrors = v.errors;
        var respErrors = [];
        Object.keys(valdErrors).forEach(function (key) {
          if (valdErrors && valdErrors[key] && valdErrors[key].message) {
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
    let fileImage = uuid() + extension;
    fileName.mv(
      process.cwd() + `/public/uploads/${name}/` + fileImage,
      function (err) {
        if (err) {
          throw err;
        }
      }
    );
    let imgPath = `/uploads/${name}/${fileImage}`;
    return imgPath;
  },

  getBcryptHash: async (keyword) => {
    const saltRounds = 10;
    var myPromise = await new Promise(function (resolve, reject) {
      bcrypt.hash(keyword, saltRounds, function (err, hash) {
        if (!err) {
          resolve(hash);
        } else {
          reject("0");
        }
      });
    });
    keyword = myPromise;
    return keyword;
  },

  getGenerateBcryptHashLink: async (keyword) => {
    var myPromise = await new Promise(function (resolve, reject) {
      bcrypt.hash(uniqueId, saltRounds, (error, hash) => {
        if (error) {
          console.error("Error hashing unique identifier:", error);
          reject(error);
        } else {
          resolve(hash);
        }
      });
    });
    keyword = myPromise;
    return keyword;
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

    const sdkJWT = KJUR.jws.JWS.sign(
      "HS256",
      sHeader,
      sPayload,
      "56GKWj1E61hYG7TRrucSwEtKlsJ2fi7W"
    );
    return sdkJWT;
  },
};

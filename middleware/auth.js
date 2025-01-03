const jwt = require("jsonwebtoken");
let userLoggedFormation = require("../models/userLoggedFormation");
let helper = require(`../helpers/helper`);
let constants = require(`../config/constants`);
let planValidity = require("../helpers/planValidity");

exports.isAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return helper.error(res, "Please Login to access this resource");
    }

    const decoded = jwt.verify(token, constants.JWTSecret);
    const user = await userLoggedFormation
      .findOne({
        userId: decoded?.data?.id,
        token: token,
      })
      .populate("userId");

    if (!user || user.userId.isActive === false || !planValidity(user.userId)) {
      throw new Error("Account is inActive");
    }
    req.user = { ...decoded.data, masterIds: user?.userId?.masterIds };
    next();
  } catch (e) {
    console.log(e);
    return res.status(401).json({
      success: false,
      error: "Your token is expired.",
      code: 401,
      data: {},
    });
  }
};

exports.adminAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, constants.JWTSecret);
    const user = await userLoggedFormation.findOne({
      userId: decoded.data.userId,
      token: token,
    });
    if (!user) {
      throw new Error();
    }
    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({
      success: false,
      error: "Please be Authenticate.",
      code: 401,
      data: {},
    });
  }
};

// exports.authPlain = async (req, res, next) => {
//   try {
//     const token = req.header("Authorization").replace("Bearer ", "");
//     const decoded = jwt.verify(token, constants.JWTSecret);
//     const user = await userLoggedFormation.findOne({
//       userId: decoded.tokenData.user_id,
//       token: token,
//     });
//     if (!user) {
//       throw new Error();
//     }
//     req.token = token;
//     req.user = user;
//     next();
//   } catch (e) {
//     return helper.error(res, "Please be Authenticate.");
//   }
// };

exports.authPlainJew = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, constants.JWTSecret);
    const user = await userLoggedFormation
      .findOne({
        userId: decoded.data.userId,
        token: token,
      })
      .populate("userId");
    if (!user || user.userId.isActive === false || !planValidity(user.userId)) {
      throw new Error();
    }
    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    return helper.error(res, "Please be Authenticate.");
  }
};

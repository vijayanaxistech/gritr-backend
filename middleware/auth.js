const jwt = require("jsonwebtoken");
let userLoggedFormation = require("../models/admin/userLoggedFormation");
let helper = require(`../helpers/helper`);
let constants = require(`../config/constants`);
const AdminRole = require("../models/admin/Roles"); // Replace with the actual path to Admin_Role model

exports.isAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return helper.error(res, "Please Login to access this resource");
    }

    const decoded = jwt.verify(token, constants.JWTSecretFrontend);

    //console.log('decoded',decoded);
    let userId = decoded?.userId;
    const user = await userLoggedFormation
      .findOne({
        userId: decoded?.userId,
        token: token,
      })
      .populate("userId");

    // if (!user || user.userId.isActive === false) {
    //   throw new Error("Account is inActive");
    // }

    req.user = { ...decoded.data, userId: decoded?.userId };
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
    // Extract token from Authorization header
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return helper.error(res, "Please Login to access this resource");
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, constants.JWTSecret);

    // Fetch user details using token and decoded ID
    const user = await userLoggedFormation
      .findOne({
        userId: decoded?.data?.id,
        token: token,
      })
      .populate("userId");

    // Check if the user exists, account is active, and has admin privileges
    if (!user || user.userId.isActive === false) {
      throw new Error("Account is inactive");
    }

    if (
      user.userId.roleType !== constants.TYPE_SUPER_ADMIN &&
      user.userId.roleType !== constants.TYPE_CONTENT_ADMIN &&
      user.userId.roleType !== constants.TYPE_ADMIN
    ) {
      return res.status(403).json({
        success: false,
        error: "Access restricted to admins only.",
        code: 403,
        data: {},
      });
    }

    // Attach user details to the request object
    req.user = { ...decoded.data, masterIds: user?.userId?.masterIds };
    next();
  } catch (e) {
    return res.status(401).json({
      success: false,
      error: "Your token is expired or invalid.",
      code: 401,
      data: {},
    });
  }
};

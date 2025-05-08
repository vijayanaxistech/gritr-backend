import jwt from "jsonwebtoken";
import userLoggedFormation from "../models/admin/userLoggedFormation.js";
import helper from "../helpers/helper.js";
import constants from "../config/constants.js";
import AdminRole from "../models/admin/Roles.js"; // Replace with the actual path to Admin_Role model

export const isAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return helper.error(res, "Please Login to access this resource");
    }

    const decoded = jwt.verify(token, constants.JWTSecretFrontend);
    let userId = decoded?.userId;
    const user = await userLoggedFormation
      .findOne({
        userId: decoded?.userId,
        token: token,
      })
      .populate("userId");

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

export const adminAuth = async (req, res, next) => {
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

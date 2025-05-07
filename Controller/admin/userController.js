import { Validator } from "node-input-validator";
import AdminUser from "../../models/admin/AdminUser.js";
import RoleManagement from "../../models/admin/Roles.js";
import UserLoggedFormation from "../../models/admin/userLoggedFormation.js";
import helper from "../../helpers/helper.js";
import jwt from "jsonwebtoken";
import requestIp from "request-ip";
import AdminToken from "../../models/admin/adminToken.js";
import constants from "../../config/constants.js";

const userController = {
  createUser: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        fullName: "required|string",
        email: "required|email",
        userName: "required|string",
        password: "required|string|minLength:6",
        roleId: "required|string",
      });

      if (!(await v.check())) {
        return helper.error(res, v.errors);
      }

      const existingUser = await AdminUser.findOne({
        userName: req.body.userName,
      });
      if (existingUser) {
        return helper.error(res, "This userName is already in use");
      }

      req.body.password = await helper.passwordEncrypt(req.body.password);

      const role = await RoleManagement.findById(req.body.roleId);
      if (role) {
        req.body.roleType = role.roleType;
      }

      const newUser = await AdminUser.create(req.body);
      return helper.success(res, "User Created Successfully.", newUser);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  login: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        username: "required|string",
        password: "required|string",
      });

      if (!(await v.check())) {
        return helper.error(res, v.errors);
      }

      const user = await AdminUser.findOne({
        userName: req.body.username,
      }).select("+password");
      if (!user) {
        return helper.error(res, "User not found");
      }

      const passwordMatch = await helper.comparePass(
        req.body.password,
        user.password
      );
      if (!passwordMatch) {
        return helper.error(res, "Incorrect password");
      }

      console.log("passwordMatch", passwordMatch);

      const clientIp = requestIp.getClientIp(req);
      console.log(user);
      const tokenPayload = {
        _id: user._id,
        roleId: user.roleId,
        roleType: user.roleType,
        userName: user.userName,
      };
      console.log(tokenPayload);

      // const token = jwt.sign(tokenPayload, constants.JWTSecret, {
      //   expiresIn: "1d",
      // });

      // Create a JWT token
      const token = jwt.sign(tokenPayload, constants.JWTSecret, {
        expiresIn: constants.JWTExpiresIn,
      });

      const tokenData = {
        userId: user._id,
        token,
        expiresAt: new Date(
          Date.now() + helper.parseExpiresIn(constants.JWTExpiresIn)
        ),
      };

      // Save token data in the database
      await AdminToken.create(tokenData);

      await UserLoggedFormation.create({
        userId: user._id,
        ipAddress: clientIp,
        loginTime: new Date(),
      });

      return helper.success(res, "Login successful", {
        token,
        user,
      });
    } catch (error) {
      return helper.error(res, error.message);
    }
  },
};

export default userController;

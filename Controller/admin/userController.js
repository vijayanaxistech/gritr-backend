import { Validator } from "node-input-validator";
import AdminUser from "../../models/admin/AdminUser.js";
import RoleManagement from "../../models/admin/Roles.js";
import UserLoggedFormation from "../../models/admin/userLoggedFormation.js";
import helper from "../../helpers/helper.js";
import jwt from "jsonwebtoken";
import requestIp from "request-ip";
import AdminToken from "../../models/admin/adminToken.js";

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

  getUserRoleList: async (req, res) => {
    try {
      const users = await AdminUser.find({ isActive: true }).lean();

      const rolesWithDisplayName = await Promise.all(
        users.map(async (user) => {
          const role = await RoleManagement.findById(user.roleId);
          return {
            ...user,
            roleType: role ? role.displayName : "Role not found",
          };
        })
      );

      return helper.success(res, "Listing Successfully.", rolesWithDisplayName);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  getUserList: async (req, res) => {
    try {
      const users = await AdminUser.find({});
      return helper.success(res, "Listing Successfully.", users);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },
};

export default userController;

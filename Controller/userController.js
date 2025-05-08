const { Validator } = require("node-input-validator");
const AdminUser = require("../models/AdminUser");
const RoleManagement = require("../models/Roles");
const UserLoggedFormation = require("../models/userLoggedFormation");
const helper = require("../helpers/helper");
const jwt = require("jsonwebtoken");
const requestIp = require("request-ip");

const {
  JWTExpiresIn,
  JWTSecret,
} = require("../config/constants");

module.exports = {

  createuser: async (req, res) => {
    try {
      // Validate required fields
      let v = new Validator(req.body, {
        fullName: "required|string",
        email: "required|string",
        userName: "required|string",
        password: "required|string",
        roleId: "required|string",
      });

      let errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors);
      }

      // Check if the userName is already in use
      let checkUserName = await AdminUser.findOne({ userName: v.inputs.userName });
      if (checkUserName) {
        return helper.error(res, "This userName is already in use");
      }

      // Encrypt the password
      req.body.password = await helper.passwordEncrypt(req.body.password);

      // Attach roleType to the user object
      if (req.body.roleId) {
        let existingRole = await RoleManagement.findOne({ _id: req.body.roleId });
        if (existingRole) {
          req.body.roleType = existingRole.roleType;
        }
      }

      // Create the user
      AdminUser.create(req.body)
        .then((response) => helper.success(res, "User Created Successfully.", response))
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  /**
   * Retrieves a list of users along with their role details.
   * Populates the role type and additional information for each user.
   */
  getuserroleList: async (req, res) => {
    try {
      const users = await AdminUser.find({ isActive: true });
      const rolesWithDisplayName = await Promise.all(
        users.map(async (user) => {
          const role = await RoleManagement.findById(user.roleId);
          return {
            userId: user._id,
            userName: user.userName,
            email: user.email,
            isActive: user.isActive,
            roleType: role ? role.displayName : "Role not found",
            createdAt: user.createdAt,
            roleId: role?._id,
          };
        })
      );
      return helper.success(res, "Listing Successfully.", rolesWithDisplayName);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  /**
   * Retrieves a list of all users.
   */
  getUserList: async (req, res) => {
    try {
      const users = await AdminUser.find({});
      return helper.success(res, "Listing Successfully.", users);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  /**
   * Retrieves a user by ID.
   * Throws an error if the user is not found.
   */
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return helper.error(res, "User ID is required.");
      }

      const user = await AdminUser.findById(id);
      if (!user) {
        return helper.error(res, "User not found.");
      }

      return helper.success(res, "User fetched successfully.", user);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  /**
   * Updates the active status of a user.
   * Validates `isActive` and updates it along with the `updatedAt` timestamp.
   */
  updateUserStatus: async (req, res) => {
    try {
      let v = new Validator(req.body, {
        isActive: "required|boolean",
      });

      let errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors);
      }

      req.body.updatedAt = new Date();

      const updatedRole = await AdminUser.findOneAndUpdate(
        { _id: req.params.id },
        { isActive: v.inputs.isActive, updatedAt: req.body.updatedAt },
        { new: true }
      );

      if (!updatedRole) {
        return helper.error(res, "User not found");
      }

      return helper.success(res, "User status updated successfully.", updatedRole);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  /**
   * Updates a user by ID.
   * Excludes the password from being updated directly.
   */
  updateUserById: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (!id) {
        return helper.error(res, "User ID is required.");
      }
      if (!updates || Object.keys(updates).length === 0) {
        return helper.error(res, "Update data is required.");
      }

      delete updates.password;

      if (req.body.roleId) {
        let existingRole = await RoleManagement.findOne({ _id: req.body.roleId });
        if (existingRole) {
          req.body.roleType = existingRole.roleType;
        }
      }

      const user = await AdminUser.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      if (!user) {
        return helper.error(res, "User not found.");
      }

      return helper.success(res, "User updated successfully.", user);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  /**
   * Logs in a user.
   * Validates credentials, checks account status, and returns a JWT token.
   */
  login: async (req, res) => {
    try {
      let v = new Validator(req.body, {
        username: "required",
        password: "required",
      });

      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.error(res, errorsResponse);
      }

      let logData = await AdminUser.findOne({
        userName: v.inputs.username,
        isDeleted: false,
      }).select("fullName email userName roleId isActive roleType password");

      if (!logData || !logData.isActive) {
        throw "Invalid credentials or inactive account.";
      }

      let checkPassword = await helper.comparePass(v.inputs.password, logData.password);
      if (!checkPassword) {
        throw "Invalid password.";
      }

      const token = jwt.sign(
        { data: { id: logData._id, roleId: logData.roleId } },
        JWTSecret,
        { expiresIn: JWTExpiresIn }
      );

      await UserLoggedFormation.create({
        userId: logData._id,
        token,
        ip: requestIp.getClientIp(req),
      });

      return helper.success(res, "User logged in successfully.", { authToken: token });
    } catch (error) {
      return helper.error(res, error);
    }
  },

  /**
   * Logs out a user.
   * Validates and removes the session token.
   */
  logout: async (req, res) => {
    try {
      const authToken = req.headers.authorization;
      if (!authToken) throw "Authorization token is required.";

      const token = authToken.split(" ")[1];
      const decodedToken = jwt.verify(token, JWTSecret);

      const session = await UserLoggedFormation.findOneAndDelete({
        userId: decodedToken.data.id,
        token,
      });

      if (!session) throw "Session not found or already logged out.";

      return helper.success(res, "User logged out successfully.");
    } catch (error) {
      return helper.error(res, error);
    }
  },
};

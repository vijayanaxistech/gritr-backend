import RoleManagement from "../../models/admin/Roles.js";
import Sidebar from "../../models/admin/sidebar.js";
import helper from "../../helpers/helper.js";
import AdminUser from "../../models/admin/AdminUser.js";
import { Validator } from "node-input-validator";

const roleManagement = {
  /**
   * @desc    Create a new role
   * @route   POST /roles/create
   * @access  Protected
   */
  create: async (req, res) => {
    try {
      // Validate request body
      let v = new Validator(req.body, {
        roleName: "required",
        roleType: "required",
        description: "string",
      });

      let errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors);
      }

      // Check if the role name already exists
      let checkRoleName = await RoleManagement.findOne({
        roleName: v.inputs.roleName,
      });

      if (checkRoleName) {
        return helper.error(res, "This role name is already in use");
      }

      // Create a new role
      RoleManagement.create(req.body)
        .then((response) => {
          return helper.success(res, "Role Created Successfully.", response);
        })
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  /**
   * @desc    Update an existing role by ID
   * @route   PUT /roles/:id
   * @access  Protected
   */
  update: async (req, res) => {
    try {
      // Validate request body
      let v = new Validator(req.body, {
        role_name: "required",
      });

      let errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors);
      }

      // Check if the role name already exists
      let checkRoleName = await RoleManagement.findOne({
        role_name: v.inputs.role_name,
      });

      if (checkRoleName) {
        return helper.error(res, "This role name is already in use");
      }

      req.body.updatedAt = new Date();
      // Update the role
      RoleManagement.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true,
      })
        .then((response) => {
          return helper.success(res, "Role Updated Successfully.", response);
        })
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  /**
   * @desc    Retrieve a list of all roles
   * @route   GET /roles/getroleList
   * @access  Protected
   */
  getroleList: async (req, res) => {
    try {
      const roles = await RoleManagement.find({});
      return helper.success(res, "Listing Successfully.", roles);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  /**
   * @desc    Update the status of a role (activate/deactivate)
   * @route   POST /roles/updateStatus/:id
   * @access  Protected
   */
  updateStatus: async (req, res) => {
    try {
      // Validate request body
      let v = new Validator(req.body, {
        isActive: "required|boolean",
      });

      let errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors);
      }

      req.body.updatedAt = new Date();
      // Update role status
      const updatedRole = await RoleManagement.findOneAndUpdate(
        { _id: req.params.id },
        { isActive: v.inputs.isActive, updatedAt: req.body.updatedAt },
        { new: true }
      );

      if (!updatedRole) {
        return helper.error(res, "Role not found");
      }

      return helper.success(
        res,
        "Role status updated successfully.",
        updatedRole
      );
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  /**
   * @desc    Retrieve a list of sidebar items
   * @route   GET /roles/sidebarList
   * @access  Public
   */
  sidebarList: async (req, res) => {
    try {
      const roles = await Sidebar.find({});
      return helper.success(res, "Listing Successfully.", roles);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  /**
   * @desc    Create a new sidebar entry
   * @route   POST /roles/createSidebar
   * @access  Public
   */
  createSidebar: async (req, res) => {
    try {
      // Validate input
      let v = new Validator(req.body, {
        sidebar_name: "required|string",
        description: "string|optional",
        isActive: "boolean|optional",
        links: "array|optional",
      });

      let errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors);
      }

      // Check if Sidebar with the same name already exists
      let checkSidebarName = await Sidebar.findOne({
        sidebar_name: v.inputs.sidebar_name,
      });

      if (checkSidebarName) {
        return helper.error(res, "This sidebar name is already in use.");
      }

      // Create new Sidebar
      Sidebar.create(req.body)
        .then((response) => {
          return helper.success(res, "Sidebar Created Successfully.", response);
        })
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  /**
   * @desc    Update permissions for a user's roles
   * @route   POST /roles/updateRolePermission
   * @access  Protected
   */
  updateRolePermission: async (req, res) => {
    try {
      const { roles, userId } = req.body;

      if (!userId) {
        return helper.error(res, "User ID is required.");
      }

      const ids = roles.map((role) => role._id);

      if (!ids || ids.length === 0) {
        return helper.error(res, "No role IDs provided.");
      }

      const existingUser = await AdminUser.findOne({ _id: userId });

      if (!existingUser) {
        return helper.error(res, "User not found or ID mismatch.");
      }

      const updatedUser = await AdminUser.findOneAndUpdate(
        { _id: userId },
        { $set: { sidebarIds: ids } },
        { new: true }
      );

      return helper.success(
        res,
        "User sidebar IDs updated successfully.",
        updatedUser
      );
    } catch (error) {
      return helper.error(
        res,
        "An error occurred while updating user permissions."
      );
    }
  },
};
export default roleManagement; // ✅ This makes it work with ES modules

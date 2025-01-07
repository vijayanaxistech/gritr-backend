let RoleManagement = require("../models/Roles");
let Sidebar = require("../models/sidebar");
const helper = require("../helpers/helper");
const {
  Validator
} = require("node-input-validator");

module.exports = {
  create: async (req, res) => {
    try {
      let v = new Validator(req.body, {
        role_name: "required",
      });

      let errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors);
      }

      let checkRoleName = await RoleManagement.findOne({
        role_name: v.inputs.role_name,
      });

      if (checkRoleName) {
        return helper.error(res, "This role name is already in use");
      }

      RoleManagement.create(req.body)
        .then((response) => {
          return helper.success(res, "Role Created Successfully.", response);
        })
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      return helper.error(res, error.message); // Return the error message
    }
  },

  update: async (req, res) => {
    try {
      let v = new Validator(req.body, {
        role_name: "required",
      });

      let errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors);
      }

      let checkRoleName = await RoleManagement.findOne({
        role_name: v.inputs.role_name,
      });

      if (checkRoleName) {
        return helper.error(res, "This role name is already in use");
      }
      req.body.updatedAt = new Date();
      RoleManagement.findOneAndUpdate({
          _id: req.params.id
        }, req.body, {
          new: true,
        })
        .then((response) => {
          return helper.success(res, "Role Updated Successfully.", response);
        })
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      return helper.error(res, error.message); // Return the error message
    }
  },

  /**
   * get role List
   * @param req
   * @param res
   * @param next
   */

  getroleList: async (req, res) => {
    try {
      const roles = await RoleManagement.find({});
      return helper.success(res, "Listing Successfully.", roles);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },


  sidebarList: async (req, res) => {
    try {
      const roles = await Sidebar.find({});
      return helper.success(res, "Listing Successfully.", roles);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

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
      return helper.error(res, error.message); // Return the error message
    }
  },


  updateStatus: async (req, res) => {
    try {
      console.log(req);
      // Validate the request body to ensure `isActive` is provided
      let v = new Validator(req.body, {
        isActive: "required|boolean", // Validate `isActive` as a required boolean field
      });
  
      let errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors);
      }
  
      // Update only the `isActive` status
      req.body.updatedAt = new Date(); // Add the updated timestamp
  
      const updatedRole = await RoleManagement.findOneAndUpdate(
        { _id: req.params.id }, // Find the role by ID
        { isActive: v.inputs.isActive, updatedAt: req.body.updatedAt }, // Update the `isActive` field
        { new: true } // Return the updated document
      );
  
      if (!updatedRole) {
        return helper.error(res, "Role not found"); // Handle case where the role doesn't exist
      }
  
      return helper.success(res, "Role status updated successfully.", updatedRole);
    } catch (error) {
      return helper.error(res, error.message); // Return the error message
    }
  },
  

  
};
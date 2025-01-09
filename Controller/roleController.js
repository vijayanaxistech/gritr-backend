let RoleManagement = require("../models/Roles");
let Sidebar = require("../models/sidebar");
const helper = require("../helpers/helper");
const AdminUser = require("../models/AdminUser");


const {
  Validator
} = require("node-input-validator");

module.exports = {
  create: async (req, res) => {
    try {

     
      let v = new Validator(req.body, {
        roleName: "required",
        roleType: "required",
        description: "string",
      });

      console.log('test2');

      let errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors);
      }

      let checkRoleName = await RoleManagement.findOne({
        roleName: v.inputs.roleName,
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

  
  updateStatus: async (req, res) => {
    try {
      console.log(req.body);
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


  // sidebarList: async (req, res) => {
  //   try {
  //     const roles = await Sidebar.find({});
  //     return helper.success(res, "Listing Successfully.", roles);
  //   } catch (error) {
  //     return helper.error(res, error.message);
  //   }
  // },

  // createSidebar: async (req, res) => {
  //   try {
  //     // Validate input
  //     let v = new Validator(req.body, {
  //       sidebar_name: "required|string",
  //       description: "string|optional",
  //       isActive: "boolean|optional",
  //       links: "array|optional",
  //     });

  //     let errors = v.errors;
  //     if (errors && errors.length > 0) {
  //       return helper.error(res, errors);
  //     }

  //     // Check if Sidebar with the same name already exists
  //     let checkSidebarName = await Sidebar.findOne({
  //       sidebar_name: v.inputs.sidebar_name,
  //     });

  //     if (checkSidebarName) {
  //       return helper.error(res, "This sidebar name is already in use.");
  //     }

  //     // Create new Sidebar
  //     Sidebar.create(req.body)
  //       .then((response) => {
  //         return helper.success(res, "Sidebar Created Successfully.", response);
  //       })
  //       .catch((e) => {
  //         throw e;
  //       });
  //   } catch (error) {
  //     return helper.error(res, error.message); // Return the error message
  //   }
  // },



//  updateRolePermission: async (req, res) => {
//   try {
//     console.log('body---', req.body);

//     const { roles, typeId } = req.body; // Destructure roles and typeId from the request body

//     // Log and check if the typeId is valid
//     console.log('typeId:', typeId);
//     const mongoose = require('mongoose');
//     const ObjectId = mongoose.Types.ObjectId;

//     if (!ObjectId.isValid(typeId)) {
//       return helper.error(res, "Invalid typeId.");
//     }

//     // Extract _id values from the roles array
//     const ids = roles.map(role => role._id);

//     console.log(ids);

//     if (!ids || ids.length === 0) {
//       return helper.error(res, "No role IDs provided.");
//     }

//     // Ensure the user exists before updating
//     const existingUser = await AdminUser.findOne({ _id: ObjectId(typeId) });

//     if (!existingUser) {
//       return helper.error(res, "User not found or typeId mismatch.");
//     }

//     // Find the user and update the sidebarIds field by matching the typeId
//     const updatedUser = await AdminUser.findOneAndUpdate(
//       { _id: ObjectId(typeId) }, // Match the user by typeId (converted to ObjectId)
//       { $set: { sidebarIds: ids } }, // Update the sidebarIds field with the extracted _id values
//       { new: true } // Return the updated user document
//     );

//     console.log('updatedUser----', updatedUser);

//     return helper.success(res, "User sidebar IDs updated successfully.", updatedUser); // Return the updated user
//   } catch (error) {
//     return helper.error(res, error.message); // Return the error message
//   }
// }

  
  
  

  
};
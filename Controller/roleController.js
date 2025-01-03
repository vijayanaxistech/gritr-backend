let RoleManagement = require("../models/Roles");
const helper = require("../helpers/helper");
const { Validator } = require("node-input-validator");

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
      return helper.error(res, error.message); // Return the error message
    }
  },

  /**
   * get role by id
   * @param req
   * @param res
   * @param next
   */

  get: (req, res) => {
    RoleManagement.findOne({ _id: req.params.id })
      .then((response) => {
        return helper.success(res, "Listing Successfully.", response);
      })
      .catch((error) => {
        return helper.error(res, error.message); // Return the error message
      });
  },
};

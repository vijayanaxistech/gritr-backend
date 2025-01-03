let moduleAccess = require("../models/moduleAccess");
const helper = require("../helpers/helper");
const { Validator } = require("node-input-validator");

module.exports = {
  create: async (req, res) => {
    try {
      let v = new Validator(req.body, {
        moduleName: "required",
        alias: "required",
      });

      let errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors);
      }

      let checkModuleName = await moduleAccess.findOne({
        moduleName: v.inputs.moduleName,
      });

      if (checkModuleName) {
        return helper.error(res, "This Module name is already in use");
      }

      moduleAccess.create(req.body)
        .then((response) => {        
          return helper.success(res, "Module Created Successfully.", response);
        })
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      return helper.error(res, error.message);
    }
  }, 


  get: (req, res) => {
    moduleAccess.findOne({ _id: req.params.id })
      .then((response) => {
        return helper.success(res, "Module Listing Successfully.", response);
      })
      .catch((error) => {
        return helper.error(res, error.message);
      });
  },


  update: async (req, res) => {
    try {
      let v = new Validator(req.body, {
        moduleName: "required",
        alias: "required",
      });

      let errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors);
      }

      let checkRoleName = await moduleAccess.findOne({
        moduleName: v.inputs.moduleName,
      });

      if (checkRoleName) {
        return helper.error(res, "This Module name is already in use");
      }

      req.body.updatedAt = new Date();
      moduleAccess.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true,
      }).then((response) => {
          return helper.success(res, "Module Updated Successfully.", response);
      }).catch((e) => {
          throw e;
      });

    } catch (error) {
      return helper.error(res, error.message);
    }
  },


  getAll: (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skipIndex = (page - 1) * limit;    
    const query = {};
    const sort = { createdAt: -1 };

    moduleAccess.find(query)
      .sort(sort)
      .skip(skipIndex)
      .limit(limit)
      .then((response) => {
        if (response.length === 0) {
          return helper.error(res, "No data available");
        }
        return helper.success(res, "Listing Successfully.", response);
      })
      .catch((error) => {
        return helper.error(res, error);
      });
  },
};

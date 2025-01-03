let WelcomeMsg = require("../models/welcomeMsg");
const helper = require("../helpers/helper");
const { Validator } = require("node-input-validator");

module.exports = {
  create: async (req, res) => {
    try {
      let v = new Validator(req.body, {
        massage: "required",
      });

      let errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors);
      }

      WelcomeMsg.create(req.body)
        .then((response) => {
          return helper.success(res, "Message Added Successfully.", response);
        })
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      return helper.error(res, error.message);
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

      req.body.updatedAt = new Date();
      WelcomeMsg.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true,
      })
        .then((response) => {
          return helper.success(res, "Message Updated Successfully.", response);
        })
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      return helper.error(res, error.message); // Return the error message
    }
  },


  get: async (req, res) => {
    try {
        const response = await WelcomeMsg.findOne().sort({ updatedAt: -1 }).exec();
        return helper.success(res, "Listing Successfully.", response);
    } catch (error) {
        console.error(error); // Log the error for debugging
        return helper.error(res, error.message);
    }
  },
};

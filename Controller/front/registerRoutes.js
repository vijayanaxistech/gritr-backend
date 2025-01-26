const { Validator } = require("node-input-validator");
const User = require("../../models/front/User");
const helper = require("../../helpers/helper");

module.exports = {
  /**
   * Registers a new user.
   * Validates the input, checks for duplicate emails, encrypts the password, and saves the user.
   */
  registerUser: async (req, res) => {
    try {
      // Validate required fields
      let v = new Validator(req.body, {
        fullName: "required|string",
        email: "required|email",
        password: "required|string|minLength:6",
        city: "required|string",
      });

      const matched = await v.check();
      if (!matched) {
        return helper.error(res, v.errors);
      }

      // Check if the email is already in use
      let checkEmail = await User.findOne({ email: v.inputs.email });
      if (checkEmail) {
        return helper.error(res, "This email is already in use");
      }

      // Encrypt the password
      req.body.password = await helper.passwordEncrypt(req.body.password);

      // Create and save the user
      const newUser = new User(req.body);
      await newUser.save();

      // Success response
      return helper.success(res, "User registered successfully.", {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        city: newUser.city,
      });
    } catch (error) {
      console.error("Error registering user:", error);
      return helper.error(res, error.message);
    }
  },
};

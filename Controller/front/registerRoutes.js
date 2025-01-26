const { Validator } = require("node-input-validator");
const User = require("../../models/front/User");
const helper = require("../../helpers/helper");
const jwt = require("jsonwebtoken");
const {
  JWTExpiresInFrontend,
  JWTSecretFrontend,
} = require("../../config/constants");


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


  /**
   * Logs in a user.
   * Validates the input, checks for matching email and password, and generates an auth token.
  */
  
  loginUser: async (req, res) => {
    try {
      // Validate required fields
      let v = new Validator(req.body, {
        email: "required|email",
        password: "required|string",
      });

      const matched = await v.check();
      if (!matched) {
        return helper.error(res, v.errors);
      }

      // Check if the user exists
      let logData = await User.findOne({ email: v.inputs.email });
      if (!logData) {
        return helper.error(res, "Invalid email or password.");
      }

      // Compare passwords using helper.comparePass
      let checkPassword = await helper.comparePass(v.inputs.password, logData.password);
      if (!checkPassword) {
        return helper.error(res, "Invalid email or password.");
      }

      // Create a JWT token
      const token = jwt.sign(
        { userId: logData._id, email: logData.email },
        JWTSecretFrontend,
        { expiresIn: JWTExpiresInFrontend }
      );

      // Success response with token
      return helper.success(res, "Login successful.", {
        token,
        user: {
          id: logData._id,
          fullName: logData.fullName,
          email: logData.email,
          city: logData.city,
        },
      });
    } catch (error) {
      console.error("Error logging in user:", error);
      return helper.error(res, error.message);
    }
  },



};

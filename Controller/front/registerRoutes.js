const { Validator } = require("node-input-validator");
const User = require("../../models/front/User")
const FrontToken = require("../../models/front/frontToken");
;
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
      // Define custom error messages for validation
      const customMessages = {
        "required": "The :attribute field is required.",
        "string": "The :attribute must be a string.",
        "email": "Please provide a valid email address.",
        "minLength": "The :attribute must be at least 6 characters long.",
      };
  
      // Validate required fields with custom messages
      let v = new Validator(req.body, {
        fullName: "required|string",
        email: "required|email",
        password: "required|string|minLength:6", // Password validation with min length
        city: "required|string",
      }, customMessages);
  
      const matched = await v.check();
  
      if (!matched) {
        // If validation fails, return the errors with custom messages and a 400 status code
        return helper.error(res, "Validation Error", v.errors, 400);
      }
  
      // Check if the email is already in use
      let checkEmail = await User.findOne({ email: v.inputs.email });
      if (checkEmail) {
        return helper.error(res, "This email is already in use.", {}, 400);
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
      return helper.error(res, error.message, {}, 500); // 500 for internal server error
    }
  },

  /**
   * Login in a user.
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
  
      // Store the token in the frontToken collection
      const tokenData = {
        userId: logData._id,
        token,
        expiresAt: new Date(Date.now() + parseInt(JWTExpiresInFrontend, 10) * 1000), // Fix: Properly calculate expiresAt
      };
  
      // Save token data in the database
      await FrontToken.create(tokenData);
  
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

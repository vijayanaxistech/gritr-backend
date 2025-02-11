const { Validator } = require("node-input-validator");
const User = require("../../models/front/User")
const FrontToken = require("../../models/front/frontToken");
const UserLoggedFormation = require("../../models/admin/userLoggedFormation");
const helper = require("../../helpers/helper");
const jwt = require("jsonwebtoken");
const requestIp = require("request-ip");
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
        return helper.error(res, "This email is already in use. Please try another.", {}, 400);
      }
  
      // Encrypt the password
      req.body.password = await helper.passwordEncrypt(req.body.password);
  
      // Create and save the user
      const newUser = new User(req.body);
      await newUser.save();
  
      // Success response
      return helper.success(res, "You’ve successfully registered! Welcome to Gritr!", {
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
        password: "required|string|minLength:6",
      });
  
      const matched = await v.check();
      if (!matched) {
        return helper.error(res, v.errors);
      }
  
      // Check if the user exists
      let logData = await User.findOne({ email: v.inputs.email });
      if (!logData) {
        return helper.error(res, "Invalid login. Please check your email and password!");
      }
  
      // Compare passwords using helper.comparePass
      let checkPassword = await helper.comparePass(v.inputs.password, logData.password);
      if (!checkPassword) {
        return helper.error(res, "Invalid login. Please check your email and password!");
      }

     
  
      // Create a JWT token
      const token = jwt.sign(
        { userId: logData._id, email: logData.email },
        JWTSecretFrontend,
        { expiresIn: JWTExpiresInFrontend }
      );

      await UserLoggedFormation.create({
        userId: logData._id,
        token,
        ip: requestIp.getClientIp(req),
      });
  
      // Store the token in the frontToken collection
      const tokenData = {
        userId: logData._id,
        token,
        expiresAt: new Date(Date.now() + helper.parseExpiresIn(JWTExpiresInFrontend)),
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
  
    /**
   * Logs out a user.
   * Validates and removes the session token.
   */
  logout: async (req, res) => {
      try {
        const authToken = req.headers.authorization;
        if (!authToken) throw "Authorization token is required.";
  
        const token = authToken.split(" ")[1];
        const decodedToken = jwt.verify(token, JWTSecretFrontend);

        console.log(decodedToken);
  
        const session = await UserLoggedFormation.findOneAndDelete({
          userId: decodedToken.userId,
          token,
        });
  
        if (!session) throw "Session not found or already logged out.";
  
        return helper.success(res, "User logged out successfully.");
      } catch (error) {
        return helper.error(res, error);
      }
  },


};


const { Validator } = require("node-input-validator");
const User = require("../../models/front/User")
const FrontToken = require("../../models/front/frontToken");
const UserLoggedFormation = require("../../models/admin/userLoggedFormation");
const helper = require("../../helpers/helper");
const jwt = require("jsonwebtoken");
const requestIp = require("request-ip");
const VerificationCode = require("../../models/front/VerificationCode");
const nodemailer = require("nodemailer");

const {
  JWTExpiresInFrontend,
  JWTSecretFrontend,
} = require("../../config/constants");


console.log("Email:", process.env.EMAIL_USER);
console.log("Password:", process.env.EMAIL_PASS); // Do not use in production



const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


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


  checkEmail: async (req, res) => {
    try {
      const { email } = req.body;

      // 1️⃣ Validate Email
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return helper.error(res, "Invalid email format", 400);
      }

      // 2️⃣ Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return helper.error(res, "No user found with this email. Please use a registered email.", {});
      }
  

      // 3️⃣ Check if a valid code already exists
      const existingCode = await VerificationCode.findOne({ email });
      if (existingCode && existingCode.expiresAt > new Date()) {
        return helper.success(res, "A verification code has already been sent. Please check your email.", {});
      }
   

      // 4️⃣ Generate a new 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expirationTime = new Date(Date.now() + 10 * 60 * 1000); // Code expires in 10 minutes


      // 5️⃣ Store the verification code in the database
      await VerificationCode.findOneAndUpdate(
        { email },
        { code: verificationCode, expiresAt: expirationTime },
        { upsert: true, new: true }
      );

 
      // 6️⃣ Send email with the verification code
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset Code",
        text: `Your verification code is: ${verificationCode}. This code will expire in 10 minutes.`,
      };

      await transporter.sendMail(mailOptions);

      return helper.success(res, "Verification code sent successfully", { email });

    } catch (error) {
      console.error("Error in checkEmail:", error);
      return helper.error(res, "Internal server error", 500);
    }
  },





};


const { Validator } = require("node-input-validator");
const AdminUser = require("../models/AdminUser");
let RoleManagement = require("../models/Roles");
const UserLoggedFormation = require("../models/userLoggedFormation");
const helper = require("../helpers/helper");
let jwt = require("jsonwebtoken");

const {
  JWTExpiresIn,
  JWTSecret,
  TYPE_SYSTEM_ADMIN,
  TYPE_SUPER_ADMIN,
  TYPE_SUB_ADMIN,
  TYPE_MASTER,
  TYPE_CLIENT,
} = require("../config/constants");
let Role = require("../models/Roles");
const requestIp = require("request-ip");

module.exports = {

  createuser: async (req, res) => {
    try {
      // Validate required fields
      let v = new Validator(req.body, {
        fullName: "required|string",
        email: "required|string",
        userName: "required|string",
        password: "required|string",
        roleId: "required|string",
      });
  
      let errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors);
      }
  
      // Check if the userName is already taken
      let checkUserName = await AdminUser.findOne({
        userName: v.inputs.userName,
      });
  
      if (checkUserName) {
        return helper.error(res, "This userName is already in use");
      }
  
      // Encrypt the password
      req.body.password = await helper.passwordEncrypt(req.body.password);
      // Process the user creation

         
      
      if (req.body.roleId) {
          let existingRole = await RoleManagement.findOne({
                _id: req.body.roleId,
          });      
           
          if (existingRole) {
            req.body.roleType = existingRole.roleType;
          }
        }

       
      AdminUser.create(req.body)
        .then((response) => {
          return helper.success(res, "User Created Successfully.", response);
        })
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      return helper.error(res, error.message); // Return the error message
    }
  },

  
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return helper.error(res, "User ID is required.");
      }  
   
      //const user = await AdminUser.findById(id).select('+password').lean(); 
      const user = await AdminUser.findById(id);
     
      if (!user) {
        return helper.error(res, "User not found.");
      }
  
      return helper.success(res, "User fetched successfully.", user);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },
  

    updateUserStatus: async (req, res) => {
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
  
      const updatedRole = await AdminUser.findOneAndUpdate(
        { _id: req.params.id }, // Find the role by ID
        { isActive: v.inputs.isActive, updatedAt: req.body.updatedAt }, // Update the `isActive` field
        { new: true } // Return the updated document
      );
  
      if (!updatedRole) {
        return helper.error(res, "User not found"); // Handle case where the role doesn't exist
      }
  
      return helper.success(res, "User status updated successfully.", updatedRole);
    } catch (error) {
      return helper.error(res, error.message); // Return the error message
    }
  },


  updateUserById: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
     

      if (!id) {
        return helper.error(res, "User ID is required.");
      }
  
      if (!updates || Object.keys(updates).length === 0) {
        return helper.error(res, "Update data is required.");
      }
      // Remove the password field from updates if it exists
      delete updates.password;
     const user = await AdminUser.findByIdAndUpdate(id, updates, {
        new: true, // Return the updated document
        runValidators: true, // Run schema validations on the updates
      });
  
      if (!user) {
        return helper.error(res, "User not found.");
      }
  
      return helper.success(res, "User updated successfully.", user);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },
  
  getUserList: async (req, res) => {
    try {
      const roles = await AdminUser.find({});
      return helper.success(res, "Listing Successfully.", roles);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  
  login: async (req, res) => {
    try {
      let v = new Validator(req.body, {
        username: "required",
        password: "required"
      });

      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.error(res, errorsResponse);
      }

      // let logData = await AdminUser.findOne({
      //   userName: v.inputs.username,
      //   isDeleted: false,
      // }).populate("roleId", "roleType");

      let logData = await AdminUser.findOne({
        userName: v.inputs.username,
        isDeleted: false,
      }).select('fullName email userName roleId isActive roleType password');
      

      if (!logData) {
        throw "Username or Password did not match, Please try again.";
      }

      if (!logData?.isActive) {
        throw "Sorry, Your Account is InActive Please Contact Administrator";
      }

      let checkPassword = await helper.comparePass(
        v.inputs.password,
        logData.password
      );

      if (!checkPassword) {
        throw "Password did not match, Please try again.";
      }

      let token = jwt.sign(
        {
          data: {
            id: logData._id,
            fullName: logData.fullName,
            email: logData.email,
            userName: logData.userName,
            roleId: logData.role,
          },
        },
        JWTSecret,
        { expiresIn: JWTExpiresIn }
      );

      logData = logData.toJSON();
      logData.jwtToken = await helper.generateSignature();
      logData.authToken = token;
      logData.role = logData?.role?.roleType;
      await UserLoggedFormation.create({
        userId: logData?._id,
        deviceId: v.inputs.channel, // need to change later
        token: token,
        ip: requestIp.getClientIp(req),
        channel: v.inputs.channel,
      });
      return helper.success(res, "User login successfully ", logData);
    } catch (error) {
      console.log(error);
      return helper.error(res, error);
    }
  },

  login2: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        username: "required",
        password: "required",
      });
  
      const errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.error(res, errorsResponse);
      }
  
      let logData = await AdminUser.findOne({
        userName: v.inputs.username,
        isDeleted: false,
      }).select('fullName email userName roleId isActive roleType password'); // Use .select() to limit fields
  
      if (!logData) {
        throw { message: "Invalid username or password" }; // Standardize error messages
      }
  
      if (!logData.isActive) {
        throw { message: "Your account is inactive. Please contact administrator." };
      }
  
      const checkPassword = await helper.comparePass(v.inputs.password, logData.password);
  
      if (!checkPassword) {
        throw { message: "Password did not match. Please try again." };
      }
  
      const token = jwt.sign(
        {
          data: {
            id: logData._id,
            fullName: logData.fullName,
            email: logData.email,
            userName: logData.userName,
            roleId: logData.roleId, // Store the roleId in the token for authorization purposes
          },
        },
        JWTSecret,
        { expiresIn: JWTExpiresIn }
      );
  
      logData = logData.toJSON();
      logData.jwtToken = await helper.generateSignature();
      logData.authToken = token;
      logData.role = logData.roleType; // Simplified role assignment
  
      await UserLoggedFormation.create({
        userId: logData._id,
        deviceId: v.inputs.channel, // Ensure this field is unique per device/session
        token: token,
        ip: requestIp.getClientIp(req),
        channel: v.inputs.channel,
      });
  
      return helper.success(res, "User login successful", logData);
    } catch (error) {
      console.error(error);
      return helper.error(res, error.message || "An error occurred during login");
    }
  },
  

  logout: async (req, res) => {
    try {
      // Validate that token is provided in the headers
      const authToken = req.headers.authorization;

      if (!authToken) {
        throw "Authorization token is required.";
      }

      const token = authToken.split(" ")[1]; // Bearer token extraction
      if (!token) {
        throw "Invalid token format.";
      }

      // Decode the token to extract user information
      const decodedToken = jwt.verify(token, JWTSecret);
      if (!decodedToken?.data?.id) {
        throw "Invalid token.";
      }

      // Find and delete the session associated with this token
      const session = await UserLoggedFormation.findOneAndDelete({
        userId: decodedToken.data.id,
        token: token,
      });

      if (!session) {
        throw "Session not found or already logged out.";
      }

      return helper.success(res, "User logged out successfully.");
    } catch (error) {
      console.log(error);
      return helper.error(res, error);
    }
  },


};
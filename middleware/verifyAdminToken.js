// middleware/verifyToken.js
const jwt = require('jsonwebtoken');
const AdminToken = require("../models/admin/adminToken");
const { JWTSecret } = require("../config/constants");
const helper = require("../helpers/helper"); 

const verifyAdminToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; 

  if (!token) {
    return helper.error(res, "Token not provided", {}, 401); 
  }

  try {
    // Verify the JWT token 
    const decoded = jwt.verify(token, JWTSecret);

    // Check if the token exists in the database and is not expired
    const dbToken = await AdminToken.findOne({ userId: decoded.data.id, token });

    if (!dbToken || dbToken.expiresAt < new Date()) {
      return helper.error(res, "Token is invalid or expired", {}, 401); 
    }
   
    req.userId = decoded.userId;

   
    return helper.success(res, "Token is valid", {}); 

  } catch (error) {
    return helper.error(res, "Invalid or expired token", {}, 401); 
  }
};

module.exports = verifyAdminToken;

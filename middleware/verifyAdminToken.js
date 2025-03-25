import jwt from "jsonwebtoken"; // Correct import syntax
import AdminToken from "../models/admin/adminToken.js"; // Use import with `.js` extension
import constants from "../config/constants.js"; // Import the entire object
const { JWTSecret } = constants; // Access JWTSecret from the constants object
import helper from "../helpers/helper.js"; // Also import helper using ES module syntax

const verifyAdminToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from Authorization header

  if (!token) {
    return helper.error(res, "Token not provided", {}, 401); // If no token is provided
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, JWTSecret);

    // Check if the token exists in the database and is not expired
    const dbToken = await AdminToken.findOne({
      userId: decoded.data.id,
      token,
    });

    if (!dbToken || dbToken.expiresAt < new Date()) {
      return helper.error(res, "Token is invalid or expired", {}, 401); // If token is invalid or expired
    }

    // If token is valid, attach userId to the request object
    req.userId = decoded.userId;

    // Send a success response indicating the token is valid
    return helper.success(res, "Token is valid", {}); // Success response
  } catch (error) {
    return helper.error(res, "Invalid or expired token", {}, 401); // Catch any errors
  }
};

export default verifyAdminToken; // Default export for ES modules

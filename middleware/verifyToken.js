// middleware/verifyToken.js
import jwt from "jsonwebtoken"; // Importing jwt using ES modules
import FrontToken from "../models/front/frontToken.js"; // Importing the model using ES modules
import constants from "../config/constants.js"; // Import the default export (the constants object)

const { JWTSecretFrontend } = constants; // Access JWTSecretFrontend from the constants object

import helper from "../helpers/helper.js"; // Correct import syntax for ES modules

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from Authorization header

  if (!token) {
    return helper.error(res, "Token not provided", {}, 401); // If no token is provided
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, JWTSecretFrontend);

    // Check if the token exists in the database and is not expired
    const dbToken = await FrontToken.findOne({ userId: decoded.userId, token });

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

export default verifyToken;

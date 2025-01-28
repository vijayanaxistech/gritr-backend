const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/verifyToken");  // Import the verifyToken middleware

/**
 * @route   POST /api/front/register/verifyToken
 * @desc    Verify if the token is valid
 * @access  Private (Protected by token verification)
 */
router.post("/verifyToken", verifyToken);  


module.exports = router;

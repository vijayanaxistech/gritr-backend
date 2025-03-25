import express from "express";
const router = express.Router();
import verifyToken from "../../middleware/verifyToken.js";
import verifyAdminToken from "../../middleware/verifyAdminToken.js"; // Use import instead of require

/**
 * @route   POST /api/front/register/verifyToken
 * @desc    Verify if the token is valid
 * @access  Private (Protected by token verification)
 */
router.post("/verifyToken", verifyToken);
router.post("/verifyAdminToken", verifyAdminToken);

export default router; // ✅ ESM Default Export

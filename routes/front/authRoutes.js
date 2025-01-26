const express = require("express");
const router = express.Router();
const registerController = require("../../Controller/front/registerRoutes");


/**
 * @route   POST /registerUser
 * @desc    Create a new register User
 * @access  Protected
 */
router.post("/registerUser", registerController.registerUser);
router.post("/loginUser", registerController.loginUser);


module.exports = router;

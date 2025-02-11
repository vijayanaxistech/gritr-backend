const express = require("express");
const router = express.Router();
const registerController = require("../../Controller/front/registerRoutes");
/**
 * @route   POST /api/front/register/registerUser
 * @desc    Register a new user
 * @access  Public
 */
router.post("/registerUser", registerController.registerUser);

/**
 * @route   POST /api/front/register/loginUser
 * @desc    Login a user
 * @access  Public
 */
router.post("/loginUser", registerController.loginUser);


/**
 * @route   POST /api/front/register/loginUser
 * @desc    Login a user
 * @access  Public
 */
router.post("/logoutuser", registerController.logout);


/**
 * @route   POST /api/front/checkEmail/checkEmailUser
 * @desc    Login a user
 * @access  Public
 */
router.post("/checkEmailUser", registerController.checkEmail);






module.exports = router;

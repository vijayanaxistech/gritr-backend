const express = require("express");
const router = express.Router();
const registerController = require("../../Controller/front/registerRoutes");
const { isAuth } = require("../../middleware/auth");

/**
 * @route   POST /api/front/register/registerUser
 * @desc    Register a new user
 * @access  Public
 */
router.post("/registerUser", registerController.registerUser);
router.post("/updateUserProfile", isAuth, registerController.updateUserProfile);

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

/**
 * @route   POST /api/front/verifyCode
 * @desc    Login a user
 * @access  Public
 */
router.post("/", registerController.verifyCode);

/**
 * @route   POST /api/front/createNewPassword
 * @desc    Login a user
 * @access  Public
 */

router.post("/changePassword", registerController.createNewPassword);

/**
 * @route   POST /api/front/createNewPassword
 * @desc    Login a user
 * @access  Public
 */

router.get("/userInfo/:id", isAuth, registerController.getuserInfo);

module.exports = router;

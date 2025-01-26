const express = require("express");
const router = express.Router();
const userController = require("../../Controller/admin/userController");
const { isAuth, adminAuth } = require("../../middleware/auth");


/**
 * @route   POST /createuser
 * @desc    Create a new user
 * @access  Protected
 */
router.post("/createuser", adminAuth, userController.createuser);

/**
 * @route   GET /getUserById/:id
 * @desc    Fetch a user's details by their ID
 * @access  Protected
 */
router.get("/getUserById/:id", adminAuth, userController.getUserById);

/**
 * @route   POST /updateUserById/:id
 * @desc    Update a user's details by their ID
 * @access  Protected
 */
router.post("/updateUserById/:id", adminAuth, userController.updateUserById);

/**
 * @route   POST /updateUserStatus/:id
 * @desc    Update the status of a user (e.g., activate or deactivate)
 * @access  Protected
 */
router.post("/updateUserStatus/:id", adminAuth, userController.updateUserStatus);

/**
 * @route   GET /getuserroleList
 * @desc    Retrieve a list of user roles
 * @access  Protected
 */
router.get("/getuserroleList", adminAuth, userController.getuserroleList);

/**
 * @route   POST /login
 * @desc    Authenticate and log in a user
 * @access  Public
 */
router.post("/login", userController.login);

/**
 * @route   POST /logout
 * @desc    Log out the authenticated user
 * @access  Protected
 */
router.post("/logout", adminAuth, userController.logout);

/**
 * @route   GET /getUserList
 * @desc    Retrieve a list of all users
 * @access  Protected
 */
router.get("/getUserList", adminAuth, userController.getUserList);

module.exports = router;

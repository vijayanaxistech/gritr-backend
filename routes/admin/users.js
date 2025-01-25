const express = require("express");
const router = express.Router();
const userController = require("../../Controller/admin/userController");
const { isAuth } = require("../../middleware/auth");

/**
 * @route   POST /createuser
 * @desc    Create a new user
 * @access  Protected
 */
router.post("/createuser", isAuth, userController.createuser);

/**
 * @route   GET /getUserById/:id
 * @desc    Fetch a user's details by their ID
 * @access  Protected
 */
router.get("/getUserById/:id", isAuth, userController.getUserById);

/**
 * @route   POST /updateUserById/:id
 * @desc    Update a user's details by their ID
 * @access  Protected
 */
router.post("/updateUserById/:id", isAuth, userController.updateUserById);

/**
 * @route   POST /updateUserStatus/:id
 * @desc    Update the status of a user (e.g., activate or deactivate)
 * @access  Protected
 */
router.post("/updateUserStatus/:id", isAuth, userController.updateUserStatus);

/**
 * @route   GET /getuserroleList
 * @desc    Retrieve a list of user roles
 * @access  Protected
 */
router.get("/getuserroleList", isAuth, userController.getuserroleList);

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
router.post("/logout", isAuth, userController.logout);

/**
 * @route   GET /getUserList
 * @desc    Retrieve a list of all users
 * @access  Protected
 */
router.get("/getUserList", isAuth, userController.getUserList);

module.exports = router;

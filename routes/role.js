let express = require('express');
let router = express.Router();
let roleManagement = require('../Controller/roleController');
const { isAuth } = require("../middleware/auth");

/**
 * @route   POST /create
 * @desc    Create a new role
 * @access  Protected
 */
router.post('/create', isAuth, roleManagement.create);

/**
 * @route   PUT /:id
 * @desc    Update an existing role by its ID
 * @access  Protected
 */
router.put('/:id', isAuth, roleManagement.update);

/**
 * @route   GET /getroleList
 * @desc    Retrieve a list of all roles
 * @access  Protected
 */
router.get('/getroleList', isAuth, roleManagement.getroleList);

/**
 * @route   POST /updateStatus/:id
 * @desc    Update the status of a role (e.g., activate or deactivate)
 * @access  Protected
 */
router.post('/updateStatus/:id', isAuth, roleManagement.updateStatus);

/**
 * @route   GET /sidebarList
 * @desc    Retrieve a list of items for the sidebar
 * @access  Public
 */
router.get('/sidebarList', roleManagement.sidebarList);

/**
 * @route   POST /updateRolePermission
 * @desc    Update role permissions
 * @access  Protected
 */
router.post('/updateRolePermission', isAuth, roleManagement.updateRolePermission);

/**
 * @route   POST /createSidebar
 * @desc    Create a new sidebar entry
 * @access  Public
 */
router.post('/createSidebar', roleManagement.createSidebar);

module.exports = router;

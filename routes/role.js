let express = require('express');
let router = express.Router();
let roleManagement = require('../Controller/roleController');
const { isAuth } = require("../middleware/auth");



// Core APIs
router.post('/create',isAuth, roleManagement.create);
router.put('/:id',isAuth, roleManagement.update);
router.get('/getroleList',isAuth, roleManagement.getroleList);
// router.post('/updateStatus/:id',isAuth, roleManagement.updateStatus);
// router.get('/sidebarList', isAuth,roleManagement.sidebarList);
// router.post('/createSidebar', isAuth,roleManagement.createSidebar);
// router.post('/updateRolePermission',roleManagement.updateRolePermission);


module.exports = router;
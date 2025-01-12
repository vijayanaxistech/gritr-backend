const express = require("express");
const router = express.Router();
const userController = require("../Controller/userController");
const { isAuth } = require("../middleware/auth");


router.post("/createuser",isAuth, userController.createuser);
router.get("/getUserById/:id",isAuth, userController.getUserById);
router.post("/updateUserById/:id",isAuth, userController.updateUserById);
router.post('/updateUserStatus/:id',isAuth, userController.updateUserStatus);
router.get('/getuserroleList',isAuth, userController.getuserroleList);





router.post("/login", userController.login);
router.post("/logout", isAuth, userController.logout);
router.get("/getUserList", isAuth, userController.getUserList);




module.exports = router;

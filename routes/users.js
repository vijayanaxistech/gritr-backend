const express = require("express");
const router = express.Router();
const userController = require("../Controller/userController");
const { isAuth } = require("../middleware/auth");


router.post("/createuser",isAuth, userController.createuser);
router.get("/getUserById/:id",isAuth, userController.getUserById);
router.post("/updateUserById/:id",isAuth, userController.updateUserById);



router.post("/login", userController.login);
router.post("/logout", isAuth, userController.logout);
router.get("/getUserList", isAuth, userController.getUserList);


// router.post("/change-password", isAuth, userController.changePassword);
// router.get("/getProfile", userController.getProfile);
// router.put("/editProfile", userController.editProfile);
// router.post("/status", userController.inactiveUser);
// router.post("/create", isAuth, userController.create);
// router.post("/create-client", isAuth, userController.createClient);
// router.delete("/delete", isAuth, userController.delete);
// router.get("/dashboard-count", isAuth, userController.getDashboardCount);

// router.get("/:id", isAuth, userController.getChildData);
// router.post('/get-login-info', isAuth, userController.geAllUserLoginInfo);
// router.post('/get-all-account-statement', isAuth, userController.geAllUserAccountStatement);


module.exports = router;

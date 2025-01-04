const express = require("express");
const router = express.Router();
const userController = require("../Controller/userController");
const { isAuth } = require("../middleware/auth");


router.post("/login", userController.login);
router.post("/logout", isAuth, userController.logout);
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

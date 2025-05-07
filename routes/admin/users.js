import express from "express"; // Replace require with import
import { adminAuth } from "../../middleware/auth.js"; // Replace require with import
import userController from "../../Controller/admin/userController.js";

const router = express.Router();

router.post("/createuser", userController.createUser);
//router.get("/getUserById/:id", adminAuth, userController.getUserById);
//router.post("/updateUserById/:id", adminAuth, userController.updateUserById);

//router.get("/getuserroleList", adminAuth, userController.getuserroleList);
router.post("/login", userController.login);
//router.post("/logout", adminAuth, userController.logout);
//router.get("/getUserList", adminAuth, userController.getUserList);

export default router;

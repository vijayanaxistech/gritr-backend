let express = require("express");
let router = express.Router();
let userController = require("../../Controller/sys/userController");
const { isAuth } = require("../../middleware/auth");


router.post("/create", isAuth, userController.create);
router.get("/:id", isAuth, userController.get);
router.get("/", isAuth, userController.getAll);

module.exports = router;

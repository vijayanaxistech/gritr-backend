let express = require("express");
let router = express.Router();
let superUserManagement = require("../../Controller/super/userController");
const { isAuth } = require("../../middleware/auth");

router.post("/create", isAuth, superUserManagement.create);
router.get("/:id", isAuth, superUserManagement.getAll);

module.exports = router;

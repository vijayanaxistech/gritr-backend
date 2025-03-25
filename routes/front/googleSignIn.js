import express from "express"; // Using import
const router = express.Router();

// Use import instead of require for controllers
import { googleSignIn } from "../../Controller/front/googleSignIn.js";
import { facebookSignIn } from "../../Controller/front/facebookSignIn.js";

router.post("/google-signin", googleSignIn);
router.post("/facebook-signin", facebookSignIn);

export default router;

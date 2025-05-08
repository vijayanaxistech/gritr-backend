import express from "express";
import adsController from "../../Controller/admin/advertiseController.js";
import { adminAuth } from "../../middleware/auth.js"; // ✅ FIXED: Now properly imports

const router = express.Router();

router.post("/ads", adminAuth, adsController.createAd);
router.get("/getAds/:id", adminAuth, adsController.getAdById);
router.post("/editAds/:id", adminAuth, adsController.updateAdById);

export default router;

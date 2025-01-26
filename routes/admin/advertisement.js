const express = require('express');
const router = express.Router();
const adsController = require('../../Controller/admin/advertiseController');
const { adminAuth } = require("../../middleware/auth");

router.post('/ads', adminAuth ,adsController.createAd);
router.get('/getAds/:id', adminAuth ,adsController.getAdById);
router.post("/editAds/:id", adminAuth, adsController.updateAdById);


module.exports = router;

const express = require('express');
const router = express.Router();
const adsController = require('../../Controller/admin/advertiseController');
const { isAuth } = require("../../middleware/auth");

router.post('/ads', isAuth ,adsController.createAd);
router.get('/getAds/:id', isAuth ,adsController.getAdById);
router.post("/editAds/:id", isAuth, adsController.updateAdById);


module.exports = router;

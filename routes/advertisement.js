const express = require('express');
const router = express.Router();
const adsController = require('../Controller/advertiseController');
const { isAuth } = require("../middleware/auth");

router.post('/ads', isAuth ,adsController.createAd);
router.get('/getAds/:id', isAuth ,adsController.getAdById);

module.exports = router;

const express = require('express');
const router = express.Router();
const advertiseController = require('../Controller/advertiseController');
const { isAuth } = require("../middleware/auth");

router.post('/ads', isAuth ,advertiseController.createAd);

module.exports = router;

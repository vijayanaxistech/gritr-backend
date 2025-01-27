// routes/businessLocationRoutes.js
const express = require('express');
const router = express.Router();
const businessLocationController = require('../../Controller/admin/businessLocationController');
const { adminAuth } = require("../../middleware/auth");


// Route to get paginated business locations
router.get('/business-locations',adminAuth, businessLocationController.getBusinessLocations);
router.get('/cityList', businessLocationController.getCity);

module.exports = router;

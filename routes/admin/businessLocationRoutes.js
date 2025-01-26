// routes/businessLocationRoutes.js
const express = require('express');
const router = express.Router();
const businessLocationController = require('../../Controller/admin/businessLocationController');
const { adminAuth } = require("../../middleware/auth");


// Route to get paginated business locations
router.get('/business-locations',adminAuth, businessLocationController.getBusinessLocations);

module.exports = router;

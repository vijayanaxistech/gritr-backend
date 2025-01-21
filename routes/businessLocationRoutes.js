// routes/businessLocationRoutes.js
const express = require('express');
const router = express.Router();
const businessLocationController = require('../Controller/businessLocationController');

// Route to get paginated business locations
router.get('/business-locations', businessLocationController.getBusinessLocations);

module.exports = router;

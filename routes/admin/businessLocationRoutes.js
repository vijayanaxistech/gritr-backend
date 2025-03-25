// routes/businessLocationRoutes.js
import express from "express"; // Change to `import` syntax
// ESM import syntax
import {
  getBusinessLocations,
  getCity,
} from "../../Controller/admin/businessLocationController.js";

import { adminAuth } from "../../middleware/auth.js"; // Import auth middleware

const router = express.Router();

// Route to get paginated business locations
router.get("/business-locations", adminAuth, getBusinessLocations);
router.get("/cityList", getCity);

export default router; // Use ES module export

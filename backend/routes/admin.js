const express = require("express");
const auth = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  getAdminPharmacies,
  createAdminPharmacy,
  updateAdminPharmacy,
  deleteAdminPharmacy,
} = require("../controllers/pharmacyController");

const router = express.Router();

router.get("/pharmacies", auth, roleMiddleware(["admin"]), getAdminPharmacies);
router.post("/pharmacies", auth, roleMiddleware(["admin"]), createAdminPharmacy);
router.put("/pharmacies/:id", auth, roleMiddleware(["admin"]), updateAdminPharmacy);
router.delete("/pharmacies/:id", auth, roleMiddleware(["admin"]), deleteAdminPharmacy);

module.exports = router;

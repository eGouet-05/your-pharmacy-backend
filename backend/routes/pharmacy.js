const express = require("express");
const auth = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  getPharmacyMedicines,
  addPharmacyMedicine,
  updatePharmacyMedicineStock,
  deletePharmacyMedicine,
} = require("../controllers/pharmacyController");

const router = express.Router();

router.get(
  "/:id/medicines",
  auth,
  roleMiddleware(["admin", "pharmacy"]),
  getPharmacyMedicines
);

router.post(
  "/:id/medicines",
  auth,
  roleMiddleware(["admin", "pharmacy"]),
  addPharmacyMedicine
);

router.patch(
  "/:id/medicines/:medicineId",
  auth,
  roleMiddleware(["admin", "pharmacy"]),
  updatePharmacyMedicineStock
);

router.delete(
  "/:id/medicines/:medicineId",
  auth,
  roleMiddleware(["admin", "pharmacy"]),
  deletePharmacyMedicine
);

module.exports = router;



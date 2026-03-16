const express = require("express");
const { searchPharmacies } = require("../controllers/pharmacyController");

const router = express.Router();

router.get("/", searchPharmacies);

module.exports = router;

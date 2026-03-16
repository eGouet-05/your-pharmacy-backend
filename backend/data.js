const bcrypt = require("bcryptjs");
const Pharmacy = require("./models/Pharmacy");
const Medicine = require("./models/Medecine");
const MedicineStock = require("./models/MedicineStock");
const User = require("./models/User");

async function seedData() {
	const forceSeed = String(process.env.FORCE_SEED || "").toLowerCase() === "true";

	const existingUsers = await User.count();
	if (existingUsers > 0 && !forceSeed) {
		console.log("Seed skipped: users already exist. Set FORCE_SEED=true to reinsert data.");
		return;
	}

	if (forceSeed) {
		await MedicineStock.destroy({ where: {} });
		await User.destroy({ where: {} });
		await Medicine.destroy({ where: {} });
		await Pharmacy.destroy({ where: {} });
		console.log("Force seed enabled: existing data cleared.");
	}

	// -----------------------------
	// PHARMACIES EN CÔTE D'IVOIRE
	// -----------------------------

	const pharmacies = await Promise.all([
		Pharmacy.create({
			name: "Pharmacie Cocody Saint Jean",
			email: "cocody@pharma.ci",
			lat: 5.3540,
			lng: -3.9815,
		}),
		Pharmacy.create({
			name: "Pharmacie Riviera Palmeraie",
			email: "riviera@pharma.ci",
			lat: 5.3682,
			lng: -3.9445,
		}),
		Pharmacy.create({
			name: "Pharmacie Plateau Centre",
			email: "plateau@pharma.ci",
			lat: 5.3237,
			lng: -4.0160,
		}),
		Pharmacy.create({
			name: "Pharmacie Marcory Résidentiel",
			email: "marcory@pharma.ci",
			lat: 5.2920,
			lng: -3.9980,
		}),
		Pharmacy.create({
			name: "Pharmacie Yopougon Selmer",
			email: "yopougon@pharma.ci",
			lat: 5.3455,
			lng: -4.0880,
		}),
		Pharmacy.create({
			name: "Pharmacie Abobo Baoulé",
			email: "abobo@pharma.ci",
			lat: 5.4325,
			lng: -4.0380,
		}),
	]);

	const [
		cocody,
		riviera,
		plateau,
		marcory,
		yopougon,
		abobo
	] = pharmacies;

	// -----------------------------
	// MEDICAMENTS
	// -----------------------------

	const medicines = await Promise.all([
		Medicine.create({ name: "Paracetamol" }),
		Medicine.create({ name: "Ibuprofen" }),
		Medicine.create({ name: "Amoxicillin" }),
		Medicine.create({ name: "Aspirin" }),
	]);

	const [
		paracetamol,
		ibuprofen,
		amoxicillin,
		aspirin
	] = medicines;

	// -----------------------------
	// STOCKS
	// -----------------------------

	await Promise.all([

		MedicineStock.create({
			pharmacyId: cocody.id,
			medicineId: paracetamol.id,
			stock: 50
		}),
		MedicineStock.create({
			pharmacyId: cocody.id,
			medicineId: ibuprofen.id,
			stock: 20
		}),

		MedicineStock.create({
			pharmacyId: riviera.id,
			medicineId: paracetamol.id,
			stock: 40
		}),

		MedicineStock.create({
			pharmacyId: plateau.id,
			medicineId: aspirin.id,
			stock: 60
		}),

		MedicineStock.create({
			pharmacyId: marcory.id,
			medicineId: amoxicillin.id,
			stock: 35
		}),

		MedicineStock.create({
			pharmacyId: yopougon.id,
			medicineId: paracetamol.id,
			stock: 80
		}),

		MedicineStock.create({
			pharmacyId: abobo.id,
			medicineId: ibuprofen.id,
			stock: 45
		})

	]);

	// -----------------------------
	// HASH PASSWORDS
	// -----------------------------

	const [adminHash, pharmacyHash] = await Promise.all([
		bcrypt.hash("admin123", 10),
		bcrypt.hash("pharmacy123", 10),
	]);

	// -----------------------------
	// USERS
	// -----------------------------

	await Promise.all([

		User.create({
			email: "admin@pharma.ci",
			password: adminHash,
			role: "ADMIN",
			pharmacyId: null,
		}),

		User.create({
			email: "cocody@pharma.ci",
			password: pharmacyHash,
			role: "PHARMACY",
			pharmacyId: cocody.id,
		}),

		User.create({
			email: "riviera@pharma.ci",
			password: pharmacyHash,
			role: "PHARMACY",
			pharmacyId: riviera.id,
		})

	]);

	console.log("Seed data inserted successfully");

}

module.exports = { seedData };
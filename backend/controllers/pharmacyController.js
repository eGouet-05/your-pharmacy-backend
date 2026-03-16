const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sequelize = require("../config/db");
const Pharmacy = require("../models/Pharmacy");
const Medicine = require("../models/Medecine");
const MedicineStock = require("../models/MedicineStock");
const User = require("../models/User");
const { calculateDistance } = require("../utils/distance");

const DEFAULT_CI_LOCATION = {
	lat: 5.36,
	lng: -4.0083,
};

const CI_BOUNDS = {
	minLat: 4.0,
	maxLat: 11.0,
	minLng: -8.7,
	maxLng: -2.4,
};

async function getPharmacyMedicines(req, res, next) {
	try {
		const pharmacyId = Number(req.params.id);
		const pharmacy = await Pharmacy.findByPk(pharmacyId, {
			include: [
				{
					model: Medicine,
					as: "medicines",
					through: { attributes: ["id", "stock"] },
					attributes: ["id", "name"],
				},
			],
		});

		if (!pharmacy) {
			return res.status(404).json({ message: "Pharmacy not found" });
		}

		const medicines = pharmacy.medicines.map((medicine) => ({
			id: medicine.id,
			name: medicine.name,
			stock: medicine.MedicineStock.stock,
		}));

		return res.json({
			id: pharmacy.id,
			name: pharmacy.name,
			medicines,
		});
	} catch (error) {
		return next(error);
	}
}

async function addPharmacyMedicine(req, res, next) {
	try {
		const pharmacyId = Number(req.params.id);
		const { name, stock } = req.body;

		if (!name || Number.isNaN(Number(stock)) || Number(stock) < 0) {
			return res.status(400).json({
				message: "name and stock (>= 0) are required",
			});
		}

		const pharmacy = await Pharmacy.findByPk(pharmacyId);
		if (!pharmacy) {
			return res.status(404).json({ message: "Pharmacy not found" });
		}

		const [medicine] = await Medicine.findOrCreate({
			where: { name: name.trim() },
			defaults: { name: name.trim() },
		});

		const [stockRow, created] = await MedicineStock.findOrCreate({
			where: { pharmacyId, medicineId: medicine.id },
			defaults: { stock: Number(stock), pharmacyId, medicineId: medicine.id },
		});

		if (!created) {
			stockRow.stock = Number(stock);
			await stockRow.save();
		}

		return res.status(created ? 201 : 200).json({
			pharmacyId,
			medicine: {
				id: medicine.id,
				name: medicine.name,
				stock: stockRow.stock,
			},
			stock: stockRow.stock,
		});
	} catch (error) {
		return next(error);
	}
}

async function updatePharmacyMedicineStock(req, res, next) {
	try {
		const pharmacyId = Number(req.params.id);
		const medicineId = Number(req.params.medicineId);
		const stock = Number(req.body.stock);

		if (
			Number.isNaN(pharmacyId) ||
			Number.isNaN(medicineId) ||
			Number.isNaN(stock) ||
			stock < 0
		) {
			return res.status(400).json({
				message: "pharmacyId, medicineId and stock (>= 0) are required",
			});
		}

		const stockRow = await MedicineStock.findOne({
			where: { pharmacyId, medicineId },
			include: [{ model: Medicine, as: "medicine", attributes: ["id", "name"] }],
		});

		if (!stockRow) {
			return res.status(404).json({ message: "Medicine stock not found" });
		}

		stockRow.stock = stock;
		await stockRow.save();

		return res.json({
			medicine: {
				id: stockRow.medicine.id,
				name: stockRow.medicine.name,
				stock: stockRow.stock,
			},
		});
	} catch (error) {
		return next(error);
	}
}

async function deletePharmacyMedicine(req, res, next) {
	try {
		const pharmacyId = Number(req.params.id);
		const medicineId = Number(req.params.medicineId);

		if (Number.isNaN(pharmacyId) || Number.isNaN(medicineId)) {
			return res
				.status(400)
				.json({ message: "pharmacyId and medicineId must be numbers" });
		}

		const deleted = await MedicineStock.destroy({
			where: { pharmacyId, medicineId },
		});

		if (!deleted) {
			return res.status(404).json({ message: "Medicine stock not found" });
		}

		return res.status(204).send();
	} catch (error) {
		return next(error);
	}
}

function normalizeCoordinates(body) {
	const latRaw = body.latitude ?? body.lat;
	const lngRaw = body.longitude ?? body.lng;

	return {
		lat: Number(latRaw),
		lng: Number(lngRaw),
	};
}

function isIvoryCoastCoordinate(lat, lng) {
	return (
		Number.isFinite(lat) &&
		Number.isFinite(lng) &&
		lat >= CI_BOUNDS.minLat &&
		lat <= CI_BOUNDS.maxLat &&
		lng >= CI_BOUNDS.minLng &&
		lng <= CI_BOUNDS.maxLng
	);
}

function normalizeUserCoordinates(query) {
	const parsedLat = Number(query.userLat);
	const parsedLng = Number(query.userLng);

	if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
		return { lat: parsedLat, lng: parsedLng, usedDefault: false };
	}

	return {
		lat: DEFAULT_CI_LOCATION.lat,
		lng: DEFAULT_CI_LOCATION.lng,
		usedDefault: true,
	};
}

function mapAdminPharmacyResponse(pharmacy) {
	return {
		id: pharmacy.id,
		name: pharmacy.name,
		address: pharmacy.address || "",
		email: pharmacy.email,
		latitude: pharmacy.lat,
		longitude: pharmacy.lng,
	};
}

function makePharmacyEmail(name) {
	const prefix = String(name || "pharmacy")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 30);
	const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
	return `${prefix || "pharmacy"}-${unique}@pharmacy.local`;
}

function generateTemporaryPassword() {
	return `Pharm-${crypto.randomBytes(4).toString("hex")}!`;
}

async function getAdminPharmacies(req, res, next) {
	try {
		const pharmacies = await Pharmacy.findAll({ order: [["id", "ASC"]] });
		return res.json(pharmacies.map(mapAdminPharmacyResponse));
	} catch (error) {
		return next(error);
	}
}

async function createAdminPharmacy(req, res, next) {
	try {
		const name = (req.body.name || "").trim();
		const email = (req.body.email || makePharmacyEmail(name)).trim().toLowerCase();
		const { lat, lng } = normalizeCoordinates(req.body);
		const role = "PHARMACY";

		if (!name || !email || !Number.isFinite(lat) || !Number.isFinite(lng)) {
			return res.status(400).json({
				message: "name, email, latitude and longitude are required",
			});
		}

		if (!isIvoryCoastCoordinate(lat, lng)) {
			return res.status(400).json({
				message: "latitude and longitude must be in Cote d'Ivoire",
			});
		}

		const existingPharmacy = await Pharmacy.findOne({ where: { email } });
		if (existingPharmacy) {
			return res.status(409).json({ message: "Pharmacy email already exists" });
		}

		const existingUser = await User.findOne({ where: { email } });
		if (existingUser) {
			return res.status(409).json({ message: "User email already exists" });
		}

		const temporaryPassword = generateTemporaryPassword();
		const passwordHash = await bcrypt.hash(temporaryPassword, 10);

		let createdPharmacy;
		let createdUser;
		await sequelize.transaction(async (transaction) => {
			createdPharmacy = await Pharmacy.create(
				{
					name,
					lat,
					lng,
					email,
				},
				{ transaction }
			);

			createdUser = await User.create(
				{
					email,
					password: passwordHash,
					role,
					pharmacyId: createdPharmacy.id,
				},
				{ transaction }
			);
		});

		return res.status(201).json({
			pharmacy: mapAdminPharmacyResponse(createdPharmacy),
			pharmacistUser: {
				id: createdUser.id,
				email: createdUser.email,
				role: createdUser.role,
				temporaryPassword,
			},
		});
	} catch (error) {
		return next(error);
	}
}

async function updateAdminPharmacy(req, res, next) {
	try {
		const pharmacyId = Number(req.params.id);
		if (Number.isNaN(pharmacyId)) {
			return res.status(400).json({ message: "Invalid pharmacy id" });
		}

		const pharmacy = await Pharmacy.findByPk(pharmacyId);
		if (!pharmacy) {
			return res.status(404).json({ message: "Pharmacy not found" });
		}

		const name = (req.body.name || "").trim();
		const email = (req.body.email || pharmacy.email || "").trim().toLowerCase();
		const { lat, lng } = normalizeCoordinates(req.body);

		if (!name || !email || !Number.isFinite(lat) || !Number.isFinite(lng)) {
			return res.status(400).json({
				message: "name, email, latitude and longitude are required",
			});
		}

		if (!isIvoryCoastCoordinate(lat, lng)) {
			return res.status(400).json({
				message: "latitude and longitude must be in Cote d'Ivoire",
			});
		}

		if (email !== pharmacy.email) {
			const existingPharmacy = await Pharmacy.findOne({ where: { email } });
			if (existingPharmacy && existingPharmacy.id !== pharmacy.id) {
				return res.status(409).json({ message: "Pharmacy email already exists" });
			}
		}

		pharmacy.name = name;
		pharmacy.email = email;
		pharmacy.lat = lat;
		pharmacy.lng = lng;
		await pharmacy.save();

		const pharmacistUser = await User.findOne({
			where: {
				pharmacyId: pharmacy.id,
				role: { [Op.iLike]: "pharmacy" },
			},
		});

		if (pharmacistUser) {
			pharmacistUser.email = email;
			await pharmacistUser.save();
		}

		return res.json({ pharmacy: mapAdminPharmacyResponse(pharmacy) });
	} catch (error) {
		return next(error);
	}
}

async function deleteAdminPharmacy(req, res, next) {
	try {
		const pharmacyId = Number(req.params.id);
		if (Number.isNaN(pharmacyId)) {
			return res.status(400).json({ message: "Invalid pharmacy id" });
		}

		await User.destroy({ where: { pharmacyId } });
		const deleted = await Pharmacy.destroy({ where: { id: pharmacyId } });
		if (!deleted) {
			return res.status(404).json({ message: "Pharmacy not found" });
		}

		return res.status(204).send();
	} catch (error) {
		return next(error);
	}
}

async function searchPharmacies(req, res, next) {
	try {
		const query = (req.query.medicine || "").trim();
		const userPosition = normalizeUserCoordinates(req.query);

		const whereMedicine = query
			? { name: { [Op.iLike]: `%${query}%` } }
			: undefined;

		const pharmacies = await Pharmacy.findAll({
			include: [
				{
					model: Medicine,
					as: "medicines",
					where: whereMedicine,
					required: Boolean(whereMedicine),
					through: { attributes: ["stock"] },
					attributes: ["id", "name"],
				},
			],
			order: [["id", "ASC"]],
		});

		const payload = pharmacies.map((pharmacy) => {
			const item = {
				id: pharmacy.id,
				name: pharmacy.name,
				lat: pharmacy.lat,
				lng: pharmacy.lng,
				medicines: pharmacy.medicines.map((medicine) => ({
					id: medicine.id,
					name: medicine.name,
					stock: medicine.MedicineStock.stock,
				})),
			};

			if (
				Number.isFinite(pharmacy.lat) &&
				Number.isFinite(pharmacy.lng)
			) {
				item.distanceKm = calculateDistance(
					userPosition.lat,
					userPosition.lng,
					pharmacy.lat,
					pharmacy.lng
				);
			}

			return item;
		});

		payload.sort((a, b) => {
			if (a.distanceKm == null && b.distanceKm == null) return a.id - b.id;
			if (a.distanceKm == null) return 1;
			if (b.distanceKm == null) return -1;
			return a.distanceKm - b.distanceKm;
		});

		return res.json(payload);
	} catch (error) {
		return next(error);
	}
}

module.exports = {
	getPharmacyMedicines,
	addPharmacyMedicine,
	updatePharmacyMedicineStock,
	deletePharmacyMedicine,
	searchPharmacies,
	getAdminPharmacies,
	createAdminPharmacy,
	updateAdminPharmacy,
	deleteAdminPharmacy,
};

const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config({
	path: path.resolve(__dirname, "../.env"),
	override: true,
});

const sequelize = require("./config/db");
const { seedData } = require("./data");
const authRoutes = require("./routes/auth");
const searchRoutes = require("./routes/search");
const pharmacyRoutes = require("./routes/pharmacy");
const adminRoutes = require("./routes/admin");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
	res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/api/admin", adminRoutes);

app.use((_req, res) => {
	res.status(404).json({ message: "Route not found" });
});

app.use((err, _req, res, _next) => {
	console.error(err);
	res.status(500).json({ message: "Internal server error" });
});

async function start() {
	try {
		await sequelize.authenticate();
		await sequelize.sync();
		await seedData();

		const port = Number(process.env.PORT || 5000);
		app.listen(port, () => {
			console.log(`Server running on port ${port}`);
		});
	} catch (error) {
		console.error("Failed to start server:", error.message);
		process.exit(1);
	}
}

start();

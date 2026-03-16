const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Pharmacy = sequelize.define(
	"Pharmacy",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		lat: {
			type: DataTypes.FLOAT,
			allowNull: true,
		},
		lng: {
			type: DataTypes.FLOAT,
			allowNull: true,
		},
	},
	{
		tableName: "pharmacies",
		timestamps: false,
	}
);

module.exports = Pharmacy;

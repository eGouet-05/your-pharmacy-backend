const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Pharmacy = require("./Pharmacy");
const Medicine = require("./Medecine");

const MedicineStock = sequelize.define(
  "MedicineStock",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    pharmacyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    medicineId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "medicine_stocks",
    timestamps: false,
    indexes: [{ unique: true, fields: ["pharmacyId", "medicineId"] }],
  }
);

Pharmacy.belongsToMany(Medicine, {
  through: MedicineStock,
  foreignKey: "pharmacyId",
  otherKey: "medicineId",
  as: "medicines",
});
Medicine.belongsToMany(Pharmacy, {
  through: MedicineStock,
  foreignKey: "medicineId",
  otherKey: "pharmacyId",
  as: "pharmacies",
});

Pharmacy.hasMany(MedicineStock, { foreignKey: "pharmacyId", as: "stocks" });
MedicineStock.belongsTo(Pharmacy, { foreignKey: "pharmacyId", as: "pharmacy" });

Medicine.hasMany(MedicineStock, { foreignKey: "medicineId", as: "stocks" });
MedicineStock.belongsTo(Medicine, { foreignKey: "medicineId", as: "medicine" });

module.exports = MedicineStock;

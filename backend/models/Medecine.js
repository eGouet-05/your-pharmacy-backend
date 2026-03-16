const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Medicine = sequelize.define(
  "Medicine",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "medicines",
    timestamps: false,
  }
);

module.exports = Medicine;

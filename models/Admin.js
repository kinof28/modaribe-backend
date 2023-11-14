const { DataTypes } = require("sequelize");
const sequelize = require("../db/config/connection");

const Admin = sequelize.define("Admin", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  whatsappPhone: {
    type: DataTypes.STRING,
  },
  profitRatio: {
    type: DataTypes.INTEGER,
    defaultValue:20,
  },
});

module.exports = Admin;

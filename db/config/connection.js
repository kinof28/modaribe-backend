const dotenv = require("dotenv");
const { Sequelize } = require("sequelize");

dotenv.config();
const { NODE_ENV, DATABASE_URL, DEV_DATABASE_URL } = process.env;

// const sequelize = new Sequelize(DEV_DATABASE_URL, {
//   logging: false,
//   dialect: "postgres",
// });

// const sequelize = new Sequelize("academy", "root", "root", {
//   dialect:'mysql',host:"localhost"
// });
// const sequelize = new Sequelize("rescteeh_amman_db", "rescteeh_root", "059283805928388", {
//   dialect:'mysql',host:"localhost"
// });

const sequelize = new Sequelize("moaldiah_education", "moaldiah_root", "059283805928388", {
  dialect:'mysql',host:"localhost"
});
module.exports = sequelize;

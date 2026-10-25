const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mysql = require("mysql2");

const connection = mysql.createPool({
  host: process.env.db_host || "localhost",
  user: process.env.db_user || "root",
  password: process.env.db_password || "",
  database: process.env.db_name || "tenant",
  supportBigNumbers: true,
  bigNumberStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

connection.getConnection((err, connection) => {
  if (err) {
    console.log("Connection to Database Failed");
    console.log(err.message);
    return;
  }
  connection.release();
  console.log("Connection to Database Successful");
});

module.exports = connection;
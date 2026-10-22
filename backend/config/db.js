const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: process.env.db_host || "localhost",
  user: process.env.db_user || "root",
  password: process.env.db_password || "",
  database: process.env.db_name || "tenant",
});

connection.connect((err) => {
  if (err) {
    console.log("Connection to Database Failed");
    console.log(err.message);
    return;
  }
  console.log("Connection to Database Successful");
});

module.exports = connection;
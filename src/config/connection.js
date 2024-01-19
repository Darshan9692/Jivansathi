require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB
});

connection.connect(function (err) {
  if (err) {
    console.log(err);
    // return res.status(401).send({ error: "Connection is not established!!" });
  }
  console.log("Databse Connected!");
});

module.exports = connection;
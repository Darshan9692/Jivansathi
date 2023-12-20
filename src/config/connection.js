const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASS || "9692",
  database: process.env.MYSQL_DB || "Jivansathi"
});

connection.connect(function (err) {
  if (err) {
    // console.log(err);
    return res.status(401).send({ error: "Connection is not established!!" });
  }
  console.log("Databse Connected!");
});

module.exports = connection;
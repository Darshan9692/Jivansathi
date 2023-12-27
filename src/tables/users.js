const db = require('../config/connection.js');

const createUsersTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        surname VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        code VARCHAR(255) UNIQUE,
        followers_count INT DEFAULT 0
    )
  `;

    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Users table created successfully');
        }
    });
};

module.exports = createUsersTable;

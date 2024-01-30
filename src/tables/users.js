const db = require('../config/connection.js');

const createUsersTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        firstname VARCHAR(255) NOT NULL,
        lastname VARCHAR(255) NOT NULL,
        phone VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        gender VARCHAR(255) NOT NULL,
        code VARCHAR(255) UNIQUE,
        followers_count INT DEFAULT 0,
        follower_list TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        current_level CHAR(2) DEFAULT 'F0',
        isupivalidated BOOL,
        upi_id VARCHAR(255) 
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

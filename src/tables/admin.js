const db = require('../config/connection.js');

const createAdminTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS admin (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        role CHAR(5) default 'admin'
    )
  `;

    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Admin table created successfully');
        }
    });
};

module.exports = createAdminTable;

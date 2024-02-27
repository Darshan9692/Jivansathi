const db = require('../config/connection.js');

const createErrorsTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS error_logs (
        log_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        error_message VARCHAR(1000),
        error_module VARCHAR(255),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `;

    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Errors table created successfully');
        }
    });
};

module.exports = createErrorsTable;

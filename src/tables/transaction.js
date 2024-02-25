const db = require('../config/connection.js');

const createTransactionTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS transaction (
        user_id INT,
        for_level VARCHAR(255), 
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `;

    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Transaction table created successfully');
        }
    });
};

module.exports = createTransactionTable;
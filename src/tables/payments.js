const db = require('../config/connection.js');

const createPaymentsTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS payments (
        user_id INT,
        payor_name VARCHAR(255),
	upi_transaction_id VARCHAR(255) PRIMARY KEY, 
        from_upi_id TEXT,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `;

    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Payments table created successfully');
        }
    });
};

module.exports = createPaymentsTable;
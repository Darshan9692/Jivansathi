const db = require('../config/connection.js');

const createPaymentTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS payments (
        user_id INT,
        tranaction_id BIGINT,
        paymentStatus BOOL DEFAULT '0',
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `;

    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Payment table created successfully');
        }
    });
};

module.exports = createPaymentTable;
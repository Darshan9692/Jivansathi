const db = require('../config/connection.js');

const createWebhookTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS webhook_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id int,
        amount DECIMAL(10, 2) NOT NULL,
        client_txn_id VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_mobile VARCHAR(20) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_vpa VARCHAR(255),
        order_id VARCHAR(255) NOT NULL,
        p_info VARCHAR(255) NOT NULL,
        redirect_url VARCHAR(255) NOT NULL,
        remark VARCHAR(255),
        status VARCHAR(255) NOT NULL,
        txnAt DATE NOT NULL,
        udf1 VARCHAR(255),
        udf2 VARCHAR(255),
        udf3 VARCHAR(255),
        upi_txn_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    );`


    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Webhook table created successfully');
        }
    });
};

module.exports = createWebhookTable;

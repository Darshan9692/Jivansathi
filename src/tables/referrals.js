const db = require('../config/connection.js');

const createReferralsTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS referrals (
        referral_id INT AUTO_INCREMENT PRIMARY KEY,
        referrer_id INT,
        referee_id INT,
        FOREIGN KEY (referrer_id) REFERENCES users(user_id),
        FOREIGN KEY (referee_id) REFERENCES users(user_id)
    )
  `;

    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Referrals table created successfully');
        }
    });
};

module.exports = createReferralsTable;
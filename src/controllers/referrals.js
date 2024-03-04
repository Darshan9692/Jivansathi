const { promisify } = require('util');
const db = require('../config/connection.js');
const axios = require("axios")

const queryAsync = promisify(db.query).bind(db);

exports.referUser = async (req, res, next) => {
    try {
        const { refereeId } = req.params;
        const { referrerCode } = req.body;

        // Check if the referee is already part of a network
        const existingReferral = await queryAsync('SELECT referrer_id FROM referrals WHERE referee_id = ?', [refereeId]);

        if (existingReferral.length > 0) {
            return res.status(400).json({ error: 'You are already part of other netwrok' });
        }

        // Check if the referrer code is valid
        const results = await queryAsync('SELECT user_id FROM users WHERE code = ?', [referrerCode]);

        if (results.length === 0) {
            return res.status(400).json({ error: 'Invalid referral code' });
        }

        const referrerId = results[0].user_id;

        // Check if the referrer already has referrals
        const hasReferrals = await queryAsync('SELECT referee_id FROM referrals WHERE referrer_id = ?', [refereeId]);

        if (hasReferrals.length > 0) {
            return res.status(400).json({ error: 'User has already a network' });
        }

        // Insert the new referral
        await queryAsync('INSERT INTO referrals (referrer_id, referee_id,referred_at) VALUES (?, ?, NOW())', [referrerId, refereeId]);

        // Update follower counts
        await updateFollowerCounts(referrerId, refereeId);

        res.status(201).json({ message: 'Referral created successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

async function updateLevels(userId) {
    const followerCountResult = await queryAsync('SELECT followers_count FROM users WHERE user_id = ?', [userId]);
    const followerCount = followerCountResult[0].followers_count;

    let level = 'F0';

    if (followerCount >= 200) {
        level = 'F1';
    }
    if (followerCount >= 400) {
        level = 'F2';
    }
    if (followerCount >= 800) {
        level = 'F3';
    }
    if (followerCount >= 1600) {
        level = 'F4';
    }
    if (followerCount >= 3200) {
        level = 'F5';
    }
    if (followerCount >= 6400) {
        level = 'F6';
    }
    if (followerCount >= 12800) {
        level = 'F7';
    }

    await queryAsync('UPDATE users SET current_level = ? WHERE user_id = ?', [level, userId]);
}

async function updateFollowerCounts(referrerId, refereeId) {
    await updateFollowerCount(referrerId);
    await updateLevels(referrerId);
    await findAncestors(referrerId, refereeId);
}

async function updateFollowerCount(userId) {
    await queryAsync('UPDATE users SET followers_count = followers_count + 1 WHERE user_id = ?', [userId]);
}

async function findAncestors(referrerId, refereeId) {
    const results = await queryAsync('SELECT referrer_id FROM referrals WHERE referee_id = ?', [referrerId]);

    for (const row of results) {
        const ancestorId = row.referrer_id;
        await updateFollowerCount(ancestorId);
        await updateLevels(ancestorId);
        await findAncestors(ancestorId, refereeId);
    }
}

exports.getAllFollowers = async (req, res, next) => {
    const { user_id } = req.params;
    try {
        const { directFollowers, allFollowers } = await getFollowers(user_id);
        res.status(200).json({ directFollowers, allFollowers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function getFollowers(user_id) {
    const directFollowers = [];
    const allFollowers = [];

    const followers = await findAllFollowers(user_id, true); // Include phone for direct followers

    for (const flw of followers) {
        if (flw.phone) {
            directFollowers.push(flw);
        }
        allFollowers.push(flw);
    }

    return { directFollowers, allFollowers };
}

async function findAllFollowers(user_id, directUser) {
    const selectColumns = ['users.user_id', 'users.firstname', 'users.lastname', 'users.gender', 'users.current_level', 'referrals.referred_at'];

    if (directUser) {
        selectColumns.push('users.phone'); // Include phone for direct followers
    }

    const query = `
        SELECT ${selectColumns.join(', ')}
        FROM users
        INNER JOIN referrals ON users.user_id = referrals.referee_id
        WHERE referrals.referrer_id = ?
    `;

    const result = await queryAsync(query, [user_id]);

    if (result.length === 0) {
        return [];
    }

    const followerPromises = result.map(async (res) => {
        const followers = await findAllFollowers(res.user_id, false); // Exclude phone for indirect followers
        return [res, ...followers];
    });

    return (await Promise.all(followerPromises)).flat();
}


exports.getMoney = async (req, res, next) => {
    const { user_id } = req.params;
    const money = {
        "F1": 100, "F2": 200, "F3": 400, "F4": 600, "F5": 800, "F6": 1000, "F7": 1200
    };
    try {
        const userExist = await queryAsync('SELECT * FROM users WHERE user_id = ? LIMIT 1', [user_id]);
        if (userExist.length === 0) return res.status(404).send("User not exist");

        const { firstname, upi_id } = userExist[0];

        const level = (await queryAsync('SELECT current_level FROM users WHERE user_id = ? LIMIT 1', [user_id]))[0].current_level;
        if (level === 'F0') return res.status(401).send("You are not eligible to get money");

        const transactionExist = await queryAsync('SELECT * FROM transaction WHERE user_id = ? LIMIT 1', [user_id]);

        if (transactionExist.length === 0) {
            await axios.post(`https://payout.pe2pe.in/Pe2Pe/v2/?secret_key=${process.env.P2P_SECRET_KEY}&api_id=${process.env.P2P_API_ID}&name=${firstname}&upi=${upi_id}&amount=${money[level]}&comment='Daily Money'`)
                .then(response => {
                    res.status(200).send(response.data);
                })
                .catch(error => {
                    res.status(401).send(error);
                });
            await queryAsync('INSERT INTO transaction (user_id, for_level, transaction_date, previous_date) VALUES (?, ?, NOW(), NOW())', [user_id, level]);
        }

        else {
            const diffInMs = new Date() - new Date(transactionExist[0].transaction_date);
            const diffInDays = diffInMs / (1000 * 60 * 60 * 24);



            if (Math.abs(Math.floor(diffInDays)) <= 365) {
                if (!transactionExist[0].for_level.includes(level)) {
                    const newLevels = `${transactionExist[0].for_level},${level}`;
                    await queryAsync('UPDATE transaction SET for_level = ? WHERE user_id = ?', [newLevels, user_id]);
                }
            } else {
                const latestLevel = transactionExist[0].for_level.split(",").pop();
                await queryAsync('UPDATE transaction SET for_level = ?, transaction_date = NOW() WHERE user_id = ?', [latestLevel, user_id]);
            }
        }

        if (transactionExist.length > 0) {
            const diffInMs = new Date() - new Date(transactionExist[0].previous_date);
            const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

            if (Math.abs(Math.floor(diffInDays)) < 1) return res.status(401).send("You can not collect money");

            var total_money = 0;
            const levels = (await queryAsync('SELECT * FROM transaction WHERE user_id = ? LIMIT 1', [user_id]))[0].for_level.split(",");
            
            levels.forEach(e => {
                total_money += money[e];
            });

            await axios.post(`https://payout.pe2pe.in/Pe2Pe/v2/?secret_key=${process.env.P2P_SECRET_KEY}&api_id=${process.env.P2P_API_ID}&name=${firstname}&upi=${upi_id}&amount=${total_money}&comment='Daily Money'`)
                .then(response => {
                    res.status(200).send(response.data);
                })
                .catch(error => {
                    res.status(401).send(error);
                });
            await queryAsync('UPDATE transaction SET previous_date = NOW() WHERE user_id = ?', [user_id]);
        }
    } catch (error) {
        console.log("Error:", error);
        return res.status(500).send("Internal Server Error");
    }
}


exports.getAccess = async (req, res, next) => {

    const { user_id } = req.params;

    const userExist = await queryAsync('SELECT * FROM users WHERE user_id = ? LIMIT 1', [user_id]);

    if (userExist.length === 0) return res.status(404).send("User not exist");

    if (userExist[0].paymentStatus === 1) return res.status(404).send("Payment already done");

    var txn_id = Math.round(Math.random() * (9999999999 - 1000000000) + 1000000000);


    var data = JSON.stringify({
        "key": process.env.PAYMENT_API,
        "client_txn_id": txn_id.toString(),
        "amount": "1",
        "p_info": "Jivansathi",
        "customer_name": userExist[0].firstname,
        "customer_email": userExist[0].email,
        "customer_mobile": userExist[0].phone,
        "redirect_url": "http://jivansathi.vercel.app/api/response",
    });


    var config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://api.ekqr.in/api/create_order',
        headers: {
            'Content-Type': 'application/json'
        },
        data: data
    };

    await queryAsync('update users set transaction_id = ?,transaction_date = NOW() where user_id = ?', [txn_id, user_id]);

    axios(config)
        .then(function (response) {
            return res.status(200).send(response.data);
        })
        .catch(function (error) {
            return res.status(500).send("Unable to create order");
        });

}

exports.checkStatus = async (req, res, next) => {
    const { user_id } = req.params;

    const userExist = await queryAsync('SELECT * FROM users WHERE user_id = ? LIMIT 1', [user_id]);

    if (userExist.length === 0) return res.status(404).send("User not exist");

    const txn_date = userExist[0].transaction_date;
    const date = new Date(txn_date);

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const formattedDate = `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year}`;

    var data = JSON.stringify({
        "key": process.env.PAYMENT_API,
        "client_txn_id": userExist[0].transaction_id,
        "txn_date": formattedDate
    });

    var config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://api.ekqr.in/api/check_order_status',
        headers: {
            'Content-Type': 'application/json'
        },
        data: data
    };

    axios(config)
        .then(function (response) {
            if (response.data.data.status === "success") {
                queryAsync(`update users set paymentStatus = '1', upi_id = ? where user_id = ?`, [response.data.data.customer_vpa, user_id]);
            }
            if (response.data.data.status === "failure" || response.data.data.status === "created") {
                return res.status(401).send("Payment has not been done yet");
            }
            return res.status(200).send(response.data.data.status);
        })
        .catch(function (error) {
            return res.status(500).send("Unable check order status")
        });

}

exports.getResponse = async (req, res, next) => {
    res.send("Thank you for visit....!!");
}

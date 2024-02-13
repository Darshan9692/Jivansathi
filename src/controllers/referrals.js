const { promisify } = require('util');
const db = require('../config/connection.js');

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
    try {
        const { user_id } = req.params;

        const userExist = await queryAsync('SELECT * FROM users WHERE user_id = ? LIMIT 1', [user_id]);

        if (userExist.length == 0) {
            return res.status(404).send("User not exist");
        }

        const level = await queryAsync('SELECT current_level FROM users WHERE user_id = ? LIMIT 1', [user_id]);

        if (level[0].current_level == 'F0') {
            return res.status(401).send("You are not eligible to get money");
        }

        const transaction_date = await queryAsync('SELECT transaction_date FROM transaction WHERE user_id = ? LIMIT 1', [user_id]);

        const diffInMs = new Date() - new Date(transaction_date[0].transaction_date);
        
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

        if (Math.floor(diffInDays) < 365) {
            return res.status(401).send("You have just transacted money");
        }

        // Decentro Logic

        if (transaction_date.length > 0) {
            const transaction = await queryAsync('INSERT INTO transaction (user_id) VALUES (?)', [user_id]);
        } else {
            const transaction = await queryAsync('UPDATE transaction SET transaction_date = NOW() WHERE user_id = ?', [user_id]);
        }

        return res.status(200).send("Transaction Success");

    } catch (error) {
        console.log(error);
    }
}
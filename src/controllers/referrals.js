const { promisify } = require('util');
const db = require('../config/connection.js');
const catchAsyncErrors = require('../services/catchAsyncErrors');

const queryAsync = promisify(db.query).bind(db);

exports.referUser = catchAsyncErrors(async (req, res, next) => {
    try {
        const { referrerId } = req.params;
        const { refereeCode } = req.body;

        const results = await queryAsync('SELECT user_id FROM users WHERE code = ?', [refereeCode]);

        if (results.length === 0) {
            return res.status(400).json({ error: 'Invalid referral code' });
        }

        const refereeId = results[0].user_id;

        const hasReferrals = await queryAsync('SELECT referee_id FROM referrals WHERE referrer_id = ?', [refereeId]);

        if (hasReferrals.length > 0) {
            return res.status(400).json({ error: 'User has already a network' });
        }

        const hasBeenUsed = await queryAsync('SELECT referrer_id FROM referrals WHERE referee_id = ?', [refereeId]);

        if (hasBeenUsed.length > 0) {
            return res.status(400).json({ error: 'Referral code has already been used' });
        }

        await queryAsync('INSERT INTO referrals (referrer_id, referee_id) VALUES (?, ?)', [referrerId, refereeId]);

        await updateFollowerCounts(referrerId, refereeId);

        res.status(201).json({ message: 'Referral created successfully' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

async function updateFollowerCounts(referrerId, refereeId) {
    await updateFollowerCount(referrerId);
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
        await findAncestors(ancestorId, refereeId);
    }
}

const { promisify } = require('util');
const db = require('../config/connection.js');
const catchAsyncErrors = require('../services/catchAsyncErrors');

const queryAsync = promisify(db.query).bind(db);

exports.referUser = catchAsyncErrors(async (req, res, next) => {
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
        await queryAsync('INSERT INTO referrals (referrer_id, referee_id) VALUES (?, ?)', [referrerId, refereeId]);

        // Update follower counts
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

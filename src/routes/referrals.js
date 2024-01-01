const express = require('express');
const { referUser } = require('../controllers/referrals');

const router = express.Router();

router.route("/referral/:refereeId").post(referUser);


module.exports = router;
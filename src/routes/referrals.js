const express = require('express');
const { referUser } = require('../controllers/referrals');

const router = express.Router();

router.route("/referral/:referrerId").post(referUser);


module.exports = router;
const express = require('express');
const { referUser, getAllFollowers } = require('../controllers/referrals');

const router = express.Router();

router.route("/referral/:refereeId").post(referUser);
router.route("/followers/:user_id").get(getAllFollowers);


module.exports = router;
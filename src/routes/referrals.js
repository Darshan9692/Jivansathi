const express = require('express');
const { referUser, getAllFollowers, getMoney } = require('../controllers/referrals');

const router = express.Router();

router.route("/referral/:refereeId").post(referUser);
router.route("/followers/:user_id").get(getAllFollowers);
router.route("/pay/:user_id").get(getMoney);


module.exports = router;
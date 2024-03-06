const express = require('express');
const { referUser, getAllFollowers, getMoney, getAccess, checkStatus, getResponse, accessPaymentDetails } = require('../controllers/referrals');

const router = express.Router();

router.route("/referral/:refereeId").post(referUser);
router.route("/followers/:user_id").get(getAllFollowers);
router.route("/pay/:user_id").get(getMoney);
router.route("/access/:user_id").get(getAccess);
router.route("/status/:user_id").get(checkStatus);
router.route("/response").get(getResponse)
router.route("/payment/:user_id").post(accessPaymentDetails);


module.exports = router;

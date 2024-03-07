const express = require('express');
const { referUser, getAllFollowers, getMoney, accessPaymentDetails, acceptPayment, rejectPayment, getRequests } = require('../controllers/referrals');

const router = express.Router();

router.route("/referral/:refereeId").post(referUser);
router.route("/followers/:user_id").get(getAllFollowers);
router.route("/pay/:user_id").get(getMoney);
// router.route("/access/:user_id").get(getAccess);
// router.route("/status/:user_id").get(checkStatus);
router.route("/payment/:user_id").post(accessPaymentDetails);
router.route("/accept/:user_id").get(acceptPayment);
router.route("/reject/:user_id").get(rejectPayment);
router.route("/requests").get(getRequests);;


module.exports = router;

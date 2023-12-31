const express = require('express');
const { profile, getSingleUser, generateOtp, verifyOtp } = require('../controllers/authentication');

const router = express.Router();

router.route("/generate").post(generateOtp);
router.route("/verify").post(verifyOtp);
router.route("/profile").post(profile);
router.route("/user/:user_id").get(getSingleUser)

module.exports = router;
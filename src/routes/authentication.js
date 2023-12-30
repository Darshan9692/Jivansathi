const express = require('express');
const { profile, loginUser, getSingleUser, generateOtp, verifyOtp } = require('../controllers/authentication');

const router = express.Router();

router.route("/generate").post(generateOtp);
router.route("/verify").post(verifyOtp);
router.route("/register").post(profile);
router.route("/login").post(loginUser);
router.route("/user/:user_id").get(getSingleUser)

module.exports = router;
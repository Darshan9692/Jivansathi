const express = require('express');
const { profile, getSingleUser, generateOtp, verifyOtp, updatePhone, updateData } = require('../controllers/authentication');

const router = express.Router();

router.route("/generate").post(generateOtp);
router.route("/verify").post(verifyOtp);
router.route("/profile").post(profile);
router.route("/user/:user_id").get(getSingleUser);
router.route("/phone/:user_id").put(updatePhone);
router.route("/profile/:user_id").put(updateData);

module.exports = router;
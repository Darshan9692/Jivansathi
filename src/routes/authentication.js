const express = require('express');
const { profile, getSingleUser, generateOtp,  updatePhone, updateData,getUserExistence,getAllUsers } = require('../controllers/authentication');

const router = express.Router();

router.route("/generate").post(generateOtp);
router.route("/profile").post(profile);
router.route("/user/:user_id").get(getSingleUser);
router.route("/phone/:user_id").put(updatePhone);
router.route("/profile/:user_id").put(updateData);
router.route("/userexists").post(getUserExistence);
router.route("/users").get(getAllUsers);

module.exports = router;
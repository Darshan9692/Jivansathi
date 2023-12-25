const express = require('express');
const { register, loginUser, logout, getSingleUser } = require('../controllers/authentication');

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(loginUser);
router.route("/logout").get(logout);
router.route("/user/:user_id").get(getSingleUser)

module.exports = router;
const express = require('express');
const { register, loginUser, getSingleUser } = require('../controllers/authentication');

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(loginUser);
router.route("/user/:user_id").get(getSingleUser)

module.exports = router;
const db = require('../config/connection.js');
const catchAsyncErrors = require('../services/catchAsyncErrors');
const twilio = require("twilio");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);
const verificationsid = process.env.VERIFYSID;

const { promisify } = require('util');
const queryAsync = promisify(db.query).bind(db);

// Register a user
exports.profile = async (req, res, next) => {
    try {
        const { firstname, lastname, email, phone } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Please enter email" });
        }

        if (phone && phone.length !== 10) {
            return res.status(400).json({ error: "Please enter valid phone number" });
        }

        const generateCode = () => {
            const namePrefix = firstname.slice(0, 2).toUpperCase();
            const surnamePrefix = lastname.slice(0, 2).toUpperCase();
            const randomNumber = Math.floor(10000 + Math.random() * 90000);
            return `${namePrefix}${surnamePrefix}${randomNumber}`;
        };

        const code = firstname && lastname && generateCode();

        const checkMobile = "SELECT firstname FROM users WHERE phone = ?";
        const isMobileExist = await queryAsync(checkMobile, [phone]);

        if (isMobileExist.length > 0) {
            return res.status(403).json("Mobile number already exist");
        }

        const checkEmail = "SELECT firstname FROM users WHERE email = ?";
        const isEmailExist = await queryAsync(checkEmail, [email]);

        if (isEmailExist.length > 0) {
            return res.status(403).json("Email already exist");
        }

        const insertUserQuery = "INSERT INTO users (firstname, lastname, email, phone, code) VALUES (?, ?, ?, ?, ?)";
        const result = await queryAsync(insertUserQuery, [firstname, lastname, email, phone, code]);

        const rId = result.insertId;
        const selectUserQuery = "SELECT * FROM users WHERE user_id = ?";
        const userResult = await queryAsync(selectUserQuery, [rId]);

        const id = userResult[0].user_id;

        res.status(201).json({ message: "Profile created successfully", id });
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: "Unable to proceed" });
    }
};

// Fetch a single user
exports.getSingleUser = async (req, res, next) => {
    try {
        const { user_id } = req.params;
        const sql = "SELECT user_id, firstname, lastname, email, code, followers_count FROM users WHERE user_id = ?";
        const result = await queryAsync(sql, [user_id]);

        if (result.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(result[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Generate OTP
exports.generateOtp = async (req, res, next) => {
    try {
        const { mobno } = req.body;

        if (!mobno || mobno.length !== 10) {
            return res.status(400).json({ error: "Please enter a valid Mobile Number" });
        }

        const verification = await client.verify.v2.services(verificationsid)
            .verifications.create({ to: `+91${mobno}`, channel: "sms" });

        if (verification.status === "pending") {
            return res.status(200).json({ message: "OTP sent successfully" });
        } else {
            return res.status(500).json({ error: "OTP not sent" });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error sending OTP" });
    }
};

// Verify OTP
exports.verifyOtp = async (req, res, next) => {
    try {
        const { phone, otp } = req.body;

        if (!otp || otp.length !== 6) {
            return res.status(400).json({ error: "Please enter a valid OTP" });
        }

        if (!phone) {
            return res.status(400).json({ error: "Please provide phone number" });
        }

        const check = await client.verify.v2.services(verificationsid)
            .verificationChecks.create({ to: `+91${phone}`, code: otp });

        if (check.status === 'approved') {
            return res.status(200).json({ message: "OTP verified successfully" });
        } else {
            return res.status(400).json({ error: "Invalid OTP" });
        }
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: "OTP not verified" });
    }
};

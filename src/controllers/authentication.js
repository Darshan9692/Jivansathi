const db = require('../config/connection.js');
const bcrypt = require('bcryptjs');
const catchAsyncErrors = require('../services/catchAsyncErrors');
const twilio = require("twilio");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);
const verificationsid = process.env.VERIFYSID;

// Register a user
exports.profile = catchAsyncErrors(async (req, res, next) => {
    const { name, surname, email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Please enter email and password" });
    }

    const generateCode = () => {
        const namePrefix = firstname.slice(0, 2).toUpperCase();
        const surnamePrefix = lastname.slice(0, 2).toUpperCase();
        const randomNumber = Math.floor(10000 + Math.random() * 90000); // Generates a random 5-digit number
        return `${namePrefix}${surnamePrefix}${randomNumber}`;
    };

    const code = firstname && lastname && generateCode();

    var pass = await bcrypt.hash(password, 10);

    try {
        const sql = `INSERT INTO users (firstname, lastname, email, password_hash, code) VALUES (?, ?, ?, ?, ?)`;

        db.query(sql, [firstname, lastname, email, pass, code], function (err, result) {
            if (err) {
                console.log(err);
                return res.status(400).json({ error: "Unable to register user due to an email or other issues" });
            }

            //if user registered successfully then retrieve that row
            const rId = result.insertId;

            const user = `SELECT * FROM users WHERE user_id = ?`;

            db.query(user, [rId], function (err, success) {
                if (err) {
                    console.error(err);
                    return res.status(400).json({ error: "Unable to register user" });
                }

                const id = success[0].user_id;

                res.status(201).json({ message: "User registered successfully", id });
            });
        });
    } catch (err) {
        console.log(err);
        return res.status(400).json({ error: "Unable to proceed" });
    }
});

// Login user
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Please enter email and password" });
    }

    const sql = `SELECT * FROM users WHERE email = ?`;

    db.query(sql, [email], function (err, data) {
        if (err) {
            console.error(err);
            return res.status(401).json({ error: "Invalid email or password" });
        }

        if (data.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = data[0];

        const id = user.user_id;

        const storedPassword = user.password_hash;

        bcrypt.compare(password, storedPassword, function (err, isPasswordMatched) {
            if (err || !isPasswordMatched) {
                return res.status(401).json({ error: "Invalid email or password" });
            }
            res.status(200).json({ message: "User logged in successfully", userID: id });
        });
    });
});

exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
    const { user_id } = req.params;
    try {
        const sql = "SELECT user_id,firstname,lastname,email,code,followers_count FROM users WHERE user_id = ?";

        db.query(sql, [user_id], function (err, result) {
            if (err) {
                console.log(err);
                return res.status(401).json({ error: "Unable to fetch user" });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }

            return res.status(200).json(result[0]);
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

exports.generateOtp = catchAsyncErrors(async (req, res, next) => {
    try {
        const { mobno } = req.body;

        if (!mobno || mobno.length !== 10) {
            return res.status(400).json("Please enter a valid Mobile Number");
        }

        const verification = await client.verify.v2.services(verificationsid)
            .verifications.create({ to: `+91${mobno}`, channel: "sms" });

        if (verification.status === "pending") {
            return res.status(200).json("OTP sent successfully");
        } else {
            return res.status(500).json("OTP not sent");
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json("Error sending OTP");
    }
});

exports.verifyOtp = catchAsyncErrors(async (req, res, next) => {
    try {
        const { phone, otp } = req.body;

        if (!otp || otp.length !== 6) {
            return res.status(400).json("Please enter a valid OTP");
        }

        if (!phone) {
            return res.status(400).json("Please provide phone number");
        }

        const check = await client.verify.v2
            .services(verificationsid)
            .verificationChecks.create({ to: `+91${phone}`, code: otp });

        if (check.status === 'approved') {
            // console.log('OTP verified successfully.');
            return res.status(200).json("Otp verified successfully");
        } else {
            console.log('Invalid Otp!');
            return res.status(400).json("Invalid Otp!");
        }
    } catch (error) {
        console.error(error.message);
        return res.status(500).json("OTP not verified!!");
    }
});

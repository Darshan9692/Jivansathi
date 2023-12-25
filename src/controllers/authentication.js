const db = require('../config/connection.js');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const bcrypt = require('bcryptjs');
const catchAsyncErrors = require('../services/catchAsyncErrors');

// Register a user
exports.register = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Please enter email and password" });
    }

    var pass = await bcrypt.hash(password, 10);

    try {
        const sql = `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`;

        db.query(sql, [name, email, pass], function (err, result) {
            if (err) {
                console.log(err);
                return res.status(400).json({ error: "Unable to register user due to already existance of an email or anything else" });
            }

            //if user registered successfully then retrive that row
            const rId = result.insertId;

            const token = jwt.sign({ rId }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRE
            });

            const user = `select * from users where user_id = ?`;

            db.query(user, [rId], function (err, success) {
                if (err) {
                    console.error(err);
                    return res.status(400).json({ error: "Unable to register user" });
                }

                const user = success[0];

                const tokenCookie = cookie.serialize('tokenjwt', token, {
                    expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
                    httpOnly: true
                });

                res.setHeader('Set-Cookie', tokenCookie);

                res.status(201).json({ message: "User registered successfully", user });
            })

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
        // console.log(user);
        const storedPassword = user.password_hash;

        bcrypt.compare(password, storedPassword, function (err, isPasswordMatched) {
            if (err || !isPasswordMatched) {
                return res.status(401).json({ error: "Invalid email or password" });
            }

            const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRE
            });

            const tokenCookie = cookie.serialize('tokenjwt', token, {
                expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
                httpOnly: true
            });

            res.setHeader('Set-Cookie', tokenCookie);

            res.status(200).json({ message: "User logged in successfully", token });
        });
    });
});

//Logout user 
exports.logout = catchAsyncErrors(async (req, res, next) => {
    res.clearCookie('tokenjwt', { path: '/api' }); // Clear the JWT cookie

    res.status(200).json({
        success: true,
        message: "Logged Out Successfully",
    });
});

exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
    const { user_id } = req.params;
    try {
        const sql = "SELECT * FROM users WHERE user_id = ?";

        db.query(sql, [user_id], function (err, result) {
            if (err) {
                console.log(err);
                return res.status(401).json({ error: "Unable to fetch user" });
            }
            
            if (result.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }

            return res.status(200).json({ user: result[0] });
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
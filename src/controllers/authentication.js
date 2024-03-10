const { error } = require('console');
const db = require('../config/connection.js');
const unirest = require("unirest");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { promisify } = require('util');
const queryAsync = promisify(db.query).bind(db);

exports.loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(401).json("Please enter email and password", 400);
    }

    try {
        const [result] = await queryAsync('SELECT * FROM admin WHERE email = ?', [email]);

        if (!result) {
            return res.status(401).json("Invalid email or password", 401);
        }

        const user = result;
        const storedPasswordHash = user.password;

        const isPasswordMatched = await bcrypt.compare(password, storedPasswordHash);

        if (!isPasswordMatched) {
            return res.status(401).json("Invalid email or password", 401);
        }

        const token = jwt.sign({ userId: user.user_id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE
        });

        const options = {
            expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
            httpOnly: true
        };

        return res.status(200).cookie("tokenjwt", token, options).json({ message: "User logged in successfully", user, token });
    } catch (err) {
        console.error(err);
        return res.status(401).json("Invalid email or password", 401);
    }
};

exports.logout = async (req, res, next) => {
    res.cookie("tokenjwt", null, {
        httponly: true,
        expires: new Date(Date.now()),
        path: "/"
    });

    res.status(200).json({
        success: true,
        message: "Logged out"
    });
};

// Register a user
exports.profile = async (req, res, next) => {
    try {
        const { firstname, lastname, email, gender, phone } = req.body;

        if (!firstname) {
            return res.status(400).json({ error: "Please enter firstname" });
        }

        if (!lastname) {
            return res.status(400).json({ error: "Please enter lastname" });
        }

        if (!gender) {
            return res.status(400).json({ error: "Please enter gender" });
        }

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

        const checkEmail = "SELECT firstname FROM users WHERE email = ?";
        const isEmailExist = await queryAsync(checkEmail, [email]);

        if (isEmailExist.length > 0) {
            return res.status(403).json("Email already exist");
        }

        const insertUserQuery = "INSERT INTO users (firstname, lastname, email, phone,gender, code) VALUES (?, ?, ?,?, ?, ?)";
        const result = await queryAsync(insertUserQuery, [firstname, lastname, email, phone, gender, code]);

        const rId = result.insertId;
        const selectUserQuery = "SELECT * FROM users WHERE user_id = ?";
        const userResult = await queryAsync(selectUserQuery, [rId]);

        const id = userResult[0].user_id;

        res.status(201).json({ message: "Profile created successfully", id });
    } catch (err) {
        console.log(err);
        return res.status(400).json({ error: "Unable to proceed" });
    }
};

// Fetch a single user
exports.getSingleUser = async (req, res, next) => {
    try {
        const { user_id } = req.params;
        const sql = "SELECT user_id, firstname, lastname, email,gender,code,phone,current_level,followers_count, paymentStatus FROM users WHERE user_id = ?";
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

exports.getAllUsers = async (req,res,next) => {
    try {
        const sql = "SELECT * FROM users";
        const result = await queryAsync(sql);
        if(result.length <= 0) {
            return res.status(400).json({message: "No User Exists."});
        }
        return res.status(200).json(result); 
    }catch(error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

//Get User Existence
exports.getUserExistence = async (req,res,next) => {
    try {
        const { phone } = req.body;
        let isMobileNumberExist = false;
        let userId = "-1";
        console.log(phone);
        const checkMobile = "SELECT user_id,firstname FROM users WHERE phone = ?";
        const isMobileExist = await queryAsync(checkMobile, [phone]);

        if (isMobileExist.length > 0) {
            isMobileNumberExist = true;
            userId = isMobileExist[0].user_id.toString();
        } 

        return res.status(200).json({isMobileNumberExist,userId});
    }catch(error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Phone number update
exports.updatePhone = async (req, res, next) => {
    try {

        const { phone } = req.body;
        const { user_id } = req.params;

        if (phone && phone.length !== 10) {
            return res.status(400).json({ error: "Please enter valid phone number" });
        }

        const checkMobile = "SELECT firstname FROM users WHERE phone = ?";
        const isMobileExist = await queryAsync(checkMobile, [phone]);

        if (isMobileExist.length > 0) {
            return res.status(403).json("Mobile number already exist");
        }

        const updatePhone = "UPDATE users SET phone = ? WHERE user_id = ?";
        const result = await queryAsync(updatePhone, [phone, user_id]);

        return res.status(200).json("Phone number updated successfully");


    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Firstname and Lastname upate
exports.updateData = async (req, res, next) => {
    try {
        const { user_id } = req.params;

        const updates = [];

        if (req.body.firstname) {
            updates.push({ column: "firstname", value: req.body.firstname });
        }

        if (req.body.lastname) {
            updates.push({ column: "lastname", value: req.body.lastname });
        }

        if (req.body.gender) {
            updates.push({ column: "gender", value: req.body.gender });
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: "No data provided for update" });
        }

        const updateQuery = `UPDATE users SET ${updates.map(update => `${update.column} = ?`).join(', ')} WHERE user_id = ?`;

        const updateValues = [...updates.map(update => update.value), user_id];

        const result = await queryAsync(updateQuery, updateValues);

        if (result.affectedRows > 0) {
            return res.status(200).json("Data updated successfully");
        } else {
            return res.status(404).json("User not found or no changes made");
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

// Generate OTP
exports.generateOtp = async (req, res, next) => {
    try {
        const { mobno } = req.body;

        if (!mobno || mobno.length !== 10) {
            return res.status(400).json({ error: "Please enter a valid Mobile Number" });
        }

        const OTP = Math.round(Math.random() * (999999-100000) + 100000);

        const response = await new Promise((resolve, reject) => {
            unirest.get("https://www.fast2sms.com/dev/bulkV2")
                .query({
                    "authorization": process.env.FAST_2_SMS_API_KEY,
                    "variables_values": OTP,
                    "route": "otp",
                    "numbers": mobno
                })
                .headers({
                    "cache-control": "no-cache"
                })
                .end(function (resp) {
                    if (resp.error) {
                        reject(resp.error);
                    } else {
                        resolve(resp.body);
                    }
                });
        });

        console.log("Response from Fast2SMS:", response);
        res.status(200).json({ OTP });

    } catch (err) {
        console.error("Error sending OTP:", err);
        res.status(500).json({ error: "Failed to send OTP" });
    }
};

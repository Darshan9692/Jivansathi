const express = require('express');
require('./src/config/connection.js');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const cors = require('cors');
const createUser = require('./src/tables/users.js');
const createReferrals = require('./src/tables/referrals.js');
const createErrorsTable = require('./src/tables/errors.js');

const authentication = require('./src/routes/authentication.js');
const referral = require('./src/routes/referrals.js');

const corsOptions = {
    origin: ['http://127.0.0.1:3000', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify the allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Specify the allowed headers
    credentials: true, // Enable credentials (cookies, authorization headers, etc)
};

app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());



//all api endpoints
app.use("/api", authentication);
app.use("/api",referral);



app.get("/", async (req, res) => {
    res.send("Good Morning!");

});

app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
    createUser();
    createReferrals();
    createErrorsTable();
})


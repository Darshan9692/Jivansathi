const express = require('express');
require('./src/config/connection');
const app = express();
require('dotenv').config();
const PORT = 3000;
const cookie = require('cookie-parser');
const cors = require('cors');
const createUser = require('./src/tables/users.js');

const authentication = require('./src/routes/authentication')

const corsOptions = {
    origin: ['http://127.0.0.1:3000', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify the allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Specify the allowed headers
    credentials: true, // Enable credentials (cookies, authorization headers, etc)
};

app.use(cors(corsOptions));
app.use(cookie());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());



//all api endpoints
app.use("/api", authentication);



app.get("/", async (req, res) => {
    res.send("Good Morning!");

});

app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
    createUser();
})


const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require('jsonwebtoken');


exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
    const { tokenjwt } = req.cookies;

    if (!tokenjwt) {
        return res.status(401).send({ error: "Please login to acess the resources" });
    }

    const decodedData = jwt.verify(tokenjwt, process.env.JWT_SECRET);
    req.user = decodedData.userId;

    next();
})

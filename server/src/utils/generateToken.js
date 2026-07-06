const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function generateAccessToken(userId) {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRES
        }
    );
}

function generateRefreshToken() {
    return crypto.randomBytes(40).toString("hex");
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
};
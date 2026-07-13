const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken"); 

const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
    );
};

const registerUserService = async ({ username, email, password }) => {
    // check existing user
    const userRegistered = await User.findOne({ email });

    if (userRegistered) {
        throw new Error("User already exists.");
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // create user
    await User.create({
        username,
        email,
        password: hashPassword,
    });

    return {
        message: "Registration successful.",
    };
};

const loginUserService = async ({ email, password }) => {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        throw new Error("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error("Invalid credentials");
    }

    user.lastLoginAt = Date.now();
    await user.save();

    return {
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
    };
};

// Google 
const googleLoginService = async (user) => {
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken();

    user.refreshTokens.push({
        token: refreshToken,
        expiresAt: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
        ),
    });

    user.lastLoginAt = new Date();

    await user.save();

    return {
        accessToken,
        refreshToken,
    };
};

module.exports = {
    generateToken,
    registerUserService,
    loginUserService,
    googleLoginService,
};

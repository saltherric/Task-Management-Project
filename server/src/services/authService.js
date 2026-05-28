const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
    const user = await User.create({
        username,
        email,
        password: hashPassword,
    });

    return {
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
    };
};

const loginUserService = async ({ email, password }) => {

    // find user
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("Invalid Email or Password.");
    }

    // compare password
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        throw new Error("Invalid Email or Password.");
    }

    return {
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
    };
};

module.exports = {
    registerUserService,
    loginUserService,
};
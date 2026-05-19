const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
    try {
        const {username, email, password} = req.body;
        // check existing user
        const userRegistered = await User.findOne({email});
        if (userRegistered) {
            return res.status(400).json({ message: "User already exists." });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        // create user
        const user = await User.create({
            username,
            email,
            password: hashPassword,
        });

        // generate token
        const token = jwt.sign(
            {id: user._id},
            process.env.JWT_SECRET,
            {
                expiresIn: "30d",
            }
        );
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: email,
            token,
        })
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password} = req.body;
        // find user
        const userLogined = await User.findOne({email});
        if (!userLogined) {
            res.status(400).json({
                message: "Invalid Email or Password."
            });
        }

        // compare password
        const match = await bcrypt.compare(password, userLogined.password);
        if (!match) {
            return res.status(400).json({ message: "Invalid Email or Password." });
        }

        // generate token
        const token = jwt.sign(
            {id: userLogined._id},
            process.env.JWT_SECRET,
            {
                expiresIn: "30d"
            }
        );

        res.json({
            _id: userLogined._id,
            username: userLogined.username,
            email: userLogined.email,
            token
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
}
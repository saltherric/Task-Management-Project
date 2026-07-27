const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken"); 
const { generateSignedUrl } = require("./signedUrl");

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

    // generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // create user
    await User.create({
        username,
        email,
        password: hashPassword,
        isVerified: false,
        verificationToken,
        verificationTokenExpires,
    });

    // send verification email
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5000/api';
    const verificationUrl = `${apiBaseUrl}/auth/verify-email?token=${verificationToken}`;
    const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #4F46E5; text-align: center;">Verify Your Email Address</h2>
            <p>Hello ${username},</p>
            <p>Thank you for signing up for our Task Management platform. Please click the button below to verify your email and complete your registration:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
            </div>
            <p>This verification link will expire in 24 hours.</p>
            <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
            <p style="font-size: 12px; color: #888888; text-align: center;">If you did not request this registration, you can safely ignore this email.</p>
        </div>
    `;

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "Verify your email",
            html: emailHtml,
        });
    } catch (err) {
        console.error("Failed to send verification email:", err);
    }

    return {
        message: "Registration successful. Please check your email to verify your account.",
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

    // Check verification status
    if (!user.isVerified) {
        throw new Error("Please verify your email address before logging in.");
    }

    user.lastLoginAt = Date.now();
    await user.save();

    const avatarUrl = user.avatar 
        ? (user.avatar.startsWith('http') || user.avatar.startsWith('data:') 
            ? user.avatar 
            : await generateSignedUrl(user.avatar)) 
        : null;

    return {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: avatarUrl,
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

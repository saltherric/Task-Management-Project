const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../utils/sendEmail");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken"); 

const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
    );
};

const generateEmailVerificationToken = () => {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    return { rawToken, hashedToken };
};

const registerUserService = async ({ username, email, password }) => {
    // check existing user
    const userRegistered = await User.findOne({ email });

    if (userRegistered) {
        throw new Error("User already exists.");
    }

    // generate verification token
    const { rawToken, hashedToken } = generateEmailVerificationToken();

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // create user with verification token and expiry
    const user = await User.create({
        username,
        email,
        password: hashPassword,
        emailVerificationToken: hashedToken,
        emailVerificationExpires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    // send verification email
    try {
        await sendVerificationEmail(user.email, rawToken);
    } catch (err) {
        console.error("sendVerificationEmail error:", err);
        // Still don't block registration — user account exists,
        // they can request a "resend verification email" later
    }

    // No token returned — user is NOT logged in yet
    return {
        message: "Registration successful. Please check your email to verify your account.",
    };
};

const resendVerificationEmailService = async ({ email }) => {
    if (!email) {
        throw new Error("Email is required");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        throw new Error("No account found for this email.");
    }

    if (user.emailVerified) {
        throw new Error("Email is already verified.");
    }

    const { rawToken, hashedToken } = generateEmailVerificationToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    await sendVerificationEmail(user.email, rawToken);

    return {
        message: "Verification email sent. Please check your inbox.",
    };
};

const verifyEmailService = async ({ token }) => {
    if (!token) {
        throw new Error("Verification token is required");
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
        throw new Error("Invalid or expired verification token.");
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    return {
        message: "Email verified successfully.",
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

    if (!user.emailVerified) {
        throw new Error("Please verify your email before logging in.");
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
    resendVerificationEmailService,
    verifyEmailService,
    googleLoginService,
};
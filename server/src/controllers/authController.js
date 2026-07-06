const { generateToken, registerUserService, loginUserService, resendVerificationEmailService, verifyEmailService, googleLoginService  } = require("../services/authService");

const registerUser = async (req, res, next) => {
    try {
        const user = await registerUserService(req.body);
        res.status(201).json(user);
    } catch (error) {
       next(error)
    }
};

const loginUser = async (req, res, next) => {
    try {
        const user = await loginUserService(req.body);
        res.json(user);
    } catch (error) {
        next(error)
    }
};

const reverify = async (req, res, next) => {
    try {
        const result = await resendVerificationEmailService(req.body);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const verifyEmail = async (req, res, next) => {
    try {
        const result = await verifyEmailService(req.query);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const googleCallback = async (req, res, next) => {
    try {
        const { accessToken, refreshToken } = await googleLoginService(req.user);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.redirect(
            `${process.env.CLIENT_URL}/oauth-success?token=${accessToken}`
        );
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerUser,
    loginUser,
    reverify,
    verifyEmail,
    googleCallback,
};
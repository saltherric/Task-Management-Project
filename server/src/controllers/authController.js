const { registerUserService, loginUserService, googleLoginService  } = require("../services/authService");
const User = require("../models/User"); // Import the User model from the database folder
const { generateSignedUrl } = require("../services/signedUrl");
const { deleteFile } = require("../services/uploadFile");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const formatUserAvatar = async (user) => {
    if (!user) return user;
    const userObj = typeof user.toObject === 'function' ? user.toObject() : user;
    if (userObj.avatar && !userObj.avatar.startsWith('http') && !userObj.avatar.startsWith('data:')) {
        try {
            userObj.avatar = await generateSignedUrl(userObj.avatar);
        } catch (err) {
            console.error("Failed to generate signed URL for user avatar", err);
        }
    }
    return userObj;
};

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

const getMe = async (req, res, next) => {
    try {
        const userWithSignedAvatar = await formatUserAvatar(req.user);
        res.json(userWithSignedAvatar);
    } catch (error) {
        next(error);
    }
};

// This function updates the current user's profile info (e.g. username, role, timezone, notifications)
const updateMe = async (req, res, next) => {
    try {
        const { username, notificationSettings, avatar } = req.body;
        
        // Find the user in the database by their ID
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Update user properties if they are supplied in the request body
        if (username) {
            user.username = username;
        }
        if (avatar !== undefined) {
            if (avatar && (avatar.startsWith('http://') || avatar.startsWith('https://'))) {
                if (user.avatar && avatar.includes(user.avatar)) {
                    // Same S3 key, do not overwrite or delete
                } else {
                    // If there was an old S3 avatar key, delete it
                    if (user.avatar && !user.avatar.startsWith('http') && !user.avatar.startsWith('data:')) {
                        try {
                            await deleteFile(user.avatar);
                        } catch (err) {
                            console.error("Failed to delete old user avatar from S3:", err);
                        }
                    }
                    user.avatar = avatar;
                }
            } else {
                if (user.avatar !== avatar) {
                    // If there was an old S3 avatar key, delete it
                    if (user.avatar && !user.avatar.startsWith('http') && !user.avatar.startsWith('data:')) {
                        try {
                            await deleteFile(user.avatar);
                        } catch (err) {
                            console.error("Failed to delete old user avatar from S3:", err);
                        }
                    }
                    user.avatar = avatar;
                }
            }
        }
        if (notificationSettings) {
            // Merge the notification settings
            user.notificationSettings = {
                ...user.notificationSettings,
                ...notificationSettings
            };
        }
        
        // Save the updated user details back to the database
        await user.save();
        
        // Convert the database object to a normal JavaScript object
        const updatedUser = user.toObject();
        // Remove the password field from the response object for safety
        delete updatedUser.password;
        
        const userWithSignedAvatar = await formatUserAvatar(updatedUser);
        // Send the updated user details back to the client
        res.status(200).json(userWithSignedAvatar);
    } catch (error) {
        next(error);
    }
};

const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ message: "Verification token is required." });
        }

        // If it's a direct browser link click (HTML request), redirect to the frontend verify page
        if (req.headers.accept && req.headers.accept.includes("text/html")) {
            return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}`);
        }

        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired verification token." });
        }

        user.isVerified = true;
        user.verificationToken = null;
        user.verificationTokenExpires = null;
        await user.save();

        res.status(200).json({ message: "Your email has been verified successfully!" });
    } catch (error) {
        next(error);
    }
};

const resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found with this email." });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "This email is already verified." });
        }

        // Generate new token
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;

        user.verificationToken = verificationToken;
        user.verificationTokenExpires = verificationTokenExpires;
        await user.save();

        const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5000/api';
        const verificationUrl = `${apiBaseUrl}/auth/verify-email?token=${verificationToken}`;
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #4F46E5; text-align: center;">Verify Your Email Address</h2>
                <p>Hello ${user.username},</p>
                <p>Please click the button below to verify your email address and activate your account:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
                </div>
                <p>This verification link will expire in 24 hours.</p>
                <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
                <p style="font-size: 12px; color: #888888; text-align: center;">If you did not request this, you can safely ignore this email.</p>
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

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "Verify your email",
            html: emailHtml,
        });

        res.status(200).json({ message: "Verification email sent successfully!" });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerUser,
    loginUser,
    googleCallback,
    getMe,
    updateMe,
    verifyEmail,
    resendVerification
};

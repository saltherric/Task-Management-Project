const express = require("express");
const router = express.Router();
const { registerUser, loginUser, googleCallback, getMe, updateMe, verifyEmail, resendVerification, forgotPassword, resetPassword } = require('../controllers/authController');
const passport = require("passport");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false,
    })
);

router.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed`,
    }),
    googleCallback
);

// Local 
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Profile routes
// This route fetches the current logged-in user profile details
router.get("/me", authMiddleware, getMe);
// This route updates the current user details (e.g. username)
router.patch("/profile", authMiddleware, updateMe);

module.exports = router;

const express = require("express");
const router = express.Router();
const { registerUser, loginUser, reverify, verifyEmail } = require('../controllers/authController');
const passport = require("passport");
const { googleCallback } = require("../controllers/authController");

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
router.post("/resend-verification", reverify);
router.post("/login", loginUser);
router.get("/verify-email", verifyEmail);

module.exports = router;
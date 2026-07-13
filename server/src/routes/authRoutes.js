const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
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
router.post("/login", loginUser);

module.exports = router;

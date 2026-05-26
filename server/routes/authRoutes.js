const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { getAllUsers } = require('../controllers/userController');

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get('/users', protect, admin, getAllUsers);

module.exports = router;